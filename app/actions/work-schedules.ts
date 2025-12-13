"use server";

import { createClient } from "@/utils/supabase/server";

// Crear horario de trabajo
export async function createWorkSchedule(scheduleData: {
  name: string;
  monthly_hours: number;
  daily_hours: number;
  work_days_per_week: number;
  check_in_time: string;
  check_out_time: string;
  break_duration_minutes: number;
  tolerance_minutes: number;
}) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { error: "No tienes permisos para crear horarios" };
    }

    const { data, error } = await supabase
      .from("work_schedules")
      .insert(scheduleData)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error("Error en createWorkSchedule:", error);
    return { data: null, error: error.message };
  }
}

// Obtener todos los horarios
export async function getAllWorkSchedules() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("work_schedules")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error("Error en getAllWorkSchedules:", error);
    return { data: null, error: error.message };
  }
}

// Actualizar horario
export async function updateWorkSchedule(
  scheduleId: string,
  scheduleData: Partial<{
    name: string;
    monthly_hours: number;
    daily_hours: number;
    work_days_per_week: number;
    check_in_time: string;
    check_out_time: string;
    break_duration_minutes: number;
    tolerance_minutes: number;
    is_active: boolean;
  }>
) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { error: "No tienes permisos para actualizar horarios" };
    }

    const { data, error } = await supabase
      .from("work_schedules")
      .update({ ...scheduleData, updated_at: new Date().toISOString() })
      .eq("id", scheduleId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error("Error en updateWorkSchedule:", error);
    return { data: null, error: error.message };
  }
}

// Asignar horario a empleado
export async function assignScheduleToStaff(
  staffId: string,
  scheduleId: string,
  startDate: string,
  endDate?: string
) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { error: "No tienes permisos para asignar horarios" };
    }

    // Desactivar asignaciones anteriores activas
    await supabase
      .from("staff_schedules")
      .update({ is_active: false })
      .eq("staff_id", staffId)
      .eq("is_active", true);

    // Crear nueva asignación
    const { data, error } = await supabase
      .from("staff_schedules")
      .insert({
        staff_id: staffId,
        schedule_id: scheduleId,
        start_date: startDate,
        end_date: endDate || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error("Error en assignScheduleToStaff:", error);
    return { data: null, error: error.message };
  }
}

// Obtener horario asignado a un empleado
export async function getStaffSchedule(staffId?: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    const targetStaffId = staffId || user.id;

    const { data, error } = await supabase
      .from("staff_schedules")
      .select(
        `
        *,
        schedule:work_schedules(*)
      `
      )
      .eq("staff_id", targetStaffId)
      .eq("is_active", true)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return { data: data || null, error: null };
  } catch (error: any) {
    console.error("Error en getStaffSchedule:", error);
    return { data: null, error: error.message };
  }
}

// Obtener todos los empleados con sus horarios
export async function getAllStaffWithSchedules() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    // Verificar que sea admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return { data: null, error: "No tienes permisos" };
    }

    // Obtener todos los empleados (staff)
    const { data: staffList, error: staffError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, role")
      .in("role", ["staff", "admin"]);

    if (staffError) throw staffError;

    // Obtener horarios asignados
    const { data: schedules, error: schedulesError } = await supabase
      .from("staff_schedules")
      .select(
        `
        *,
        schedule:work_schedules(*)
      `
      )
      .eq("is_active", true);

    if (schedulesError) throw schedulesError;

    // Combinar datos
    const staffWithSchedules = staffList?.map((staff) => {
      const assignedSchedule = schedules?.find((s) => s.staff_id === staff.id);
      return {
        ...staff,
        assigned_schedule: assignedSchedule || null,
      };
    });

    return { data: staffWithSchedules, error: null };
  } catch (error: any) {
    console.error("Error en getAllStaffWithSchedules:", error);
    return { data: null, error: error.message };
  }
}
