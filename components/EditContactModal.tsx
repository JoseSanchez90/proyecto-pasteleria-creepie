"use client";

import { useState } from "react";
import { X, Loader, Save } from "lucide-react";
import { actualizarPerfil } from "@/app/actions/usuarios";

interface EditContactModalProps {
  userId: string;
  initialData: {
    first_name: string;
    last_name: string;
    dni_ruc: string;
    phone: string;
    email: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditContactModal({
  userId,
  initialData,
  onClose,
  onSuccess,
}: EditContactModalProps) {
  const [formData, setFormData] = useState({
    first_name: initialData.first_name || "",
    last_name: initialData.last_name || "",
    dni_ruc: initialData.dni_ruc || "",
    phone: initialData.phone || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "El nombre es requerido";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "El apellido es requerido";
    }

    if (!formData.dni_ruc.trim()) {
      newErrors.dni_ruc = "El DNI es requerido";
    } else if (formData.dni_ruc.length < 8) {
      newErrors.dni_ruc = "El DNI debe tener al menos 8 dígitos";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
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
      const { data, error } = await actualizarPerfil(userId, formData);

      if (error) {
        alert("Error al actualizar información: " + error);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating contact info:", error);
      alert("Error al actualizar información");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Editar Información de Contacto
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Email (solo lectura) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={initialData.email}
              disabled
              className="w-full p-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              El correo no se puede modificar
            </p>
          </div>

          {/* Nombres */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombres *
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, first_name: e.target.value }))
              }
              placeholder="Tus nombres"
              className={`w-full p-3 rounded-xl border ${
                errors.first_name
                  ? "border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:ring-2 focus:ring-blue-200 transition`}
            />
            {errors.first_name && (
              <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>
            )}
          </div>

          {/* Apellidos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellidos *
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, last_name: e.target.value }))
              }
              placeholder="Tus apellidos"
              className={`w-full p-3 rounded-xl border ${
                errors.last_name
                  ? "border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:ring-2 focus:ring-blue-200 transition`}
            />
            {errors.last_name && (
              <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>
            )}
          </div>

          {/* DNI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DNI *
            </label>
            <input
              type="text"
              value={formData.dni_ruc}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  dni_ruc: e.target.value.replace(/\D/g, ""),
                }))
              }
              placeholder="12345678"
              maxLength={8}
              className={`w-full p-3 rounded-xl border ${
                errors.dni_ruc
                  ? "border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:ring-2 focus:ring-blue-200 transition`}
            />
            {errors.dni_ruc && (
              <p className="text-xs text-red-500 mt-1">{errors.dni_ruc}</p>
            )}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Celular *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="+51 999 999 999"
              className={`w-full p-3 rounded-xl border ${
                errors.phone
                  ? "border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:ring-2 focus:ring-blue-200 transition`}
            />
            {errors.phone && (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
