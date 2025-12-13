"use server";

import { createClient } from "@/utils/supabase/server";

// Tipos para reportes
export type PeriodoReporte = "day" | "week" | "month" | "year";

export type ReporteFinanciero = {
  ingresos: number;
  egresos: number;
  reembolsos: number;
  ganancia_neta: number;
  total_pedidos: number;
  total_reservaciones: number;
  pedidos_completados: number;
  pedidos_cancelados: number;
  ventas_por_categoria: Record<string, number>;
  metodos_pago: Record<string, number>;
  productos_mas_vendidos: Array<{
    product_id: string;
    product_name: string;
    cantidad: number;
    total: number;
  }>;
  comparacion_anterior: {
    ingresos_cambio: number;
    egresos_cambio: number;
    ganancia_cambio: number;
  };
};

// Función auxiliar para obtener rango de fechas según período
function obtenerRangoFechas(periodo: PeriodoReporte) {
  const ahora = new Date();
  let inicio: Date;
  let fin: Date = new Date(ahora);

  switch (periodo) {
    case "day":
      inicio = new Date(ahora);
      inicio.setHours(0, 0, 0, 0);
      fin.setHours(23, 59, 59, 999);
      break;
    case "week":
      inicio = new Date(ahora);
      inicio.setDate(ahora.getDate() - ahora.getDay()); // Domingo
      inicio.setHours(0, 0, 0, 0);
      break;
    case "month":
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      inicio.setHours(0, 0, 0, 0);
      break;
    case "year":
      inicio = new Date(ahora.getFullYear(), 0, 1);
      inicio.setHours(0, 0, 0, 0);
      break;
  }

  return {
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
  };
}

// Función auxiliar para obtener período anterior
function obtenerPeriodoAnterior(periodo: PeriodoReporte) {
  const { inicio, fin } = obtenerRangoFechas(periodo);
  const inicioDate = new Date(inicio);
  const finDate = new Date(fin);
  const duracion = finDate.getTime() - inicioDate.getTime();

  const inicioAnterior = new Date(inicioDate.getTime() - duracion);
  const finAnterior = new Date(inicioDate.getTime() - 1);

  return {
    inicio: inicioAnterior.toISOString(),
    fin: finAnterior.toISOString(),
  };
}

