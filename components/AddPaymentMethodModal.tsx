"use client";

import { useState } from "react";
import { X, Loader, CreditCard } from "lucide-react";
import { agregarMetodoPago } from "@/app/actions/payment-methods";
import { useNotyf } from "@/app/providers/NotyfProvider";

interface AddPaymentMethodModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPaymentMethodModal({
  userId,
  onClose,
  onSuccess,
}: AddPaymentMethodModalProps) {
  const [formData, setFormData] = useState({
    card_number: "",
    card_holder_name: "",
    expiry_month: "",
    expiry_year: "",
    cvv: "",
    is_default: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [detectedCardType, setDetectedCardType] = useState<string | null>(null);
  const notyf = useNotyf();

  const detectCardType = (number: string) => {
    const digits = number.replace(/\s/g, "");

    if (/^4/.test(digits)) return "visa";
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
    if (/^3[47]/.test(digits)) return "amex";
    if (/^3[068]/.test(digits) || /^30[0-5]/.test(digits)) return "dinersclub";

    return null;
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(" ") : digits;
  };

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setFormData((prev) => ({ ...prev, card_number: formatted }));
    setDetectedCardType(detectCardType(formatted));

    if (errors.card_number) {
      setErrors((prev) => ({ ...prev, card_number: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.card_holder_name.trim()) {
      newErrors.card_holder_name = "El nombre del titular es requerido";
    }

    const cleanNumber = formData.card_number.replace(/\s/g, "");
    if (!cleanNumber) {
      newErrors.card_number = "El número de tarjeta es requerido";
    } else if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      newErrors.card_number = "Número de tarjeta inválido";
    }

    const month = parseInt(formData.expiry_month);
    if (!formData.expiry_month) {
      newErrors.expiry_month = "Requerido";
    } else if (month < 1 || month > 12) {
      newErrors.expiry_month = "Mes inválido";
    }

    const year = parseInt(formData.expiry_year);
    const currentYear = new Date().getFullYear();
    if (!formData.expiry_year) {
      newErrors.expiry_year = "Requerido";
    } else if (year < currentYear || year > currentYear + 20) {
      newErrors.expiry_year = "Año inválido";
    }

    if (!formData.cvv) {
      newErrors.cvv = "Requerido";
    } else if (formData.cvv.length < 3 || formData.cvv.length > 4) {
      newErrors.cvv = "CVV inválido";
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
      const { data, error } = await agregarMetodoPago({
        user_id: userId,
        card_number: formData.card_number,
        card_holder_name: formData.card_holder_name,
        expiry_month: formData.expiry_month.padStart(2, "0"),
        expiry_year: formData.expiry_year,
        cvv: formData.cvv,
        is_default: formData.is_default,
      });

      if (error) {
        notyf?.error("Error al agregar tarjeta: " + error);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding card:", error);
      notyf?.error("Error al agregar tarjeta");
    } finally {
      setSaving(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear + i);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            Agregar Método de Pago
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Número de tarjeta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de tarjeta *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.card_number}
                onChange={(e) => handleCardNumberChange(e.target.value)}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className={`w-full p-2 md:p-3 rounded-xl border ${
                  errors.card_number
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-200 transition`}
              />
              {detectedCardType && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 capitalize">
                  {detectedCardType === "amex"
                    ? "Amex"
                    : detectedCardType === "dinersclub"
                    ? "Diners"
                    : detectedCardType}
                </div>
              )}
            </div>
            {errors.card_number && (
              <p className="text-xs text-red-500 mt-1">{errors.card_number}</p>
            )}
          </div>

          {/* Nombre del titular */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del titular *
            </label>
            <input
              type="text"
              value={formData.card_holder_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  card_holder_name: e.target.value.toUpperCase(),
                }))
              }
              placeholder="JUAN PÉREZ"
              className={`w-full p-2 md:p-3 rounded-xl border ${
                errors.card_holder_name
                  ? "border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              } focus:ring-2 focus:ring-blue-200 transition uppercase`}
            />
            {errors.card_holder_name && (
              <p className="text-xs text-red-500 mt-1">
                {errors.card_holder_name}
              </p>
            )}
          </div>

          {/* Fecha de expiración y CVV */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mes *
              </label>
              <select
                value={formData.expiry_month}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expiry_month: e.target.value,
                  }))
                }
                className={`w-full p-2 md:p-3 rounded-xl border ${
                  errors.expiry_month
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-200 transition`}
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month.toString().padStart(2, "0")}>
                    {month.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              {errors.expiry_month && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.expiry_month}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año *
              </label>
              <select
                value={formData.expiry_year}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expiry_year: e.target.value,
                  }))
                }
                className={`w-full p-2 md:p-3 rounded-xl border ${
                  errors.expiry_year
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-200 transition`}
              >
                <option value="">AAAA</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.expiry_year && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.expiry_year}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVV *
              </label>
              <input
                type="text"
                value={formData.cvv}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cvv: e.target.value.replace(/\D/g, ""),
                  }))
                }
                placeholder="123"
                maxLength={4}
                className={`w-full p-2 md:p-3 rounded-xl border ${
                  errors.cvv
                    ? "border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                } focus:ring-2 focus:ring-blue-200 transition`}
              />
              {errors.cvv && (
                <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>
              )}
            </div>
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
            <label
              htmlFor="is_default"
              className="text-xs md:text-sm text-gray-700"
            >
              Establecer como método de pago predeterminado
            </label>
          </div>

          {/* Info de seguridad */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              🔒 Tu información está segura. Solo guardamos los últimos 4
              dígitos de tu tarjeta.
            </p>
          </div>

          {/* Números de prueba */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Números de tarjeta de prueba:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <div>Visa: 4532 0151 1283 0366</div>
              <div>Mastercard: 5425 2334 3010 9903</div>
              <div>Amex: 3742 454554 00126</div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 md:gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-2 lg:px-4 py-3 bg-white hover:bg-gray-50 text-sm lg:text-base text-gray-900 border border-gray-300 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-2 lg:px-4 py-3 bg-blue-600 hover:bg-blue-700 text-sm lg:text-base text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Agregar Tarjeta
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
