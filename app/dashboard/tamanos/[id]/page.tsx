"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, X, Ruler, Loader } from "lucide-react";
import {
  obtenerTamanoPorId,
  actualizarTamano,
  type Tamano,
} from "@/app/actions/tamanos";
import { useNotyf } from "@/app/providers/NotyfProvider";
import RingLoader from "@/components/loaders/ringLoader";

export default function EditarTamanoPage() {
  const params = useParams();
  const router = useRouter();
  const notyf = useNotyf();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tamano, setTamano] = useState<Tamano | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    person_capacity: "",
    additional_price: "0",
    description: "",
    display_order: "0",
    is_active: true,
  });

  useEffect(() => {
    const cargarTamano = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await obtenerTamanoPorId(params.id as string);

        if (error) {
          throw new Error(error);
        }

        if (data) {
          setTamano(data);
          setFormData({
            name: data.name || "",
            person_capacity: data.person_capacity.toString() || "",
            additional_price: data.additional_price?.toString() || "0",
            description: data.description || "",
            display_order: data.display_order.toString() || "0",
            is_active: data.is_active || true,
          });
        }
      } catch (err) {
        console.error("Error cargando tamaño:", err);
        notyf?.error("Error al cargar tamaño");
        setError(err instanceof Error ? err.message : "Error al cargar tamaño");
      } finally {
        setLoading(false);
      }
    };

    cargarTamano();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tamano) return;

    setSaving(true);
    setError(null);

    if (!formData.name.trim()) {
      setError("El nombre del tamaño es obligatorio");
      setSaving(false);
      notyf?.error("El nombre del tamaño es obligatorio");
      return;
    }

    if (!formData.person_capacity || parseInt(formData.person_capacity) <= 0) {
      setError("La capacidad de personas debe ser mayor a 0");
      setSaving(false);
      notyf?.error("La capacidad de personas debe ser mayor a 0");
      return;
    }

    try {
      const tamanoFormData = new FormData();
      tamanoFormData.append("name", formData.name.trim());
      tamanoFormData.append("person_capacity", formData.person_capacity);
      tamanoFormData.append("additional_price", formData.additional_price);
      tamanoFormData.append("description", formData.description.trim());
      tamanoFormData.append("display_order", formData.display_order);
      tamanoFormData.append("is_active", formData.is_active.toString());

      const { error: actionError } = await actualizarTamano(
        tamano.id,
        tamanoFormData
      );

      if (actionError) {
        throw new Error(actionError);
      }

      notyf?.success("Tamaño actualizado exitosamente");
      router.push("/dashboard/tamanos");
    } catch (error) {
      console.error("Error al actualizar tamaño:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar el tamaño. Intenta nuevamente.";
      setError(errorMessage);
      notyf?.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    notyf?.error("Tamaño cancelado");
    router.push("/dashboard/tamanos");
  };

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
        <p className="text-gray-500">Cargando Tamaño...</p>
      </div>
    );
  }

  if (error && !tamano) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/tamanos")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  if (!tamano) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <Ruler className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Tamaño no encontrado
          </h3>
          <button
            onClick={() => router.push("/dashboard/tamanos")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Editar Tamaño: {tamano.name}
            </h1>
            <p className="text-gray-600">Actualiza la información del tamaño</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </div>
      </div>

      {/* Información del tamaño */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">ID:</span> {tamano.id.slice(-8)}
          </div>
          <div>
            <span className="font-medium">Estado actual:</span>{" "}
            {tamano.is_active ? "Activo" : "Inactivo"}
          </div>
          <div>
            <span className="font-medium">Creado:</span>{" "}
            {new Date(tamano.created_at).toLocaleDateString("es-PE")}
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
                disabled={saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                disabled={saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                disabled={saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                disabled={saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                disabled={saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                  disabled={saving}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
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
      </form>
    </div>
  );
}
