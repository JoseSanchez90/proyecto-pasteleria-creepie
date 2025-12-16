"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, Package } from "lucide-react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  obtenerProductos,
  eliminarProducto,
  eliminarProductoPermanente,
  actualizarProducto,
  type ProductoConCategoria,
} from "@/app/actions/productos";
import { FaBan, FaToggleOff, FaToggleOn } from "react-icons/fa";
import RingLoader from "@/components/loaders/ringLoader";
import { useNotyf } from "@/app/providers/NotyfProvider";

export default function ProductosPage() {
  const [productos, setProductos] = useState<ProductoConCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const router = useRouter();
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 5;
  const notyf = useNotyf();

  // Cargar productos al montar el componente
  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await obtenerProductos();

      if (error) {
        throw new Error(error);
      }

      setProductos(data || []);
    } catch (err) {
      console.error("Error cargando productos:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar productos"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos
  const productosFiltrados = productos.filter((producto) => {
    const coincideBusqueda =
      producto.name.toLowerCase().includes(busqueda.toLowerCase()) ||
      producto.description.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria =
      filtroCategoria === "todas" ||
      producto.category?.name.toLowerCase() === filtroCategoria;
    const coincideEstado =
      filtroEstado === "todos" ||
      (filtroEstado === "activos" && producto.is_active) ||
      (filtroEstado === "inactivos" && !producto.is_active);

    return coincideBusqueda && coincideCategoria && coincideEstado;
  });

  // Calcular índices para la paginación
  const indiceInicial = (paginaActual - 1) * elementosPorPagina;
  const indiceFinal = indiceInicial + elementosPorPagina;
  const productosPagina = productosFiltrados.slice(indiceInicial, indiceFinal);

  // Calcular total de páginas
  const totalPaginas = Math.ceil(
    productosFiltrados.length / elementosPorPagina
  );

  // Obtener categorías únicas para el filtro
  const categoriasUnicas = [
    "todas",
    ...Array.from(
      new Set(
        productos
          .filter((p) => p.category?.name)
          .map((p) => p.category.name.toLowerCase())
      )
    ),
  ];

  const estados = ["todos", "activos", "inactivos"];

  const inhabilitarProductoHandler = async (id: string) => {
    try {
      const { error } = await eliminarProducto(id);

      if (error) {
        throw new Error(error);
      }

      // Actualizar lista local
      setProductos(productos.filter((p) => p.id !== id));
      notyf?.success("Producto inhabilitado");
    } catch (err) {
      console.error("Error inhabilitando producto:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al inhabilitar producto"
      );
    }
  };

  const eliminarProductoPermanenteHandler = async (id: string) => {
    try {
      const { error } = await eliminarProductoPermanente(id);

      if (error) {
        throw new Error(error);
      }
      // Actualizar lista local
      setProductos(productos.filter((p) => p.id !== id));
      notyf?.success("Producto eliminado permanentemente");
    } catch (err) {
      console.error("Error eliminando producto permanentemente:", err);
      notyf?.error(
        err instanceof Error
          ? err.message
          : "Error al eliminar producto permanentemente"
      );
    }
  };

  const toggleEstado = async (id: string) => {
    try {
      const producto = productos.find((p) => p.id === id);
      if (!producto) return;

      // Crear FormData para la actualización
      const formData = new FormData();
      formData.append("name", producto.name);
      formData.append("description", producto.description);
      formData.append("price", producto.price.toString());
      formData.append("offer_price", producto.offer_price?.toString() || "0");
      formData.append("is_offer", producto.is_offer.toString());
      formData.append("is_active", (!producto.is_active).toString());
      formData.append("stock", producto.stock.toString());
      formData.append("preparation_time", producto.preparation_time.toString());
      formData.append("category_id", producto.category_id);

      const { error } = await actualizarProducto(id, formData);

      if (error) {
        throw new Error(error);
      }

      // Actualizar estado local
      setProductos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
      );
    } catch (err) {
      console.error("Error cambiando estado:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al cambiar estado"
      );
    }
  };

  const nuevoProducto = () => {
    router.push("/dashboard/productos/nuevo");
  };

  const editarProducto = (id: string) => {
    router.push(`/dashboard/productos/${id}`);
  };

  const verProducto = (id: string) => {
    router.push(`/dashboard/productos/ver/${id}`);
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(precio);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE");
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 h-full">
        <RingLoader
          size="50"
          stroke="6"
          bgOpacity="0.1"
          speed="1.68"
          color="#3b82f6"
        />
        <p className="text-gray-500">Cargando Productos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarProductos}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-6">
          <div>
            <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
              Gestión de Productos
            </h1>
            <p className="text-sm 2xl:text-base text-gray-600">
              Administra los productos de tu pastelería
            </p>
          </div>

          <button
            onClick={nuevoProducto}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro por categoría */}
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categoriasUnicas.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria === "todas"
                    ? "Todas las categorías"
                    : categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </option>
              ))}
            </select>

            {/* Filtro por estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado === "todos"
                    ? "Todos los estados"
                    : estado.charAt(0).toUpperCase() + estado.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Productos</p>
            <p className="text-2xl font-bold text-gray-800">
              {productos.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Activos</p>
            <p className="text-2xl font-bold text-green-600">
              {productos.filter((p) => p.is_active).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">En Oferta</p>
            <p className="text-2xl font-bold text-orange-600">
              {productos.filter((p) => p.is_offer).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Sin Stock</p>
            <p className="text-2xl font-bold text-red-600">
              {productos.filter((p) => p.stock === 0).length}
            </p>
          </div>
        </div>

        {/* Tabla de productos */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 2xl:px-6 py-2 2xl:py-3 text-left text-xs font-medium uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-4 2xl:px-6 py-2 2xl:py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 2xl:px-6 py-2 2xl:py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-4 2xl:px-6 py-2 2xl:py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th className="px-4 2xl:px-6 py-2 2xl:py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-4 2xl:px-6 py-2 2xl:py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-4 2xl:px-6 py-2 2xl:py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 2xl:px-6 py-2 2xl:py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Creado
                  </th>
                  <th className="px-4 2xl:px-6 py-2 2xl:py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {productosPagina.map((producto, index) => {
                  const numeroFila =
                    (paginaActual - 1) * elementosPorPagina + index + 1;
                  return (
                    <tr key={producto.id} className="hover:bg-gray-50">
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {numeroFila}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="flex items-center">
                          <div className="shrink-0 h-12 w-12 bg-gray-100 rounded-lg overflow-hidden relative">
                            {producto.images && producto.images.length > 0 ? (
                              <Image
                                src={
                                  producto.images.sort(
                                    (a, b) => a.image_order - b.image_order
                                  )[0].image_url
                                }
                                alt={producto.name}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="w-48 2xl:w-full pl-4">
                            <div className="text-sm font-medium text-gray-900">
                              {producto.name}
                            </div>
                            <div className="text-xs 2xl:text-sm text-gray-500 whitespace-normal">
                              {producto.description}
                            </div>
                            {producto.is_offer && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-lg">
                                En oferta
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap overflow-hidden">
                        <span className="text-sm text-blue-600">
                          {producto.category?.name || "Sin categoría"}
                        </span>
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap overflow-hidden">
                        {producto.available_sizes &&
                        producto.available_sizes.length > 0 ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {producto.available_sizes.length}{" "}
                              {producto.available_sizes.length === 1
                                ? "tamaño"
                                : "tamaños"}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {producto.available_sizes
                                .map((opt) => opt.size.name)
                                .join(", ")}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            Sin tamaños
                          </span>
                        )}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap overflow-hidden">
                        <div className="text-sm text-gray-900">
                          {formatearPrecio(producto.price)}
                        </div>
                        {producto.is_offer &&
                          producto.offer_price &&
                          producto.offer_price > 0 && (
                            <div className="text-sm text-green-600">
                              Oferta: {formatearPrecio(producto.offer_price)}
                            </div>
                          )}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap overflow-hidden">
                        <span
                          className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full ${
                            producto.stock > 10
                              ? "text-blue-600"
                              : producto.stock > 0
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {producto.stock} und
                        </span>
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap overflow-hidden">
                        <button
                          onClick={() => toggleEstado(producto.id)}
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                            producto.is_active
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {producto.is_active ? (
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
                        {formatearFecha(producto.created_at)}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {/* <button
                            onClick={() => verProducto(producto.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                            title="Ver producto"
                          >
                            <Eye className="w-4 h-4 2xl:w-5 2xl:h-5" />
                          </button> */}
                          <button
                            onClick={() => editarProducto(producto.id)}
                            className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit className="w-4 h-4 2xl:w-5 2xl:h-5" />
                          </button>
                          <button
                            onClick={() =>
                              inhabilitarProductoHandler(producto.id)
                            }
                            className="text-orange-600 hover:text-orange-900 p-1 cursor-pointer"
                            title="Inhabilitar producto"
                          >
                            <FaBan className="w-4 h-4 2xl:w-5 2xl:h-5" />
                          </button>
                          <button
                            onClick={() =>
                              eliminarProductoPermanenteHandler(producto.id)
                            }
                            className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 className="w-4 h-4 2xl:w-5 2xl:h-5" />
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
          {productosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron productos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {busqueda ||
                filtroCategoria !== "todas" ||
                filtroEstado !== "todos"
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "Comienza creando tu primer producto."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Paginación (placeholder) */}
      <div className="flex items-center justify-between mt-6 pb-4">
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
            className="p-2 2xl:p-3 text-sm border bg-gray-800 hover:bg-gray-900 text-white rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RiArrowLeftSLine className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => setPaginaActual(paginaActual + 1)}
            disabled={
              productosFiltrados.length <= elementosPorPagina * paginaActual
            }
            className="p-2 2xl:p-3 text-sm border bg-gray-800 hover:bg-gray-900 text-white rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RiArrowRightSLine className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
