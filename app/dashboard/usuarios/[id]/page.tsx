"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  IdCard,
} from "lucide-react";
import {
  obtenerUsuarioPorId,
  actualizarUsuario,
  type Usuario,
} from "@/app/actions/usuarios";
import RingLoader from "@/components/loaders/ringLoader";
import { useNotyf } from "@/app/providers/NotyfProvider";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const notyf = useNotyf();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dni_ruc: "",
    birth_date: "",
    phone: "",
    address: "",
    department: "",
    province: "",
    district: "",
    role: "customer" as "customer" | "admin" | "staff" | "supervisor",
  });

  // Cargar datos del usuario
  useEffect(() => {
    const cargarUsuario = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        const { data, error } = await obtenerUsuarioPorId(params.id as string);

        if (error) {
          throw new Error(error);
        }

        if (data) {
          setUsuario(data);
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            dni_ruc: data.dni_ruc || "",
            birth_date: data.birth_date ? data.birth_date.split("T")[0] : "",
            phone: data.phone || "",
            address: data.address || "",
            department: data.department || "",
            province: data.province || "",
            district: data.district || "",
            role: data.role as "customer" | "admin" | "staff" | "supervisor",
          });
        }
      } catch (err) {
        console.error("Error cargando usuario:", err);
        notyf?.error("Error al cargar usuario");
        setError(
          err instanceof Error ? err.message : "Error al cargar usuario"
        );
      } finally {
        setLoading(false);
      }
    };

    cargarUsuario();
  }, [params.id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    notyf?.error("Usuario actualizado exitosamente");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setSaving(true);
    setError(null);

    try {
      // Preparar datos para enviar
      const datosActualizados = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        dni_ruc: formData.dni_ruc,
        birth_date: formData.birth_date || null,
        phone: formData.phone,
        address: formData.address,
        department: formData.department,
        province: formData.province,
        district: formData.district,
        role: formData.role,
      };

      const { data, error: actionError } = await actualizarUsuario(
        usuario.id,
        datosActualizados
      );

      if (actionError) {
        throw new Error(actionError);
      }

      notyf?.success("Usuario actualizado exitosamente");
      router.push("/dashboard/usuarios");
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar el usuario. Intenta nuevamente.";
      setError(errorMessage);
      notyf?.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
    notyf?.error("Usuario cancelado");
  };

  // Departamentos del Perú
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
        <p className="text-gray-500">Cargando Usuario...</p>
      </div>
    );
  }

  if (error && !usuario) {
    return (
      <div className="max-w-4xl mx-auto h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/usuarios")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
        <h1 className="text-2xl font-bold text-gray-800">
          Editar Usuario: {usuario?.first_name} {usuario?.last_name}
        </h1>
        <p className="text-gray-600">Actualiza la información del usuario</p>
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

      {/* Información del usuario */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* <div>
            <span className="font-medium">ID:</span> {usuario?.id}
          </div> */}
          <div>
            <span className="font-medium">Email:</span> {usuario?.email}
          </div>
          <div>
            <span className="font-medium">Registrado:</span>{" "}
            {usuario?.created_at
              ? new Date(usuario.created_at).toLocaleDateString("es-PE")
              : "N/A"}
          </div>
          <div>
            <span className="font-medium">Última actualización:</span>{" "}
            {usuario?.updated_at
              ? new Date(usuario.updated_at).toLocaleDateString("es-PE")
              : "N/A"}
          </div>
        </div>
      </div>

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
                disabled={saving}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                disabled={saving}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                disabled={saving}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
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
                disabled={saving}
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
            {/* Email (solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={usuario?.email || ""}
                disabled
                className="w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                El email no se puede modificar
              </p>
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
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
          </div>

          {/* Nota importante */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Solo se puede editar la información del
              perfil. El email y la contraseña deben ser modificados por el
              usuario desde su cuenta.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="bg-white px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
