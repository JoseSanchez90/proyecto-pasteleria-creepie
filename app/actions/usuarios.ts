"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

// Tipos basados en tu schema
export type Usuario = {
  id: string;
  role: "customer" | "staff" | "admin" | "supervisor";
  first_name: string;
  last_name: string;
  dni_ruc: string;
  birth_date: string | null;
  address: string;
  department: string;
  province: string;
  district: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export type UsuarioCompleto = Usuario & {
  staff_roles?: {
    can_manage_products: boolean;
    can_manage_orders: boolean;
    can_manage_reservations: boolean;
    can_manage_staff: boolean;
    can_view_reports: boolean;
  };
  staff_attendance?: Array<{
    work_date: string;
    check_in: string | null;
    check_out: string | null;
    hours_worked: number;
  }>;
};

export type StaffRole = {
  id: string;
  staff_id: string;
  can_manage_products: boolean;
  can_manage_orders: boolean;
  can_manage_reservations: boolean;
  can_manage_staff: boolean;
  can_view_reports: boolean;
  created_at: string;
};

export async function crearUsuario(usuarioData: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  dni_ruc: string;
  birth_date?: string;
  phone?: string;
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  role?: "customer" | "admin" | "staff" | "supervisor";
}) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient(); // Admin client for auth operations

  try {
    // Validaciones
    if (!usuarioData.email || !usuarioData.password) {
      throw new Error("Email y contraseña son requeridos");
    }

    if (usuarioData.password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }

    if (
      !usuarioData.first_name ||
      !usuarioData.last_name ||
      !usuarioData.dni_ruc
    ) {
      throw new Error("Nombre, apellido y DNI son requeridos");
    }

    // Verificar si el email ya existe en profiles
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", usuarioData.email)
      .single();

    if (existingProfile) {
      throw new Error(
        `El email ${usuarioData.email} ya está registrado en el sistema`
      );
    }

    // 1. Crear usuario en Auth de Supabase usando el cliente admin
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: usuarioData.email,
        password: usuarioData.password,
        email_confirm: true, // Auto-confirmar el email
        user_metadata: {
          first_name: usuarioData.first_name,
          last_name: usuarioData.last_name,
          dni_ruc: usuarioData.dni_ruc,
        },
      });

    if (authError) {
      console.error("Error creating auth user:", authError);
      // Manejar error específico de usuario duplicado
      if (authError.message.includes("already registered")) {
        throw new Error(
          `El email ${usuarioData.email} ya está registrado en autenticación`
        );
      }
      throw new Error(`Error al crear usuario: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error(
        "No se pudo crear el usuario en el sistema de autenticación"
      );
    }

    // 2. Crear o actualizar perfil en la tabla profiles
    // Nota: Si hay un trigger que crea el perfil automáticamente,
    // usamos upsert para actualizarlo con los datos correctos
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        [
          {
            id: authData.user.id,
            role: usuarioData.role || "customer",
            first_name: usuarioData.first_name,
            last_name: usuarioData.last_name,
            dni_ruc: usuarioData.dni_ruc,
            birth_date: usuarioData.birth_date || null,
            address: usuarioData.address || "",
            department: usuarioData.department || "",
            province: usuarioData.province || "",
            district: usuarioData.district || "",
            phone: usuarioData.phone || "",
            email: usuarioData.email,
          },
        ],
        {
          onConflict: "id", // Si el ID ya existe, actualiza en lugar de lanzar error
        }
      )
      .select()
      .single();

    if (profileError) {
      console.error("Error creating/updating profile:", profileError);

      // Si falla crear el profile, intentar eliminar el usuario de auth
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log(
          "Usuario de auth eliminado después de fallo en perfil:",
          authData.user.id
        );
      } catch (deleteError) {
        console.error("Error al eliminar usuario de auth:", deleteError);
      }

      throw new Error(`Error al crear perfil: ${profileError.message}`);
    }

    revalidatePath("/dashboard/usuarios");
    return {
      data: {
        auth_user: authData.user,
        profile: profileData,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error in crearUsuario:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar usuario (solo el perfil, no la autenticación)
export async function actualizarUsuario(
  id: string,
  datosActualizados: {
    first_name?: string;
    last_name?: string;
    dni_ruc?: string;
    birth_date?: string | null;
    phone?: string;
    address?: string;
    department?: string;
    province?: string;
    district?: string;
    role?: "customer" | "admin" | "staff" | "supervisor";
  }
) {
  const supabase = await createClient();

  try {
    // Validaciones
    if (datosActualizados.dni_ruc && datosActualizados.dni_ruc.length < 8) {
      throw new Error("El DNI debe tener al menos 8 dígitos");
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...datosActualizados,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }

    revalidatePath("/dashboard/usuarios");
    revalidatePath(`/dashboard/usuarios/${id}`);
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarUsuario:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener todos los usuarios (para admin)
export async function obtenerUsuarios(filtros?: {
  role?: string;
  buscar?: string;
}) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    // Aplicar filtros
    if (filtros?.role) {
      query = query.eq("role", filtros.role);
    }
    if (filtros?.buscar) {
      query = query.or(
        `first_name.ilike.%${filtros.buscar}%,last_name.ilike.%${filtros.buscar}%,email.ilike.%${filtros.buscar}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerUsuarios:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener usuario por ID
export async function obtenerUsuarioPorId(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user:", error);
      throw new Error(`Error al obtener usuario: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerUsuarioPorId:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener perfil completo de usuario (con roles de staff si aplica)
export async function obtenerPerfilCompleto(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        staff_roles(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      throw new Error(`Error al obtener perfil: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerPerfilCompleto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar perfil de usuario
export async function actualizarPerfil(
  id: string,
  datosActualizados: {
    first_name?: string;
    last_name?: string;
    dni_ruc?: string;
    birth_date?: string | null;
    address?: string;
    department?: string;
    province?: string;
    district?: string;
    phone?: string;
  }
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...datosActualizados,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }

    revalidatePath("/mi-cuenta");
    revalidatePath("/dashboard/usuarios");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarPerfil:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar rol de usuario (solo admin)
export async function actualizarRolUsuario(
  id: string,
  nuevoRol: Usuario["role"]
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .update({
        role: nuevoRol,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating user role:", error);
      throw new Error(`Error al actualizar rol: ${error.message}`);
    }

    revalidatePath("/dashboard/usuarios");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarRolUsuario:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener todos los staff
export async function obtenerStaff() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        staff_roles(*)
      `
      )
      .eq("role", "staff")
      .order("first_name");

    if (error) {
      console.error("Error fetching staff:", error);
      throw new Error(`Error al obtener staff: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerStaff:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar permisos de staff
export async function actualizarPermisosStaff(
  staffId: string,
  permisos: {
    can_manage_products: boolean;
    can_manage_orders: boolean;
    can_manage_reservations: boolean;
    can_manage_staff: boolean;
    can_view_reports: boolean;
  }
) {
  const supabase = await createClient();

  try {
    // Verificar si ya existe un registro de roles para este staff
    const { data: existingRole } = await supabase
      .from("staff_roles")
      .select("id")
      .eq("staff_id", staffId)
      .single();

    let result;

    if (existingRole) {
      // Actualizar permisos existentes
      result = await supabase
        .from("staff_roles")
        .update(permisos)
        .eq("staff_id", staffId)
        .select()
        .single();
    } else {
      // Crear nuevos permisos
      result = await supabase
        .from("staff_roles")
        .insert([
          {
            staff_id: staffId,
            ...permisos,
          },
        ])
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error updating staff permissions:", result.error);
      throw new Error(`Error al actualizar permisos: ${result.error.message}`);
    }

    revalidatePath("/admin/staff");
    return { data: result.data, error: null };
  } catch (error) {
    console.error("Error in actualizarPermisosStaff:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Registrar asistencia de staff
export async function registrarAsistencia(
  staffId: string,
  accion: "check_in" | "break_start" | "break_end" | "check_out"
) {
  const supabase = await createClient();

  try {
    const hoy = new Date().toISOString().split("T")[0];
    const ahora = new Date().toISOString();

    // Buscar registro de asistencia del día
    const { data: registroExistente } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", staffId)
      .eq("work_date", hoy)
      .single();

    let result;

    if (registroExistente) {
      // Actualizar registro existente
      const actualizacion: any = {};

      switch (accion) {
        case "check_in":
          actualizacion.check_in = ahora;
          break;
        case "break_start":
          actualizacion.break_start = ahora;
          break;
        case "break_end":
          actualizacion.break_end = ahora;
          // Calcular horas trabajadas hasta ahora
          if (registroExistente.check_in) {
            const horasTrabajadas = calcularHorasTrabajadas(
              registroExistente.check_in,
              ahora,
              registroExistente.break_start,
              registroExistente.break_end
            );
            actualizacion.hours_worked = horasTrabajadas;
          }
          break;
        case "check_out":
          actualizacion.check_out = ahora;
          // Calcular horas trabajadas totales
          if (registroExistente.check_in) {
            const horasTrabajadas = calcularHorasTrabajadas(
              registroExistente.check_in,
              ahora,
              registroExistente.break_start,
              registroExistente.break_end
            );
            actualizacion.hours_worked = horasTrabajadas;
          }
          break;
      }

      result = await supabase
        .from("staff_attendance")
        .update(actualizacion)
        .eq("id", registroExistente.id)
        .select()
        .single();
    } else {
      // Crear nuevo registro (solo para check_in)
      if (accion !== "check_in") {
        throw new Error("Debe registrar entrada primero");
      }

      result = await supabase
        .from("staff_attendance")
        .insert([
          {
            staff_id: staffId,
            work_date: hoy,
            check_in: ahora,
            hours_worked: 0,
          },
        ])
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error recording attendance:", result.error);
      throw new Error(`Error al registrar asistencia: ${result.error.message}`);
    }

    revalidatePath("/staff/asistencia");
    return { data: result.data, error: null };
  } catch (error) {
    console.error("Error in registrarAsistencia:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Función auxiliar para calcular horas trabajadas
function calcularHorasTrabajadas(
  checkIn: string,
  checkOut: string,
  breakStart: string | null,
  breakEnd: string | null
): number {
  const inicio = new Date(checkIn).getTime();
  const fin = new Date(checkOut).getTime();

  let horasTotales = (fin - inicio) / (1000 * 60 * 60); // Convertir a horas

  // Restar tiempo de break si existe
  if (breakStart && breakEnd) {
    const inicioBreak = new Date(breakStart).getTime();
    const finBreak = new Date(breakEnd).getTime();
    const horasBreak = (finBreak - inicioBreak) / (1000 * 60 * 60);
    horasTotales -= horasBreak;
  }

  return Math.max(0, horasTotales);
}

// Obtener asistencia de staff por rango de fechas
export async function obtenerAsistenciaStaff(
  staffId: string,
  fechaInicio: string,
  fechaFin: string
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("staff_attendance")
      .select("*")
      .eq("staff_id", staffId)
      .gte("work_date", fechaInicio)
      .lte("work_date", fechaFin)
      .order("work_date", { ascending: false });

    if (error) {
      console.error("Error fetching staff attendance:", error);
      throw new Error(`Error al obtener asistencia: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerAsistenciaStaff:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener estadísticas de usuarios
export async function obtenerEstadisticasUsuarios() {
  const supabase = await createClient();

  try {
    // Total de usuarios
    const { count: totalUsuarios, error: errorTotal } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Usuarios por rol
    const { count: totalClientes, error: errorClientes } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "customer");

    const { count: totalStaff, error: errorStaff } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "staff");

    const { count: totalSupervisores, error: errorSupervisores } =
      await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "supervisor");

    // Nuevos usuarios este mes
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: nuevosEsteMes, error: errorNuevos } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", inicioMes.toISOString());

    if (
      errorTotal ||
      errorClientes ||
      errorStaff ||
      errorSupervisores ||
      errorNuevos
    ) {
      throw new Error("Error al obtener estadísticas de usuarios");
    }

    const estadisticas = {
      total_usuarios: totalUsuarios || 0,
      total_clientes: totalClientes || 0,
      total_staff: totalStaff || 0,
      total_supervisores: totalSupervisores || 0,
      nuevos_este_mes: nuevosEsteMes || 0,
    };

    return { data: estadisticas, error: null };
  } catch (error) {
    console.error("Error in obtenerEstadisticasUsuarios:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Buscar usuarios
export async function buscarUsuarios(termino: string, limit: number = 10) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .or(
        `first_name.ilike.%${termino}%,last_name.ilike.%${termino}%,email.ilike.%${termino}%,phone.ilike.%${termino}%`
      )
      .limit(limit);

    if (error) {
      console.error("Error searching users:", error);
      throw new Error(`Error al buscar usuarios: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in buscarUsuarios:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar usuario completamente (perfil + auth + datos relacionados)
export async function eliminarUsuario(id: string) {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient(); // Admin client for auth operations

  try {
    // 1. Eliminar datos relacionados primero
    console.log("Eliminando carrito del usuario:", id);
    await supabaseAdmin.from("cart").delete().eq("user_id", id);

    console.log("Eliminando items del carrito del usuario:", id);
    // Eliminar cart_items si existe la tabla
    try {
      await supabaseAdmin.from("cart_items").delete().eq("user_id", id);
    } catch (e) {
      // Si la tabla no existe o hay error, continuar
      console.log("No se pudo eliminar cart_items (puede no existir):", e);
    }

    console.log("Eliminando pedidos del usuario:", id);
    // Eliminar pedidos (orders) del usuario
    try {
      await supabaseAdmin.from("orders").delete().eq("user_id", id);
    } catch (e) {
      console.log("No se pudo eliminar orders:", e);
    }

    console.log("Eliminando reservas del usuario:", id);
    // Eliminar reservaciones del usuario
    try {
      await supabaseAdmin.from("reservations").delete().eq("user_id", id);
    } catch (e) {
      console.log("No se pudo eliminar reservations:", e);
    }

    // 2. Eliminar el perfil de la tabla profiles
    console.log("Eliminando perfil del usuario:", id);
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileError) {
      console.error("Error deleting profile:", profileError);
      throw new Error(`Error al eliminar perfil: ${profileError.message}`);
    }

    // 3. Luego eliminar el usuario de Auth usando el cliente admin
    console.log("Eliminando usuario de Auth:", id);
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authError) {
      console.error("Error deleting auth user:", authError);

      // Si falla eliminar de Auth, podrías considerar recrear el perfil
      // o manejar el error de otra manera
      throw new Error(
        `Error al eliminar usuario de autenticación: ${authError.message}`
      );
    }

    revalidatePath("/dashboard/usuarios");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarUsuario:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
