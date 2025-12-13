"use client";

import { useState, useEffect } from "react";
import {
  obtenerReservacionesClienteConImagenes,
  type ReservacionAgrupada,
} from "@/app/actions/reservaciones";
import { FaCalendar } from "react-icons/fa";
import DotWaveLoader from "./loaders/dotWaveLoader";
import RingLoader from "./loaders/ringLoader";

// Tipos
type ReservationStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "on_the_way"
  | "completed"
  | "cancelled"
  | "no_show";

interface ReservationTrackingProps {
  userId: string;
}

export default function ReservationTracking({
  userId,
}: ReservationTrackingProps) {
  const [reservations, setReservations] = useState<ReservacionAgrupada[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReservations = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const { data, error } = await obtenerReservacionesClienteConImagenes(
          userId
        );

        if (error) {
          console.error("Error loading reservations:", error);
          setReservations([]);
        } else {
          setReservations((data as ReservacionAgrupada[]) || []);
        }
      } catch (error) {
        console.error("Error in loadReservations:", error);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [userId]);

  const getStatusSteps = (currentStatus: ReservationStatus) => {
    const steps = [
      { name: "pending" as ReservationStatus, label: "Pendiente" },
      { name: "confirmed" as ReservationStatus, label: "Confirmado" },
      { name: "preparing" as ReservationStatus, label: "En preparación" },
      { name: "on_the_way" as ReservationStatus, label: "En camino" },
      { name: "completed" as ReservationStatus, label: "Completado" },
    ];

    const stepsCount = steps.length;
    const currentIndex = steps.findIndex((step) => step.name === currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentIndex,
      current: index === currentIndex,
    }));
  };

  const getStatusLabel = (status: ReservationStatus) => {
    const labels: Record<ReservationStatus, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      preparing: "En preparación",
      on_the_way: "En camino",
      completed: "Completado",
      cancelled: "Cancelado",
      no_show: "No se presentó",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: ReservationStatus) => {
    const colors: Record<ReservationStatus, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      on_the_way: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      no_show: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // HH:MM
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
        <p className="text-gray-500">
          Cargando Seguimiento de Reservaciones...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-blue-600">
        Seguimiento de Reservaciones
      </h2>

      {reservations.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No tienes reservaciones aún.</p>
          <button
            onClick={() => (window.location.href = "/reservaciones")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Hacer mi primera reservación
          </button>
        </div>
      ) : (
        reservations.map((reservation) => {
          const totalAmount = reservation.items.reduce(
            (sum, item) => sum + item.total_amount,
            0
          );

          return (
            <div
              key={reservation.id}
              className="bg-white rounded-lg shadow border p-6"
            >
              {/* Header de la reservación */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">
                    Reservación #{reservation.id.slice(-8)}
                  </h3>
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <FaCalendar className="text-amber-500 mb-1" />{" "}
                    {formatDate(reservation.reservation_date)} a las{" "}
                    {formatTime(reservation.reservation_time)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Creada el{" "}
                    {new Date(reservation.created_at).toLocaleDateString(
                      "es-ES"
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">S/. {totalAmount.toFixed(2)}</p>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                      reservation.status as ReservationStatus
                    )}`}
                  >
                    {getStatusLabel(reservation.status as ReservationStatus)}
                  </span>
                </div>
              </div>

              {/* Barra de progreso */}
              {reservation.status !== "cancelled" &&
                reservation.status !== "no_show" && (
                  <div className="mb-6">
                    <div className="flex justify-between mb-2">
                      {getStatusSteps(
                        reservation.status as ReservationStatus
                      ).map((step) => (
                        <div
                          key={step.name}
                          className={`text-xs text-center ${
                            step.completed || step.current
                              ? "text-blue-600 font-medium"
                              : "text-gray-400"
                          }`}
                          style={{
                            width: `${
                              100 /
                              getStatusSteps(
                                reservation.status as ReservationStatus
                              ).length
                            }%`,
                          }}
                        >
                          {step.label}
                        </div>
                      ))}
                    </div>
                    <div className="relative flex justify-center items-center left-18">
                      {getStatusSteps(
                        reservation.status as ReservationStatus
                      ).map((step, index, array) => (
                        <div
                          key={step.name}
                          className="flex items-center w-full"
                        >
                          <div
                            className={`w-3 h-3 rounded-full z-10 ${
                              step.completed ? "bg-blue-600" : "bg-gray-300"
                            } ${
                              step.current
                                ? "ring-2 ring-blue-600 bg-indigo-600"
                                : "bg-blue-800"
                            }`}
                          />
                          {index < array.length - 1 && (
                            <div
                              className={`w-full h-1 ${
                                step.completed ? "bg-blue-600" : "bg-gray-300"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Productos de la reservación */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">
                  Productos ({reservation.items.length}):
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800 text-white">
                      <tr>
                        <th className="px-3 py-2 font-medium">Producto</th>
                        <th className="px-3 py-2 font-medium">Tamaño</th>
                        <th className="px-3 py-2 font-medium text-center">
                          Cant.
                        </th>
                        <th className="px-3 py-2 font-medium text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {reservation.items.map((item, itemIndex) => (
                        <tr
                          key={itemIndex}
                          className="bg-white hover:bg-gray-50"
                        >
                          <td className="px-3 py-2">
                            <div className="font-medium text-gray-900">
                              {item.product?.name || "Producto"}
                            </div>
                            {item.special_requests && (
                              <div className="text-xs text-gray-500 mt-1">
                                <strong>Notas:</strong> {item.special_requests}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {item.size_id ? `ID ${item.size_id}` : "Único"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {item.quantity}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-blue-600">
                            S/. {item.total_amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t border-gray-200">
                      <tr>
                        <td
                          colSpan={3}
                          className="px-3 py-2 text-right font-bold"
                        >
                          Total:
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-blue-600">
                          S/.{" "}
                          {reservation.items
                            .reduce((sum, item) => sum + item.total_amount, 0)
                            .toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Información adicional de items */}
              {reservation.items.some((item) => item.special_requests) && (
                <div className="border-t pt-4 mt-4">
                  {reservation.items.map(
                    (item, itemIndex) =>
                      item.special_requests && (
                        <div
                          key={itemIndex}
                          className="mb-2 p-3 bg-blue-50 rounded-lg text-sm"
                        >
                          <span className="font-medium text-blue-800">
                            {item.product?.name} - Solicitudes especiales:{" "}
                          </span>
                          <span className="text-gray-700">
                            {item.special_requests}
                          </span>
                        </div>
                      )
                  )}
                </div>
              )}

              {/* Mensaje de estado cancelado */}
              {reservation.status === "cancelled" && (
                <div className="border-t pt-4 mt-4">
                  <div className="p-3 bg-red-50 rounded-lg text-sm text-red-800">
                    ⚠️ Esta reservación ha sido cancelada.
                  </div>
                </div>
              )}

              {/* Mensaje de no show */}
              {reservation.status === "no_show" && (
                <div className="border-t pt-4 mt-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-800">
                    ℹ️ No se presentó a esta reservación.
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
