"use client";

import { useState, useEffect } from "react";
import {
  obtenerGastos,
  crearGasto,
  eliminarGasto,
  type Gasto,
  type GastoData,
} from "@/app/actions/gastos";
import { Plus, Trash2, DollarSign } from "lucide-react";
import RingLoader from "@/components/loaders/ringLoader";

const categorias = [
  { value: "ingredients", label: "Ingredientes" },
  { value: "utilities", label: "Servicios" },
  { value: "salaries", label: "Salarios" },
  { value: "rent", label: "Alquiler" },
  { value: "equipment", label: "Equipamiento" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Otros" },
];

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<GastoData>({
    category: "ingredients",
    description: "",
    amount: 0,
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    cargarGastos();
  }, []);

  const cargarGastos = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await obtenerGastos();
      setGastos(data || []);
    } catch (err) {
      console.error("Error loading expenses:", err);
      setError("Error al cargar los gastos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await crearGasto(formData);
    if (!error) {
      setShowForm(false);
      setFormData({
        category: "ingredients",
        description: "",
        amount: 0,
        expense_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      cargarGastos();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este gasto?")) {
      await eliminarGasto(id);
      cargarGastos();
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(price);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(`${fecha}T00:00:00-05:00`).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.amount), 0);

  if (loading) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-2">
        <RingLoader
          size="50"
          stroke="6"
          bgOpacity="0.1"
          speed="1.68"
          color="#3b82f6"
        />
        <p className="text-gray-500">Cargando Gastos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarGastos}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex md:flex-row flex-col gap-2 justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
            Gestión de Gastos
          </h1>
          <p className="text-sm 2xl:text-base text-gray-600">
            Administra los egresos del negocio
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Gasto
        </button>
      </div>

      {/* Total */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Total de Gastos</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(totalGastos)}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Nuevo Gasto</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {categorias.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) =>
                    setFormData({ ...formData, expense_date: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de gastos */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase">
                  Fecha
                </th>
                <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase">
                  Categoría
                </th>
                <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase">
                  Descripción
                </th>
                <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase">
                  Monto
                </th>
                <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {gastos.map((gasto) => (
                <tr key={gasto.id} className="hover:bg-gray-50">
                  <td className="px-4 2xl:px-6 py-3 2xl:py-4 text-sm text-gray-900">
                    {formatearFecha(gasto.expense_date)}
                  </td>
                  <td className="px-4 2xl:px-6 py-3 2xl:py-4 text-sm text-gray-900">
                    {categorias.find((c) => c.value === gasto.category)?.label}
                  </td>
                  <td className="px-4 2xl:px-6 py-3 2xl:py-4 text-sm text-gray-900">
                    {gasto.description}
                  </td>
                  <td className="px-4 2xl:px-6 py-3 2xl:py-4 text-sm font-medium text-gray-900">
                    {formatPrice(Number(gasto.amount))}
                  </td>
                  <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                    <button
                      onClick={() => handleDelete(gasto.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
