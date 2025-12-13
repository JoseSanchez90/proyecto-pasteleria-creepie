"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

// Tipos basados en tu schema
export type Pedido = {
  id: string;
  customer_id: string;
  total_amount: number;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "on_the_way"
    | "completed"
    | "cancelled";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  payment_method: string;
  address: string;
  notes: string;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
};

export type PedidoItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  size_id: string | null;
  product?: {
    name: string;
    description?: string;
    price?: number;
    offer_price?: number;
    is_offer?: boolean;
    images?: {
      image_url: string;
      image_order: number;
    }[];
  } | {
    name: string;
  };
  size?: {
    id: string;
    name: string;
    person_capacity: number | string;
  } | null;
};

export type PedidoCompleto = Pedido & {
  items: PedidoItem[];
  customer?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
};

// Crear nuevo pedido
export async function crearPedido(pedidoData: {
  customer_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    size_id?: string | null;
  }>;
  payment_method: string;
  address: string;
  notes?: string;
}) {
  const supabase = await createClient();

  try {
    // Calcular el total
    const total_amount = pedidoData.items.reduce(
      (total, item) => total + item.quantity * item.unit_price,
      0
    );

    // Crear el pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("orders")
      .insert([
        {
          customer_id: pedidoData.customer_id,
          total_amount,
          status: "pending",
          payment_status: "pending",
          payment_method: pedidoData.payment_method,
          address: pedidoData.address,
          notes: pedidoData.notes || "",
          estimated_delivery: new Date(
            Date.now() + 60 * 60 * 1000
          ).toISOString(), // 1 hora después
        },
      ])
      .select()
      .single();

    if (pedidoError) {
      console.error("Error creating order:", pedidoError);
      throw new Error(`Error al crear pedido: ${pedidoError.message}`);
    }

    // Crear los items del pedido
    const itemsData = pedidoData.items.map((item) => ({
      order_id: pedido.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
      size_id: item.size_id || null,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(itemsData);

    if (itemsError) {
      console.error("Error creating order items:", itemsError);
      throw new Error(`Error al crear items del pedido: ${itemsError.message}`);
    }

    revalidatePath("/pedidos");
    revalidatePath("/admin/pedidos");
    return { data: pedido, error: null };
  } catch (error) {
    console.error("Error in crearPedido:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener todos los pedidos (para admin)
export async function obtenerPedidos(filtros?: {
  status?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
}) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("orders")
      .select(
        `
        *,
        customer:profiles(first_name, last_name, email, phone),
        items:order_items(
          id,
          product_id,
          quantity,
          unit_price,
          subtotal,
          size_id,
          product:products(name),
          size:product_sizes(id, name, person_capacity)
        )
      `
      )
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (filtros?.status) {
      query = query.eq("status", filtros.status);
    }
    if (filtros?.fecha_inicio) {
      query = query.gte("created_at", filtros.fecha_inicio);
    }
    if (filtros?.fecha_fin) {
      query = query.lte("created_at", filtros.fecha_fin);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching orders:", error);
      throw new Error(`Error al obtener pedidos: ${error.message}`);
    }

    // Procesar datos para asegurar que size siempre esté disponible
    const processedData = data?.map((order: any) => {
      return {
        ...order,
        items: (order.items || []).map((item: any) => {
          // Si size es null o undefined pero tenemos size_id, intentar obtener el nombre
          let processedSize = item.size;
          
          // Si no tenemos size pero tenemos size_id, al menos retornar el ID como respaldo
          if (!processedSize && item.size_id) {
            processedSize = {
              id: item.size_id,
              name: item.size_id, // Usar el ID como nombre temporal
              person_capacity: 0
            };
          }

          return {
            ...item,
            size: processedSize
          };
        })
      };
    });

    return { data: processedData, error: null };
  } catch (error) {
    console.error("Error in obtenerPedidos:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener pedidos de un cliente
export async function obtenerPedidosCliente(customerId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(
          *,
          product:products(name, description),
          size:product_sizes(id, name, person_capacity)
        )
      `
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customer orders:", error);
      throw new Error(`Error al obtener pedidos del cliente: ${error.message}`);
    }

    // Procesar datos para asegurar que size siempre esté disponible
    const processedData = data?.map((order: any) => {
      return {
        ...order,
        items: (order.items || []).map((item: any) => {
          let processedSize = item.size;
          
          if (!processedSize && item.size_id) {
            processedSize = {
              id: item.size_id,
              name: item.size_id,
              person_capacity: 0
            };
          }

          return {
            ...item,
            size: processedSize
          };
        })
      };
    });

    return { data: processedData, error: null };
  } catch (error) {
    console.error("Error in obtenerPedidosCliente:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener pedido por ID
export async function obtenerPedidoPorId(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        items:order_items(
          *,
          products:products(
            name, 
            description, 
            price, 
            offer_price, 
            is_offer,
            images:product_images(image_url, image_order)
          ),
          size:product_sizes(id, name, person_capacity)
        ),
        customer:profiles(first_name, last_name, email, phone, address)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching order:", error);
      throw new Error(`Error al obtener pedido: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerPedidoPorId:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar estado del pedido
export async function actualizarEstadoPedido(
  id: string,
  nuevoEstado: Pedido["status"]
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        `
        *,
        customer:profiles(first_name, last_name, email),
        items:order_items(
          quantity,
          product:products(name)
        )
      `
      )
      .single();

    if (error) {
      console.error("Error updating order status:", error);
      throw new Error(
        `Error al actualizar estado del pedido: ${error.message}`
      );
    }

    // Obtener nombres de productos para el mensaje
    const productNames =
      data.items?.map((item: any) => item.product?.name).filter(Boolean) || [];
    const productsText =
      productNames.length > 0
        ? productNames.slice(0, 2).join(", ") +
          (productNames.length > 2 ? "..." : "")
        : "tus productos";

    // Crear notificación para el cliente cuando se confirma el pedido
    if (nuevoEstado === "confirmed" && data) {
      await createNotification({
        user_id: data.customer_id,
        type: "order_confirmed",
        title: "Pedido Confirmado",
        message: `Tu pedido de ${productsText} ha sido confirmado. Pronto comenzaremos a prepararlo. Total: S/ ${data.total_amount.toFixed(
          2
        )}`,
        related_id: data.id,
      });
    }

    // Crear notificación cuando se está preparando el pedido
    if (nuevoEstado === "preparing" && data) {
      await createNotification({
        user_id: data.customer_id,
        type: "order_preparing",
        title: "Pedido en Preparación",
        message: `Tu pedido de ${productsText} está siendo preparado con mucho cuidado. ¡Pronto estará listo!`,
        related_id: data.id,
      });
    }

    // Crear notificación cuando está en camino
    if (nuevoEstado === "on_the_way" && data) {
      await createNotification({
        user_id: data.customer_id,
        type: "order_on_the_way",
        title: "Pedido en Camino",
        message: `¡Tu pedido de ${productsText} está en camino! Llegará aproximadamente a las ${
          data.estimated_delivery
            ? new Date(data.estimated_delivery).toLocaleTimeString("es-PE", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "pronto"
        }`,
        related_id: data.id,
      });
    }

    // Crear notificación cuando se completa
    if (nuevoEstado === "completed" && data) {
      await createNotification({
        user_id: data.customer_id,
        type: "order_completed",
        title: "Pedido Entregado",
        message: `¡Tu pedido ha sido entregado! Gracias por tu compra de ${productsText}. ¡Esperamos que lo disfrutes!`,
        related_id: data.id,
      });
    }

    // Crear notificación cuando se cancela
    if (nuevoEstado === "cancelled" && data) {
      await createNotification({
        user_id: data.customer_id,
        type: "order_cancelled",
        title: "Pedido Cancelado",
        message: `Tu pedido de ${productsText} ha sido cancelado. Si tienes alguna duda, contáctanos.`,
        related_id: data.id,
      });
    }

    revalidatePath("/pedidos");
    revalidatePath("/admin/pedidos");
    revalidatePath("/dashboard/pedidos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarEstadoPedido:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar estado de pago
export async function actualizarEstadoPago(
  id: string,
  nuevoEstadoPago: Pedido["payment_status"]
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("orders")
      .update({
        payment_status: nuevoEstadoPago,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating payment status:", error);
      throw new Error(`Error al actualizar estado de pago: ${error.message}`);
    }

    revalidatePath("/pedidos");
    revalidatePath("/admin/pedidos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarEstadoPago:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Cancelar pedido
export async function cancelarPedido(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error cancelling order:", error);
      throw new Error(`Error al cancelar pedido: ${error.message}`);
    }

    revalidatePath("/pedidos");
    revalidatePath("/admin/pedidos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in cancelarPedido:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener estadísticas de pedidos (para dashboard)
export async function obtenerEstadisticasPedidos() {
  const supabase = await createClient();

  try {
    // Total de pedidos
    const { count: totalPedidos, error: errorTotal } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true });

    // Pedidos pendientes
    const { count: pedidosPendientes, error: errorPendientes } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    // Ingresos del día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const { data: ingresosHoy, error: errorIngresos } = await supabase
      .from("orders")
      .select("total_amount")
      .gte("created_at", hoy.toISOString())
      .lt("created_at", manana.toISOString())
      .eq("payment_status", "paid");

    const totalIngresosHoy =
      ingresosHoy?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

    if (errorTotal || errorPendientes || errorIngresos) {
      throw new Error("Error al obtener estadísticas de pedidos");
    }

    const estadisticas = {
      total_pedidos: totalPedidos || 0,
      pedidos_pendientes: pedidosPendientes || 0,
      ingresos_hoy: totalIngresosHoy,
    };

    return { data: estadisticas, error: null };
  } catch (error) {
    console.error("Error in obtenerEstadisticasPedidos:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener pedidos recientes (últimos 10)
export async function obtenerPedidosRecientes() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        customer:profiles(first_name, last_name)
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error fetching recent orders:", error);
      throw new Error(`Error al obtener pedidos recientes: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerPedidosRecientes:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener pedidos de un cliente con imágenes de productos (para seguimiento)
export async function obtenerPedidosClienteConImagenes(customerId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items(
          *,
          products(
            id,
            name,
            price,
            images:product_images(image_url, image_order)
          ),
          size:product_sizes(id, name, person_capacity)
        )
      `
      )
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching customer orders with images:", error);
      throw new Error(`Error al obtener pedidos del cliente: ${error.message}`);
    }

    // Procesar datos para asegurar que size siempre esté disponible
    const processedData = data?.map((order: any) => {
      return {
        ...order,
        order_items: (order.order_items || []).map((item: any) => {
          let processedSize = item.size;
          
          if (!processedSize && item.size_id) {
            processedSize = {
              id: item.size_id,
              name: item.size_id,
              person_capacity: 0
            };
          }

          return {
            ...item,
            size: processedSize
          };
        })
      };
    });

    return { data: processedData, error: null };
  } catch (error) {
    console.error("Error in obtenerPedidosClienteConImagenes:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
