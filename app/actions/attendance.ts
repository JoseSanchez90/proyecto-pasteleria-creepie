"use server";

import { createClient } from "@/utils/supabase/server";

// Marcar entrada
export async function checkIn() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Verificar que el usuario tenga un horario asignado
    const { data: assignedSchedule } = await supabase
      .from("staff_schedules")
      .select("*, schedule:work_schedules(*)")
      .eq("staff_id", user.id)
      .eq("is_active", true)
      .single();

    if (!assignedSchedule) {
      return {
        error:
          "No tienes un horario asignado. Contacta al administrador para que te asigne un horario de trabajo.",
      };
    }

    const today = new Date().toISOString().split("T")[0];

    // Verificar si ya marcó entrada hoy
    const { data: existing } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", user.id)
      .eq("work_date", today)
      .single();

    if (existing && existing.check_in) {
      return { error: "Ya marcaste entrada hoy" };
    }

    if (existing) {
      // Actualizar registro existente
      const { error } = await supabase
        .from("staff_attendance")
        .update({ check_in: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Crear nuevo registro
      const { error } = await supabase.from("staff_attendance").insert({
        staff_id: user.id,
        work_date: today,
        check_in: new Date().toISOString(),
      });

      if (error) throw error;
    }

    return { success: true, message: "Entrada marcada correctamente" };
  } catch (error: any) {
    console.error("Error en checkIn:", error);
    return { error: error.message };
  }
}

// Marcar inicio de refrigerio
export async function startBreak() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: attendance } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", user.id)
      .eq("work_date", today)
      .single();

    if (!attendance) {
      return { error: "Debes marcar entrada primero" };
    }

    if (!attendance.check_in) {
      return { error: "Debes marcar entrada primero" };
    }

    if (attendance.break_start) {
      return { error: "Ya iniciaste el refrigerio" };
    }

    const { error } = await supabase
      .from("staff_attendance")
      .update({ break_start: new Date().toISOString() })
      .eq("id", attendance.id);

    if (error) throw error;

    return { success: true, message: "Refrigerio iniciado" };
  } catch (error: any) {
    console.error("Error en startBreak:", error);
    return { error: error.message };
  }
}

// Marcar fin de refrigerio
export async function endBreak() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: attendance } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", user.id)
      .eq("work_date", today)
      .single();

    if (!attendance || !attendance.break_start) {
      return { error: "Debes iniciar el refrigerio primero" };
    }

    if (attendance.break_end) {
      return { error: "Ya finalizaste el refrigerio" };
    }

    const { error } = await supabase
      .from("staff_attendance")
      .update({ break_end: new Date().toISOString() })
      .eq("id", attendance.id);

    if (error) throw error;

    return { success: true, message: "Refrigerio finalizado" };
  } catch (error: any) {
    console.error("Error en endBreak:", error);
    return { error: error.message };
  }
}

// Marcar salida
export async function checkOut() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: attendance } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", user.id)
      .eq("work_date", today)
      .single();

    if (!attendance || !attendance.check_in) {
      return { error: "Debes marcar entrada primero" };
    }

    if (attendance.check_out) {
      return { error: "Ya marcaste salida hoy" };
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(attendance.check_in);

    // Calcular horas trabajadas
    let totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / 60000;

    // Restar tiempo de refrigerio si existe
    if (attendance.break_start && attendance.break_end) {
      const breakStart = new Date(attendance.break_start);
      const breakEnd = new Date(attendance.break_end);
      const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / 60000;
      totalMinutes -= breakMinutes;
    }

    const hoursWorked = (totalMinutes / 60).toFixed(2);

    const { error } = await supabase
      .from("staff_attendance")
      .update({
        check_out: checkOutTime.toISOString(),
        hours_worked: hoursWorked,
      })
      .eq("id", attendance.id);

    if (error) throw error;

    return {
      success: true,
      message: `Salida marcada. Horas trabajadas: ${hoursWorked}`,
    };
  } catch (error: any) {
    console.error("Error en checkOut:", error);
    return { error: error.message };
  }
}

