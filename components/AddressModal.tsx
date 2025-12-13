"use client";

import { useState } from "react";
import { X, Loader, MapPin, Check } from "lucide-react";
import {
  agregarDireccion,
  actualizarDireccion,
  type ShippingAddress,
} from "@/app/actions/addresses";

interface AddressModalProps {
  userId: string;
  address?: ShippingAddress | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddressModal({
  userId,
  address,
  onClose,
  onSuccess,
}: AddressModalProps) {
  const isEditing = !!address;

  const [formData, setFormData] = useState({
    address_name: address?.address_name || "",
    address: address?.address || "",
    department: address?.department || "",
    province: address?.province || "",
    district: address?.district || "",
    reference: address?.reference || "",
    is_default: address?.is_default || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida";
    }

    if (!formData.department.trim()) {
      newErrors.department = "El departamento es requerido";
    }

    if (!formData.province.trim()) {
      newErrors.province = "La provincia es requerida";
    }

    if (!formData.district.trim()) {
      newErrors.district = "El distrito es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      if (isEditing && address) {
        const { data, error } = await actualizarDireccion(
          address.id,
          userId,
          formData
        );

        if (error) {
          alert("Error al actualizar dirección: " + error);
        } else {
          onSuccess();
        }
      } else {
        const { data, error } = await agregarDireccion({
          user_id: userId,
          ...formData,
        });

        if (error) {
          alert("Error al agregar dirección: " + error);
        } else {
          onSuccess();
        }
      }
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Error al guardar dirección");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Editar Dirección" : "Agregar Dirección"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre de la dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la dirección (Opcional)
            </label>
            <input
              type="text"
              value={formData.address_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  address_name: e.target.value,
                }))
              }
              placeholder="Ej: Casa, Oficina, etc."
              className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Av. Principal #123"
              className={`w-full p-3 rounded-xl border ${
                errors.address
                  ? "border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:ring-2 focus:ring-blue-200 transition`}
            />
            {errors.address && (
              <p className="text-xs text-red-500 mt-1">{errors.address}</p>
            )}
          </div>

          {/* Departamento, Provincia, Distrito */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Departamento *
              </label>
              <select
                value={formData.department}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    department: e.target.value,
                  }))
                }
                className={`w-full p-3 rounded-xl border ${
                  errors.department
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-200 transition`}
              >
                <option value="">Seleccionar</option>
                <option value="Lima">Lima</option>
                <option value="Arequipa">Arequipa</option>
                <option value="Cusco">Cusco</option>
                <option value="La Libertad">La Libertad</option>
                <option value="Piura">Piura</option>
              </select>
              {errors.department && (
                <p className="text-xs text-red-500 mt-1">{errors.department}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provincia *
              </label>
              <select
                value={formData.province}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    province: e.target.value,
                  }))
                }
                className={`w-full p-3 rounded-xl border ${
                  errors.province
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-200 transition`}
              >
                <option value="">Seleccionar</option>
                <option value="Lima">Lima</option>
                <option value="Callao">Callao</option>
                <option value="Arequipa">Arequipa</option>
                <option value="Cusco">Cusco</option>
              </select>
              {errors.province && (
                <p className="text-xs text-red-500 mt-1">{errors.province}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distrito *
              </label>
              <select
                value={formData.district}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    district: e.target.value,
                  }))
                }
                className={`w-full p-3 rounded-xl border ${
                  errors.district
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-200 transition`}
              >
                <option value="">Seleccionar</option>
                <option value="Miraflores">Miraflores</option>
                <option value="San Isidro">San Isidro</option>
                <option value="Barranco">Barranco</option>
                <option value="Surco">Surco</option>
                <option value="La Molina">La Molina</option>
              </select>
              {errors.district && (
                <p className="text-xs text-red-500 mt-1">{errors.district}</p>
              )}
            </div>
          </div>

          {/* Referencia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referencia (Opcional)
            </label>
            <textarea
              value={formData.reference}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reference: e.target.value }))
              }
              placeholder="Ej: Casa con reja azul, frente al parque..."
              rows={2}
              className="w-full p-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition resize-none"
            />
          </div>

          {/* Predeterminada */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_default: e.target.checked,
                }))
              }
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_default" className="text-sm text-gray-700">
              Establecer como dirección predeterminada
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {isEditing ? "Actualizar" : "Agregar Dirección"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
