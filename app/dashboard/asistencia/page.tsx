"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar, TrendingUp, BarChart3, Award } from "lucide-react";
import {
  getTodayAttendance,
  getAttendanceByMonth,
} from "@/app/actions/attendance";
import { getStaffSchedule } from "@/app/actions/work-schedules";
import DotWaveLoader from "@/components/loaders/dotWaveLoader";

export default function MiAsistenciaPage() {
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [totalHours, setTotalHours] = useState(0);
  const [schedule, setSchedule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Estado para mes y año seleccionado
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const loadData = async () => {
    setLoading(true);

    // Cargar asistencia de hoy (solo si es el mes actual)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    if (selectedMonth === currentMonth && selectedYear === currentYear) {
      const { data: today } = await getTodayAttendance();
      setTodayAttendance(today);
    } else {
      setTodayAttendance(null);
    }

    // Cargar asistencia del mes seleccionado
    const { data: monthly, totalHours: hours } = await getAttendanceByMonth(
      selectedYear,
      selectedMonth
    );
    setMonthlyData(monthly || []);
    setTotalHours(hours || 0);

    // Cargar horario asignado (solo una vez)
    if (!schedule) {
      const { data: scheduleData } = await getStaffSchedule();
      setSchedule(scheduleData);
    }

    setLoading(false);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-PE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Calcular estadísticas adicionales
  const daysWorked = monthlyData.length;
  const completeDays = monthlyData.filter(
    (d) => d.check_in && d.check_out
  ).length;
  const avgHoursPerDay = daysWorked > 0 ? totalHours / daysWorked : 0;
  const targetHours = schedule?.schedule?.monthly_hours || 0;
  const remainingHours = Math.max(0, targetHours - totalHours);
  const progressPercentage =
    targetHours > 0 ? (totalHours / targetHours) * 100 : 0;

  const isCurrentMonth =
    selectedMonth === new Date().getMonth() + 1 &&
    selectedYear === new Date().getFullYear();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <DotWaveLoader size="80" speed="1.0" color="#3b82f6" />
          <p className="mt-4 text-gray-600">Cargando tu reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mi Reporte de Asistencia
          </h1>
          <p className="text-gray-600">
            Consulta tu historial y estadísticas personales
          </p>
        </div>

        {/* Selector de Mes/Año Moderno */}
        <div className="mb-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Período de Consulta
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Selector de Mes */}
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-10 py-2.5 cursor-pointer hover:bg-gray-100 transition"
                >
                  {monthNames.map((month, index) => (
                    <option key={index} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Selector de Año */}
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-10 py-2.5 cursor-pointer hover:bg-gray-100 transition"
                >
                  {Array.from(
                    { length: 5 },
                    (_, i) => new Date().getFullYear() - i
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              {/* Badge de mes actual */}
              {isCurrentMonth && (
                <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                  Mes actual
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Advertencia si no hay horario asignado */}
        {!schedule && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="shrink-0">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  No tienes un horario asignado
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Necesitas que un administrador te asigne un horario de
                  trabajo. Por favor, contacta con el administrador.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tarjetas de Estadísticas Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Horario Asignado */}
          <div className="bg-linear-to-br from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Tu Horario
            </h3>
            {schedule?.schedule ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-gray-700 text-base">
                  {schedule.schedule.name}
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-gray-500">Entrada</p>
                    <p className="font-semibold text-indigo-600">
                      {schedule.schedule.check_in_time}
                    </p>
                  </div>
                  <div className="bg-white p-2 rounded">
                    <p className="text-xs text-gray-500">Salida</p>
                    <p className="font-semibold text-indigo-600">
                      {schedule.schedule.check_out_time}
                    </p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-indigo-100">
                  <p className="text-gray-600">
                    <span className="font-medium">
                      {schedule.schedule.daily_hours}h
                    </span>{" "}
                    diarias
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">
                      {schedule.schedule.monthly_hours}h
                    </span>{" "}
                    mensuales
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No tienes horario asignado
              </p>
            )}
          </div>

          {/* Horas del Mes */}
          <div className="bg-linear-to-br from-green-50 to-white p-6 rounded-xl shadow-sm border border-green-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Horas Trabajadas
            </h3>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-gray-900">
                {totalHours.toFixed(1)}
                <span className="text-2xl text-gray-500">h</span>
              </p>
              {schedule?.schedule && (
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    Meta: {schedule.schedule.monthly_hours}h
                  </p>
                  <div className="mt-2 bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        progressPercentage >= 100
                          ? "bg-green-600"
                          : progressPercentage >= 75
                          ? "bg-blue-600"
                          : "bg-yellow-600"
                      }`}
                      style={{
                        width: `${Math.min(progressPercentage, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className="font-medium text-gray-700">
                      {progressPercentage.toFixed(0)}% completado
                    </span>
                    {progressPercentage >= 100 && (
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        ¡Meta cumplida!
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Asistencia de Hoy (solo si es mes actual) */}
          {isCurrentMonth ? (
            <div className="bg-linear-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Hoy
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Entrada:</span>
                  <span className="font-medium text-gray-900">
                    {formatTime(todayAttendance?.check_in)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Refrigerio:</span>
                  <span className="font-medium text-gray-900">
                    {formatTime(todayAttendance?.break_start)} -{" "}
                    {formatTime(todayAttendance?.break_end)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Salida:</span>
                  <span className="font-medium text-gray-900">
                    {formatTime(todayAttendance?.check_out)}
                  </span>
                </div>
                {todayAttendance?.hours_worked && (
                  <div className="flex justify-between pt-2 border-t border-blue-100">
                    <span className="text-gray-600">Horas:</span>
                    <span className="font-bold text-green-600">
                      {parseFloat(todayAttendance.hours_worked).toFixed(1)}h
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-linear-to-br from-purple-50 to-white p-6 rounded-xl shadow-sm border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Resumen del Mes
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Días trabajados</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {daysWorked}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Días completos</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {completeDays}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-purple-100">
                  <span className="text-sm text-gray-600">Promedio/día</span>
                  <span className="text-xl font-bold text-purple-600">
                    {avgHoursPerDay.toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estadísticas Detalladas */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Estadísticas Detalladas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-linear-to-br from-blue-50 to-blue-100 rounded-lg">
              <p className="text-3xl font-bold text-blue-900">{daysWorked}</p>
              <p className="text-sm text-blue-700 mt-1">Días trabajados</p>
            </div>
            <div className="text-center p-4 bg-linear-to-br from-green-50 to-green-100 rounded-lg">
              <p className="text-3xl font-bold text-green-900">
                {completeDays}
              </p>
              <p className="text-sm text-green-700 mt-1">Días completos</p>
            </div>
            <div className="text-center p-4 bg-linear-to-br from-purple-50 to-purple-100 rounded-lg">
              <p className="text-3xl font-bold text-purple-900">
                {avgHoursPerDay.toFixed(1)}h
              </p>
              <p className="text-sm text-purple-700 mt-1">Promedio diario</p>
            </div>
            <div className="text-center p-4 bg-linear-to-br from-orange-50 to-orange-100 rounded-lg">
              <p className="text-3xl font-bold text-orange-900">
                {remainingHours.toFixed(1)}h
              </p>
              <p className="text-sm text-orange-700 mt-1">Horas restantes</p>
            </div>
          </div>
        </div>

        {/* Historial del Mes */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Historial de {monthNames[selectedMonth - 1]}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Entrada
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Refrigerio
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Salida
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Horas
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p className="font-medium">
                        No hay registros de asistencia
                      </p>
                      <p className="text-sm">
                        en {monthNames[selectedMonth - 1]} {selectedYear}
                      </p>
                    </td>
                  </tr>
                ) : (
                  monthlyData.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {formatDate(record.work_date)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatTime(record.check_in)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {record.break_start
                          ? `${formatTime(record.break_start)} - ${formatTime(
                              record.break_end
                            )}`
                          : "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatTime(record.check_out)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span
                          className={`font-semibold px-2 py-1 rounded ${
                            record.hours_worked
                              ? "text-green-700 bg-green-50"
                              : "text-gray-400"
                          }`}
                        >
                          {record.hours_worked
                            ? `${parseFloat(record.hours_worked).toFixed(1)}h`
                            : "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