// Obtener asistencia de hoy
export async function getTodayAttendance() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", user.id)
      .eq("work_date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return { data: data || null, error: null };
  } catch (error: any) {
    console.error("Error en getTodayAttendance:", error);
    return { data: null, error: error.message };
  }
}

// Obtener asistencia del mes actual
export async function getMonthlyAttendance(staffId?: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    const targetStaffId = staffId || user.id;

    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", targetStaffId)
      .gte("work_date", firstDay)
      .lte("work_date", lastDay)
      .order("work_date", { ascending: false });

    if (error) throw error;

    // Calcular total de horas del mes
    const totalHours = data?.reduce(
      (sum, record) => sum + (parseFloat(record.hours_worked) || 0),
      0
    );

    return { data, totalHours, error: null };
  } catch (error: any) {
    console.error("Error en getMonthlyAttendance:", error);
    return { data: null, totalHours: 0, error: error.message };
  }
}

// Obtener asistencia de un mes y año específico
export async function getAttendanceByMonth(
  year: number,
  month: number,
  staffId?: string
) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    const targetStaffId = staffId || user.id;

    // Calcular primer y último día del mes
    const firstDay = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const lastDay = new Date(year, month, 0).toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", targetStaffId)
      .gte("work_date", firstDay)
      .lte("work_date", lastDay)
      .order("work_date", { ascending: false });

    if (error) throw error;

    // Calcular total de horas del mes
    const totalHours = data?.reduce(
      (sum, record) => sum + (parseFloat(record.hours_worked) || 0),
      0
    );

    return { data, totalHours, error: null };
  } catch (error: any) {
    console.error("Error en getAttendanceByMonth:", error);
    return { data: null, totalHours: 0, error: error.message };
  }
}

// Obtener reporte de asistencia de todos los empleados (solo admin)
export async function getAllStaffAttendance(month?: string, year?: string) {
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
      return { data: null, error: "No tienes permisos para ver este reporte" };
    }

    const now = new Date();
    const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    const firstDay = new Date(targetYear, targetMonth, 1)
      .toISOString()
      .split("T")[0];
    const lastDay = new Date(targetYear, targetMonth + 1, 0)
      .toISOString()
      .split("T")[0];

    const { data, error } = await supabase
      .from("staff_attendance")
      .select(
        `
        *,
        staff:profiles(id, first_name, last_name, email)
      `
      )
      .gte("work_date", firstDay)
      .lte("work_date", lastDay)
      .order("work_date", { ascending: false });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error("Error en getAllStaffAttendance:", error);
    return { data: null, error: error.message };
  }
}

// ============================================
// NUEVAS FUNCIONES PARA SUPERVISOR
// ============================================

// Obtener todos los staff con su asistencia de hoy
export async function getAllStaffWithTodayAttendance() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    // Verificar que sea supervisor o admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "supervisor"].includes(profile.role)) {
      return {
        data: null,
        error: "No tienes permisos para ver esta información",
      };
    }

    const today = new Date().toISOString().split("T")[0];

    // Obtener todos los usuarios con rol staff
    const { data: staffList, error: staffError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("role", "staff")
      .order("first_name");

    if (staffError) throw staffError;

    if (!staffList || staffList.length === 0) {
      return { data: [], error: null };
    }

    // Obtener horarios activos para todos los staff
    const { data: schedulesList, error: schedulesError } = await supabase
      .from("staff_schedules")
      .select(
        `
        staff_id,
        schedule:work_schedules(
          name,
          check_in_time,
          check_out_time,
          daily_hours
        )
      `
      )
      .eq("is_active", true)
      .in(
        "staff_id",
        staffList.map((s) => s.id)
      );

    if (schedulesError) throw schedulesError;

    // Obtener asistencia de hoy para todos los staff
    const { data: attendanceList, error: attendanceError } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("work_date", today)
      .in(
        "staff_id",
        staffList.map((s) => s.id)
      );

    if (attendanceError) throw attendanceError;

    // Combinar datos
    const staffWithAttendance = staffList
      .map((staff: any) => {
        const scheduleAssignment = schedulesList?.find(
          (s: any) => s.staff_id === staff.id
        );
        const attendance = attendanceList?.find((a) => a.staff_id === staff.id);

        // El schedule viene desde Supabase, puede ser objeto o array
        const rawSchedule = scheduleAssignment?.schedule;
        const schedule = Array.isArray(rawSchedule)
          ? rawSchedule[0] || null
          : rawSchedule || null;

        return {
          id: staff.id,
          first_name: staff.first_name,
          last_name: staff.last_name,
          email: staff.email,
          schedule: schedule,
          today_attendance: attendance || null,
        };
      })
      // Filtrar solo los que tienen horario asignado
      .filter((staff) => staff.schedule !== null);

    return { data: staffWithAttendance, error: null };
  } catch (error: any) {
    console.error("Error en getAllStaffWithTodayAttendance:", error);
    return { data: null, error: error.message };
  }
}

