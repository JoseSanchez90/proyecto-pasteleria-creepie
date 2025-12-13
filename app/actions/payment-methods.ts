"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Tipos
export type PaymentMethod = {
  id: string;
  user_id: string;
  card_type: "visa" | "mastercard" | "amex" | "dinersclub";
  card_holder_name: string;
  card_last_four: string;
  expiry_month: string;
  expiry_year: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type NewPaymentMethodData = {
  user_id: string;
  card_number: string; // Solo para validación, no se guarda completo
  card_holder_name: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string; // Solo para validación, no se guarda
  is_default?: boolean;
};

// Obtener todos los métodos de pago de un usuario
export async function obtenerMetodosPago(userId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment methods:", error);
      throw new Error(`Error al obtener métodos de pago: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerMetodosPago:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Validar número de tarjeta usando algoritmo de Luhn
function validarLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s/g, "");
  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

// Detectar tipo de tarjeta basado en el número
function detectarTipoTarjeta(
  cardNumber: string
): "visa" | "mastercard" | "amex" | "dinersclub" | null {
  const digits = cardNumber.replace(/\s/g, "");

  // Visa: empieza con 4
  if (/^4/.test(digits)) {
    return "visa";
  }

  // Mastercard: empieza con 51-55 o 2221-2720
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) {
    return "mastercard";
  }

  // American Express: empieza con 34 o 37
  if (/^3[47]/.test(digits)) {
    return "amex";
  }

  // Diners Club: empieza con 36 o 38 o 300-305
  if (/^3[068]/.test(digits) || /^30[0-5]/.test(digits)) {
    return "dinersclub";
  }

  return null;
}

// Validar tarjeta (simulado - mock)
export async function validarTarjeta(
  cardNumber: string,
  cvv: string,
  expiryMonth: string,
  expiryYear: string
) {
  try {
    // Limpiar número de tarjeta
    const cleanCardNumber = cardNumber.replace(/\s/g, "");

    // Validar longitud
    if (cleanCardNumber.length < 13 || cleanCardNumber.length > 19) {
      return {
        valid: false,
        error: "Número de tarjeta inválido",
      };
    }

    // Validar que solo contenga números
    if (!/^\d+$/.test(cleanCardNumber)) {
      return {
        valid: false,
        error: "El número de tarjeta solo debe contener dígitos",
      };
    }

    // Validar usando algoritmo de Luhn
    if (!validarLuhn(cleanCardNumber)) {
      return {
        valid: false,
        error: "Número de tarjeta inválido",
      };
    }

    // Detectar tipo de tarjeta
    const cardType = detectarTipoTarjeta(cleanCardNumber);
    if (!cardType) {
      return {
        valid: false,
        error: "Tipo de tarjeta no soportado",
      };
    }

    // Validar CVV
    const expectedCvvLength = cardType === "amex" ? 4 : 3;
    if (cvv.length !== expectedCvvLength) {
      return {
        valid: false,
        error: `CVV debe tener ${expectedCvvLength} dígitos para ${cardType}`,
      };
    }

    // Validar fecha de expiración
    const month = parseInt(expiryMonth);
    const year = parseInt(expiryYear);

    if (month < 1 || month > 12) {
      return {
        valid: false,
        error: "Mes de expiración inválido",
      };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return {
        valid: false,
        error: "Tarjeta expirada",
      };
    }

    // Simulación: En producción aquí se haría la llamada a la pasarela de pago real
    return {
      valid: true,
      cardType,
      lastFour: cleanCardNumber.slice(-4),
    };
  } catch (error) {
    console.error("Error in validarTarjeta:", error);
    return {
      valid: false,
      error: "Error al validar tarjeta",
    };
  }
}

// Agregar nuevo método de pago
export async function agregarMetodoPago(paymentData: NewPaymentMethodData) {
  const supabase = await createClient();

  try {
    // Validar tarjeta primero
    const validation = await validarTarjeta(
      paymentData.card_number,
      paymentData.cvv,
      paymentData.expiry_month,
      paymentData.expiry_year
    );

    if (!validation.valid) {
      return {
        data: null,
        error: validation.error || "Tarjeta inválida",
      };
    }

    // Si se marca como predeterminada, desmarcar las demás
    if (paymentData.is_default) {
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", paymentData.user_id);
    }

    // Insertar nuevo método de pago
    const { data, error } = await supabase
      .from("payment_methods")
      .insert([
        {
          user_id: paymentData.user_id,
          card_type: validation.cardType,
          card_holder_name: paymentData.card_holder_name,
          card_last_four: validation.lastFour,
          expiry_month: paymentData.expiry_month,
          expiry_year: paymentData.expiry_year,
          is_default: paymentData.is_default || false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding payment method:", error);
      throw new Error(`Error al agregar método de pago: ${error.message}`);
    }

    revalidatePath("/mi-cuenta");
    return { data, error: null };
  } catch (error) {
    console.error("Error in agregarMetodoPago:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Establecer método de pago como predeterminado
export async function establecerMetodoPredeterminado(
  paymentMethodId: string,
  userId: string
) {
  const supabase = await createClient();

  try {
    // Primero, desmarcar todos los métodos de pago del usuario
    await supabase
      .from("payment_methods")
      .update({ is_default: false })
      .eq("user_id", userId);

    // Luego, marcar el seleccionado como predeterminado
    const { data, error } = await supabase
      .from("payment_methods")
      .update({
        is_default: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentMethodId)
      .eq("user_id", userId) // Seguridad: verificar que pertenece al usuario
      .select()
      .single();

    if (error) {
      console.error("Error setting default payment method:", error);
      throw new Error(
        `Error al establecer método predeterminado: ${error.message}`
      );
    }

    revalidatePath("/mi-cuenta");
    return { data, error: null };
  } catch (error) {
    console.error("Error in establecerMetodoPredeterminado:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar método de pago
export async function eliminarMetodoPago(
  paymentMethodId: string,
  userId: string
) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("payment_methods")
      .delete()
      .eq("id", paymentMethodId)
      .eq("user_id", userId); // Seguridad: verificar que pertenece al usuario

    if (error) {
      console.error("Error deleting payment method:", error);
      throw new Error(`Error al eliminar método de pago: ${error.message}`);
    }

    revalidatePath("/mi-cuenta");
    return { error: null };
  } catch (error) {
    console.error("Error in eliminarMetodoPago:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar método de pago (solo fecha de expiración y nombre)
export async function actualizarMetodoPago(
  paymentMethodId: string,
  userId: string,
  updates: {
    card_holder_name?: string;
    expiry_month?: string;
    expiry_year?: string;
  }
) {
  const supabase = await createClient();

  try {
    // Si se actualizan las fechas, validar que no esté expirada
    if (updates.expiry_month && updates.expiry_year) {
      const month = parseInt(updates.expiry_month);
      const year = parseInt(updates.expiry_year);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (
        year < currentYear ||
        (year === currentYear && month < currentMonth)
      ) {
        return {
          data: null,
          error: "Fecha de expiración inválida",
        };
      }
    }

    const { data, error } = await supabase
      .from("payment_methods")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentMethodId)
      .eq("user_id", userId) // Seguridad: verificar que pertenece al usuario
      .select()
      .single();

    if (error) {
      console.error("Error updating payment method:", error);
      throw new Error(`Error al actualizar método de pago: ${error.message}`);
    }

    revalidatePath("/mi-cuenta");
    return { data, error: null };
  } catch (error) {
    console.error("Error in actualizarMetodoPago:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
