"use client";

import { useState, useEffect } from "react";
import { Search, Clock, Coffee, LogIn, LogOut, Users } from "lucide-react";
import {
  getAllStaffWithTodayAttendance,
  markStaffCheckIn,
  markStaffBreakStart,
  markStaffBreakEnd,
  markStaffCheckOut,
} from "@/app/actions/attendance";
import DotWaveLoader from "@/components/loaders/dotWaveLoader";
import RingLoader from "@/components/loaders/ringLoader";

interface StaffMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  schedule: {
    name: string;
    check_in_time: string;
    check_out_time: string;
    daily_hours: number;
  } | null;
  today_attendance: {
    id: string;
    check_in: string | null;
    break_start: string | null;
    break_end: string | null;
    check_out: string | null;
    hours_worked: string | null;
  } | null;
}

export default function GestionAsistenciaPage() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadStaffData();
  }, []);

  useEffect(() => {
    // Filtrar staff por término de búsqueda
    if (searchTerm.trim() === "") {
      setFilteredStaff(staffList);
    } else {
      const filtered = staffList.filter((staff) => {
        const fullName = `${staff.first_name} ${staff.last_name}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
      setFilteredStaff(filtered);
    }
  }, [searchTerm, staffList]);

  const loadStaffData = async () => {
    setLoading(true);
    const { data, error } = await getAllStaffWithTodayAttendance();

    if (error) {
      setMessage({ type: "error", text: error });
    } else {
      setStaffList(data || []);
      setFilteredStaff(data || []);
    }
    setLoading(false);
  };

  const handleAction = async (
    staffId: string,
    action: "checkIn" | "breakStart" | "breakEnd" | "checkOut",
    staffName: string
  ) => {
    setActionLoading(staffId + action);
    setMessage(null);

    let result;
    switch (action) {
      case "checkIn":
        result = await markStaffCheckIn(staffId);
        break;
      case "breakStart":
        result = await markStaffBreakStart(staffId);
        break;
      case "breakEnd":
        result = await markStaffBreakEnd(staffId);
        break;
      case "checkOut":
        result = await markStaffCheckOut(staffId);
        break;
    }

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({
        type: "success",
        text: `${staffName}: ${result.message}`,
      });
      // Recargar datos
      await loadStaffData();
      // Limpiar búsqueda después de marcar asistencia
      setSearchTerm("");
    }

    setActionLoading(null);
    // Auto-ocultar mensaje después de 5 segundos
    setTimeout(() => setMessage(null), 5000);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAttendanceStatus = (staff: StaffMember) => {
    const attendance = staff.today_attendance;

    if (!attendance || !attendance.check_in) {
      return { status: "Sin marcar", color: "bg-gray-100 text-gray-700" };
    }

    if (attendance.check_out) {
      return { status: "Salida marcada", color: "bg-green-100 text-green-700" };
    }

    if (attendance.break_start && !attendance.break_end) {
      return {
        status: "En refrigerio",
        color: "bg-yellow-100 text-yellow-700",
      };
    }

    if (attendance.break_end) {
      return { status: "Trabajando", color: "bg-blue-100 text-blue-700" };
    }

    return { status: "Entrada marcada", color: "bg-blue-100 text-blue-700" };
  };

  const getAvailableActions = (staff: StaffMember) => {
    const attendance = staff.today_attendance;
    const actions = [];

    if (!attendance || !attendance.check_in) {
      actions.push({
        label: "Marcar Entrada",
        action: "checkIn" as const,
        icon: LogIn,
        color: "bg-green-600 hover:bg-green-700",
      });
    } else if (!attendance.check_out) {
      if (!attendance.break_start) {
        actions.push({
          label: "Iniciar Refrigerio",
          action: "breakStart" as const,
          icon: Coffee,
          color: "bg-yellow-600 hover:bg-yellow-700",
        });
      } else if (!attendance.break_end) {
        actions.push({
          label: "Fin Refrigerio",
          action: "breakEnd" as const,
          icon: Coffee,
          color: "bg-orange-600 hover:bg-orange-700",
        });
      }

      actions.push({
        label: "Marcar Salida",
        action: "checkOut" as const,
        icon: LogOut,
        color: "bg-red-600 hover:bg-red-700",
      });
    }

    return actions;
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
        <p className="text-gray-500">Cargando Asistencia...</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl 2xl:text-2xl font-bold text-gray-900 mb-2">
            Gestión de Asistencia
          </h1>
          <p className="text-sm 2xl:text-base text-gray-600">
            Estación compartida para que los trabajadores marquen su asistencia
          </p>
        </div>

        {/* Mensaje de feedback */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar trabajador por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-2 2xl:py-4 text-base 2xl:text-lg bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Trabajadores</p>
                <p className="text-2xl font-bold text-gray-900">
                  {staffList.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Presentes Hoy</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    staffList.filter(
                      (s) =>
                        s.today_attendance?.check_in &&
                        !s.today_attendance?.check_out
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <LogOut className="w-8 h-8 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Han Salido</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    staffList.filter((s) => s.today_attendance?.check_out)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de trabajadores */}
        <div className="space-y-4 pb-6">
          {filteredStaff.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-gray-200 text-center">
              <p className="text-gray-500">
                {searchTerm
                  ? "No se encontraron trabajadores con ese nombre"
                  : "No hay trabajadores registrados"}
              </p>
            </div>
          ) : (
            filteredStaff.map((staff) => {
              const statusInfo = getAttendanceStatus(staff);
              const actions = getAvailableActions(staff);

              return (
                <div
                  key={staff.id}
                  className="bg-white p-6 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Información del trabajador */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {staff.first_name} {staff.last_name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}
                        >
                          {statusInfo.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Horario:</span>{" "}
                          {staff.schedule
                            ? `${staff.schedule.check_in_time} - ${staff.schedule.check_out_time}`
                            : "Sin horario"}
                        </div>
                        <div>
                          <span className="font-medium">Entrada:</span>{" "}
                          {formatTime(staff.today_attendance?.check_in ?? null)}
                        </div>
                        <div>
                          <span className="font-medium">Refrigerio:</span>{" "}
                          {formatTime(
                            staff.today_attendance?.break_start ?? null
                          )}{" "}
                          -{" "}
                          {formatTime(
                            staff.today_attendance?.break_end ?? null
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Salida:</span>{" "}
                          {formatTime(
                            staff.today_attendance?.check_out ?? null
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2">
                      {actions.map((actionItem) => {
                        const Icon = actionItem.icon;
                        const isLoading =
                          actionLoading === staff.id + actionItem.action;

                        return (
                          <button
                            key={actionItem.action}
                            onClick={() =>
                              handleAction(
                                staff.id,
                                actionItem.action,
                                `${staff.first_name} ${staff.last_name}`
                              )
                            }
                            disabled={isLoading || !!actionLoading}
                            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${actionItem.color}`}
                          >
                            {isLoading ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando...</span>
                              </>
                            ) : (
                              <>
                                <Icon className="w-5 h-5" />
                                <span>{actionItem.label}</span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