// Marcar entrada para un staff (usado por supervisor)
export async function markStaffCheckIn(staffId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Verificar que sea supervisor o admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "supervisor"].includes(profile.role)) {
      return { error: "No tienes permisos para realizar esta acción" };
    }

    // Verificar que el staff tenga horario asignado
    const { data: assignedSchedule } = await supabase
      .from("staff_schedules")
      .select("*")
      .eq("staff_id", staffId)
      .eq("is_active", true)
      .single();

    if (!assignedSchedule) {
      return {
        error: "Este trabajador no tiene un horario asignado",
      };
    }

    const today = new Date().toISOString().split("T")[0];

    // Verificar si ya marcó entrada hoy
    const { data: existing } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", staffId)
      .eq("work_date", today)
      .single();

    if (existing && existing.check_in) {
      return { error: "Este trabajador ya marcó entrada hoy" };
    }

    if (existing) {
      // Actualizar registro existente
      const { error } = await supabase
        .from("staff_attendance")
        .update({ check_in: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Crear nuevo registro
      const { error } = await supabase.from("staff_attendance").insert({
        staff_id: staffId,
        work_date: today,
        check_in: new Date().toISOString(),
      });

      if (error) throw error;
    }

    return { success: true, message: "Entrada marcada correctamente" };
  } catch (error: any) {
    console.error("Error en markStaffCheckIn:", error);
    return { error: error.message };
  }
}

// Marcar inicio de refrigerio para un staff (usado por supervisor)
export async function markStaffBreakStart(staffId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Verificar que sea supervisor o admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "supervisor"].includes(profile.role)) {
      return { error: "No tienes permisos para realizar esta acción" };
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: attendance } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", staffId)
      .eq("work_date", today)
      .single();

    if (!attendance) {
      return { error: "El trabajador debe marcar entrada primero" };
    }

    if (!attendance.check_in) {
      return { error: "El trabajador debe marcar entrada primero" };
    }

    if (attendance.break_start) {
      return { error: "El trabajador ya inició el refrigerio" };
    }

    const { error } = await supabase
      .from("staff_attendance")
      .update({ break_start: new Date().toISOString() })
      .eq("id", attendance.id);

    if (error) throw error;

    return { success: true, message: "Refrigerio iniciado" };
  } catch (error: any) {
    console.error("Error en markStaffBreakStart:", error);
    return { error: error.message };
  }
}

