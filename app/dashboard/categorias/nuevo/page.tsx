"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Tag, Loader } from "lucide-react";
import { createCategoria } from "@/app/actions/categorias";
import { FaSave } from "react-icons/fa";

export default function NuevaCategoriaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones básicas
    if (!formData.name.trim()) {
      setError("El nombre de la categoría es obligatorio");
      setLoading(false);
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      setLoading(false);
      return;
    }

    try {
      // Crear FormData para enviar
      const categoriaFormData = new FormData();
      categoriaFormData.append("name", formData.name.trim());
      categoriaFormData.append("description", formData.description.trim());
      categoriaFormData.append("is_active", formData.is_active.toString());

      const { data, error: actionError } = await createCategoria(
        categoriaFormData
      );

      if (actionError) {
        throw new Error(actionError);
      }

      alert("Categoría creada exitosamente");
      router.push("/dashboard/categorias");
    } catch (error) {
      console.error("Error al crear categoría:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al crear la categoría. Intenta nuevamente.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (
      confirm(
        "¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán."
      )
    ) {
      router.push("/dashboard/categorias");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
          Nueva Categoría
        </h1>
        <p className="text-sm 2xl:text-base text-gray-600">
          Crea una nueva categoría para organizar tus productos
        </p>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información de la Categoría */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Información de la Categoría
          </h2>

          <div className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Categoría *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: Tortas, Postres, Cupcakes..."
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.name.length}/100 caracteres
              </p>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                placeholder="Describe esta categoría para que los clientes sepan qué productos incluye..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 caracteres
              </p>
            </div>

            {/* Estado */}
            <div className="flex items-start space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={loading}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                id="is_active"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                <div className="font-medium">Categoría activa</div>
                <div className="text-gray-500">
                  Las categorías inactivas no se mostrarán a los clientes
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Consejos */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Consejos para crear categorías efectivas:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Usa nombres claros y descriptivos</li>
            <li>
              Mantén las categorías específicas pero no demasiado limitadas
            </li>
            <li>Considera cómo tus clientes buscarían los productos</li>
            <li>Evita crear demasiadas categorías similares</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FaSave className="w-4 h-4" />
            {loading ? "Guardando..." : "Guardar Categoría"}
          </button>
        </div>
      </form>
    </div>
  );
}
