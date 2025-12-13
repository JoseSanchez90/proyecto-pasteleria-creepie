"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { X, Tag } from "lucide-react";
import {
  getCategoriaById,
  updateCategoria,
  type Categoria,
} from "@/app/actions/categorias";
import RingLoader from "@/components/loaders/ringLoader";
import { FaSave } from "react-icons/fa";

export default function EditarCategoriaPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  // Cargar categoría al montar el componente
  useEffect(() => {
    const cargarCategoria = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await getCategoriaById(params.id as string);

        if (error) {
          throw new Error(error);
        }

        if (data) {
          setCategoria(data);
          setFormData({
            name: data.name || "",
            description: data.description || "",
            is_active: data.is_active || true,
          });
        }
      } catch (err) {
        console.error("Error cargando categoría:", err);
        setError(
          err instanceof Error ? err.message : "Error al cargar categoría"
        );
      } finally {
        setLoading(false);
      }
    };

    cargarCategoria();
  }, [params.id]);

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
    if (!categoria) return;

    setSaving(true);
    setError(null);

    // Validaciones básicas
    if (!formData.name.trim()) {
      setError("El nombre de la categoría es obligatorio");
      setSaving(false);
      return;
    }

    if (formData.name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres");
      setSaving(false);
      return;
    }

    try {
      // Crear FormData para enviar
      const categoriaFormData = new FormData();
      categoriaFormData.append("name", formData.name.trim());
      categoriaFormData.append("description", formData.description.trim());
      categoriaFormData.append("is_active", formData.is_active.toString());

      const { error: actionError } = await updateCategoria(
        categoria.id,
        categoriaFormData
      );

      if (actionError) {
        throw new Error(actionError);
      }

      alert("Categoría actualizada exitosamente");
      router.push("/dashboard/categorias");
    } catch (error) {
      console.error("Error al actualizar categoría:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar la categoría. Intenta nuevamente.";
      setError(errorMessage);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 h-full">
        <RingLoader
          size="50"
          stroke="6"
          bgOpacity="0.1"
          speed="1.68"
          color="#3b82f6"
        />
        <p className="text-gray-500">Cargando Categoría...</p>
      </div>
    );
  }

  if (error && !categoria) {
    return (
      <div className="max-w-2xl mx-auto h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/categorias")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  if (!categoria) {
    return (
      <div className="max-w-2xl mx-auto h-full">
        <div className="text-center py-12">
          <Tag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Categoría no encontrada
          </h3>
          <button
            onClick={() => router.push("/dashboard/categorias")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
          Editar Categoría: {categoria.name}
        </h1>
        <p className="text-sm 2xl:text-base text-gray-600">
          Actualiza la información de la categoría
        </p>
      </div>

      {/* Información de la categoría */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* <div>
            <span className="font-medium">ID:</span> {categoria.id}
          </div> */}
          <div>
            <span className="font-medium">Estado actual:</span>{" "}
            {categoria.is_active ? "Activa" : "Inactiva"}
          </div>
          <div>
            <span className="font-medium">Creada:</span>{" "}
            {new Date(categoria.created_at).toLocaleDateString("es-PE")}
          </div>
          <div>
            <span className="font-medium">Última actualización:</span>{" "}
            {new Date(categoria.updated_at).toLocaleDateString("es-PE")}
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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
                disabled={saving}
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
                disabled={saving}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                placeholder="Describe esta categoría para que los clientes sepan qué productos incluye..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/500 caracteres
              </p>
            </div>

            {/* Estado */}
            <div className="flex items-center space-x-3 p-4 bg-white border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                disabled={saving}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
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

        {/* Nota importante */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Nota importante:
          </h3>
          <p className="text-sm text-yellow-700">
            Al desactivar una categoría, los productos asociados seguirán
            existiendo pero no serán visibles para los clientes hasta que
            reactives la categoría o los muevas a otra categoría activa.
          </p>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FaSave className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
