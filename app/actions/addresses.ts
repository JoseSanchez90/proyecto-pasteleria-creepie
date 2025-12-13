"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Tipos
export type ShippingAddress = {
  id: string;
  user_id: string;
  address_name: string;
  address: string;
  department: string;
  province: string;
  district: string;
  reference: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type NewAddressData = {
  user_id: string;
  address_name?: string;
  address: string;
  department: string;
  province: string;
  district: string;
  reference?: string;
  is_default?: boolean;
};

// Obtener todas las direcciones de un usuario
export async function obtenerDirecciones(userId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("shipping_addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching addresses:", error);
      throw new Error(`Error al obtener direcciones: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerDirecciones:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Agregar nueva dirección
export async function agregarDireccion(addressData: NewAddressData) {
  const supabase = await createClient();

  try {
    // Validaciones
    if (
      !addressData.address ||
      !addressData.department ||
      !addressData.province ||
      !addressData.district
    ) {
      return {
        data: null,
        error: "Todos los campos obligatorios deben ser completados",
      };
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (addressData.is_default) {
      await supabase
        .from("shipping_addresses")
        .update({ is_default: false })
        .eq("user_id", addressData.user_id);
    }

    // Insertar nueva dirección
    const { data, error } = await supabase
      .from("shipping_addresses")
      .insert([
        {
          user_id: addressData.user_id,
          address_name: addressData.address_name || "",
          address: addressData.address,
          department: addressData.department,
          province: addressData.province,
          district: addressData.district,
          reference: addressData.reference || "",
          is_default: addressData.is_default || false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding address:", error);
      throw new Error(`Error al agregar dirección: ${error.message}`);
    }

    revalidatePath("/verificacion-de-pago");
    revalidatePath("/mi-cuenta");
    return { data, error: null };
  } catch (error) {
    console.error("Error in agregarDireccion:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar dirección existente
export async function actualizarDireccion(
  id: string,
  userId: string,
  updates: {
    address_name?: string;
    address?: string;
    department?: string;
    province?: string;
    district?: string;
    reference?: string;
  }
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("shipping_addresses")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId) // Seguridad: verificar que pertenece al usuario
      .select()
      .single();

    if (error) {
      console.error("Error updating address:", error);
      throw new Error(`Error al actualizar dirección: ${error.message}`);
    }

    revalidatePath("/verificacion-de-pago");
    revalidatePath("/mi-cuenta");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarDireccion:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Establecer dirección como predeterminada
export async function establecerDireccionPredeterminada(
  addressId: string,
  userId: string
) {
  const supabase = await createClient();

  try {
    // Primero, desmarcar todas las direcciones del usuario
    await supabase
      .from("shipping_addresses")
      .update({ is_default: false })
      .eq("user_id", userId);

    // Luego, marcar la seleccionada como predeterminada
    const { data, error } = await supabase
      .from("shipping_addresses")
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", addressId)
      .eq("user_id", userId) // Seguridad: verificar que pertenece al usuario
      .select()
      .single();

    if (error) {
      console.error("Error setting default address:", error);
      throw new Error(
        `Error al establecer dirección predeterminada: ${error.message}`
      );
    }

    revalidatePath("/verificacion-de-pago");
    revalidatePath("/mi-cuenta");
    return { data, error: null };
  } catch (error) {
    console.error("Error in establecerDireccionPredeterminada:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar dirección
export async function eliminarDireccion(addressId: string, userId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("shipping_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId); // Seguridad: verificar que pertenece al usuario

    if (error) {
      console.error("Error deleting address:", error);
      throw new Error(`Error al eliminar dirección: ${error.message}`);
    }

    revalidatePath("/verificacion-de-pago");
    revalidatePath("/mi-cuenta");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarDireccion:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
