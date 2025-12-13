"use server";

import { createClient } from "@/utils/supabase/server";
import { uploadImage, deleteImage } from "@/utils/supabase/storage";
import { revalidatePath } from "next/cache";

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  image_order: number;
  created_at: string;
};

/**
 * Sube una imagen para un producto
 */
export async function uploadProductImage(
  productId: string,
  formData: FormData
) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { data: null, error: "No se proporcionó ningún archivo" };
    }

    // Validar tipo de archivo
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return {
        data: null,
        error: "Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP",
      };
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        data: null,
        error: "El archivo es demasiado grande. Máximo 5MB",
      };
    }

    // Subir imagen al storage
    const { url, error: uploadError } = await uploadImage(file, "products");

    if (uploadError || !url) {
      return { data: null, error: uploadError || "Error al subir imagen" };
    }

    // Obtener el orden de la imagen (última + 1)
    const supabase = await createClient();
    const { data: existingImages } = await supabase
      .from("product_images")
      .select("image_order")
      .eq("product_id", productId)
      .order("image_order", { ascending: false })
      .limit(1);

    const nextOrder = existingImages?.[0]?.image_order
      ? existingImages[0].image_order + 1
      : 0;

    // Guardar referencia en la base de datos
    const { data, error } = await supabase
      .from("product_images")
      .insert([
        {
          product_id: productId,
          image_url: url,
          image_order: nextOrder,
        },
      ])
      .select()
      .single();

    if (error) {
      // Si falla guardar en DB, intentar eliminar la imagen del storage
      await deleteImage(url);
      return { data: null, error: error.message };
    }

    revalidatePath("/dashboard/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in uploadProductImage:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Elimina una imagen de un producto
 */
export async function deleteProductImage(imageId: string) {
  try {
    const supabase = await createClient();

    // Obtener la URL de la imagen antes de eliminarla
    const { data: image, error: fetchError } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("id", imageId)
      .single();

    if (fetchError || !image) {
      return { error: "Imagen no encontrada" };
    }

    // Eliminar del storage
    const { error: storageError } = await deleteImage(image.image_url);

    if (storageError) {
      console.error("Error deleting from storage:", storageError);
      // Continuar aunque falle eliminar del storage
    }

    // Eliminar de la base de datos
    const { error: dbError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (dbError) {
      return { error: dbError.message };
    }

    revalidatePath("/dashboard/productos");
    return { error: null };
  } catch (error) {
    console.error("Error in deleteProductImage:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Obtiene todas las imágenes de un producto
 */
export async function getProductImages(productId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("image_order", { ascending: true });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in getProductImages:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Actualiza el orden de las imágenes de un producto
 */
export async function updateImageOrder(imageId: string, newOrder: number) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("product_images")
      .update({ image_order: newOrder })
      .eq("id", imageId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/dashboard/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in updateImageOrder:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Establece una imagen como principal (orden 0)
 */
export async function setMainImage(imageId: string, productId: string) {
  try {
    const supabase = await createClient();

    // Primero, incrementar el orden de todas las imágenes
    const { data: allImages } = await supabase
      .from("product_images")
      .select("id, image_order")
      .eq("product_id", productId);

    if (allImages) {
      for (const img of allImages) {
        await supabase
          .from("product_images")
          .update({ image_order: img.image_order + 1 })
          .eq("id", img.id);
      }
    }

    // Luego, establecer la imagen seleccionada como orden 0
    const { data, error } = await supabase
      .from("product_images")
      .update({ image_order: 0 })
      .eq("id", imageId)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    revalidatePath("/dashboard/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in setMainImage:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
