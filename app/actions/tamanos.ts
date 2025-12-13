"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Tipos para tamaños
export type Tamano = {
  id: string;
  name: string;
  person_capacity: number;
  additional_price: number;
  description: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type TamanoConConteo = Tamano & {
  product_count?: number;
};

// Obtener todos los tamaños
export async function obtenerTamanos(soloActivos: boolean = true) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("product_sizes")
      .select("*")
      .order("display_order", { ascending: true });

    if (soloActivos) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching sizes:", error);
      throw new Error(`Error al obtener tamaños: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerTamanos:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener tamaños con conteo de productos
export async function obtenerTamanosConConteo() {
  const supabase = await createClient();

  try {
    const { data: tamanos, error: tamanosError } = await supabase
      .from("product_sizes")
      .select("*")
      .order("display_order", { ascending: true });

    if (tamanosError) {
      throw new Error(`Error al obtener tamaños: ${tamanosError.message}`);
    }

    // Obtener conteo de productos para cada tamaño
    const tamanosConConteo = await Promise.all(
      (tamanos || []).map(async (tamano) => {
        const { count } = await supabase
          .from("product_size_options")
          .select("*", { count: "exact", head: true })
          .eq("size_id", tamano.id);

        return {
          ...tamano,
          product_count: count || 0,
        };
      })
    );

    return { data: tamanosConConteo, error: null };
  } catch (error) {
    console.error("Error in obtenerTamanosConConteo:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener tamaño por ID
export async function obtenerTamanoPorId(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("product_sizes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching size:", error);
      throw new Error(`Error al obtener tamaño: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerTamanoPorId:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Crear nuevo tamaño
export async function crearTamano(formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get("name") as string;
    const person_capacity = parseInt(formData.get("person_capacity") as string);
    const additional_price =
      parseFloat(formData.get("additional_price") as string) || 0;
    const description = formData.get("description") as string;
    const display_order =
      parseInt(formData.get("display_order") as string) || 0;
    const is_active = formData.get("is_active") === "true";

    // Validaciones
    if (!name || !person_capacity) {
      throw new Error("Nombre y capacidad de personas son requeridos");
    }

    if (person_capacity <= 0) {
      throw new Error("La capacidad de personas debe ser mayor a 0");
    }

    if (additional_price < 0) {
      throw new Error("El precio adicional no puede ser negativo");
    }

    const { data, error } = await supabase
      .from("product_sizes")
      .insert([
        {
          name,
          person_capacity,
          additional_price,
          description: description || "",
          display_order,
          is_active,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating size:", error);
      throw new Error(`Error al crear tamaño: ${error.message}`);
    }

    revalidatePath("/dashboard/tamanos");
    revalidatePath("/dashboard/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in crearTamano:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar tamaño
export async function actualizarTamano(id: string, formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get("name") as string;
    const person_capacity = parseInt(formData.get("person_capacity") as string);
    const additional_price =
      parseFloat(formData.get("additional_price") as string) || 0;
    const description = formData.get("description") as string;
    const display_order =
      parseInt(formData.get("display_order") as string) || 0;
    const is_active = formData.get("is_active") === "true";

    if (!name || !person_capacity) {
      throw new Error("Nombre y capacidad de personas son requeridos");
    }

    if (person_capacity <= 0) {
      throw new Error("La capacidad de personas debe ser mayor a 0");
    }

    if (additional_price < 0) {
      throw new Error("El precio adicional no puede ser negativo");
    }

    const { data, error } = await supabase
      .from("product_sizes")
      .update({
        name,
        person_capacity,
        additional_price,
        description: description || "",
        display_order,
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating size:", error);
      throw new Error(`Error al actualizar tamaño: ${error.message}`);
    }

    revalidatePath("/dashboard/tamanos");
    revalidatePath("/dashboard/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarTamano:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar tamaño
export async function eliminarTamano(id: string) {
  const supabase = await createClient();

  try {
    // Verificar si hay productos asociados
    const { count } = await supabase
      .from("product_size_options")
      .select("*", { count: "exact", head: true })
      .eq("size_id", id);

    if (count && count > 0) {
      throw new Error(
        "No se puede eliminar un tamaño que tiene productos asociados"
      );
    }

    const { error } = await supabase
      .from("product_sizes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting size:", error);
      throw new Error(`Error al eliminar tamaño: ${error.message}`);
    }

    revalidatePath("/dashboard/tamanos");
    revalidatePath("/dashboard/productos");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarTamano:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Toggle estado activo/inactivo
export async function toggleEstadoTamano(id: string, nuevoEstado: boolean) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("product_sizes")
      .update({
        is_active: nuevoEstado,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error toggling size status:", error);
      throw new Error(`Error al cambiar estado: ${error.message}`);
    }

    revalidatePath("/dashboard/tamanos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in toggleEstadoTamano:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
