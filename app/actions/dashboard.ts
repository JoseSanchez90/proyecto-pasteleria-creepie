// actions/dashboard.ts
"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface Metricas {
  ventasTotales: number;
  ventasHoy: number;
  totalUsuarios: number;
  totalProductos: number;
  pedidosPendientes: number;
  tasaConversion: number;
}

export interface PedidoReciente {
  id: string;
  cliente: string;
  total: number;
  fecha: string;
  estado: string;
}

export interface ProductoPopular {
  id: string;
  nombre: string;
  ventas: number;
}

export interface VentasMensuales {
  mes: string;
  ventas: number;
}

export interface ProductosPorCategoria {
  categoria: string;
  cantidad: number;
  color: string;
}

// Interfaces para las respuestas de Supabase
interface OrderWithProfile {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
  }[];
}

interface OrderItemWithProduct {
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    is_active: boolean;
  }[];
}

export async function obtenerMetricas(): Promise<Metricas> {
  const supabase = await createClient();

  try {
    // Fechas para filtrar
    const hoy = new Date();
    const inicioHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate()
    );
    const finHoy = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() + 1
    );

    // 1. Ventas totales (solo pedidos completados)
    const { data: ventasTotalesData } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed");

    const ventasTotales =
      ventasTotalesData?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ) || 0;

    // 2. Ventas de hoy
    const { data: ventasHoyData } = await supabase
      .from("orders")
      .select("total_amount")
      .eq("status", "completed")
      .gte("created_at", inicioHoy.toISOString())
      .lt("created_at", finHoy.toISOString());

    const ventasHoy =
      ventasHoyData?.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      ) || 0;

    // 3. Total usuarios
    const { count: totalUsuarios } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // 4. Total productos activos
    const { count: totalProductos } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // 5. Pedidos pendientes
    const { count: pedidosPendientes } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // 6. Tasa de conversión (pedidos completados vs total pedidos)
    const { data: todosPedidos } = await supabase
      .from("orders")
      .select("status");

    const totalPedidos = todosPedidos?.length || 0;
    const pedidosCompletados =
      todosPedidos?.filter((pedido) => pedido.status === "completed").length ||
      0;

    const tasaConversion =
      totalPedidos > 0 ? (pedidosCompletados / totalPedidos) * 100 : 0;

    return {
      ventasTotales,
      ventasHoy,
      totalUsuarios: totalUsuarios || 0,
      totalProductos: totalProductos || 0,
      pedidosPendientes: pedidosPendientes || 0,
      tasaConversion: Number(tasaConversion.toFixed(1)),
    };
  } catch (error) {
    console.error("Error obteniendo métricas:", error);
    return {
      ventasTotales: 0,
      ventasHoy: 0,
      totalUsuarios: 0,
      totalProductos: 0,
      pedidosPendientes: 0,
      tasaConversion: 0,
    };
  }
}

