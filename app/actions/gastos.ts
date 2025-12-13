"use server";

import { createClient } from "@/utils/supabase/server";

// Tipos para gastos
export type Gasto = {
  id: string;
  category:
    | "ingredients"
    | "utilities"
    | "salaries"
    | "rent"
    | "equipment"
    | "marketing"
    | "other";
  description: string;
  amount: number;
  expense_date: string;
  created_by: string | null;
  notes: string;
  created_at: string;
};

export type GastoData = {
  category: Gasto["category"];
  description: string;
  amount: number;
  expense_date: string;
  notes?: string;
};

// Crear nuevo gasto
export async function crearGasto(data: GastoData) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { data: null, error: "Usuario no autenticado" };
    }

    const { data: gasto, error } = await supabase
      .from("expenses")
      .insert([
        {
          category: data.category,
          description: data.description,
          amount: data.amount,
          expense_date: data.expense_date,
          notes: data.notes || "",
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating expense:", error);
      throw new Error(`Error al crear gasto: ${error.message}`);
    }

    return { data: gasto, error: null };
  } catch (error) {
    console.error("Error in crearGasto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener gastos con filtros
export async function obtenerGastos(filtros?: {
  fecha_inicio?: string;
  fecha_fin?: string;
  categoria?: string;
}) {
  const supabase = await createClient();

  try {
    let query = supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });

    if (filtros?.fecha_inicio) {
      query = query.gte("expense_date", filtros.fecha_inicio);
    }
    if (filtros?.fecha_fin) {
      query = query.lte("expense_date", filtros.fecha_fin);
    }
    if (filtros?.categoria) {
      query = query.eq("category", filtros.categoria);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching expenses:", error);
      throw new Error(`Error al obtener gastos: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error in obtenerGastos:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Actualizar gasto
export async function actualizarGasto(id: string, data: GastoData) {
  const supabase = await createClient();

  try {
    const { data: gasto, error } = await supabase
      .from("expenses")
      .update({
        category: data.category,
        description: data.description,
        amount: data.amount,
        expense_date: data.expense_date,
        notes: data.notes || "",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating expense:", error);
      throw new Error(`Error al actualizar gasto: ${error.message}`);
    }

    return { data: gasto, error: null };
  } catch (error) {
    console.error("Error in actualizarGasto:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Eliminar gasto
export async function eliminarGasto(id: string) {
  const supabase = await createClient();

  try {
    const { error } = await supabase.from("expenses").delete().eq("id", id);

    if (error) {
      console.error("Error deleting expense:", error);
      throw new Error(`Error al eliminar gasto: ${error.message}`);
    }

    return { error: null };
  } catch (error) {
    console.error("Error in eliminarGasto:", error);
    return {
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener total de gastos por período
export async function obtenerTotalGastos(
  fecha_inicio: string,
  fecha_fin: string
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", fecha_inicio)
      .lte("expense_date", fecha_fin);

    if (error) {
      console.error("Error fetching total expenses:", error);
      throw new Error(`Error al obtener total de gastos: ${error.message}`);
    }

    const total =
      data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;

    return { data: total, error: null };
  } catch (error) {
    console.error("Error in obtenerTotalGastos:", error);
    return {
      data: 0,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// Obtener gastos por categoría
export async function obtenerGastosPorCategoria(
  fecha_inicio: string,
  fecha_fin: string
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("category, amount")
      .gte("expense_date", fecha_inicio)
      .lte("expense_date", fecha_fin);

    if (error) {
      console.error("Error fetching expenses by category:", error);
      throw new Error(
        `Error al obtener gastos por categoría: ${error.message}`
      );
    }

    // Agrupar por categoría
    const grouped = data?.reduce((acc: any, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += Number(item.amount);
      return acc;
    }, {});

    return { data: grouped || {}, error: null };
  } catch (error) {
    console.error("Error in obtenerGastosPorCategoria:", error);
    return {
      data: {},
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
