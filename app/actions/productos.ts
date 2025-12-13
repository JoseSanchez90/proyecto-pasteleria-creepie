"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { generarSlug } from "@/utils/slugify";

// Tipos basados en tu schema
export type Producto = {
  id: string;
  name: string;
  description: string;
  price: number;
  offer_price: number;
  is_offer: boolean;
  is_active: boolean;
  stock: number;
  preparation_time: number;
  category_id: string;
  offer_end_date: string | null;
  created_at: string;
};

export type ProductoCompleto = Producto & {
  category: {
    name: string;
  };
  available_sizes?: Array<{
    id: string;
    size_id: string;
    is_default: boolean;
    size: {
      id: string;
      name: string;
      person_capacity: number;
      additional_price: number;
    };
  }>;
  images: Array<{
    id: string;
    image_url: string;
    image_order: number;
  }>;
  ingredients: Array<{
    id: string;
    ingredient: string;
  }>;
};

export type ProductoConCategoria = Producto & {
  category: {
    name: string;
  };
  available_sizes?: Array<{
    id: string;
    size_id: string;
    is_default: boolean;
    size: {
      id: string;
      name: string;
      person_capacity: number;
      additional_price: number;
    };
  }>;
  images?: Array<{
    id: string;
    image_url: string;
    image_order: number;
  }>;
};

// Obtener todos los productos activos
export async function obtenerProductos(filtros?: {
  categoria_id?: string;
  solo_ofertas?: boolean;
  buscar?: string;
  limit?: number;
}) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name),
        available_sizes:product_size_options(
          id,
          size_id,
          is_default,
          size:product_sizes(id, name, person_capacity, additional_price)
        ),
        images:product_images(id, image_url, image_order)
      `
      )
      .eq("is_active", true)
      .order("name");

    // Aplicar filtros
    if (filtros?.categoria_id) {
      query = query.eq("category_id", filtros.categoria_id);
    }
    if (filtros?.solo_ofertas) {
      query = query.eq("is_offer", true);
    }
    if (filtros?.buscar) {
      query = query.ilike("name", `%${filtros.buscar}%`);
    }
    if (filtros?.limit) {
      query = query.limit(filtros.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerProductos:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener producto por ID con toda la información
export async function obtenerProductoPorId(id: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name),
        available_sizes:product_size_options(
          id,
          size_id,
          is_default,
          size:product_sizes(id, name, person_capacity, additional_price)
        ),
        images:product_images(*),
        ingredients:product_ingredients(*)
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching product:", error);
      throw new Error(`Error al obtener producto: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerProductoPorId:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Crear nuevo producto
