"use client";

import { useState, useEffect } from "react";
import {
  obtenerMetodosPago,
  agregarMetodoPago,
  eliminarMetodoPago,
  establecerMetodoPredeterminado,
  type PaymentMethod as PaymentMethodType,
} from "@/app/actions/payment-methods";
import { CreditCard, Trash2, Plus, X, Loader, Check, Star } from "lucide-react";
import DotWaveLoader from "./loaders/dotWaveLoader";
import RingLoader from "./loaders/ringLoader";

interface PaymentMethodProps {
  userId: string;
}

export default function PaymentMethod({ userId }: PaymentMethodProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, [userId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const { data, error } = await obtenerMetodosPago(userId);

      if (error) {
        console.error("Error loading payment methods:", error);
        setPaymentMethods([]);
      } else {
        setPaymentMethods(data || []);
      }
    } catch (error) {
      console.error("Error in loadPaymentMethods:", error);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este método de pago?")) {
      return;
    }

    try {
      setProcessingId(id);
      const { error } = await eliminarMetodoPago(id, userId);

      if (error) {
        alert("Error al eliminar método de pago: " + error);
      } else {
        await loadPaymentMethods();
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      alert("Error al eliminar método de pago");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      setProcessingId(id);
      const { error } = await establecerMetodoPredeterminado(id, userId);

      if (error) {
        alert("Error al establecer método predeterminado: " + error);
      } else {
        await loadPaymentMethods();
      }
    } catch (error) {
      console.error("Error setting default:", error);
      alert("Error al establecer método predeterminado");
    } finally {
      setProcessingId(null);
    }
  };

  const getCardIcon = (type: string) => {
    const icons: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "Amex",
      dinersclub: "Diners Club",
    };
    return icons[type] || "💳";
  };

  const getCardGradient = (type: string) => {
    const gradients: Record<string, string> = {
      visa: "bg-gradient-to-br from-blue-500 to-blue-700",
      mastercard: "bg-gradient-to-br from-orange-500 to-red-600",
      amex: "bg-gradient-to-br from-teal-500 to-blue-600",
      dinersclub: "bg-gradient-to-br from-purple-500 to-indigo-600",
    };
    return gradients[type] || "bg-gradient-to-br from-gray-500 to-gray-700";
  };

  const getCardName = (type: string) => {
    const names: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "American Express",
      dinersclub: "Diners Club",
    };
    return names[type] || type;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 h-screen">
        <RingLoader
          size="50"
          stroke="6"
          bgOpacity="0.1"
          speed="1.68"
          color="#3b82f6"
        />
        <p className="text-gray-500">Cargando Metodos de Pago...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-blue-600">Método de Pago</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          Agregar tarjeta
        </button>
      </div>

      {/* Lista de tarjetas */}
      {paymentMethods.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            No tienes métodos de pago guardados
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors"
          >
            Agregar tu primera tarjeta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className="relative bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Tarjeta visual */}
              <div
                className={`${getCardGradient(
                  method.card_type
                )} text-white p-6 rounded-t-xl relative overflow-hidden`}
              >
                {/* Patrón de fondo */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <span className="text-2xl">
                      {getCardIcon(method.card_type)}
                    </span>
                    {method.is_default && (
                      <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                        <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                        <span className="text-xs font-medium">
                          Predeterminada
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="text-lg tracking-wider font-mono">
                      •••• •••• •••• {method.card_last_four}
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-xs opacity-75 mb-1">
                        Titular de la tarjeta
                      </div>
                      <div className="font-medium text-sm uppercase">
                        {method.card_holder_name}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs opacity-75 mb-1">Expira</div>
                      <div className="font-medium text-sm">
                        {method.expiry_month}/{method.expiry_year.slice(-2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="p-4 flex gap-2">
                {!method.is_default && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    disabled={processingId === method.id}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {processingId === method.id ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500 mb-0.5" />
                        Predeterminada
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(method.id)}
                  disabled={processingId === method.id}
                  className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer transition-colors disabled:opacity-50"
                >
                  {processingId === method.id ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </>
                  )}
                </button>
              </div>

              <div className="px-4 pb-4 text-xs text-gray-500">
                {getCardName(method.card_type)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de agregar tarjeta */}
      {showAddForm && (
        <AddCardForm
          userId={userId}
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            setShowAddForm(false);
            loadPaymentMethods();
          }}
        />
      )}
    </div>
  );
}

/* ---------------- FORMULARIO DE AGREGAR TARJETA ---------------- */

interface AddCardFormProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddCardForm({ userId, onClose, onSuccess }: AddCardFormProps) {
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

    // Limpiar error si existe
    if (errors.card_number) {
      setErrors((prev) => ({ ...prev, card_number: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validar nombre
    if (!formData.card_holder_name.trim()) {
      newErrors.card_holder_name = "El nombre del titular es requerido";
    }

    // Validar número de tarjeta
    const cleanNumber = formData.card_number.replace(/\s/g, "");
    if (!cleanNumber) {
      newErrors.card_number = "El número de tarjeta es requerido";
    } else if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      newErrors.card_number = "Número de tarjeta inválido";
    }

    // Validar mes
    const month = parseInt(formData.expiry_month);
    if (!formData.expiry_month) {
      newErrors.expiry_month = "Requerido";
    } else if (month < 1 || month > 12) {
      newErrors.expiry_month = "Mes inválido";
    }

    // Validar año
    const year = parseInt(formData.expiry_year);
    const currentYear = new Date().getFullYear();
    if (!formData.expiry_year) {
      newErrors.expiry_year = "Requerido";
    } else if (year < currentYear || year > currentYear + 20) {
      newErrors.expiry_year = "Año inválido";
    }

    // Validar CVV
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
        alert("Error al agregar tarjeta: " + error);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding card:", error);
      alert("Error al agregar tarjeta");
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
          <h3 className="text-lg font-semibold text-gray-900">
            Agregar tarjeta
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
                className={`w-full p-3 rounded-xl border ${
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
              className={`w-full p-3 rounded-xl border ${
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
                className={`w-full p-3 rounded-xl border ${
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
                className={`w-full p-3 rounded-xl border ${
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
                className={`w-full p-3 rounded-xl border ${
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
            <label htmlFor="is_default" className="text-sm text-gray-700">
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
                "Agregar tarjeta"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
