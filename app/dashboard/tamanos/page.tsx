"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  obtenerTamanosConConteo,
  eliminarTamano,
  toggleEstadoTamano,
  type TamanoConConteo,
} from "@/app/actions/tamanos";
import RingLoader from "@/components/loaders/ringLoader";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";

export default function TamanosPage() {
  const router = useRouter();
  const [tamanos, setTamanos] = useState<TamanoConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5;

  useEffect(() => {
    cargarTamanos();
  }, []);

  const cargarTamanos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await obtenerTamanosConConteo();

      if (error) {
        throw new Error(error);
      }

      setTamanos(data || []);
    } catch (err) {
      console.error("Error cargando tamaños:", err);
      setError(err instanceof Error ? err.message : "Error al cargar tamaños");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar tamaños
  const tamanosFiltrados = tamanos.filter((tamano) => {
    const coincideBusqueda =
      tamano.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      tamano.description.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activos" && tamano.is_active) ||
      (filtroEstado === "inactivos" && !tamano.is_active);

    return coincideBusqueda && coincideEstado;
  });

  // Calcular índices para la paginación
  const indiceInicial = (paginaActual - 1) * elementosPorPagina;
  const indiceFinal = indiceInicial + elementosPorPagina;
  const tamanosPagina = tamanosFiltrados.slice(indiceInicial, indiceFinal);

  // Calcular total de páginas
  const totalPaginas = Math.ceil(tamanosFiltrados.length / elementosPorPagina);

  const toggleEstado = async (id: string) => {
    try {
      const tamano = tamanos.find((t) => t.id === id);
      if (!tamano) return;

      const { error } = await toggleEstadoTamano(id, !tamano.is_active);

      if (error) {
        throw new Error(error);
      }

      // Actualizar estado local
      setTamanos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_active: !t.is_active } : t))
      );
    } catch (err) {
      console.error("Error cambiando estado:", err);
      alert(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  const eliminarTamanoHandler = async (id: string) => {
    const tamano = tamanos.find((t) => t.id === id);

    if ((tamano?.product_count || 0) > 0) {
      alert("No puedes eliminar un tamaño que tiene productos asociados.");
      return;
    }

    if (confirm("¿Estás seguro de que quieres eliminar este tamaño?")) {
      try {
        const { error } = await eliminarTamano(id);

        if (error) {
          throw new Error(error);
        }

        setTamanos(tamanos.filter((t) => t.id !== id));
        alert("Tamaño eliminado exitosamente");
      } catch (err) {
        console.error("Error eliminando tamaño:", err);
        alert(err instanceof Error ? err.message : "Error al eliminar tamaño");
      }
    }
  };

  const editarTamano = (id: string) => {
    router.push(`/dashboard/tamanos/${id}`);
  };

  const nuevoTamano = () => {
    router.push("/dashboard/tamanos/nuevo");
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE");
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
        <p className="text-gray-500">Cargando Tamaños...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarTamanos}
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
        <div className="flex flex-col gap-2 md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
              Gestión de Tamaños
            </h1>
            <p className="text-sm 2xl:text-base text-gray-600">
              Administra los tamaños disponibles para tus productos
            </p>
          </div>

          <button
            onClick={nuevoTamano}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nuevo Tamaño
          </button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tamaños..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los tamaños</option>
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Tamaños</p>
            <p className="text-2xl font-bold text-gray-800">{tamanos.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Activos</p>
            <p className="text-2xl font-bold text-green-600">
              {tamanos.filter((t) => t.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Inactivos</p>
            <p className="text-2xl font-bold text-red-600">
              {tamanos.filter((t) => !t.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Productos</p>
            <p className="text-2xl font-bold text-blue-600">
              {tamanos.reduce((sum, t) => sum + (t.product_count || 0), 0)}
            </p>
          </div>
        </div>

        {/* Tabla de tamaños */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Capacidad
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Precio Adicional
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Productos
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tamanosPagina.map((tamano, index) => {
                  const numeroFila =
                    (paginaActual - 1) * elementosPorPagina + index + 1;

                  return (
                    <tr key={tamano.id} className="hover:bg-gray-50">
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {numeroFila}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Ruler className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {tamano.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Orden: {tamano.display_order}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-semibold text-gray-900">
                            {tamano.person_capacity} personas
                          </span>
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          S/ {tamano.additional_price?.toFixed(2) || "0.00"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Precio adicional
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {tamano.description || "Sin descripción"}
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            (tamano.product_count || 0) > 0
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          {tamano.product_count || 0} productos
                        </span>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleEstado(tamano.id)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            tamano.is_active
                              ? "text-green-600 hover:text-green-800"
                              : "text-red-600 hover:text-red-800"
                          }`}
                        >
                          {tamano.is_active ? (
                            <>
                              <FaToggleOn className="w-6 h-6" />
                              Activo
                            </>
                          ) : (
                            <>
                              <FaToggleOff className="w-6 h-6" />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(tamano.created_at)}
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => editarTamano(tamano.id)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Editar tamaño"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarTamanoHandler(tamano.id)}
                            className={`p-1 ${
                              (tamano.product_count || 0) > 0
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-900"
                            }`}
                            title={
                              (tamano.product_count || 0) > 0
                                ? "No se puede eliminar - Tiene productos asociados"
                                : "Eliminar tamaño"
                            }
                            disabled={(tamano.product_count || 0) > 0}
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
          {tamanosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Ruler className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron tamaños
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {busqueda || filtroEstado !== "todos"
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "Comienza creando tu primer tamaño."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Paginación */}
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
            className="p-2 text-sm border bg-gray-800 hover:bg-gray-900 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPaginaActual(paginaActual + 1)}
            disabled={
              tamanosFiltrados.length <= elementosPorPagina * paginaActual
            }
            className="p-2 text-sm border bg-gray-800 hover:bg-gray-900 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
