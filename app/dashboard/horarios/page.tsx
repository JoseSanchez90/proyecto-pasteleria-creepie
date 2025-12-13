"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Clock } from "lucide-react";
import {
  createWorkSchedule,
  getAllWorkSchedules,
  assignScheduleToStaff,
  getAllStaffWithSchedules,
} from "@/app/actions/work-schedules";
import RingLoader from "@/components/loaders/ringLoader";

export default function HorariosPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    monthly_hours: 160,
    daily_hours: 8,
    work_days_per_week: 6,
    check_in_time: "08:00",
    check_out_time: "17:00",
    break_duration_minutes: 60,
    tolerance_minutes: 15,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: schedulesData } = await getAllWorkSchedules();
    setSchedules(schedulesData || []);

    const { data: staffData } = await getAllStaffWithSchedules();
    setStaff(staffData || []);
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createWorkSchedule(formData);

    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Horario creado exitosamente");
      setShowCreateModal(false);
      setFormData({
        name: "",
        monthly_hours: 160,
        daily_hours: 8,
        work_days_per_week: 6,
        check_in_time: "08:00",
        check_out_time: "17:00",
        break_duration_minutes: 60,
        tolerance_minutes: 15,
      });
      await loadData();
    }

    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAssignSchedule = async (scheduleId: string) => {
    if (!selectedStaff) {
      setMessage("Selecciona un empleado");
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const result = await assignScheduleToStaff(
      selectedStaff,
      scheduleId,
      today
    );

    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Horario asignado exitosamente");
      setShowAssignModal(false);
      setSelectedStaff("");
      await loadData();
    }

    setLoading(false);
    setTimeout(() => setMessage(""), 3000);
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

  return (
    <div className="h-full">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-xl 2xl:text-2xl font-bold text-gray-900 mb-2">
            Gestión de Horarios
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Crear Horario
          </button>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
            {message}
          </div>
        )}

        {/* Horarios Disponibles */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-4 2xl:mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Horarios Disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition"
              >
                <h3 className="font-semibold text-gray-900 mb-2">
                  {schedule.name}
                </h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    Horario: {schedule.check_in_time} -{" "}
                    {schedule.check_out_time}
                  </p>
                  <p>Horas diarias: {schedule.daily_hours}h</p>
                  <p>Horas mensuales: {schedule.monthly_hours}h</p>
                  <p>Días/semana: {schedule.work_days_per_week}</p>
                  <p>Refrigerio: {schedule.break_duration_minutes} min</p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(true);
                    // Store schedule ID for assignment
                    (window as any).selectedScheduleId = schedule.id;
                  }}
                  className="mt-4 w-full px-3 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition text-sm font-medium cursor-pointer"
                >
                  Asignar a Empleado
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Empleados con Horarios */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Empleados y sus Horarios
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 text-white">
                  <tr className="border-b">
                    <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Horario Asignado
                    </th>
                    <th className="px-4 2xl:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                      Horas Mensuales
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((employee) => (
                    <tr key={employee.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {employee.first_name} {employee.last_name}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {employee.email}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {employee.assigned_schedule?.schedule?.name || (
                          <span className="text-gray-400">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-4 2xl:px-6 py-3 2xl:py-4">
                        {employee.assigned_schedule?.schedule
                          ?.monthly_hours || (
                          <span className="text-gray-400">Sin asignar</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Crear Horario */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Crear Nuevo Horario
              </h3>
              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Horario
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Entrada
                    </label>
                    <input
                      type="time"
                      value={formData.check_in_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          check_in_time: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hora Salida
                    </label>
                    <input
                      type="time"
                      value={formData.check_out_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          check_out_time: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horas Diarias
                    </label>
                    <input
                      type="number"
                      value={formData.daily_hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          daily_hours: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Horas Mensuales
                    </label>
                    <input
                      type="number"
                      value={formData.monthly_hours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthly_hours: parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Días/Semana
                    </label>
                    <input
                      type="number"
                      value={formData.work_days_per_week}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          work_days_per_week: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                      min="1"
                      max="7"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refrigerio (min)
                    </label>
                    <input
                      type="number"
                      value={formData.break_duration_minutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          break_duration_minutes: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Creando..." : "Crear"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Asignar Horario */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Asignar Horario a Empleado
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seleccionar Empleado
                  </label>
                  <select
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    {staff.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedStaff("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() =>
                      handleAssignSchedule((window as any).selectedScheduleId)
                    }
                    disabled={loading || !selectedStaff}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Asignando..." : "Asignar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
