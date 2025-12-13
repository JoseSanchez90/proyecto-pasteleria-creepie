"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Users,
  Edit,
  Check,
  X,
  Clock,
  AlertCircle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { getAllStaffAttendance } from "@/app/actions/attendance";
import { updateAttendanceRecord } from "@/app/actions/attendance";
import { getAllStaffWithSchedules } from "@/app/actions/work-schedules";
import DotWaveLoader from "@/components/loaders/dotWaveLoader";
import RingLoader from "@/components/loaders/ringLoader";

export default function ReportesAsistenciaPage() {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editModal, setEditModal] = useState(false);
  const [editValues, setEditValues] = useState({
    check_in: "",
    break_start: "",
    break_end: "",
    check_out: "",
  });

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    setLoading(true);

    const { data } = await getAllStaffAttendance(selectedMonth, selectedYear);
    setAttendanceData(data || []);

    const { data: staffData } = await getAllStaffWithSchedules();
    setStaff(staffData || []);

    setLoading(false);
  };

  const handleUpdateAttendanceRecord = async () => {
    if (!editingRecord) return;

    try {
      const updates: any = {};

      if (editValues.check_in) {
        const date = new Date(editingRecord.work_date);
        const [hours, minutes] = editValues.check_in.split(":");
        date.setHours(parseInt(hours), parseInt(minutes), 0);
        updates.check_in = date.toISOString();
      }

      if (editValues.break_start) {
        const date = new Date(editingRecord.work_date);
        const [hours, minutes] = editValues.break_start.split(":");
        date.setHours(parseInt(hours), parseInt(minutes), 0);
        updates.break_start = date.toISOString();
      }

      if (editValues.break_end) {
        const date = new Date(editingRecord.work_date);
        const [hours, minutes] = editValues.break_end.split(":");
        date.setHours(parseInt(hours), parseInt(minutes), 0);
        updates.break_end = date.toISOString();
      }

      if (editValues.check_out) {
        const date = new Date(editingRecord.work_date);
        const [hours, minutes] = editValues.check_out.split(":");
        date.setHours(parseInt(hours), parseInt(minutes), 0);
        updates.check_out = date.toISOString();
      }

      const result = await updateAttendanceRecord(
        editingRecord.id,
        updates
      );

      if (result?.error) {
        throw new Error(result.error);
      }

      // Recargar datos
      await loadData();
      setEditModal(false);
      setEditingRecord(null);
      alert("Registro actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando registro:", error);
      alert(
        "Error al actualizar el registro: " +
          (error instanceof Error ? error.message : "")
      );
    }
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setEditValues({
      check_in: record.check_in
        ? new Date(record.check_in).toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "",
      break_start: record.break_start
        ? new Date(record.break_start).toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "",
      break_end: record.break_end
        ? new Date(record.break_end).toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "",
      check_out: record.check_out
        ? new Date(record.check_out).toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "",
    });
    setEditModal(true);
  };

  // Agrupar asistencia por empleado
  const getStaffSummary = () => {
    const summary: any = {};

    attendanceData.forEach((record) => {
      const staffId = record.staff_id;
      if (!summary[staffId]) {
        summary[staffId] = {
          staff: record.staff,
          totalHours: 0,
          daysWorked: 0,
          records: [],
          incompleteRecords: 0,
        };
      }

      summary[staffId].totalHours += parseFloat(record.hours_worked || 0);
      summary[staffId].daysWorked += 1;

      // Contar registros incompletos
      if (!record.check_in || !record.break_start || !record.break_end || !record.check_out) {
        summary[staffId].incompleteRecords += 1;
      }

      summary[staffId].records.push(record);
    });

    return Object.values(summary).sort((a: any, b: any) =>
      (a.staff?.first_name || "").localeCompare(b.staff?.first_name || "")
    );
  };

  const staffSummary = getStaffSummary();
  const selectedStaffData: any =
    selectedStaff && staffSummary.find((s: any) => s.staff?.id === selectedStaff);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return { text: "-", isMissing: true };
    const date = new Date(timestamp);
    return {
      text: date.toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isMissing: false,
    };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      weekday: "short",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Empleado",
      "Fecha",
      "Entrada",
      "Refrigerio Inicio",
      "Refrigerio Fin",
      "Salida",
      "Horas Trabajadas",
    ];

    const rows = attendanceData.map((record) => [
      `${record.staff?.first_name} ${record.staff?.last_name}`,
      record.work_date,
      formatTime(record.check_in).text,
      formatTime(record.break_start).text,
      formatTime(record.break_end).text,
      formatTime(record.check_out).text,
      record.hours_worked || "0",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-asistencia-${selectedMonth}-${selectedYear}.csv`;
    a.click();
  };

  const months = [
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
    <div className="h-full flex flex-col md:flex-row">
      {/* Panel Lateral - Lista de Empleados (Modal en mobile) */}
      {selectedStaff === null ? (
        // Vista de selección de empleado (mobile y tablet)
        <div className="w-full md:w-72 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Empleados ({staffSummary.length})
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {selectedMonth && selectedYear && `${months[parseInt(selectedMonth) - 1]} ${selectedYear}`}
            </p>
          </div>

          <div className="p-2 md:p-3">
            {staffSummary.map((summary: any) => (
              <button
                key={summary.staff?.id}
                onClick={() => setSelectedStaff(summary.staff?.id)}
                className="w-full text-left p-3 md:p-3 rounded-lg mb-2 transition-all bg-gray-50 text-gray-900 hover:bg-indigo-100 hover:text-indigo-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {summary.staff?.first_name} {summary.staff?.last_name}
                    </p>
                    <p className="text-xs mt-1 text-gray-500">
                      {summary.daysWorked} días • {summary.totalHours.toFixed(1)}h
                    </p>
                  </div>
                  {summary.incompleteRecords > 0 && (
                    <div className="text-xs px-2 py-1 rounded ml-2 bg-yellow-100 text-yellow-800">
                      {summary.incompleteRecords}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        // Vista de detalles del empleado (mobile y desktop)
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 md:p-6 2xl:p-8">
            {/* Header con botón de regreso en mobile */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 md:mb-8 gap-3">
              <div className="">
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="mb-6 flex items-center gap-3 text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <p className="font-medium">Volver</p>
                </button>
                <h1 className="text-xl md:text-2xl 2xl:text-3xl font-bold text-gray-900">
                  {selectedStaffData?.staff?.first_name}{" "}
                  {selectedStaffData?.staff?.last_name}
                </h1>
                <p className="text-gray-500 text-xs md:text-sm mt-1">
                  {selectedStaffData?.staff?.email}
                </p>
              </div>
              <button
                onClick={exportToCSV}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>

            {/* Filtros */}
            <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200 mb-4 md:mb-6">
              <div className="flex gap-2 md:gap-4 items-end">
                <div className="w-full">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Mes
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={(index + 1).toString()}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {[2024, 2025, 2026].map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={loadData}
                  disabled={loading}
                  className="w-full md:w-auto px-3 md:px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? "..." : "Filtrar"}
                </button>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
                <p className="text-xs md:text-sm text-gray-500 mb-1">Días Trabajados</p>
                <p className="text-2xl md:text-3xl font-bold text-indigo-600">
                  {selectedStaffData?.daysWorked || 0}
                </p>
              </div>
              <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
                <p className="text-xs md:text-sm text-gray-500 mb-1">Horas Totales</p>
                <p className="text-2xl md:text-3xl font-bold text-green-600">
                  {selectedStaffData?.totalHours.toFixed(1) || 0}h
                </p>
              </div>
              <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
                <p className="text-xs md:text-sm text-gray-500 mb-1">Incompletos</p>
                <p
                  className={`text-2xl md:text-3xl font-bold ${
                    selectedStaffData?.incompleteRecords > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {selectedStaffData?.incompleteRecords || 0}
                </p>
              </div>
            </div>

            {/* Tabla de Registros */}
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-medium">
                        Fecha
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-medium">
                        Entrada
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-medium">
                        Refrigerio Inicio
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-medium">
                        Refrigerio Fin
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-medium">
                        Salida
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-medium">
                        Horas
                      </th>
                      <th className="px-2 md:px-4 py-2 md:py-3 text-left font-medium">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedStaffData?.records && selectedStaffData.records.map((record: any) => {
                      const checkIn = formatTime(record.check_in);
                      const breakStart = formatTime(record.break_start);
                      const breakEnd = formatTime(record.break_end);
                      const checkOut = formatTime(record.check_out);
                      const hasIncomplete =
                        checkIn.isMissing ||
                        breakStart.isMissing ||
                        breakEnd.isMissing ||
                        checkOut.isMissing;

                      return (
                        <tr
                          key={record.id}
                          className={`hover:bg-white ${
                            hasIncomplete ? "bg-yellow-50" : ""
                          }`}
                        >
                          <td className="px-2 md:px-4 py-2 md:py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400 hidden sm:inline" />
                              {formatDate(record.work_date)}
                            </div>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3">
                            <span
                              className={
                                checkIn.isMissing
                                  ? "text-red-600 font-semibold"
                                  : "text-gray-900"
                              }
                            >
                              {checkIn.isMissing && (
                                <AlertCircle className="w-3 h-3 inline mr-1 text-red-600" />
                              )}
                              {checkIn.text}
                            </span>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3">
                            <span
                              className={
                                breakStart.isMissing
                                  ? "text-red-600 font-semibold"
                                  : "text-gray-900"
                              }
                            >
                              {breakStart.isMissing && (
                                <AlertCircle className="w-3 h-3 inline mr-1 text-red-600" />
                              )}
                              {breakStart.text}
                            </span>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3">
                            <span
                              className={
                                breakEnd.isMissing
                                  ? "text-red-600 font-semibold"
                                  : "text-gray-900"
                              }
                            >
                              {breakEnd.isMissing && (
                                <AlertCircle className="w-3 h-3 inline mr-1 text-red-600" />
                              )}
                              {breakEnd.text}
                            </span>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3">
                            <span
                              className={
                                checkOut.isMissing
                                  ? "text-red-600 font-semibold"
                                  : "text-gray-900"
                              }
                            >
                              {checkOut.isMissing && (
                                <AlertCircle className="w-3 h-3 inline mr-1 text-red-600" />
                              )}
                              {checkOut.text}
                            </span>
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3 font-semibold text-gray-900">
                            {record.hours_worked
                              ? parseFloat(record.hours_worked).toFixed(1)
                              : "-"}
                            h
                          </td>
                          <td className="px-2 md:px-4 py-2 md:py-3">
                            <button
                              onClick={() => openEditModal(record)}
                              className="inline-flex items-center gap-1 px-2 md:px-3 py-1.5 text-xs md:text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition whitespace-nowrap"
                            >
                              <Edit className="w-3 h-3" />
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {(!selectedStaffData?.records || selectedStaffData.records.length === 0) && (
                  <div className="text-center py-8 md:py-12 text-gray-500 text-sm">
                    No hay registros para este período
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editModal && editingRecord && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/80 flex items-end md:items-center justify-center z-50 p-0 md:p-4">
          <div className="bg-white rounded-t-lg md:rounded-lg max-w-md w-full max-h-[90vh] md:max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg md:rounded-t-none">
              <h2 className="text-lg font-bold text-gray-900">
                Editar Registro
              </h2>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {formatDate(editingRecord.work_date)}
              </p>
            </div>

            <div className="p-4 md:p-6 space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Entrada
                </label>
                <input
                  type="time"
                  value={editValues.check_in.split(" ")[0] || ""}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      check_in: e.target.value,
                    })
                  }
                  className="w-full px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Inicio de Refrigerio
                </label>
                <input
                  type="time"
                  value={editValues.break_start.split(" ")[0] || ""}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      break_start: e.target.value,
                    })
                  }
                  className="w-full px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Fin de Refrigerio
                </label>
                <input
                  type="time"
                  value={editValues.break_end.split(" ")[0] || ""}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      break_end: e.target.value,
                    })
                  }
                  className="w-full px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">
                  Salida
                </label>
                <input
                  type="time"
                  value={editValues.check_out.split(" ")[0] || ""}
                  onChange={(e) =>
                    setEditValues({
                      ...editValues,
                      check_out: e.target.value,
                    })
                  }
                  className="w-full px-2 md:px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-gray-200 flex gap-2 md:gap-3 justify-end sticky bottom-0 bg-white rounded-b-lg md:rounded-b-none">
              <button
                onClick={() => setEditModal(false)}
                className="flex-1 md:flex-none px-3 md:px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateAttendanceRecord}
                className="flex-1 md:flex-none px-3 md:px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
