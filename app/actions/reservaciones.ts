"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notifications";

// Tipos basados en tu schema
export type Reservacion = {
  id: string;
  customer_id: string;
  product_id: string;
  size_id?: string | null;
  reservation_date: string;
  reservation_time: string;
  quantity: number;
  special_requests: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "on_the_way"
    | "completed"
    | "cancelled"
    | "no_show";
  total_amount: number;
  created_at: string;
};

export type ReservacionCompleta = Reservacion & {
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  product: {
    name: string;
    price: number;
    preparation_time: number;
  };
};

// Tipo para reservaciones agrupadas por cliente y fecha
export type ReservacionAgrupada = {
  id: string; // ID de la primera reservación del grupo
  customer_id: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  reservation_date: string;
  reservation_time: string;
  status: string;
  created_at: string;
  items: Array<{
    id: string;
    product_id: string;
    size_id: string | null;
    quantity: number;
    special_requests: string;
    total_amount: number;
    product: {
      name: string;
      price: number;
      preparation_time: number;
    };
  }>;
  total_amount_combined: number;
};

// Crear nueva reservación
export async function crearReservacion(reservacionData: {
  customer_id: string;
  product_id: string;
  reservation_date: string;
  reservation_time: string;
  quantity: number;
  special_requests?: string;
  customer_phone?: string;
  customer_name?: string;
  size_id?: string;
}) {
  const supabase = await createClient();

  try {
    // Validar que la fecha no sea en el pasado
    const fechaReserva = new Date(
      `${reservacionData.reservation_date}T${reservacionData.reservation_time}`
    );
    if (fechaReserva < new Date()) {
      throw new Error("No se pueden hacer reservaciones en fechas pasadas");
    }

    // Obtener información del producto para calcular el total
    const { data: producto, error: productoError } = await supabase
      .from("products")
      .select("price, preparation_time")
      .eq("id", reservacionData.product_id)
      .single();

    if (productoError) {
      console.error("Error fetching product:", productoError);
      throw new Error("Error al obtener información del producto");
    }

    let unitPrice = producto.price;
    let sizeInfo = "";

    // Si se seleccionó un tamaño, obtener el precio adicional
    if (reservacionData.size_id) {
      const { data: sizeData, error: sizeError } = await supabase
        .from("product_sizes")
        .select("name, person_capacity, additional_price")
        .eq("id", reservacionData.size_id)
        .single();

      if (!sizeError && sizeData) {
        unitPrice += sizeData.additional_price;
        sizeInfo = `\n[Tamaño: ${sizeData.name} - ${sizeData.person_capacity} personas]`;
      }
    }

    const total_amount = unitPrice * reservacionData.quantity;

    // Actualizar perfil del usuario con teléfono si se proporciona
    if (reservacionData.customer_phone) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", reservacionData.customer_id)
        .single();

      // Solo actualizar si el teléfono no existe o es diferente
      if (!profile?.phone || profile.phone !== reservacionData.customer_phone) {
        await supabase
          .from("profiles")
          .update({ phone: reservacionData.customer_phone })
          .eq("id", reservacionData.customer_id);
      }
    }

    // Crear la reservación
    const { data: reservacion, error } = await supabase
      .from("reservations")
      .insert([
        {
          customer_id: reservacionData.customer_id,
          product_id: reservacionData.product_id,
          size_id: reservacionData.size_id || null,
          reservation_date: reservacionData.reservation_date,
          reservation_time: reservacionData.reservation_time,
          quantity: reservacionData.quantity,
          special_requests: reservacionData.special_requests || "",
          status: "pending",
          total_amount,
        },
      ])
      .select(
        `
        *,
        product:products(name, price),
        customer:profiles(first_name, last_name, email, phone)
      `
      )
      .single();

    if (error) {
      console.error("Error creating reservation:", error);
      throw new Error(`Error al crear reservación: ${error.message}`);
    }

    revalidatePath("/reservaciones");
    revalidatePath("/dashboard/reservaciones");
    return { data: reservacion, error: null };
  } catch (error) {
    console.error("Error in crearReservacion:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Crear múltiples reservaciones (Carrito)
export async function crearReservacionMultiple(reservacionData: {
  customer_id: string;
  items: {
    product_id: string;
    size_id?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_name: string;
    size_name?: string;
  }[];
  reservation_date: string;
  reservation_time: string;
  special_requests?: string;
  customer_phone?: string;
  customer_name?: string;
}) {
  const supabase = await createClient();

  try {
    // Validar que la fecha no sea en el pasado
    const fechaReserva = new Date(
      `${reservacionData.reservation_date}T${reservacionData.reservation_time}`
    );
    if (fechaReserva < new Date()) {
      throw new Error("No se pueden hacer reservaciones en fechas pasadas");
    }

    // Actualizar perfil del usuario con teléfono si se proporciona
    if (reservacionData.customer_phone) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", reservacionData.customer_id)
        .single();

      // Solo actualizar si el teléfono no existe o es diferente
      if (!profile?.phone || profile.phone !== reservacionData.customer_phone) {
        await supabase
          .from("profiles")
          .update({ phone: reservacionData.customer_phone })
          .eq("id", reservacionData.customer_id);
      }
    }

    const reservationsToCreate = reservacionData.items.map((item) => {
      let sizeInfo = "";
      if (item.size_name) {
        sizeInfo = `\n[Tamaño: ${item.size_name}]`;
      }

      return {
        customer_id: reservacionData.customer_id,
        product_id: item.product_id,
        reservation_date: reservacionData.reservation_date,
        reservation_time: reservacionData.reservation_time,
        quantity: item.quantity,
        special_requests: (reservacionData.special_requests || "") + sizeInfo,
        status: "pending",
        total_amount: item.total_price,
      };
    });

    // Crear las reservaciones
    const { data: reservaciones, error } = await supabase
      .from("reservations")
      .insert(reservationsToCreate)
      .select();

    if (error) {
      console.error("Error creating multiple reservations:", error);
      throw new Error(`Error al crear reservaciones: ${error.message}`);
    }

    revalidatePath("/reservaciones");
    revalidatePath("/dashboard/reservaciones");
    return { data: reservaciones, error: null };
  } catch (error) {
    console.error("Error in crearReservacionMultiple:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener todas las reservaciones (para admin)
// Función helper para agrupar reservaciones por cliente y fecha
function agruparReservaciones(
  reservaciones: ReservacionCompleta[]
): ReservacionAgrupada[] {
  const grouped: { [key: string]: ReservacionAgrupada } = {};

  reservaciones.forEach((res) => {
    const key = `${res.customer_id}_${res.reservation_date}_${res.reservation_time}`;

    if (!grouped[key]) {
      grouped[key] = {
        id: res.id,
        customer_id: res.customer_id,
        customer: res.customer,
        reservation_date: res.reservation_date,
        reservation_time: res.reservation_time,
        status: res.status,
        created_at: res.created_at,
        items: [],
        total_amount_combined: 0,
      };
    }

    grouped[key].items.push({
      id: res.id,
      product_id: res.product_id,
      size_id: res.size_id || null,
      quantity: res.quantity,
      special_requests: res.special_requests,
      total_amount: res.total_amount,
      product: res.product,
    });

    grouped[key].total_amount_combined += res.total_amount;
  });

  return Object.values(grouped);
}

export async function obtenerReservaciones(filtros?: {
  status?: string;
  fecha?: string;
  customer_id?: string;
}) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("reservations")
      .select(
        `
        *,
        customer:profiles(first_name, last_name, email, phone),
        product:products(name, price, preparation_time)
      `
      )
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    // Aplicar filtros
    if (filtros?.status) {
      query = query.eq("status", filtros.status);
    }
    if (filtros?.fecha) {
      query = query.eq("reservation_date", filtros.fecha);
    }
    if (filtros?.customer_id) {
      query = query.eq("customer_id", filtros.customer_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reservations:", error);
      throw new Error(`Error al obtener reservaciones: ${error.message}`);
    }

    // Agrupar las reservaciones por cliente y fecha
    const agrupadas = agruparReservaciones(data as ReservacionCompleta[]);

    return { data: agrupadas as any, error: null };
  } catch (error) {
    console.error("Error in obtenerReservaciones:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener reservaciones de un cliente
export async function obtenerReservacionesCliente(customerId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        customer:profiles(first_name, last_name, email, phone),
        product:products(name, price, preparation_time)
      `
      )
      .eq("customer_id", customerId)
      .order("reservation_date", { ascending: false })
      .order("reservation_time", { ascending: false });

    if (error) {
      console.error("Error fetching customer reservations:", error);
      throw new Error(
        `Error al obtener reservaciones del cliente: ${error.message}`
      );
    }

    // Agrupar las reservaciones por cliente y fecha
    const agrupadas = agruparReservaciones(data as ReservacionCompleta[]);

    return { data: agrupadas as any, error: null };
  } catch (error) {
    console.error("Error in obtenerReservacionesCliente:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener reservación por ID
export async function obtenerReservacionPorId(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        customer:profiles(first_name, last_name, email, phone, address),
        product:products(name, description, price, preparation_time)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching reservation:", error);
      throw new Error(`Error al obtener reservación: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerReservacionPorId:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar estado de reservación
export async function actualizarEstadoReservacion(
  id: string,
  nuevoEstado: Reservacion["status"]
) {
  const supabase = await createClient();

  try {
    // Primero, obtener la reservación original para obtener customer_id, reservation_date y reservation_time
    const { data: originalRes, error: getError } = await supabase
      .from("reservations")
      .select("customer_id, reservation_date, reservation_time")
      .eq("id", id)
      .single();

    if (getError || !originalRes) {
      throw new Error("No se pudo encontrar la reservación");
    }

    // Actualizar TODAS las reservaciones del grupo (mismo customer_id, fecha y hora)
    const { data: updatedRes, error: updateError } = await supabase
      .from("reservations")
      .update({ status: nuevoEstado })
      .eq("customer_id", originalRes.customer_id)
      .eq("reservation_date", originalRes.reservation_date)
      .eq("reservation_time", originalRes.reservation_time)
      .select(
        `
        *,
        customer:profiles(first_name, last_name, email, phone),
        product:products(name)
      `
      );

    if (updateError) {
      console.error("Error updating reservation status:", updateError);
      throw new Error(
        `Error al actualizar estado de reservación: ${updateError.message}`
      );
    }

    // Crear notificación para el cliente una sola vez (usando la primera reservación)
    if (updatedRes && updatedRes.length > 0) {
      const firstRes = updatedRes[0];
      const productNames = updatedRes.map((r) => r.product.name).join(", ");

      // Crear notificación cuando se confirma la reservación
      if (nuevoEstado === "confirmed") {
        await createNotification({
          user_id: firstRes.customer_id,
          type: "reservation_confirmed",
          title: "Reservación Confirmada",
          message: `Tu reservación de ${productNames} para el ${firstRes.reservation_date} a las ${firstRes.reservation_time} ha sido confirmada. ¡Te esperamos!`,
          related_id: firstRes.id,
        });
      }

      // Crear notificación cuando se esta preparando la reservación
      if (nuevoEstado === "preparing") {
        await createNotification({
          user_id: firstRes.customer_id,
          type: "reservation_preparing",
          title: "Reservación en Preparación",
          message: `Tu reservación de ${productNames} esta siendo preparada.`,
          related_id: firstRes.id,
        });
      }

      // Crear notificación cuando se esta en camino
      if (nuevoEstado === "on_the_way") {
        await createNotification({
          user_id: firstRes.customer_id,
          type: "reservation_on_the_way",
          title: "Reservación En Camino",
          message: `Tu reservación de ${productNames} esta en camino a ser entregado.`,
          related_id: firstRes.id,
        });
      }

      // Crear notificación cuando se completa
      if (nuevoEstado === "completed") {
        await createNotification({
          user_id: firstRes.customer_id,
          type: "reservation_completed",
          title: "Reservación Completada",
          message: `Gracias por tu compra de ${productNames}. ¡Esperamos que lo hayas disfrutado!`,
          related_id: firstRes.id,
        });
      }

      // Crear notificación cuando se cancela
      if (nuevoEstado === "cancelled") {
        await createNotification({
          user_id: firstRes.customer_id,
          type: "reservation_cancelled",
          title: "Reservación Cancelada",
          message: `Tu reservación de ${productNames} para el ${firstRes.reservation_date} ha sido cancelada.`,
          related_id: firstRes.id,
        });
      }
    }

    revalidatePath("/reservaciones");
    revalidatePath("/dashboard/reservaciones");
    return { data: updatedRes, error: null };
  } catch (error) {
    console.error("Error in actualizarEstadoReservacion:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Cancelar reservación
export async function cancelarReservacion(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error cancelling reservation:", error);
      throw new Error(`Error al cancelar reservación: ${error.message}`);
    }

    revalidatePath("/reservaciones");
    revalidatePath("/dashboard/reservaciones");
    return { data, error: null };
  } catch (error) {
    console.error("Error in cancelarReservacion:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar reservación permanentemente
export async function eliminarReservacion(id: string) {
  const supabase = await createClient();

  try {
    // Primero, obtener la reservación original para obtener customer_id, reservation_date y reservation_time
    const { data: originalRes, error: getError } = await supabase
      .from("reservations")
      .select("customer_id, reservation_date, reservation_time")
      .eq("id", id)
      .single();

    if (getError || !originalRes) {
      throw new Error("No se pudo encontrar la reservación");
    }

    // Eliminar TODAS las reservaciones del grupo (mismo customer_id, fecha y hora)
    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("customer_id", originalRes.customer_id)
      .eq("reservation_date", originalRes.reservation_date)
      .eq("reservation_time", originalRes.reservation_time);

    if (error) {
      console.error("Error deleting reservation:", error);
      throw new Error(`Error al eliminar reservación: ${error.message}`);
    }

    revalidatePath("/reservaciones");
    revalidatePath("/dashboard/reservaciones");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarReservacion:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener horarios disponibles para una fecha
export async function obtenerHorariosDisponibles(
  fecha: string,
  productId: string
) {
  const supabase = await createClient();

  try {
    // Obtener las reservaciones existentes para esa fecha y producto
    const { data: reservacionesExistentes, error } = await supabase
      .from("reservations")
      .select("reservation_time, quantity, status")
      .eq("reservation_date", fecha)
      .eq("product_id", productId)
      .in("status", ["pending", "confirmed"]);

    if (error) {
      console.error("Error fetching existing reservations:", error);
      throw new Error(`Error al obtener horarios: ${error.message}`);
    }

    // Generar horarios disponibles (ejemplo: cada 30 minutos de 9:00 a 21:00)
    const horariosDisponibles = [];
    const horaInicio = 9; // 9:00 AM
    const horaFin = 21; // 9:00 PM

    for (let hora = horaInicio; hora < horaFin; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const tiempo = `${hora.toString().padStart(2, "0")}:${minuto
          .toString()
          .padStart(2, "0")}`;

        // Verificar si el horario está disponible
        const reservacionEnEsteHorario = reservacionesExistentes?.find(
          (r) => r.reservation_time === tiempo
        );

        if (!reservacionEnEsteHorario) {
          horariosDisponibles.push(tiempo);
        }
      }
    }

    return { data: horariosDisponibles, error: null };
  } catch (error) {
    console.error("Error in obtenerHorariosDisponibles:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener reservaciones del día (para dashboard)
export async function obtenerReservacionesHoy() {
  const supabase = await createClient();

  try {
    const hoy = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        customer:profiles(first_name, last_name, phone),
        product:products(name)
      `
      )
      .eq("reservation_date", hoy)
      .in("status", ["pending", "confirmed"])
      .order("reservation_time", { ascending: true });

    if (error) {
      console.error("Error fetching today reservations:", error);
      throw new Error(
        `Error al obtener reservaciones de hoy: ${error.message}`
      );
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerReservacionesHoy:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener reservaciones por rango de fechas
export async function obtenerReservacionesPorRango(
  fechaInicio: string,
  fechaFin: string
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        customer:profiles(first_name, last_name),
        product:products(name, price)
      `
      )
      .gte("reservation_date", fechaInicio)
      .lte("reservation_date", fechaFin)
      .order("reservation_date", { ascending: true })
      .order("reservation_time", { ascending: true });

    if (error) {
      console.error("Error fetching reservations by range:", error);
      throw new Error(
        `Error al obtener reservaciones por rango: ${error.message}`
      );
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerReservacionesPorRango:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener estadísticas de reservaciones
export async function obtenerEstadisticasReservaciones() {
  const supabase = await createClient();

  try {
    // Total de reservaciones
    const { count: totalReservaciones, error: errorTotal } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true });

    // Reservaciones pendientes
    const { count: reservacionesPendientes, error: errorPendientes } =
      await supabase
        .from("reservations")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

    // Reservaciones de hoy
    const hoy = new Date().toISOString().split("T")[0];
    const { count: reservacionesHoy, error: errorHoy } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("reservation_date", hoy)
      .in("status", ["pending", "confirmed"]);

    if (errorTotal || errorPendientes || errorHoy) {
      throw new Error("Error al obtener estadísticas de reservaciones");
    }

    const estadisticas = {
      total_reservaciones: totalReservaciones || 0,
      reservaciones_pendientes: reservacionesPendientes || 0,
      reservaciones_hoy: reservacionesHoy || 0,
    };

    return { data: estadisticas, error: null };
  } catch (error) {
    console.error("Error in obtenerEstadisticasReservaciones:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Verificar disponibilidad
export async function verificarDisponibilidad(
  fecha: string,
  tiempo: string,
  productId: string
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select("id")
      .eq("reservation_date", fecha)
      .eq("reservation_time", tiempo)
      .eq("product_id", productId)
      .in("status", ["pending", "confirmed"])
      .single();

    // Si no encuentra reservación, está disponible
    const disponible = !data;

    return { data: { disponible }, error: null };
  } catch (error) {
    // Si hay error pero es porque no encontró registros, está disponible
    if (error instanceof Error && error.message.includes("No rows found")) {
      return { data: { disponible: true }, error: null };
    }

    console.error("Error in verificarDisponibilidad:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function obtenerProductosActivos() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id, 
      name, 
      price, 
      preparation_time, 
      description,
      available_sizes:product_size_options(
        id,
        size_id,
        is_default,
        size:product_sizes(id, name, person_capacity, additional_price)
      )
    `
    )
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Error fetching products:", error);
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// Obtener reservaciones de un cliente con imágenes de productos (para seguimiento)
export async function obtenerReservacionesClienteConImagenes(
  customerId: string
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("reservations")
      .select(
        `
        *,
        customer:profiles(first_name, last_name, email, phone),
        product:products(
          id,
          name,
          price,
          preparation_time,
          images:product_images(image_url, image_order)
        )
      `
      )
      .eq("customer_id", customerId)
      .order("reservation_date", { ascending: false })
      .order("reservation_time", { ascending: false });

    if (error) {
      console.error("Error fetching customer reservations with images:", error);
      throw new Error(
        `Error al obtener reservaciones del cliente: ${error.message}`
      );
    }

    // Agrupar las reservaciones por cliente y fecha
    const agrupadas = agruparReservaciones(data as ReservacionCompleta[]);

    return { data: agrupadas as any, error: null };
  } catch (error) {
    console.error("Error in obtenerReservacionesClienteConImagenes:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
