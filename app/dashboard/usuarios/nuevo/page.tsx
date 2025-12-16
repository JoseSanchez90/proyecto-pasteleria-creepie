"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, User, Mail, Phone, MapPin, Calendar, IdCard } from "lucide-react";
import { crearUsuario } from "@/app/actions/usuarios";
import { FaSave } from "react-icons/fa";
import { useNotyf } from "@/app/providers/NotyfProvider";

export default function NewUserPage() {
  const router = useRouter();
  const notyf = useNotyf();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado del formulario basado en tu DB profiles
  const [formData, setFormData] = useState({
    // Información personal
    first_name: "",
    last_name: "",
    dni_ruc: "",
    birth_date: "",

    // Información de contacto
    email: "",
    phone: "",

    // Ubicación
    address: "",
    department: "",
    province: "",
    district: "",

    // Rol del usuario
    role: "customer" as "customer" | "admin" | "staff" | "supervisor",

    // Información de autenticación
    password: "",
    confirmPassword: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones básicas
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      notyf?.error("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      notyf?.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (!formData.first_name || !formData.last_name || !formData.dni_ruc) {
      setError("Los campos de nombre, apellido y DNI son obligatorios");
      setLoading(false);
      notyf?.error("Los campos de nombre, apellido y DNI son obligatorios");
      return;
    }

    try {
      // Preparar datos para enviar
      const usuarioData = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        dni_ruc: formData.dni_ruc,
        birth_date: formData.birth_date || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        department: formData.department || undefined,
        province: formData.province || undefined,
        district: formData.district || undefined,
        role: formData.role,
      };

      // Llamar a la Server Action
      const { data, error: actionError } = await crearUsuario(usuarioData);

      if (actionError) {
        throw new Error(actionError);
      }

      // Mostrar mensaje de éxito
      notyf?.success("Usuario creado exitosamente");

      // Redirigir a la lista de usuarios
      router.push("/dashboard/usuarios");
    } catch (error) {
      console.error("Error al crear usuario:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al crear el usuario. Intenta nuevamente.";
      setError(errorMessage);
      notyf?.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
    notyf?.error("Operación cancelada");
  };

  // Departamentos del Perú (ejemplo)
  const departamentos = [
    "Lima",
    "Arequipa",
    "Cusco",
    "La Libertad",
    "Piura",
    "Lambayeque",
    "Junín",
    "Puno",
    "Ancash",
    "Ica",
    "Tacna",
    "Loreto",
    "Ucayali",
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nuevo Usuario</h1>
        <p className="text-gray-600">Crea un nuevo usuario para el sistema</p>
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
        {/* Información Personal */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Información Personal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombres *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: María"
              />
            </div>

            {/* Apellidos */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellidos *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: Gonzales Pérez"
              />
            </div>

            {/* DNI/RUC */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <IdCard className="w-4 h-4" />
                DNI/RUC *
              </label>
              <input
                type="text"
                name="dni_ruc"
                value={formData.dni_ruc}
                onChange={handleChange}
                required
                pattern="[0-9]{8,11}"
                title="Ingrese 8 dígitos para DNI o 11 para RUC"
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: 70123456"
              />
            </div>

            {/* Fecha de Nacimiento */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                name="birth_date"
                value={formData.birth_date}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Información de Contacto
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="ejemplo@email.com"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                pattern="[0-9]{9}"
                title="Ingrese 9 dígitos"
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: 987654321"
              />
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Ubicación
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Seleccionar departamento</option>
                {departamentos.map((depto) => (
                  <option key={depto} value={depto}>
                    {depto}
                  </option>
                ))}
              </select>
            </div>

            {/* Provincia */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provincia
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: Lima"
              />
            </div>

            {/* Distrito */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distrito
              </label>
              <input
                type="text"
                name="district"
                value={formData.district}
                onChange={handleChange}
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: Miraflores"
              />
            </div>

            {/* Dirección */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección Completa
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: Av. Principal 123, Urbanización Los Jardines"
              />
            </div>
          </div>
        </div>

        {/* Configuración de Cuenta */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Configuración de Cuenta
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rol del usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol del Usuario *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="customer">Cliente</option>
                <option value="admin">Administrador</option>
                <option value="staff">Staff</option>
                <option value="supervisor">Supervisor</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Los administradores tienen acceso completo al sistema. Los
                supervisores pueden gestionar asistencia del staff.
              </p>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={6}
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Repite la contraseña"
              />
            </div>
          </div>

          {/* Nota importante */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Al crear un usuario desde el panel de
              administración, se creará tanto en el sistema de autenticación
              como en el perfil de la base de datos. El email se confirmará
              automáticamente.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FaSave className="w-4 h-4" />
            {loading ? "Creando Usuario..." : "Crear Usuario"}
          </button>
        </div>
      </form>
    </div>
  );
}