// Obtener reportes financieros completos
export async function obtenerReportesFinancieros(
  periodo: PeriodoReporte = "month",
  customInicio?: string,
  customFin?: string
) {
  const supabase = await createClient();

  try {
    // Usar fechas personalizadas si se proporcionan, de lo contrario usar el período
    let inicio: string;
    let fin: string;
    let periodoAnterior: { inicio: string; fin: string };

    if (customInicio && customFin) {
      inicio = customInicio;
      fin = customFin;

      // Calcular período anterior basado en la duración personalizada
      const inicioDate = new Date(customInicio);
      const finDate = new Date(customFin);
      const duracion = finDate.getTime() - inicioDate.getTime();

      const inicioAnterior = new Date(inicioDate.getTime() - duracion);
      const finAnterior = new Date(inicioDate.getTime() - 1);

      periodoAnterior = {
        inicio: inicioAnterior.toISOString(),
        fin: finAnterior.toISOString(),
      };
    } else {
      const rango = obtenerRangoFechas(periodo);
      inicio = rango.inicio;
      fin = rango.fin;
      periodoAnterior = obtenerPeriodoAnterior(periodo);
    }

    // 1. Obtener ingresos de pedidos pagados
    const { data: pedidosPagados, error: errorPedidos } = await supabase
      .from("orders")
      .select("id, total_amount, payment_method, payment_status, status")
      .gte("created_at", inicio)
      .lte("created_at", fin);

    if (errorPedidos) throw new Error(errorPedidos.message);

    // Calcular ingresos de todos los pedidos (no solo pagados)
    const ingresosPedidos =
      pedidosPagados?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

    const reembolsos =
      pedidosPagados
        ?.filter((p) => p.payment_status === "refunded")
        .reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

    const pedidosCompletados =
      pedidosPagados?.filter((p) => p.status === "completed").length || 0;
    const pedidosCancelados =
      pedidosPagados?.filter((p) => p.status === "cancelled").length || 0;

    // Métodos de pago (de todos los pedidos)
    const metodosPago: Record<string, number> = {};
    pedidosPagados?.forEach((p) => {
      const metodo = p.payment_method || "No especificado";
      metodosPago[metodo] = (metodosPago[metodo] || 0) + 1;
    });

    // 2. Obtener ingresos de reservaciones pagadas
    const { data: reservacionesPagadas, error: errorReservaciones } =
      await supabase
        .from("reservations")
        .select("total_amount")
        .gte("created_at", inicio)
        .lte("created_at", fin)
        .eq("status", "confirmed");

    if (errorReservaciones) throw new Error(errorReservaciones.message);

    const ingresosReservaciones =
      reservacionesPagadas?.reduce(
        (sum, r) => sum + Number(r.total_amount),
        0
      ) || 0;

    const totalIngresos = ingresosPedidos + ingresosReservaciones;

    // 3. Obtener egresos
    const { data: gastos, error: errorGastos } = await supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", inicio.split("T")[0])
      .lte("expense_date", fin.split("T")[0]);

    if (errorGastos) throw new Error(errorGastos.message);

    const totalEgresos =
      gastos?.reduce((sum, g) => sum + Number(g.amount), 0) || 0;

    // 4. Ventas por categoría - Filtrar por fecha del pedido
    const { data: itemsPedidos, error: errorItems } = await supabase
      .from("order_items")
      .select(
        `
        quantity,
        unit_price,
        order_id,
        product:products(id, name, category:categories(name))
      `
      );

    if (errorItems) throw new Error(errorItems.message);

    // Obtener IDs de pedidos del período
    const pedidosIds = pedidosPagados?.map((p: any) => p.id) || [];

    // Filtrar items que pertenecen a pedidos del período
    const itemsFiltrados = itemsPedidos?.filter((item: any) =>
      pedidosIds.includes(item.order_id)
    );

    const ventasPorCategoria: Record<string, number> = {};
    itemsFiltrados?.forEach((item: any) => {
      const categoria = item.product?.category?.name || "Sin categoría";
      const monto = Number(item.quantity) * Number(item.unit_price);
      ventasPorCategoria[categoria] =
        (ventasPorCategoria[categoria] || 0) + monto;
    });

    // 5. Productos más vendidos
    const productosMap: Record<string, any> = {};
    itemsFiltrados?.forEach((item: any) => {
      const productId = item.product?.id || "unknown";
      const productName = item.product?.name || "Producto desconocido";
      if (!productosMap[productId]) {
        productosMap[productId] = {
          product_id: productId,
          product_name: productName,
          cantidad: 0,
          total: 0,
        };
      }
      productosMap[productId].cantidad += Number(item.quantity);
      productosMap[productId].total +=
        Number(item.quantity) * Number(item.unit_price);
    });

    const productosMasVendidos = Object.values(productosMap)
      .sort((a: any, b: any) => b.cantidad - a.cantidad)
      .slice(0, 10);

    // 6. Comparación con período anterior
    const { data: pedidosAnteriores } = await supabase
      .from("orders")
      .select("total_amount, payment_status")
      .gte("created_at", periodoAnterior.inicio)
      .lte("created_at", periodoAnterior.fin);

    const ingresosAnteriores =
      pedidosAnteriores?.reduce((sum, p) => sum + Number(p.total_amount), 0) ||
      0;

    const { data: gastosAnteriores } = await supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", periodoAnterior.inicio.split("T")[0])
      .lte("expense_date", periodoAnterior.fin.split("T")[0]);

    const egresosAnteriores =
      gastosAnteriores?.reduce((sum, g) => sum + Number(g.amount), 0) || 0;

    const gananciaActual = totalIngresos - totalEgresos - reembolsos;
    const gananciaAnterior = ingresosAnteriores - egresosAnteriores;

    const calcularCambio = (actual: number, anterior: number) => {
      if (anterior === 0) return actual > 0 ? 100 : 0;
      return ((actual - anterior) / anterior) * 100;
    };

    const reporte: ReporteFinanciero = {
      ingresos: totalIngresos,
      egresos: totalEgresos,
      reembolsos,
      ganancia_neta: gananciaActual,
      total_pedidos: pedidosPagados?.length || 0,
      total_reservaciones: reservacionesPagadas?.length || 0,
      pedidos_completados: pedidosCompletados,
      pedidos_cancelados: pedidosCancelados,
      ventas_por_categoria: ventasPorCategoria,
      metodos_pago: metodosPago,
      productos_mas_vendidos: productosMasVendidos,
      comparacion_anterior: {
        ingresos_cambio: calcularCambio(totalIngresos, ingresosAnteriores),
        egresos_cambio: calcularCambio(totalEgresos, egresosAnteriores),
        ganancia_cambio: calcularCambio(gananciaActual, gananciaAnterior),
      },
    };

    return { data: reporte, error: null };
  } catch (error) {
    console.error("Error in obtenerReportesFinancieros:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener datos para gráfico de ingresos vs egresos
export async function obtenerDatosGrafico(periodo: PeriodoReporte = "month") {
  const supabase = await createClient();

  try {
    const { inicio, fin } = obtenerRangoFechas(periodo);
    const puntos = periodo === "year" ? 12 : periodo === "month" ? 30 : 7;

    const datos = [];
    const inicioDate = new Date(inicio);
    const finDate = new Date(fin);
    const intervalo = (finDate.getTime() - inicioDate.getTime()) / puntos;

    for (let i = 0; i < puntos; i++) {
      const puntoInicio = new Date(inicioDate.getTime() + intervalo * i);
      const puntoFin = new Date(inicioDate.getTime() + intervalo * (i + 1));

      // Ingresos del punto
      const { data: pedidos } = await supabase
        .from("orders")
        .select("total_amount")
        .gte("created_at", puntoInicio.toISOString())
        .lt("created_at", puntoFin.toISOString());

      const ingresos =
        pedidos?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

      // Egresos del punto
      const { data: gastos } = await supabase
        .from("expenses")
        .select("amount")
        .gte("expense_date", puntoInicio.toISOString().split("T")[0])
        .lt("expense_date", puntoFin.toISOString().split("T")[0]);

      const egresos =
        gastos?.reduce((sum, g) => sum + Number(g.amount), 0) || 0;

      datos.push({
        fecha: puntoInicio.toLocaleDateString("es-PE", {
          day: "2-digit",
          month: "short",
        }),
        ingresos,
        egresos,
      });
    }

    return { data: datos, error: null };
  } catch (error) {
    console.error("Error in obtenerDatosGrafico:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