export async function obtenerPedidosRecientes(
  limite: number = 5
): Promise<PedidoReciente[]> {
  const supabase = await createClient();

  try {
    const { data: pedidos } = (await supabase
      .from("orders")
      .select(
        `
        id,
        total_amount,
        status,
        created_at,
        profiles!orders_customer_id_fkey (
          first_name,
          last_name
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(limite)) as { data: OrderWithProfile[] | null };

    if (!pedidos) return [];

    return pedidos.map((pedido) => {
      const perfil = pedido.profiles?.[0]; // Tomar el primer perfil del array
      const nombreCliente = perfil
        ? `${perfil.first_name || ""} ${perfil.last_name || ""}`.trim()
        : "Cliente";

      return {
        id: `ORD-${pedido.id.substring(0, 4).toUpperCase()}`,
        cliente: nombreCliente || "Cliente",
        total: pedido.total_amount || 0,
        fecha: pedido.created_at,
        estado: pedido.status || "pending",
      };
    });
  } catch (error) {
    console.error("Error obteniendo pedidos recientes:", error);
    return [];
  }
}

export async function obtenerProductosPopulares(
  limite: number = 4
): Promise<ProductoPopular[]> {
  const supabase = await createClient();

  try {
    // Obtener ventas por producto desde order_items
    const { data: itemsVendidos } = (await supabase.from("order_items").select(`
        product_id,
        quantity,
        products!inner (
          id,
          name,
          is_active
        )
      `)) as { data: OrderItemWithProduct[] | null };

    if (!itemsVendidos) return [];

    // Agrupar ventas por producto
    const ventasPorProducto = itemsVendidos.reduce((acc, item) => {
      const productId = item.product_id;
      const producto = item.products?.[0]; // Tomar el primer producto del array

      if (producto && !acc[productId]) {
        acc[productId] = {
          id: producto.id,
          nombre: producto.name,
          ventas: 0,
        };
      }

      if (acc[productId]) {
        acc[productId].ventas += item.quantity || 0;
      }

      return acc;
    }, {} as Record<string, ProductoPopular>);

    // Ordenar por ventas y limitar
    return Object.values(ventasPorProducto)
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, limite);
  } catch (error) {
    console.error("Error obteniendo productos populares:", error);

    // Fallback: obtener productos activos si hay error con order_items
    try {
      const { data: productos } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .limit(limite);

      return (
        productos?.map((producto) => ({
          id: producto.id,
          nombre: producto.name,
          ventas: 0,
        })) || []
      );
    } catch (fallbackError) {
      console.error("Error en fallback de productos:", fallbackError);
      return [];
    }
  }
}

export async function obtenerVentasMensuales(): Promise<VentasMensuales[]> {
  const supabase = await createClient();

  try {
    // Obtener pedidos pagados de los últimos 8 meses
    const hoy = new Date();
    const hace8Meses = new Date(hoy.getFullYear(), hoy.getMonth() - 7, 1);

    const { data: pedidos } = await supabase
      .from("orders")
      .select("created_at, total_amount")
      .eq("payment_status", "paid")
      .gte("created_at", hace8Meses.toISOString());

    if (!pedidos) return [];

    // Agrupar por mes y año
    const ventasPorMes: Record<string, number> = {};
    const meses = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    pedidos.forEach((pedido) => {
      const fecha = new Date(pedido.created_at);
      // Crear clave única con año y mes para evitar mezclar años
      const mesKey = `${fecha.getFullYear()}-${fecha.getMonth()}`;

      if (!ventasPorMes[mesKey]) {
        ventasPorMes[mesKey] = 0;
      }
      ventasPorMes[mesKey] += pedido.total_amount || 0;
    });

    // Generar últimos 8 meses
    const resultado: VentasMensuales[] = [];
    for (let i = 7; i >= 0; i--) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const mesNombre = meses[fecha.getMonth()];
      const mesKey = `${fecha.getFullYear()}-${fecha.getMonth()}`;
      resultado.push({
        mes: mesNombre,
        ventas: Math.round(ventasPorMes[mesKey] || 0),
      });
    }

    return resultado;
  } catch (error) {
    console.error("Error obteniendo ventas mensuales:", error);
    return [];
  }
}

export async function obtenerProductosPorCategoria(): Promise<
  ProductosPorCategoria[]
> {
  const supabase = await createClient();

  try {
    const { data: productos } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true);

    if (!productos) return [];

    // Agrupar por categoría
    const categorias: Record<string, number> = {};
    productos.forEach((producto) => {
      const cat = producto.category || "Sin categoría";
      categorias[cat] = (categorias[cat] || 0) + 1;
    });

    // Colores para las categorías
    const colores = [
      "#6366f1", // Indigo
      "#ec4899", // Pink
      "#f59e0b", // Amber
      "#10b981", // Emerald
      "#8b5cf6", // Violet
      "#f97316", // Orange
    ];

    return Object.entries(categorias).map(([categoria, cantidad], index) => ({
      categoria,
      cantidad,
      color: colores[index % colores.length],
    }));
  } catch (error) {
    console.error("Error obteniendo productos por categoría:", error);
    return [];
  }
}

export async function obtenerDatosDashboard() {
  const [
    metricas,
    pedidosRecientes,
    productosPopulares,
    ventasMensuales,
    productosPorCategoria,
  ] = await Promise.all([
    obtenerMetricas(),
    obtenerPedidosRecientes(5),
    obtenerProductosPopulares(4),
    obtenerVentasMensuales(),
    obtenerProductosPorCategoria(),
  ]);

  return {
    metricas,
    pedidosRecientes,
    productosPopulares,
    ventasMensuales,
    productosPorCategoria,
  };
}

// Función para revalidar el dashboard si es necesario
export async function revalidarDashboard() {
  revalidatePath("/dashboard");
}
