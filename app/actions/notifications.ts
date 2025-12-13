"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Tipo para notificaciones basado en tu schema
export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
  is_read: boolean;
  created_at: string;
};

// Obtener notificaciones del usuario
export async function getNotifications(limit: number = 10) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications:", error);
      throw new Error(`Error al obtener notificaciones: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in getNotifications:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener conteo de notificaciones no leídas
export async function getUnreadCount() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { count: 0, error: null };
    }

    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error fetching unread count:", error);
      throw new Error(
        `Error al obtener conteo de notificaciones: ${error.message}`
      );
    }

    return { count: count || 0, error: null };
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    return {
      count: 0,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Marcar notificación como leída
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const { data, error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id) // Asegurar que pertenece al usuario
      .select()
      .single();

    if (error) {
      console.error("Error marking notification as read:", error);
      throw new Error(
        `Error al marcar notificación como leída: ${error.message}`
      );
    }

    revalidatePath("/");
    return { data, error: null };
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Marcar todas las notificaciones como leídas
export async function markAllNotificationsAsRead() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      throw new Error(
        `Error al marcar todas las notificaciones como leídas: ${error.message}`
      );
    }

    revalidatePath("/");
    return { error: null };
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Crear nueva notificación (esta puede ser llamada por admin o sistema, así que user_id se pasa)
export async function createNotification(notificationData: {
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_id?: string;
}) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: notificationData.user_id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          related_id: notificationData.related_id,
          is_read: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating notification:", error);
      throw new Error(`Error al crear notificación: ${error.message}`);
    }

    revalidatePath("/");
    return { data, error: null };
  } catch (error) {
    console.error("Error in createNotification:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar notificación
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Usuario no autenticado");
    }

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", user.id); // Asegurar que pertenece al usuario

    if (error) {
      console.error("Error deleting notification:", error);
      throw new Error(`Error al eliminar notificación: ${error.message}`);
    }

    revalidatePath("/");
    return { error: null };
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener notificaciones por tipo
export async function getNotificationsByType(type: string, limit: number = 10) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", type)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notifications by type:", error);
      throw new Error(`Error al obtener notificaciones: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in getNotificationsByType:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener notificaciones recientes (últimos 7 días)
export async function getRecentNotifications(days: number = 7) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: null };
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recent notifications:", error);
      throw new Error(
        `Error al obtener notificaciones recientes: ${error.message}`
      );
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in getRecentNotifications:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
