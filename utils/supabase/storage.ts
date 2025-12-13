import { createClient } from "@/utils/supabase/server";

const STORAGE_BUCKET = "images";

/**
 * Sube una imagen al storage de Supabase
 * @param file - Archivo a subir
 * @param folder - Carpeta dentro del bucket (ej: 'products', 'categories')
 * @returns URL pública de la imagen subida
 */
export async function uploadImage(
  file: File,
  folder: string = "products"
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient();

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error uploading image:", error);
      return { url: null, error: error.message };
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error("Error in uploadImage:", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Elimina una imagen del storage de Supabase
 * @param imageUrl - URL completa de la imagen a eliminar
 * @returns Resultado de la operación
 */
export async function deleteImage(
  imageUrl: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();

    // Extraer el path de la URL
    // Ejemplo: https://xxx.supabase.co/storage/v1/object/public/images/products/123.jpg
    // Necesitamos: products/123.jpg
    const urlParts = imageUrl.split(`/${STORAGE_BUCKET}/`);
    if (urlParts.length < 2) {
      return { error: "URL de imagen inválida" };
    }

    const filePath = urlParts[1];

    // Eliminar archivo
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting image:", error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error("Error in deleteImage:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Obtiene la URL pública de una imagen
 * @param path - Path de la imagen en el storage
 * @returns URL pública
 */
export async function getPublicUrl(path: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return publicUrl;
}

/**
 * Lista todas las imágenes en una carpeta
 * @param folder - Carpeta a listar
 * @returns Lista de archivos
 */
export async function listImages(folder: string = "products") {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      console.error("Error listing images:", error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in listImages:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
