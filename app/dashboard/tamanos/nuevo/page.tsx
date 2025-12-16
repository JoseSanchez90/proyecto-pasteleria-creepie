"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearTamano } from "@/app/actions/tamanos";
import { FaSave } from "react-icons/fa";
import { useNotyf } from "@/app/providers/NotyfProvider";

export default function NuevoTamanoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const notyf = useNotyf();
  const [formData, setFormData] = useState({
    name: "",
    person_capacity: "",
    additional_price: "0",
    description: "",
    display_order: "0",
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("person_capacity", formData.person_capacity);
      formDataToSend.append("additional_price", formData.additional_price);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("display_order", formData.display_order);
      formDataToSend.append("is_active", formData.is_active.toString());

      const { data, error } = await crearTamano(formDataToSend);

      if (error) {
        throw new Error(error);
      }

      notyf?.success("Tamaño creado exitosamente");
      router.push("/dashboard/tamanos");
    } catch (err) {
      console.error("Error creating size:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al crear tamaño"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/tamanos");
    notyf?.error("¡Operación cancelada!");
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
          Nuevo Tamaño
        </h1>
        <p className="text-sm 2xl:text-base text-gray-600">
          Crea un nuevo tamaño para tus productos
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Información del Tamaño
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nombre del Tamaño <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Pequeño, Mediano, Grande"
              />
            </div>

            {/* Capacidad de Personas */}
            <div>
              <label
                htmlFor="person_capacity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Capacidad de Personas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="person_capacity"
                required
                min="1"
                value={formData.person_capacity}
                onChange={(e) =>
                  setFormData({ ...formData, person_capacity: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 6, 12, 20"
              />
              <p className="mt-1 text-sm text-gray-500">
                Número de personas que pueden consumir este tamaño
              </p>
            </div>

            {/* Precio Adicional */}
            <div>
              <label
                htmlFor="additional_price"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Precio Adicional (S/)
              </label>
              <input
                type="number"
                id="additional_price"
                min="0"
                step="0.01"
                value={formData.additional_price}
                onChange={(e) =>
                  setFormData({ ...formData, additional_price: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
              <p className="mt-1 text-sm text-gray-500">
                Costo adicional que se suma al precio base del producto
              </p>
            </div>

            {/* Orden de Visualización */}
            <div>
              <label
                htmlFor="display_order"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Orden de Visualización
              </label>
              <input
                type="number"
                id="display_order"
                min="0"
                value={formData.display_order}
                onChange={(e) =>
                  setFormData({ ...formData, display_order: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              <p className="mt-1 text-sm text-gray-500">
                Orden en que se mostrará (menor número = primero)
              </p>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Descripción
              </label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descripción opcional del tamaño"
              />
            </div>

            {/* Estado Activo */}
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Tamaño activo
                </span>
              </label>
              <p className="mt-1 ml-6 text-sm text-gray-500">
                Los tamaños activos estarán disponibles para asignar a productos
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={handleCancel}
            className="bg-white flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            <FaSave className="w-4 h-4" />
            {loading ? "Guardando..." : "Guardar Tamaño"}
          </button>
        </div>
      </form>
    </div>
  );
}
