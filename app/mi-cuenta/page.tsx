"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { obtenerUsuarioPorId, actualizarPerfil } from "@/app/actions/usuarios";
import { obtenerPedidosCliente } from "@/app/actions/pedidos";
import OrderTracking from "@/components/orderTracking";
import ReservationTracking from "@/components/reservationTracking";
import PaymentMethod from "@/components/paymentMethod";
import { LoginModal } from "@/components/loginModal";
import { RegisterModal } from "@/components/registerModal";
import { User2Icon } from "lucide-react";
import { formatPrice } from "@/lib/format";
import RingLoader from "@/components/loaders/ringLoader";

type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  province: string;
  district: string;
  birth_date: string | null;
  dni_ruc: string;
};

export default function MyAccount() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("perfil");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const sections = [
    { id: "perfil", label: "Datos Personales" },
    { id: "pedidos", label: "Mis Pedidos" },
    { id: "seguimiento", label: "Seguimiento de Pedido" },
    { id: "reservaciones", label: "Seguimiento de Reservación" },
    { id: "pagos", label: "Método de Pago" },
  ];

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    checkUser();
  }, []);

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
        <p className="text-gray-500">Cargando Cuenta...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full min-h-screen bg-neutral-100 flex justify-center items-center">
        <div className="text-center">
          <p className="text-neutral-600 mb-4">No estás autenticado</p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2 text-white px-6 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <User2Icon className="w-5 h-5 mb-0.5" />
            Iniciar Sesión
          </button>
        </div>
        {/* Authentication Modals */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSwitchToRegister={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
        />
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSwitchToLogin={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl 2xl:max-w-6xl mx-auto min-h-screen bg-neutral-100 flex justify-center py-32 px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="rounded-2xl shadow bg-white">
          <div className="p-4 flex flex-col gap-3">
            {sections.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`text-left px-4 py-2 rounded-xl transition font-medium cursor-pointer ${
                  section === item.id
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="md:col-span-3">
          <div className="rounded-2xl shadow bg-white">
            <div className="p-6">
              {section === "perfil" && <DatosPersonales user={user} />}
              {section === "pedidos" && <MisPedidos user={user} />}
              {section === "seguimiento" && <OrderTracking userId={user.id} />}
              {section === "reservaciones" && (
                <ReservationTracking userId={user.id} />
              )}
              {section === "pagos" && <MetodoPago user={user} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- DATOS PERSONALES ---------------- */

function DatosPersonales({ user }: { user: any }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    department: "",
    province: "",
    district: "",
    birth_date: "",
  });
  const [isNewProfile, setIsNewProfile] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await obtenerUsuarioPorId(user.id);

        if (error) {
          console.error("Error loading profile:", error);
        } else if (data) {
          setProfile(data as Profile);
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            phone: data.phone || "",
            address: data.address || "",
            department: data.department || "",
            province: data.province || "",
            district: data.district || "",
            birth_date: data.birth_date || "",
          });

          // Verificar si es un perfil nuevo (sin nombre o apellido)
          if (!data.first_name || !data.last_name) {
            setIsNewProfile(true);
          }
        }
      } catch (error) {
        console.error("Error in loadProfile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user.id]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateProfile = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      alert("Por favor completa tu nombre y apellido");
      return;
    }

    try {
      setSaving(true);
      const { error } = await actualizarPerfil(user.id, formData);

      if (error) {
        alert("Error al actualizar perfil: " + error);
      } else {
        alert("✅ Perfil actualizado correctamente");
        setIsNewProfile(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error al actualizar perfil");
    } finally {
      setSaving(false);
    }
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
        <p className="text-gray-500">Cargando Perfil...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-blue-600">Datos Personales</h2>

      {isNewProfile && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Completa tu perfil
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Es la primera vez que accedes a tu cuenta. Por favor, completa
                  tu información personal para una mejor experiencia.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Nombres *
          </label>
          <input
            className="w-full p-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            placeholder="Ej: José"
            value={formData.first_name}
            onChange={(e) => handleInputChange("first_name", e.target.value)}
          />
          {!formData.first_name && (
            <p className="text-xs text-red-500 mt-1">
              Este campo es obligatorio
            </p>
          )}
        </div>

        {/* Apellido */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Apellidos *
          </label>
          <input
            className="w-full p-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            placeholder="Ej: Pérez García"
            value={formData.last_name}
            onChange={(e) => handleInputChange("last_name", e.target.value)}
          />
          {!formData.last_name && (
            <p className="text-xs text-red-500 mt-1">
              Este campo es obligatorio
            </p>
          )}
        </div>

        {/* Email (solo lectura) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Correo electrónico
          </label>
          <input
            className="w-full p-3 rounded-xl border border-neutral-300 bg-neutral-100"
            value={user.email}
            disabled
          />
          <p className="text-xs text-neutral-500 mt-1">
            El email no se puede modificar
          </p>
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Teléfono
          </label>
          <input
            className="w-full p-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            placeholder="Ej: +51 987 654 321"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
          />
        </div>

        {/* Fecha de Nacimiento */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Fecha de Nacimiento
          </label>
          <input
            type="date"
            className="w-full p-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            value={formData.birth_date}
            onChange={(e) => handleInputChange("birth_date", e.target.value)}
          />
          <p className="text-xs text-neutral-500 mt-1">
            Para recibir ofertas en tu cumpleaños
          </p>
        </div>

        {/* Dirección */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Dirección
          </label>
          <input
            className="w-full p-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            placeholder="Ej: Av. Principal 123"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
          />
        </div>

        {/* Departamento, Provincia, Distrito */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Departamento
          </label>
          <input
            className="w-full p-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            placeholder="Ej: Lima"
            value={formData.department}
            onChange={(e) => handleInputChange("department", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Provincia
          </label>
          <input
            className="w-full p-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            placeholder="Ej: Lima"
            value={formData.province}
            onChange={(e) => handleInputChange("province", e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Distrito
          </label>
          <input
            className="w-full p-3 rounded-xl border border-neutral-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
            placeholder="Ej: Miraflores"
            value={formData.district}
            onChange={(e) => handleInputChange("district", e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={updateProfile}
          disabled={
            saving || !formData.first_name.trim() || !formData.last_name.trim()
          }
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {(!formData.first_name || !formData.last_name) && (
          <p className="text-sm text-red-500">
            Completa tu nombre y apellido para guardar
          </p>
        )}
      </div>
    </div>
  );
}

/* ---------------- MÉTODO DE PAGO ---------------- */

function MetodoPago({ user }: { user: any }) {
  return <PaymentMethod userId={user.id} />;
}

/* ---------------- MIS PEDIDOS ---------------- */

// Tipos
type OrderStatus =
  | "completed"
  | "cancelled"
  | "confirmed"
  | "preparing"
  | "on_the_way"
  | "pending";

function MisPedidos({ user }: { user?: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const { data, error } = await obtenerPedidosCliente(user.id);

        if (error) {
          console.error("Error loading orders:", error);
          setOrders([]);
        } else {
          setOrders(data || []);
        }
      } catch (error) {
        console.error("Error in loadOrders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      loadOrders();
    }
  }, [user]);

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      completed: "Completado",
      cancelled: "Cancelado",
      confirmed: "Confirmado",
      preparing: "En Preparación",
      on_the_way: "En Camino",
      pending: "Pendiente",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-yellow-100 text-yellow-800",
      on_the_way: "bg-orange-100 text-orange-800",
      pending: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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
        <p className="text-gray-500">Cargando Pedidos...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-blue-600">Mis Pedidos</h2>

      {orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-neutral-500 mb-4">No tienes pedidos aún.</p>
          <button
            onClick={() => (window.location.href = "/postres")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Hacer mi primer pedido
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl shadow bg-neutral-50 border p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-neutral-700">
                    Pedido #{order.id.slice(-8)}
                  </span>
                  <p className="text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-blue-600 font-semibold">
                    {formatPrice(order.total_amount)}
                  </p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs text-gray-500 ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
