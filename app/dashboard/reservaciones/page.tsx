"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Calendar,
  Clock,
  User,
  Phone,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
} from "lucide-react";
import {
  obtenerReservaciones,
  actualizarEstadoReservacion,
  eliminarReservacion,
  type ReservacionAgrupada,
} from "@/app/actions/reservaciones";
import { createClient } from "@/utils/supabase/client";
import { PiCookingPotFill } from "react-icons/pi";
import { ImTruck } from "react-icons/im";
import { FaFileCircleCheck } from "react-icons/fa6";
import RingLoader from "@/components/loaders/ringLoader";
import { useNotyf } from "@/app/providers/NotyfProvider";

export default function ReservationsPage() {
  const notyf = useNotyf();
  const [reservaciones, setReservaciones] = useState<ReservacionAgrupada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroFecha, setFiltroFecha] = useState("todas");
  const [paginaActual, setPaginaActual] = useState(1);
  const [selectedReservacion, setSelectedReservacion] =
    useState<ReservacionAgrupada | null>(null);
  const elementosPorPagina = 3;

  // Cargar reservaciones al montar el componente
  useEffect(() => {
    cargarReservaciones();

    // Suscribirse a cambios en tiempo real
    const supabase = createClient();
    const channel = supabase
      .channel("reservations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
        },
        (payload) => {
          console.log("Cambio detectado en reservaciones:", payload);
          notyf?.success("Reservación actualizada exitosamente");
          cargarReservaciones(); // Recargar datos
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const cargarReservaciones = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await obtenerReservaciones();

      if (error) {
        throw new Error(error);
      }

      setReservaciones(data || []);
    } catch (err) {
      console.error("Error cargando reservaciones:", err);
      notyf?.error("Error al cargar reservaciones");
      setError(
        err instanceof Error ? err.message : "Error al cargar reservaciones"
      );
    } finally {
      setLoading(false);
    }
  };

  // Filtrar reservaciones
  const reservacionesFiltradas = reservaciones.filter((reservacion) => {
    const productoNombres = reservacion.items
      .map((item) => item.product.name.toLowerCase())
      .join(" ");

    const coincideBusqueda =
      reservacion.customer?.first_name
        .toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      reservacion.customer?.last_name
        .toLowerCase()
        .includes(busqueda.toLowerCase()) ||
      productoNombres.includes(busqueda.toLowerCase()) ||
      reservacion.customer?.email
        .toLowerCase()
        .includes(busqueda.toLowerCase());

    const coincideEstado =
      filtroEstado === "todos" || reservacion.status === filtroEstado;

    const coincideFecha =
      filtroFecha === "todas" ||
      (filtroFecha === "hoy" &&
        reservacion.reservation_date ===
          new Date().toISOString().split("T")[0]) ||
      (filtroFecha === "futuras" &&
        reservacion.reservation_date >=
          new Date().toISOString().split("T")[0]) ||
      (filtroFecha === "pasadas" &&
        reservacion.reservation_date < new Date().toISOString().split("T")[0]);

    return coincideBusqueda && coincideEstado && coincideFecha;
  });

  // Calcular índices para la paginación
  const indiceInicial = (paginaActual - 1) * elementosPorPagina;
  const indiceFinal = indiceInicial + elementosPorPagina;
  const reservacionesPagina = reservacionesFiltradas.slice(
    indiceInicial,
    indiceFinal
  );

  // Calcular total de páginas
  const totalPaginas = Math.ceil(
    reservacionesFiltradas.length / elementosPorPagina
  );

  const estados = [
    "todos",
    "pending",
    "confirmed",
    "preparing",
    "on_the_way",
    "completed",
    "cancelled",
  ];
  const fechas = ["todas", "hoy", "futuras", "pasadas"];

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const { error } = await actualizarEstadoReservacion(
        id,
        nuevoEstado as any
      );

      if (error) {
        throw new Error(error);
      }

      // Recargar reservaciones para mostrar cambios
      await cargarReservaciones();
      console.log("Estado actualizado exitosamente");
      notyf?.success("Estado actualizado exitosamente");
    } catch (err) {
      console.error("Error cambiando estado:", err);
      notyf?.error("Error al cambiar estado");
      console.log(
        err instanceof Error ? err.message : "Error al cambiar estado"
      );
    }
  };

  const handleEliminarReservacion = async (id: string) => {
    try {
      const { error } = await eliminarReservacion(id);

      if (error) {
        throw new Error(error);
      }

      // Recargar reservaciones para reflejar cambios
      await cargarReservaciones();
      console.log("Reservación eliminada exitosamente");
      notyf?.success("Reservación eliminada exitosamente");
    } catch (err) {
      console.error("Error eliminando reservación:", err);
      notyf?.error("Error al eliminar reservación");
    }
  };

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(precio);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(`${fecha}T00:00:00-05:00`).toLocaleDateString("es-PE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatearHora = (hora: string) => {
    if (!hora) return "No especificada";

    // Si la hora ya tiene formato HH:MM, usarla directamente
    // Si tiene formato HH:MM:SS, también funciona
    const timeString = hora.includes(":") ? hora : `${hora}:00`;

    // Crear fecha con la hora
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes), 0);

    return date.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerBadgeEstado = (estado: string) => {
    const estilos = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      preparing: "bg-orange-100 text-orange-800",
      on_the_way: "bg-indigo-100 text-indigo-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const textos = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      completed: "Completada",
      preparing: "En preparación",
      on_the_way: "En camino",
      cancelled: "Cancelada",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          estilos[estado as keyof typeof estilos]
        }`}
      >
        {textos[estado as keyof typeof textos]}
      </span>
    );
  };

  const esHoy = (fecha: string) => {
    const hoy = new Date();
    const fechaReserva = new Date(fecha + "T00:00:00-05:00");

    return (
      fechaReserva.getDate() === hoy.getDate() &&
      fechaReserva.getMonth() === hoy.getMonth() &&
      fechaReserva.getFullYear() === hoy.getFullYear()
    );
  };

  const esFutura = (fecha: string) => {
    return fecha > new Date().toISOString().split("T")[0];
  };

  const diferenciaDias = (fecha: string) => {
    const fechaReserva = new Date(fecha + "T00:00:00-05:00");
    const hoy = new Date();
    const diferencia = fechaReserva.getTime() - hoy.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
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
        <p className="text-gray-500">Cargando Reservaciones...</p>
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
            onClick={cargarReservaciones}
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
              Gestión de Reservaciones
            </h1>
            <p className="text-sm 2xl:text-base text-gray-600">
              Administra las reservaciones de productos
            </p>
          </div>

          {/* <div className="mt-4 sm:mt-0 text-sm text-gray-500">
            Total: {reservaciones.length} reservaciones
          </div> */}
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente o producto..."
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
                    ? "Confirmadas"
                    : estado === "completed"
                    ? "Completadas"
                    : "Canceladas"}
                </option>
              ))}
            </select>

            {/* Filtro por fecha */}
            <select
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fechas.map((fecha) => (
                <option key={fecha} value={fecha}>
                  {fecha === "todas"
                    ? "Todas las fechas"
                    : fecha === "hoy"
                    ? "Hoy"
                    : fecha === "futuras"
                    ? "Futuras"
                    : "Pasadas"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-800">
              {reservaciones.length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Para Hoy</p>
            <p className="text-2xl font-bold text-blue-600">
              {reservaciones.filter((r) => esHoy(r.reservation_date)).length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-600">
              {reservaciones.filter((r) => r.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Confirmadas</p>
            <p className="text-2xl font-bold text-green-600">
              {reservaciones.filter((r) => r.status === "confirmed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Preparando</p>
            <p className="text-2xl font-bold text-pink-600">
              {reservaciones.filter((r) => r.status === "preparing").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">En Camino</p>
            <p className="text-2xl font-bold text-orange-500">
              {reservaciones.filter((r) => r.status === "on_the_way").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Completadas</p>
            <p className="text-2xl font-bold text-purple-600">
              {reservaciones.filter((r) => r.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Canceladas</p>
            <p className="text-2xl font-bold text-red-600">
              {reservaciones.filter((r) => r.status === "cancelled").length}
            </p>
          </div>
        </div>

        {/* Lista de reservaciones */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    N°
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Reservación
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Fecha y Hora
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservacionesPagina.map((reservacion, index) => {
                  const numeroFila =
                    (paginaActual - 1) * elementosPorPagina + index + 1;
                  const totalCantidad = reservacion.items.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  );
                  const totalAmount = reservacion.items.reduce(
                    (sum, item) => sum + item.total_amount,
                    0
                  );

                  return (
                    <tr key={reservacion.id} className="hover:bg-gray-50">
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {numeroFila}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="flex items-start">
                          <div className="rounded-lg flex items-center justify-center">
                            <Calendar
                              className={`w-5 h-5 mt-0.5 ${
                                esHoy(reservacion.reservation_date)
                                  ? "text-red-600"
                                  : esFutura(reservacion.reservation_date)
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              Reserva #{reservacion.id.slice(-6).toUpperCase()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {totalCantidad} unidad(es)
                            </div>
                            <div className="text-sm font-semibold text-gray-800">
                              {formatearPrecio(totalAmount)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          {reservacion.customer?.first_name}{" "}
                          {reservacion.customer?.last_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {reservacion.customer?.phone || "No especificado"}
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-xs">
                          {reservacion.customer?.email}
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="text-sm">
                          {reservacion.items.length === 1 ? (
                            <>
                              <div className="font-medium text-gray-900">
                                {reservacion.items[0].product.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Cant: {reservacion.items[0].quantity}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="font-medium text-gray-900">
                                {reservacion.items[0].product.name}
                              </div>
                              <div className="text-xs text-blue-600 font-medium">
                                +{reservacion.items.length - 1} producto
                                {reservacion.items.length - 1 !== 1
                                  ? "s"
                                  : ""}{" "}
                                más
                              </div>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        <div className="text-sm text-gray-900 flex items-start gap-1 mb-1">
                          <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p>{formatearFecha(reservacion.reservation_date)}</p>
                        </div>
                        <div className="text-sm text-gray-500 flex items-start gap-1">
                          <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                          <p>{formatearHora(reservacion.reservation_time)}</p>
                        </div>
                        {esHoy(reservacion.reservation_date) && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            ¡Para hoy!
                          </span>
                        )}
                        {esFutura(reservacion.reservation_date) && (
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-600 text-white rounded-lg">
                            {`¡Quedan ${diferenciaDias(
                              reservacion.reservation_date
                            )} días!`}
                          </span>
                        )}
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap">
                        <select
                          value={reservacion.status}
                          onChange={(e) =>
                            cambiarEstado(reservacion.id, e.target.value)
                          }
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="pending">Pendiente</option>
                          <option value="confirmed">Confirmada</option>
                          <option value="preparing">Preparando</option>
                          <option value="on_the_way">En camino</option>
                          <option value="completed">Completada</option>
                          <option value="cancelled">Cancelada</option>
                        </select>
                      </td>

                      <td className="px-4 2xl:px-6 py-3 2xl:py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {" "}
                          {reservacion.status === "pending" && (
                            <button
                              className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                              title="Confirmar reservación"
                              onClick={() =>
                                cambiarEstado(reservacion.id, "confirmed")
                              }
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {reservacion.status === "confirmed" && (
                            <button
                              className="text-fuchsia-600 hover:text-fuchsia-600 p-1 cursor-pointer"
                              title="Preparar reservación"
                              onClick={() =>
                                cambiarEstado(reservacion.id, "preparing")
                              }
                            >
                              <PiCookingPotFill className="w-5 h-5" />
                            </button>
                          )}
                          {reservacion.status === "preparing" && (
                            <button
                              className="text-green-600 hover:text-green-600 p-1 cursor-pointer"
                              title="En camino"
                              onClick={() =>
                                cambiarEstado(reservacion.id, "on_the_way")
                              }
                            >
                              <ImTruck className="w-5 h-5" />
                            </button>
                          )}
                          {reservacion.status === "on_the_way" && (
                            <button
                              className="text-blue-600 hover:text-blue-600 p-1 cursor-pointer"
                              title="Completado"
                              onClick={() =>
                                cambiarEstado(reservacion.id, "completed")
                              }
                            >
                              <FaFileCircleCheck className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedReservacion(reservacion)}
                            className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                            title="Ver detalles"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              handleEliminarReservacion(reservacion.id)
                            }
                            className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                            title="Cancelar reservación"
                          >
                            <Trash2 className="w-5 h-5" />
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
          {reservacionesFiltradas.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No se encontraron reservaciones
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {busqueda || filtroEstado !== "todos" || filtroFecha !== "todas"
                  ? "Intenta ajustar los filtros de búsqueda."
                  : "No hay reservaciones registradas en el sistema."}
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
            disabled={reservacionesFiltradas.length <= 3 * paginaActual}
            className="p-2 text-sm border bg-gray-800 hover:bg-gray-900 text-white rounded-full disabled:bg-gray-400 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal de Detalles de Reservación */}
      {selectedReservacion && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-100 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Detalles de Reservación
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Reserva #{selectedReservacion.id.slice(-6).toUpperCase()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReservacion(null)}
                  className="hover:bg-gray-200 p-2 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido del Modal */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  Información de la Reservación
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Fecha</p>
                    <p className="font-medium text-gray-900">
                      {formatearFecha(selectedReservacion.reservation_date)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Hora</p>
                    <p className="font-medium text-gray-900">
                      {formatearHora(selectedReservacion.reservation_time)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Estado</p>
                    <p className="font-medium text-gray-900">
                      {selectedReservacion.status === "pending"
                        ? "Pendiente"
                        : selectedReservacion.status === "confirmed"
                        ? "Confirmada"
                        : selectedReservacion.status === "preparing"
                        ? "Preparando"
                        : selectedReservacion.status === "on_the_way"
                        ? "En camino"
                        : selectedReservacion.status === "completed"
                        ? "Completada"
                        : "Cancelada"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-bold text-blue-600 text-lg">
                      {formatearPrecio(
                        selectedReservacion.items.reduce(
                          (sum, item) => sum + item.total_amount,
                          0
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información del Cliente */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                  Información del Cliente
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Nombre</p>
                    <p className="font-medium text-gray-900">
                      {selectedReservacion.customer?.first_name}{" "}
                      {selectedReservacion.customer?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium text-gray-900 wrap-break-word">
                      {selectedReservacion.customer?.email}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-gray-500">Teléfono</p>
                    <p className="font-medium text-gray-900">
                      {selectedReservacion.customer?.phone || "No registrado"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Productos */}
              <div className="border rounded-lg overflow-hidden mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="px-4 py-3 font-medium">Producto</th>
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
                      {selectedReservacion.items?.map((item) => {
                        return (
                          <tr key={item.id} className="bg-white">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {(Array.isArray(item.product)
                                  ? item.product[0]?.name
                                  : item.product?.name) ||
                                  "Producto sin nombre"}
                              </div>
                              {item.special_requests && (
                                <div className="text-xs text-gray-500 mt-1 bg-yellow-50 p-1 rounded">
                                  <strong>Notas:</strong>{" "}
                                  {item.special_requests}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatearPrecio(
                                item.total_amount / item.quantity || 0
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatearPrecio(item.total_amount)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-white border-t border-gray-300">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-right font-bold"
                        >
                          Total de Reservación:
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">
                          {formatearPrecio(
                            selectedReservacion.items.reduce(
                              (sum, item) => sum + item.total_amount,
                              0
                            )
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
