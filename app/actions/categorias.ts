"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Tipo para categorías
export type Categoria = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Obtener todas las categorías activas
export async function getCategorias() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in getCategorias:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener categoría por ID
export async function getCategoriaById(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching category:", error);
      throw new Error(`Error al obtener categoría: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in getCategoriaById:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Crear nueva categoría
export async function createCategoria(formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (!name) {
      throw new Error("El nombre de la categoría es requerido");
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name,
          description: description || "",
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      throw new Error(`Error al crear categoría: ${error.message}`);
    }

    revalidatePath("/admin/categorias");
    return { data, error: null };
  } catch (error) {
    console.error("Error in createCategoria:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar categoría
export async function updateCategoria(id: string, formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const is_active = formData.get("is_active") === "true";

    if (!name) {
      throw new Error("El nombre de la categoría es requerido");
    }

    const { data, error } = await supabase
      .from("categories")
      .update({
        name,
        description: description || "",
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      throw new Error(`Error al actualizar categoría: ${error.message}`);
    }

    revalidatePath("/admin/categorias");
    return { data, error: null };
  } catch (error) {
    console.error("Error in updateCategoria:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar categoría (solo si no tiene productos asociados)
export async function deleteCategoria(id: string) {
  const supabase = await createClient();

  try {
    // 1. Primero verificar si la categoría existe
    const { data: categoria, error: categoriaError } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", id)
      .single();

    if (categoriaError) {
      throw new Error(`Categoría no encontrada: ${categoriaError.message}`);
    }

    // 2. Verificar si hay productos en esta categoría
    const {
      data: productos,
      error: productosError,
      count,
    } = await supabase
      .from("products")
      .select("id", { count: "exact" })
      .eq("category_id", id)
      .eq("is_active", true);

    if (productosError) {
      throw new Error(
        `Error al verificar productos: ${productosError.message}`
      );
    }

    // 3. Si hay productos activos, no permitir eliminar
    if (count && count > 0) {
      throw new Error(
        `No se puede eliminar la categoría "${categoria.name}" porque tiene ${count} producto(s) activo(s) asociado(s). Primero mueve o desactiva los productos.`
      );
    }

    // 4. Si no hay productos activos, eliminar la categoría
    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new Error(`Error al eliminar categoría: ${deleteError.message}`);
    }

    revalidatePath("/dashboard/categorias");
    return { error: null };
  } catch (error) {
    console.error("Error in deleteCategoria:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener categorías con conteo de productos
export async function getCategoriasWithProductCount() {
  const supabase = await createClient();

  try {
    // Obtener todas las categorías (activas e inactivas)
    const { data: categorias, error: categoriasError } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (categoriasError) {
      console.error("Error fetching categories:", categoriasError);
      throw new Error(
        `Error al obtener categorías: ${categoriasError.message}`
      );
    }

    // Para cada categoría, contar los productos activos
    const categoriasWithCount = await Promise.all(
      (categorias || []).map(async (categoria) => {
        const { count, error: countError } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("category_id", categoria.id)
          .eq("is_active", true);

        if (countError) {
          console.error(
            `Error counting products for category ${categoria.id}:`,
            countError
          );
          return {
            ...categoria,
            product_count: 0,
          };
        }

        return {
          ...categoria,
          product_count: count || 0,
        };
      })
    );

    return { data: categoriasWithCount, error: null };
  } catch (error) {
    console.error("Error in getCategoriasWithProductCount:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener todas las categorías activas
export async function obtenerCategorias() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      throw new Error(`Error al obtener categorías: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerCategorias:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
