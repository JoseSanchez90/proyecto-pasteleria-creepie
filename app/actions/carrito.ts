"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Tipos para el carrito
export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  size_id: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    price: number;
    offer_price: number | null;
    is_offer: boolean;
    stock: number;
    images: Array<{
      image_url: string;
      image_order: number;
    }>;
  };
  size?: {
    id: string;
    name: string;
    person_capacity: number;
    additional_price: number;
  } | null;
};

// Obtener o crear carrito del usuario
async function obtenerOCrearCarrito(userId: string) {
  const supabase = await createClient();

  // Buscar carrito existente
  const { data: cart, error: cartError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (cart) {
    return { cartId: cart.id, error: null };
  }

  // Si no existe, crear uno nuevo
  const { data: newCart, error: createError } = await supabase
    .from("cart")
    .insert([{ user_id: userId }])
    .select("id")
    .single();

  if (createError) {
    return { cartId: null, error: createError.message };
  }

  return { cartId: newCart.id, error: null };
}

// Obtener items del carrito del usuario
export async function obtenerCarrito() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: [], error: "Usuario no autenticado" };
    }

    // Obtener el carrito del usuario
    const { data: cart } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!cart) {
      return { data: [], error: null };
    }

    // Obtener items del carrito
    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
        *,
        product:products(
          id,
          name,
          price,
          offer_price,
          is_offer,
          stock,
          category:categories(id, name),
          images:product_images(image_url, image_order)
        ),
        size:product_sizes(id, name, person_capacity, additional_price)
      `
      )
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cart:", error);
      throw new Error(`Error al obtener carrito: ${error.message}`);
    }

    return { data: data as CartItem[], error: null };
  } catch (error) {
    console.error("Error in obtenerCarrito:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Agregar producto al carrito
export async function agregarAlCarrito(
  productId: string,
  quantity: number = 1,
  sizeId: string | null = null
) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        data: null,
        error: "Debes iniciar sesión para agregar al carrito",
      };
    }

    // Obtener o crear carrito
    const { cartId, error: cartError } = await obtenerOCrearCarrito(user.id);

    if (cartError || !cartId) {
      return { data: null, error: cartError || "Error al obtener carrito" };
    }

    // Obtener precio del producto
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("price, offer_price, is_offer")
      .eq("id", productId)
      .single();

    if (productError) {
      return { data: null, error: "Producto no encontrado" };
    }

    // Calcular precio base (con o sin oferta)
    let unitPrice =
      product.is_offer && product.offer_price
        ? product.offer_price
        : product.price;

    // Si hay un tamaño seleccionado, agregar el precio adicional
    if (sizeId) {
      const { data: sizeData, error: sizeError } = await supabase
        .from("product_sizes")
        .select("additional_price")
        .eq("id", sizeId)
        .single();

      if (!sizeError && sizeData) {
        unitPrice += sizeData.additional_price;
      }
    }

    // Verificar si el producto ya está en el carrito con el mismo tamaño
    const { data: existingItem } = await supabase
      .from("cart_items")
      .select("*")
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .eq("size_id", sizeId)
      .single();

    if (existingItem) {
      // Si ya existe, actualizar cantidad
      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al actualizar cantidad: ${error.message}`);
      }

      revalidatePath("/carrito-compras");
      return { data, error: null };
    } else {
      // Si no existe, crear nuevo item
      const { data, error } = await supabase
        .from("cart_items")
        .insert([
          {
            cart_id: cartId,
            product_id: productId,
            quantity,
            unit_price: unitPrice,
            size_id: sizeId,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new Error(`Error al agregar al carrito: ${error.message}`);
      }

      revalidatePath("/carrito-compras");
      return { data, error: null };
    }
  } catch (error) {
    console.error("Error in agregarAlCarrito:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar cantidad de un item
export async function actualizarCantidadCarrito(
  itemId: string,
  quantity: number
) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    if (quantity <= 0) {
      // Si la cantidad es 0 o menor, eliminar el item
      return await eliminarDelCarrito(itemId);
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar cantidad: ${error.message}`);
    }

    revalidatePath("/carrito-compras");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarCantidadCarrito:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar item del carrito
export async function eliminarDelCarrito(itemId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      throw new Error(`Error al eliminar del carrito: ${error.message}`);
    }

    revalidatePath("/carrito-compras");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarDelCarrito:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Vaciar carrito
export async function vaciarCarrito() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { error: "Usuario no autenticado" };
    }

    // Obtener carrito del usuario
    const { data: cart } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!cart) {
      return { error: null };
    }

    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cart.id);

    if (error) {
      throw new Error(`Error al vaciar carrito: ${error.message}`);
    }

    revalidatePath("/carrito-compras");
    return { error: null };
  } catch (error) {
    console.error("Error in vaciarCarrito:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener cantidad total de items en el carrito
export async function obtenerCantidadCarrito() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { count: 0, error: null };
    }

    // Obtener carrito del usuario
    const { data: cart } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!cart) {
      return { count: 0, error: null };
    }

    const { data, error } = await supabase
      .from("cart_items")
      .select("quantity")
      .eq("cart_id", cart.id);

    if (error) {
      throw new Error(`Error al obtener cantidad: ${error.message}`);
    }

    const totalCount = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    return { count: totalCount, error: null };
  } catch (error) {
    console.error("Error in obtenerCantidadCarrito:", error);
    return {
      count: 0,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
