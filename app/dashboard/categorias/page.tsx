"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getCategoriasWithProductCount,
  deleteCategoria,
  updateCategoria,
  type Categoria,
} from "@/app/actions/categorias";
import RingLoader from "@/components/loaders/ringLoader";
import { FaToggleOff, FaToggleOn } from "react-icons/fa";

interface CategoriaConConteo extends Categoria {
  product_count?: number;
}

export default function CategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<CategoriaConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 6;

  // Cargar categorías al montar el componente
  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await getCategoriasWithProductCount();

      if (error) {
        throw new Error(error);
      }

      setCategorias(data || []);
    } catch (err) {
      console.error("Error cargando categorías:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar categorías"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filtrar categorías
  const categoriasFiltradas = categorias.filter((categoria) => {
    const coincideBusqueda =
      categoria.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      categoria.description.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "todas" ||
      (filtroEstado === "activas" && categoria.is_active) ||
      (filtroEstado === "inactivas" && !categoria.is_active);

    return coincideBusqueda && coincideEstado;
  });

  const toggleEstado = async (id: string) => {
    try {
      const categoria = categorias.find((cat) => cat.id === id);
      if (!categoria) return;

      // Crear FormData para la actualización
      const formData = new FormData();
      formData.append("name", categoria.name);
      formData.append("description", categoria.description);
      formData.append("is_active", (!categoria.is_active).toString());

      const { error } = await updateCategoria(id, formData);

      if (error) {
        throw new Error(error);
      }

      // Actualizar estado local
      setCategorias((prev) =>
        prev.map((cat) =>
          cat.id === id ? { ...cat, is_active: !cat.is_active } : cat
        )
      );
    } catch (err) {
      console.error("Error cambiando estado:", err);
      alert(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  };

  // Calcular índices para la paginación
  const indiceInicial = (paginaActual - 1) * elementosPorPagina;
  const indiceFinal = indiceInicial + elementosPorPagina;
  const categoriasPagina = categoriasFiltradas.slice(
    indiceInicial,
    indiceFinal
  );

  // Calcular total de páginas
  const totalPaginas = Math.ceil(
    categoriasFiltradas.length / elementosPorPagina
  );

  const eliminarCategoria = async (id: string) => {
    const categoria = categorias.find((cat) => cat.id === id);

    // Verificación corregida - explícitamente check si es mayor que 0
    if ((categoria?.product_count || 0) > 0) {
      alert("No puedes eliminar una categoría que tiene productos asociados.");
      return;
    }

    if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      try {
        const { error } = await deleteCategoria(id);

        if (error) {
          throw new Error(error);
        }

        // Actualizar lista local
        setCategorias(categorias.filter((cat) => cat.id !== id));
        alert("Categoría eliminada exitosamente");
      } catch (err) {
        console.error("Error eliminando categoría:", err);
        alert(
          err instanceof Error ? err.message : "Error al eliminar categoría"
        );
      }
    }
  };

  const editarCategoria = (categoria: CategoriaConConteo) => {
    router.push(`/dashboard/categorias/${categoria.id}`);
  };

  const nuevaCategoria = () => {
    router.push("/dashboard/categorias/nuevo");
  };

  const verProductosCategoria = (categoriaId: string) => {
    router.push(`/dashboard/productos?categoria=${categoriaId}`);
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
        <p className="text-gray-500">Cargando Categorías...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarCategorias}
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
              Gestión de Categorías
            </h1>
            <p className="text-sm 2xl:text-base text-gray-600">
              Organiza los productos por categorías
            </p>
          </div>

          <button
            onClick={nuevaCategoria}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nueva Categoría
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
                placeholder="Buscar categorías..."
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
              <option value="todas">Todas las categorías</option>
              <option value="activas">Solo activas</option>
              <option value="inactivas">Solo inactivas</option>
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Categorías</p>
            <p className="text-2xl font-bold text-gray-800">
              {categorias.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Activas</p>
            <p className="text-2xl font-bold text-green-600">
              {categorias.filter((c) => c.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Inactivas</p>
            <p className="text-2xl font-bold text-red-600">
              {categorias.filter((c) => !c.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Productos</p>
            <p className="text-2xl font-bold text-blue-600">
              {categorias.reduce(
                (sum, cat) => sum + (cat.product_count || 0),
                0
              )}
            </p>
          </div>
        </div>

        {/* Lista de categorías */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Categoría
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
                {categoriasPagina.map((categoria, index) => {
                  const numeroFila =
                    (paginaActual - 1) * elementosPorPagina + index + 1;

                  return (
                    <tr key={categoria.id} className="hover:bg-gray-50">
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {numeroFila}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="flex items-center">
                          <div className="shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Tag className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {categoria.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {categoria.id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {categoria.description || "Sin descripción"}
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                            (categoria.product_count || 0) > 0
                              ? "text-green-600"
                              : "text-gray-600"
                          }`}
                        >
                          {categoria.product_count || 0} productos
                        </span>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleEstado(categoria.id)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                            categoria.is_active
                              ? "text-green-600 hover:text-green-800"
                              : "text-red-600 hover:text-red-800"
                          }`}
                        >
                          {categoria.is_active ? (
                            <>
                              <FaToggleOn className="w-6 h-6" />
                              Activa
                            </>
                          ) : (
                            <>
                              <FaToggleOff className="w-6 h-6" />
                              Inactiva
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(categoria.created_at)}
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => editarCategoria(categoria)}
                            className="text-green-600 hover:text-green-900 p-1"
                            title="Editar categoría"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarCategoria(categoria.id)}
                            className={`p-1 ${
                              (categoria.product_count || 0) > 0
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-600 hover:text-red-900"
                            }`}
                            title={
                              (categoria.product_count || 0) > 0
                                ? "No se puede eliminar - Tiene productos asociados"
                                : "Eliminar categoría"
                            }
                            disabled={(categoria.product_count || 0) > 0}
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
          {categoriasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron categorías
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {busqueda || filtroEstado !== "todas"
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "Comienza creando tu primera categoría."}
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
              categoriasFiltradas.length <= elementosPorPagina * paginaActual
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
