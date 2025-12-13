"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Tipo para opciones de tamaño de producto
export type ProductSizeOption = {
  id: string;
  product_id: string;
  size_id: string;
  is_default: boolean;
  created_at: string;
};

export type ProductSizeOptionWithDetails = ProductSizeOption & {
  size: {
    id: string;
    name: string;
    person_capacity: number;
    additional_price: number;
  };
};

// Obtener todos los tamaños disponibles para un producto
export async function obtenerTamanosDeProducto(productId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("product_size_options")
      .select(
        `
        *,
        size:product_sizes(id, name, person_capacity, additional_price)
      `
      )
      .eq("product_id", productId)
      .order("is_default", { ascending: false });

    if (error) {
      console.error("Error fetching product sizes:", error);
      throw new Error(
        `Error al obtener tamaños del producto: ${error.message}`
      );
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerTamanosDeProducto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Agregar un tamaño a un producto
export async function agregarTamanoAProducto(
  productId: string,
  sizeId: string,
  isDefault: boolean = false
) {
  const supabase = await createClient();

  try {
    // Si es el predeterminado, quitar el flag de otros tamaños
    if (isDefault) {
      await supabase
        .from("product_size_options")
        .update({ is_default: false })
        .eq("product_id", productId);
    }

    const { data, error } = await supabase
      .from("product_size_options")
      .insert([
        {
          product_id: productId,
          size_id: sizeId,
          is_default: isDefault,
        },
      ])
      .select()
      .single();

    if (error) {
      // Si es error de duplicado, ignorar
      if (error.code === "23505") {
        throw new Error("Este tamaño ya está asignado al producto");
      }
      console.error("Error adding size to product:", error);
      throw new Error(`Error al agregar tamaño: ${error.message}`);
    }

    revalidatePath("/dashboard/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in agregarTamanoAProducto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar un tamaño de un producto
export async function eliminarTamanoDeProducto(
  productId: string,
  sizeId: string
) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("product_size_options")
      .delete()
      .eq("product_id", productId)
      .eq("size_id", sizeId);

    if (error) {
      console.error("Error removing size from product:", error);
      throw new Error(`Error al eliminar tamaño: ${error.message}`);
    }

    revalidatePath("/dashboard/productos");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarTamanoDeProducto:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Establecer un tamaño como predeterminado
export async function establecerTamanoPorDefecto(
  productId: string,
  sizeId: string
) {
  const supabase = await createClient();

  try {
    // Primero, quitar el flag de todos los tamaños del producto
    await supabase
      .from("product_size_options")
      .update({ is_default: false })
      .eq("product_id", productId);

    // Luego, establecer el nuevo predeterminado
    const { data, error } = await supabase
      .from("product_size_options")
      .update({ is_default: true })
      .eq("product_id", productId)
      .eq("size_id", sizeId)
      .select()
      .single();

    if (error) {
      console.error("Error setting default size:", error);
      throw new Error(
        `Error al establecer tamaño predeterminado: ${error.message}`
      );
    }

    revalidatePath("/dashboard/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in establecerTamanoPorDefecto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar múltiples tamaños de un producto
export async function actualizarTamanosDeProducto(
  productId: string,
  sizeIds: string[],
  defaultSizeId: string
) {
  const supabase = await createClient();

  try {
    // Eliminar todos los tamaños actuales
    await supabase
      .from("product_size_options")
      .delete()
      .eq("product_id", productId);

    // Agregar los nuevos tamaños
    const insertData = sizeIds.map((sizeId) => ({
      product_id: productId,
      size_id: sizeId,
      is_default: sizeId === defaultSizeId,
    }));

    const { data, error } = await supabase
      .from("product_size_options")
      .insert(insertData)
      .select();

    if (error) {
      console.error("Error updating product sizes:", error);
      throw new Error(`Error al actualizar tamaños: ${error.message}`);
    }

    revalidatePath("/dashboard/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarTamanosDeProducto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
