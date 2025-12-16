"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  User,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import {
  obtenerUsuarios,
  actualizarRolUsuario,
  type Usuario,
} from "@/app/actions/usuarios";
import RingLoader from "@/components/loaders/ringLoader";
import { useNotyf } from "@/app/providers/NotyfProvider";

export default function UsersPage() {
  const notyf = useNotyf();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [filtroUbicacion, setFiltroUbicacion] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5;

  // Cargar usuarios al montar el componente
  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      setError(null);

      const { data, error } = await obtenerUsuarios();

      if (error) {
        throw new Error(error);
      }

      setUsuarios(data || []);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
      notyf?.error("Error al cargar usuarios");
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setCargando(false);
    }
  };

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const coincideBusqueda =
      usuario.first_name.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.last_name.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.dni_ruc.includes(busqueda);

    const coincideRol = filtroRol === "todos" || usuario.role === filtroRol;
    const coincideUbicacion =
      filtroUbicacion === "todos" ||
      (filtroUbicacion === "con-ubicacion" && usuario.department !== "") ||
      (filtroUbicacion === "sin-ubicacion" && usuario.department === "");

    return coincideBusqueda && coincideRol && coincideUbicacion;
  });

  // Calcular índices para la paginación
  const indiceInicial = (paginaActual - 1) * elementosPorPagina;
  const indiceFinal = indiceInicial + elementosPorPagina;
  const usuariosPagina = usuariosFiltrados.slice(indiceInicial, indiceFinal);

  // Calcular total de páginas
  const totalPaginas = Math.ceil(usuariosFiltrados.length / elementosPorPagina);

  const roles = ["todos", "customer", "admin", "staff", "supervisor"];
  const ubicaciones = ["todos", "con-ubicacion", "sin-ubicacion"];

  const eliminarUsuario = async (id: string) => {
    if (
      confirm(
        "¿Estás seguro de que quieres ELIMINAR PERMANENTEMENTE este usuario? Esta acción no se puede deshacer."
      )
    ) {
      try {
        await eliminarUsuario(id); // Ahora usa la nueva función

        if (error) {
          throw new Error(error);
        }

        // Actualizar lista local
        setUsuarios(usuarios.filter((u) => u.id !== id));
        notyf?.success("Usuario eliminado permanentemente");
      } catch (err) {
        console.error("Error eliminando usuario:", err);
        notyf?.error(
          err instanceof Error ? err.message : "Error al eliminar usuario"
        );
      }
    }
  };

  const cambiarRol = async (id: string, nuevoRol: string) => {
    try {
      const { error } = await actualizarRolUsuario(
        id,
        nuevoRol as Usuario["role"]
      );

      if (error) {
        throw new Error(error);
      }

      // Actualizar estado local
      setUsuarios((prevUsuarios) =>
        prevUsuarios.map((usuario) =>
          usuario.id === id
            ? { ...usuario, role: nuevoRol as Usuario["role"] }
            : usuario
        )
      );
    } catch (err) {
      console.error("Error cambiando rol:", err);
      notyf?.error(err instanceof Error ? err.message : "Error al cambiar rol");
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE");
  };

  const calcularEdad = (fechaNacimiento: string | null) => {
    if (!fechaNacimiento) return "No especificada";
    const edad =
      new Date().getFullYear() - new Date(fechaNacimiento).getFullYear();
    return `${edad} años`;
  };

  const handleNuevoUsuario = () => {
    router.push("/dashboard/usuarios/nuevo");
  };

  const handleEditarUsuario = (id: string) => {
    router.push(`/dashboard/usuarios/${id}`);
  };

  if (cargando) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-2">
        <RingLoader
          size="50"
          stroke="6"
          bgOpacity="0.1"
          speed="1.68"
          color="#3b82f6"
        />
        <p className="text-gray-500">Cargando Usuarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col justify-center items-center gap-2">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarUsuarios}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
              Gestión de Usuarios
            </h1>
            <p className="text-sm 2xl:text-base text-gray-600">
              Administra los usuarios de tu pastelería
            </p>
          </div>

          <button
            onClick={handleNuevoUsuario}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nuevo Usuario
          </button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o DNI..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por rol */}
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {roles.map((rol) => (
                <option key={rol} value={rol}>
                  {rol === "todos"
                    ? "Todos los roles"
                    : rol === "customer"
                    ? "Solo clientes"
                    : rol === "admin"
                    ? "Solo administradores"
                    : rol === "supervisor"
                    ? "Solo supervisores"
                    : "Solo staff"}
                </option>
              ))}
            </select>

            {/* Filtro por ubicación */}
            <select
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {ubicaciones.map((ubicacion) => (
                <option key={ubicacion} value={ubicacion}>
                  {ubicacion === "todos"
                    ? "Todas las ubicaciones"
                    : ubicacion === "con-ubicacion"
                    ? "Con ubicación"
                    : "Sin ubicación"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-zinc-50 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Usuarios</p>
            <p className="text-2xl font-bold text-gray-800">
              {usuarios.length}
            </p>
          </div>
          <div className="bg-zinc-50 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Clientes</p>
            <p className="text-2xl font-bold text-green-600">
              {usuarios.filter((u) => u.role === "customer").length}
            </p>
          </div>
          <div className="bg-zinc-50 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Administradores</p>
            <p className="text-2xl font-bold text-purple-600">
              {usuarios.filter((u) => u.role === "admin").length}
            </p>
          </div>
          <div className="bg-zinc-50 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Supervisores</p>
            <p className="text-2xl font-bold text-purple-600">
              {usuarios.filter((u) => u.role === "supervisor").length}
            </p>
          </div>
          <div className="bg-zinc-50 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Staff</p>
            <p className="text-2xl font-bold text-purple-600">
              {usuarios.filter((u) => u.role === "staff").length}
            </p>
          </div>
          <div className="bg-zinc-50 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Sin ubicación</p>
            <p className="text-2xl font-bold text-orange-600">
              {usuarios.filter((u) => u.department === "").length}
            </p>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Registrado
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosPagina.map((usuario, index) => {
                  const numeroFila =
                    (paginaActual - 1) * elementosPorPagina + index + 1;

                  return (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {numeroFila}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4 w-36">
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.first_name} {usuario.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              DNI: {usuario.dni_ruc || "No especificado"}
                            </div>
                            {usuario.birth_date && (
                              <div className="text-xs text-gray-400">
                                {calcularEdad(usuario.birth_date)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="text-sm text-gray-900 flex items-center gap-1 mb-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {usuario.email}
                        </div>
                        {usuario.phone && (
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            {usuario.phone}
                          </div>
                        )}
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {usuario.department ? (
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              {usuario.department}
                            </div>
                            <div className="text-xs text-gray-500">
                              {usuario.province}, {usuario.district}
                            </div>
                            {usuario.address && (
                              <div className="text-xs text-gray-400 truncate max-w-xs">
                                {usuario.address}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Sin ubicación
                          </span>
                        )}
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <select
                          value={usuario.role}
                          onChange={(e) =>
                            cambiarRol(usuario.id, e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="customer">Cliente</option>
                          <option value="admin">Administrador</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="staff">Staff</option>
                        </select>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(usuario.created_at)}
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditarUsuario(usuario.id)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Editar usuario"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarUsuario(usuario.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {usuariosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron usuarios
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {busqueda ||
                filtroRol !== "todos" ||
                filtroUbicacion !== "todos"
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "No hay usuarios registrados en el sistema."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Paginación (placeholder) */}
      <div className="py-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando{" "}
          <span className="font-medium">
            {totalPaginas > paginaActual ? paginaActual : totalPaginas}
          </span>{" "}
          de <span className="font-medium">{totalPaginas}</span> páginas
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPaginaActual(paginaActual - 1)}
            disabled={paginaActual === 1}
            className="p-3 text-sm border bg-gray-800 hover:bg-gray-900 text-white rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RiArrowLeftSLine className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setPaginaActual(paginaActual + 1)}
            disabled={
              usuariosFiltrados.length <= elementosPorPagina * paginaActual
            }
            className="p-3 text-sm border bg-gray-800 hover:bg-gray-900 text-white rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RiArrowRightSLine className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