export async function crearProducto(formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const offer_price = parseFloat(formData.get("offer_price") as string) || 0;
    const is_offer = formData.get("is_offer") === "true";
    const stock = parseInt(formData.get("stock") as string) || 0;
    const preparation_time =
      parseInt(formData.get("preparation_time") as string) || 0;
    const category_id = formData.get("category_id") as string;
    const offer_end_date = formData.get("offer_end_date") as string | null;

    // Validaciones
    if (!name || !price || !category_id) {
      throw new Error("Nombre, precio y categoría son requeridos");
    }

    const { data: producto, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          description: description || "",
          price,
          offer_price,
          is_offer,
          is_active: true,
          stock,
          preparation_time,
          category_id,
          offer_end_date: is_offer && offer_end_date ? offer_end_date : null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating product:", error);
      throw new Error(`Error al crear producto: ${error.message}`);
    }

    revalidatePath("/admin/productos");
    revalidatePath("/productos");
    return { data: producto, error: null };
  } catch (error) {
    console.error("Error in crearProducto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar producto
export async function actualizarProducto(id: string, formData: FormData) {
  const supabase = await createClient();

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const offer_price = parseFloat(formData.get("offer_price") as string) || 0;
    const is_offer = formData.get("is_offer") === "true";
    const is_active = formData.get("is_active") === "true";
    const stock = parseInt(formData.get("stock") as string) || 0;
    const preparation_time =
      parseInt(formData.get("preparation_time") as string) || 0;
    const category_id = formData.get("category_id") as string;
    const offer_end_date = formData.get("offer_end_date") as string | null;

    if (!name || !price || !category_id) {
      throw new Error("Nombre, precio y categoría son requeridos");
    }

    const { data: producto, error } = await supabase
      .from("products")
      .update({
        name,
        description: description || "",
        price,
        offer_price,
        is_offer,
        is_active,
        stock,
        preparation_time,
        category_id,
        offer_end_date: is_offer && offer_end_date ? offer_end_date : null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating product:", error);
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }

    revalidatePath("/admin/productos");
    revalidatePath("/productos");
    return { data: producto, error: null };
  } catch (error) {
    console.error("Error in actualizarProducto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar producto (soft delete)
export async function eliminarProducto(id: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("products")
      .update({
        is_active: false,
      })
      .eq("id", id);

    if (error) {
      console.error("Error deleting product:", error);
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }

    revalidatePath("/admin/productos");
    revalidatePath("/productos");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarProducto:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar producto permanentemente (hard delete con cascada)
export async function eliminarProductoPermanente(id: string) {
  const supabase = await createClient();

  try {
    // 1. Eliminar imágenes del producto
    const { error: imagesError } = await supabase
      .from("product_images")
      .delete()
      .eq("product_id", id);

    if (imagesError) {
      console.error("Error deleting product images:", imagesError);
      throw new Error(`Error al eliminar imágenes: ${imagesError.message}`);
    }

    // 2. Eliminar ingredientes del producto
    const { error: ingredientsError } = await supabase
      .from("product_ingredients")
      .delete()
      .eq("product_id", id);

    if (ingredientsError) {
      console.error("Error deleting product ingredients:", ingredientsError);
      throw new Error(
        `Error al eliminar ingredientes: ${ingredientsError.message}`
      );
    }

    // 3. Eliminar items del carrito que contengan este producto
    const { error: cartItemsError } = await supabase
      .from("cart_items")
      .delete()
      .eq("product_id", id);

    if (cartItemsError) {
      console.error("Error deleting cart items:", cartItemsError);
      throw new Error(
        `Error al eliminar items del carrito: ${cartItemsError.message}`
      );
    }

    // 4. Finalmente, eliminar el producto
    const { error: productError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (productError) {
      console.error("Error deleting product:", productError);
      throw new Error(`Error al eliminar producto: ${productError.message}`);
    }

    revalidatePath("/admin/productos");
    revalidatePath("/productos");
    revalidatePath("/carrito-compras");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarProductoPermanente:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Agregar imagen a producto
export async function agregarImagenProducto(
  productoId: string,
  imageUrl: string,
  imageOrder: number = 0
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("product_images")
      .insert([
        {
          product_id: productoId,
          image_url: imageUrl,
          image_order: imageOrder,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding product image:", error);
      throw new Error(`Error al agregar imagen: ${error.message}`);
    }

    revalidatePath("/admin/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in agregarImagenProducto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar imagen de producto
export async function eliminarImagenProducto(imagenId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imagenId);

    if (error) {
      console.error("Error deleting product image:", error);
      throw new Error(`Error al eliminar imagen: ${error.message}`);
    }

    revalidatePath("/admin/productos");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarImagenProducto:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Agregar ingrediente a producto
export async function agregarIngredienteProducto(
  productoId: string,
  ingrediente: string
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("product_ingredients")
      .insert([
        {
          product_id: productoId,
          ingredient: ingrediente,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding product ingredient:", error);
      throw new Error(`Error al agregar ingrediente: ${error.message}`);
    }

    revalidatePath("/admin/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in agregarIngredienteProducto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar ingrediente de producto
export async function eliminarIngredienteProducto(ingredienteId: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("product_ingredients")
      .delete()
      .eq("id", ingredienteId);

    if (error) {
      console.error("Error deleting product ingredient:", error);
      throw new Error(`Error al eliminar ingrediente: ${error.message}`);
    }

    revalidatePath("/admin/productos");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarIngredienteProducto:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener productos en oferta
export async function obtenerProductosOferta(limit?: number) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name),
        available_sizes:product_size_options(
          id,
          size_id,
          is_default,
          size:product_sizes(id, name, person_capacity, additional_price)
        ),
        images:product_images(id, image_url, image_order)
      `
      )
      .eq("is_active", true)
      .eq("is_offer", true)
      .order("created_at", { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching offer products:", error);
      throw new Error(`Error al obtener productos en oferta: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerProductosOferta:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener productos por categoría
export async function obtenerProductosPorCategoria(categoriaId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name),
        available_sizes:product_size_options(
          id,
          size_id,
          is_default,
          size:product_sizes(id, name, person_capacity, additional_price)
        ),
        images:product_images(id, image_url, image_order)
      `
      )
      .eq("category_id", categoriaId)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching products by category:", error);
      throw new Error(
        `Error al obtener productos por categoría: ${error.message}`
      );
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerProductosPorCategoria:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Buscar productos
export async function buscarProductos(termino: string, limit: number = 10) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name),
        available_sizes:product_size_options(
          id,
          size_id,
          is_default,
          size:product_sizes(id, name, person_capacity, additional_price)
        ),
        images:product_images(id, image_url, image_order)
      `
      )
      .eq("is_active", true)
      .or(`name.ilike.%${termino}%,description.ilike.%${termino}%`)
      .limit(limit);

    if (error) {
      console.error("Error searching products:", error);
      throw new Error(`Error al buscar productos: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in buscarProductos:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar stock de producto
export async function actualizarStockProducto(
  productoId: string,
  nuevoStock: number
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .update({ stock: nuevoStock })
      .eq("id", productoId)
      .select()
      .single();

    if (error) {
      console.error("Error updating product stock:", error);
      throw new Error(`Error al actualizar stock: ${error.message}`);
    }

    revalidatePath("/admin/productos");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarStockProducto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener productos más vendidos
export async function obtenerProductosMasVendidos(limit: number = 5) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("order_items")
      .select(
        `
        product_id,
        products:product_id(
          id,
          name,
          price,
          offer_price,
          is_offer,
          category:categories(name)
        ),
        quantity
      `
      )
      .limit(limit);

    if (error) {
      console.error("Error fetching best sellers:", error);
      throw new Error(
        `Error al obtener productos más vendidos: ${error.message}`
      );
    }

    // Agrupar y sumar cantidades
    const productosMap = new Map();
    data?.forEach((item) => {
      const productId = item.product_id;
      if (productosMap.has(productId)) {
        productosMap.set(
          productId,
          productosMap.get(productId) + item.quantity
        );
      } else {
        productosMap.set(productId, {
          ...item.products,
          total_vendido: item.quantity,
        });
      }
    });

    const productosMasVendidos = Array.from(productosMap.values())
      .sort((a, b) => b.total_vendido - a.total_vendido)
      .slice(0, limit);

    return { data: productosMasVendidos, error: null };
  } catch (error) {
    console.error("Error in obtenerProductosMasVendidos:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener producto por slug
export async function obtenerProductoPorSlug(slug: string) {
  const supabase = await createClient();

  try {
    // Obtener todos los productos activos con sus relaciones
    const { data: productos, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name),
        available_sizes:product_size_options(
          id,
          size_id,
          is_default,
          size:product_sizes(id, name, person_capacity, additional_price)
        ),
        images:product_images(*),
        ingredients:product_ingredients(*)
      `
      )
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching products:", error);
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    // Buscar el producto cuyo slug coincida
    const producto = productos?.find((p) => generarSlug(p.name) === slug);

    if (!producto) {
      return {
        data: null,
        error: "Producto no encontrado",
      };
    }

    return { data: producto, error: null };
  } catch (error) {
    console.error("Error in obtenerProductoPorSlug:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener productos relacionados por categoría
export async function obtenerProductosRelacionados(
  productoId: string,
  categoriaId: string,
  limit: number = 3
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        category:categories(name),
        available_sizes:product_size_options(
          id,
          size_id,
          is_default,
          size:product_sizes(id, name, person_capacity, additional_price)
        ),
        images:product_images(id, image_url, image_order)
      `
      )
      .eq("is_active", true)
      .eq("category_id", categoriaId)
      .neq("id", productoId) // Excluir el producto actual
      .limit(limit);

    if (error) {
      console.error("Error fetching related products:", error);
      throw new Error(
        `Error al obtener productos relacionados: ${error.message}`
      );
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerProductosRelacionados:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
