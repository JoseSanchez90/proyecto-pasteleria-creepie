"use client";

import { useState, useEffect } from "react";
import { Search, User, Edit, Eye, Truck, Trash, X } from "lucide-react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import {
  obtenerPedidos,
  actualizarEstadoPedido,
  actualizarEstadoPago,
  type PedidoCompleto,
} from "@/app/actions/pedidos";
import { FaTruck } from "react-icons/fa";
import { BsCake2Fill } from "react-icons/bs";
import { FaSquareWhatsapp } from "react-icons/fa6";
import RingLoader from "@/components/loaders/ringLoader";
import { formatPrice } from "@/lib/format";
import { useNotyf } from "@/app/providers/NotyfProvider";

export default function OrdersPage() {
  const notyf = useNotyf();
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPago, setFiltroPago] = useState("todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const [selectedPedido, setSelectedPedido] = useState<PedidoCompleto | null>(
    null
  );
  const elementosPorPagina = 3;

  // Cargar pedidos al montar el componente
  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await obtenerPedidos();

      if (error) {
        notyf?.error(error);
      }

      setPedidos(data || []);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al cargar pedidos"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filtrar pedidos
  const pedidosFiltrados = pedidos.filter((pedido) => {
    const coincideBusqueda =
      pedido.id.toLowerCase().includes(busqueda.toLowerCase()) ||
      pedido.customer?.first_name
        ?.toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      pedido.customer?.last_name
        ?.toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      pedido.customer?.email?.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "todos" || pedido.status === filtroEstado;
    const coincidePago =
      filtroPago === "todos" || pedido.payment_status === filtroPago;

    return coincideBusqueda && coincideEstado && coincidePago;
  });

  const estados = [
    "todos",
    "pending",
    "confirmed",
    "preparing",
    "on_the_way",
    "completed",
    "cancelled",
  ];
  const estadosPago = ["todos", "pending", "paid", "failed", "refunded"];

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await actualizarEstadoPedido(id, nuevoEstado as any);

      if (error) {
        notyf?.error(error);
      }

      // Actualizar estado local
      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.id === id ? { ...pedido, status: nuevoEstado as any } : pedido
        )
      );
    } catch (err) {
      console.error("Error cambiando estado:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al cambiar estado"
      );
    }
  };

  // Calcular índices para la paginación
  const indiceInicial = (paginaActual - 1) * elementosPorPagina;
  const indiceFinal = indiceInicial + elementosPorPagina;
  const pedidosPagina = pedidosFiltrados.slice(indiceInicial, indiceFinal);

  // Calcular total de páginas
  const totalPaginas = Math.ceil(pedidosFiltrados.length / elementosPorPagina);

  const cambiarEstadoPago = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await actualizarEstadoPago(id, nuevoEstado as any);

      if (error) {
        notyf?.error(error);
      }

      // Actualizar estado local
      setPedidos((prev) =>
        prev.map((pedido) =>
          pedido.id === id
            ? { ...pedido, payment_status: nuevoEstado as any }
            : pedido
        )
      );
    } catch (err) {
      console.error("Error cambiando estado de pago:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al cambiar estado de pago"
      );
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerBadgeEstado = (estado: string) => {
    const estilos = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      on_the_way: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const textos = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      on_the_way: "En camino",
      completed: "Completado",
      cancelled: "Cancelado",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          estilos[estado as keyof typeof estilos] || "bg-gray-100 text-gray-800"
        }`}
      >
        {textos[estado as keyof typeof textos] || estado}
      </span>
    );
  };

  const obtenerBadgePago = (estado: string) => {
    const estilos = {
      pending: "bg-yellow-100 text-yellow-800",
      paid: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };

    const textos = {
      pending: "Pendiente",
      paid: "Pagado",
      failed: "Fallido",
      refunded: "Reembolsado",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          estilos[estado as keyof typeof estilos] || "bg-gray-100 text-gray-800"
        }`}
      >
        {textos[estado as keyof typeof textos] || estado}
      </span>
    );
  };

  const obtenerMetodoPago = (metodo: string) => {
    const metodos = {
      card: "Tarjeta",
      cash: "Efectivo",
      transfer: "Transferencia",
      "": "No especificado",
    };

    return metodos[metodo as keyof typeof metodos] || metodo;
  };

  const handleVerDetalles = (id: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (pedido) {
      setSelectedPedido(pedido);
    }
  };

  const handleEditarPedido = (id: string) => {
    router.push(`/dashboard/pedidos/editar/${id}`);
  };

  // Calcular ingresos de hoy
  const calcularIngresosHoy = () => {
    const hoy = new Date().toISOString().split("T")[0];
    return pedidos
      .filter(
        (pedido) =>
          pedido.created_at.split("T")[0] === hoy &&
          pedido.payment_status === "paid"
      )
      .reduce((sum, pedido) => sum + pedido.total_amount, 0);
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
        <p className="text-gray-500">Cargando Pedidos...</p>
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
            onClick={cargarPedidos}
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
              Gestión de Pedidos
            </h1>
            <p className="text-sm 2xl:text-base text-gray-600">
              Administra los pedidos de tu pastelería
            </p>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID, cliente o email..."
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
              {estados.map((estado) => (
                <option key={estado} value={estado}>
                  {estado === "todos"
                    ? "Todos los estados"
                    : estado === "pending"
                    ? "Pendientes"
                    : estado === "confirmed"
                    ? "Confirmados"
                    : estado === "preparing"
                    ? "En preparación"
                    : estado === "on_the_way"
                    ? "En camino"
                    : estado === "completed"
                    ? "Completados"
                    : "Cancelados"}
                </option>
              ))}
            </select>

            {/* Filtro por estado de pago */}
            <select
              value={filtroPago}
              onChange={(e) => setFiltroPago(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {estadosPago.map((estado) => (
                <option key={estado} value={estado}>
                  {estado === "todos"
                    ? "Todos los pagos"
                    : estado === "pending"
                    ? "Pagos pendientes"
                    : estado === "paid"
                    ? "Pagados"
                    : estado === "failed"
                    ? "Fallidos"
                    : "Reembolsados"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total Pedidos</p>
            <p className="text-xl 2xl:text-2xl font-bold text-gray-800">
              {pedidos.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-xl 2xl:text-2xl font-bold text-yellow-600">
              {pedidos.filter((p) => p.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Confirmados</p>
            <p className="text-xl 2xl:text-2xl font-bold text-blue-600">
              {pedidos.filter((p) => p.status === "confirmed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Preparando</p>
            <p className="text-xl 2xl:text-2xl font-bold text-orange-600">
              {pedidos.filter((p) => p.status === "preparing").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">En camino</p>
            <p className="text-xl 2xl:text-2xl font-bold text-purple-600">
              {pedidos.filter((p) => p.status === "on_the_way").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Completados</p>
            <p className="text-xl 2xl:text-2xl font-bold text-green-600">
              {pedidos.filter((p) => p.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Pagados</p>
            <p className="text-xl 2xl:text-2xl font-bold text-green-600">
              {pedidos.filter((p) => p.payment_status === "paid").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Ingresos Hoy</p>
            <p className="text-xl 2xl:text-2xl font-bold text-purple-600">
              {formatPrice(calcularIngresosHoy())}
            </p>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Pedido
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Metodo de Pago
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Pago
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pedidosPagina.map((pedido, index) => {
                  const numeroFila =
                    (paginaActual - 1) * elementosPorPagina + index + 1;

                  return (
                    <tr key={pedido.id} className="hover:bg-gray-50">
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {numeroFila}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="flex items-center">
                          <div className="shrink-0 h-12 w-12 2xl:h-14 2xl:w-14 bg-black rounded-lg flex items-center justify-center">
                            <BsCake2Fill className="w-6 h-6 2xl:w-8 2xl:h-8 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Pedido #{pedido.id.slice(-6).toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pedido.items?.reduce(
                                (total, item) => total + item.quantity,
                                0
                              ) || 0}{" "}
                              producto(s)
                            </div>
                            {pedido.items && pedido.items.length > 0 && (
                              <div className="text-xs text-gray-400 mt-1 max-w-sm">
                                {pedido.items
                                  .map((item: any) => {
                                    // Obtener el nombre del producto de forma segura
                                    const productName = Array.isArray(
                                      item.product
                                    )
                                      ? item.product[0]?.name ||
                                        `Producto #${item.product_id.slice(-6)}`
                                      : item.product?.name ||
                                        `Producto #${item.product_id.slice(
                                          -6
                                        )}`;

                                    // Obtener el tamaño de forma segura
                                    let sizeName = null;
                                    if (item.size) {
                                      sizeName = Array.isArray(item.size)
                                        ? item.size[0]?.name
                                        : item.size.name;
                                    }

                                    return (
                                      <div key={item.id} className="truncate">
                                        {item.quantity}x {productName}
                                        {sizeName ? (
                                          <span className="text-gray-400 ml-1 rounded text-xs">
                                            = Tamaño: ({sizeName})
                                          </span>
                                        ) : (
                                          " = Tamaño único"
                                        )}
                                      </div>
                                    );
                                  })
                                  .slice(0, 2)}
                                {pedido.items.length > 2 && (
                                  <div className="text-gray-400">
                                    +{pedido.items.length - 2} más...
                                  </div>
                                )}
                              </div>
                            )}
                            {/* {pedido.estimated_delivery && (
                              <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <Truck className="w-3 h-3" />
                                Entrega:{" "}
                                {formatearFecha(pedido.estimated_delivery)}
                              </div>
                            )} */}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          {pedido.customer?.first_name}{" "}
                          {pedido.customer?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {pedido.customer?.email}
                        </div>
                        {pedido.customer?.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <FaSquareWhatsapp className="w-4 h-4 text-green-500" />{" "}
                            {pedido.customer.phone}
                          </div>
                        )}
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          {formatPrice(pedido.total_amount)}
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-500 mt-1">
                          {obtenerMetodoPago(pedido.payment_method)}
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <select
                          value={pedido.status}
                          onChange={(e) =>
                            cambiarEstado(pedido.id, e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmado</option>
                          <option value="preparing">Preparando</option>
                          <option value="on_the_way">En camino</option>
                          <option value="completed">Completado</option>
                          <option value="cancelled">Cancelado</option>
                        </select>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <select
                          value={pedido.payment_status}
                          onChange={(e) =>
                            cambiarEstadoPago(pedido.id, e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="paid">Pagado</option>
                          <option value="failed">Fallido</option>
                          <option value="refunded">Reembolsado</option>
                        </select>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatearFecha(pedido.created_at)}
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerDetalles(pedido.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditarPedido(pedido.id)}
                            className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                            title="Editar pedido"
                          >
                            <Edit className="w-4 h-4" />
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
          {pedidosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <FaTruck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron pedidos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {busqueda || filtroEstado !== "todos" || filtroPago !== "todos"
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "No hay pedidos registrados en el sistema."}
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
            disabled={pedidosFiltrados.length <= 3 * paginaActual}
            className="p-3 text-sm border bg-gray-800 hover:bg-gray-900 text-white rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RiArrowRightSLine className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Modal de Detalles del Pedido */}
      {selectedPedido && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Detalles del Pedido #
                    {selectedPedido.id.slice(-6).toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Realizado el {formatearFecha(selectedPedido.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPedido(null)}
                  className="hover:bg-gray-200 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Información del Cliente */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Cliente</p>
                    <p className="font-medium">
                      {selectedPedido.customer?.first_name}{" "}
                      {selectedPedido.customer?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">
                      {selectedPedido.customer?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Teléfono</p>
                    <p className="font-medium">
                      {selectedPedido.customer?.phone || "No registrado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Dirección de Entrega</p>
                    <p className="font-medium">{selectedPedido.address}</p>
                  </div>
                </div>
              </div>

              {/* Fecha de Entrega Estimada */}
              {selectedPedido.estimated_delivery && (
                <div className="bg-white rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        Fecha de Entrega Solicitada
                      </h3>
                      <p className="text-blue-700 font-medium">
                        {formatearFecha(selectedPedido.estimated_delivery)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Notas */}
              {selectedPedido.notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Notas del Cliente
                  </h3>
                  <div className="bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm border border-yellow-100">
                    {selectedPedido.notes}
                  </div>
                </div>
              )}

              {/* Lista de Productos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                  Productos ({selectedPedido.items?.length || 0})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-800 text-white">
                        <tr>
                          <th className="px-4 py-3 font-medium">Producto</th>
                          <th className="px-4 py-3 font-medium">Tamaño</th>
                          <th className="px-4 py-3 font-medium text-center">
                            Cant.
                          </th>
                          <th className="px-4 py-3 font-medium text-center">
                            Precio Unit.
                          </th>
                          <th className="px-4 py-3 font-medium text-center">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedPedido.items?.map((item) => {
                          // Helper para obtener tamaño de forma segura
                          let sizeName = "No especificado";
                          if (item.size) {
                            sizeName = Array.isArray(item.size)
                              ? item.size[0]?.name || "No especificado"
                              : item.size.name;
                          } else if (item.size_id) {
                            sizeName = item.size_id;
                          }

                          return (
                            <tr key={item.id} className="bg-white">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {/* Helper para obtener nombre del producto de forma segura */}
                                  {(Array.isArray(item.product)
                                    ? item.product[0]?.name
                                    : item.product?.name) ||
                                    "Producto sin nombre"}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.size_id ? sizeName : "Único"}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {formatPrice(item.unit_price)}
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                {formatPrice(item.subtotal)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-white border-t border-gray-300">
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-3 text-right font-bold"
                          >
                            Total del Pedido:
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">
                            {formatPrice(selectedPedido.total_amount)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