// Marcar fin de refrigerio para un staff (usado por supervisor)
export async function markStaffBreakEnd(staffId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Verificar que sea supervisor o admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "supervisor"].includes(profile.role)) {
      return { error: "No tienes permisos para realizar esta acción" };
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: attendance } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", staffId)
      .eq("work_date", today)
      .single();

    if (!attendance || !attendance.break_start) {
      return { error: "El trabajador debe iniciar el refrigerio primero" };
    }

    if (attendance.break_end) {
      return { error: "El trabajador ya finalizó el refrigerio" };
    }

    const { error } = await supabase
      .from("staff_attendance")
      .update({ break_end: new Date().toISOString() })
      .eq("id", attendance.id);

    if (error) throw error;

    return { success: true, message: "Refrigerio finalizado" };
  } catch (error: any) {
    console.error("Error en markStaffBreakEnd:", error);
    return { error: error.message };
  }
}

// Marcar salida para un staff (usado por supervisor)
export async function markStaffCheckOut(staffId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Verificar que sea supervisor o admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "supervisor"].includes(profile.role)) {
      return { error: "No tienes permisos para realizar esta acción" };
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: attendance } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", staffId)
      .eq("work_date", today)
      .single();

    if (!attendance || !attendance.check_in) {
      return { error: "El trabajador debe marcar entrada primero" };
    }

    if (attendance.check_out) {
      return { error: "El trabajador ya marcó salida hoy" };
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(attendance.check_in);

    // Calcular horas trabajadas
    let totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / 60000;

    // Restar tiempo de refrigerio si existe
    if (attendance.break_start && attendance.break_end) {
      const breakStart = new Date(attendance.break_start);
      const breakEnd = new Date(attendance.break_end);
      const breakMinutes = (breakEnd.getTime() - breakStart.getTime()) / 60000;
      totalMinutes -= breakMinutes;
    }

    const hoursWorked = (totalMinutes / 60).toFixed(2);

    const { error } = await supabase
      .from("staff_attendance")
      .update({
        check_out: checkOutTime.toISOString(),
        hours_worked: hoursWorked,
      })
      .eq("id", attendance.id);

    if (error) throw error;

    return {
      success: true,
      message: `Salida marcada. Horas trabajadas: ${hoursWorked}`,
    };
  } catch (error: any) {
    console.error("Error en markStaffCheckOut:", error);
    return { error: error.message };
  }
}

// Actualizar registro de asistencia manualmente (para administrador)
export async function updateAttendanceRecord(
  recordId: string,
  updates: {
    check_in?: string;
    break_start?: string;
    break_end?: string;
    check_out?: string;
  }
) {
  const supabase = await createClient();

  try {
    const { data: record, error: fetchError } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("id", recordId)
      .single();

    if (fetchError) {
      throw new Error("Registro no encontrado");
    }

    const updateData: any = {};

    if (updates.check_in) {
      updateData.check_in = updates.check_in;
    }

    if (updates.break_start) {
      updateData.break_start = updates.break_start;
    }

    if (updates.break_end) {
      updateData.break_end = updates.break_end;
    }

    if (updates.check_out) {
      updateData.check_out = updates.check_out;
    }

    // Recalcular horas trabajadas si hay cambios
    if (
      updates.check_in ||
      updates.break_start ||
      updates.break_end ||
      updates.check_out
    ) {
      const checkIn = new Date(
        updates.check_in || record.check_in
      ).getTime();
      const breakStart = new Date(
        updates.break_start || record.break_start
      ).getTime();
      const breakEnd = new Date(
        updates.break_end || record.break_end
      ).getTime();
      const checkOut = new Date(
        updates.check_out || record.check_out
      ).getTime();

      if (checkIn && breakStart && breakEnd && checkOut) {
        const breakDuration = (breakEnd - breakStart) / (1000 * 60 * 60);
        const totalTime = (checkOut - checkIn) / (1000 * 60 * 60);
        const hoursWorked = totalTime - breakDuration;
        updateData.hours_worked = Math.max(0, hoursWorked);
      }
    }

    const { error } = await supabase
      .from("staff_attendance")
      .update(updateData)
      .eq("id", recordId);

    if (error) throw error;

    return { success: true, message: "Registro actualizado correctamente" };
  } catch (error: any) {
    console.error("Error updating attendance record:", error);
    return { error: error.message };
  }
}
