"use client";

import { useState, useEffect } from "react";
import {
  obtenerReportesFinancieros,
  type ReporteFinanciero,
  type PeriodoReporte,
} from "@/app/actions/reportes";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Calendar,
  Package,
  CreditCard,
} from "lucide-react";
import RingLoader from "@/components/loaders/ringLoader";
import { useNotyf } from "@/app/providers/NotyfProvider";

export default function ReportesPage() {
  const notyf = useNotyf();
  const [periodo, setPeriodo] = useState<PeriodoReporte>("month");
  const [modoFecha, setModoFecha] = useState<"preset" | "custom">("preset");
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(
    new Date().getFullYear()
  );
  const [reporte, setReporte] = useState<ReporteFinanciero | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarReportes();
  }, [periodo, modoFecha, mesSeleccionado, anioSeleccionado]);

  const cargarReportes = async () => {
    try {
      setLoading(true);
      setError(null);

      let data, error;

      if (modoFecha === "custom") {
        // Calcular rango personalizado basado en mes y año seleccionado
        const inicio = new Date(anioSeleccionado, mesSeleccionado, 1);
        const fin = new Date(
          anioSeleccionado,
          mesSeleccionado + 1,
          0,
          23,
          59,
          59
        );

        // Pasar fechas personalizadas a la función
        const result = await obtenerReportesFinancieros(
          "month",
          inicio.toISOString(),
          fin.toISOString()
        );
        data = result.data;
        error = result.error;
      } else {
        const result = await obtenerReportesFinancieros(periodo);
        data = result.data;
        error = result.error;
      }

      if (error) {
        throw new Error(error);
      }

      setReporte(data);
    } catch (err) {
      console.error("Error loading reports:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al cargar reportes"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(price);
  };

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getPeriodLabel = () => {
    if (modoFecha === "custom") {
      const meses = [
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
      return `${meses[mesSeleccionado]} ${anioSeleccionado}`;
    }

    const labels = {
      day: "Hoy",
      week: "Esta Semana",
      month: "Este Mes",
      year: "Este Año",
    };
    return labels[periodo];
  };

  const meses = [
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

  const anios = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );

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
        <p className="text-gray-500">Cargando Reportes...</p>
      </div>
    );
  }

  if (error || !reporte) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={cargarReportes}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
              Reportes Financieros
            </h1>
            <p className="text-sm 2xl:text-base text-gray-600">
              Análisis detallado de ingresos y gastos - {getPeriodLabel()}
            </p>
          </div>

          {/* Toggle entre preset y custom */}
          <div className="flex gap-2">
            <button
              onClick={() => setModoFecha("preset")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                modoFecha === "preset"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-blue-100"
              }`}
            >
              Rápido
            </button>
            <button
              onClick={() => setModoFecha("custom")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                modoFecha === "custom"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-blue-100"
              }`}
            >
              Personalizado
            </button>
          </div>
        </div>

        {/* Selector de período */}
        {modoFecha === "preset" ? (
          <div className="flex gap-2 flex-wrap">
            {(["day", "week", "month", "year"] as PeriodoReporte[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
                  periodo === p
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-blue-100"
                }`}
              >
                {p === "day" && "Hoy"}
                {p === "week" && "Semana"}
                {p === "month" && "Mes"}
                {p === "year" && "Año"}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 flex-wrap items-center">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Mes</label>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {meses.map((mes, idx) => (
                  <option key={idx} value={idx}>
                    {mes}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Año</label>
              <select
                value={anioSeleccionado}
                onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {anios.map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 2xl:gap-4 mb-2 2xl:mb-4">
        {/* Ingresos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Ingresos</p>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-xl 2xl:text-2xl font-bold text-gray-900">
            {formatPrice(reporte.ingresos)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {reporte.comparacion_anterior.ingresos_cambio >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                reporte.comparacion_anterior.ingresos_cambio >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatPercent(reporte.comparacion_anterior.ingresos_cambio)}
            </span>
            <span className="text-sm text-gray-500">vs período anterior</span>
          </div>
        </div>

        {/* Egresos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Egresos</p>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-xl 2xl:text-2xl font-bold text-gray-900">
            {formatPrice(reporte.egresos)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {reporte.comparacion_anterior.egresos_cambio >= 0 ? (
              <TrendingUp className="w-4 h-4 text-red-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-600" />
            )}
            <span
              className={`text-sm font-medium ${
                reporte.comparacion_anterior.egresos_cambio >= 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {formatPercent(reporte.comparacion_anterior.egresos_cambio)}
            </span>
            <span className="text-sm text-gray-500">vs período anterior</span>
          </div>
        </div>

        {/* Reembolsos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Reembolsos</p>
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-xl 2xl:text-2xl font-bold text-gray-900">
            {formatPrice(reporte.reembolsos)}
          </p>
          <p className="text-sm text-gray-500 mt-2">Pedidos reembolsados</p>
        </div>

        {/* Ganancia Neta */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Ganancia Neta</p>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xl 2xl:text-2xl font-bold text-gray-900">
            {formatPrice(reporte.ganancia_neta)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {reporte.comparacion_anterior.ganancia_cambio >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span
              className={`text-sm font-medium ${
                reporte.comparacion_anterior.ganancia_cambio >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatPercent(reporte.comparacion_anterior.ganancia_cambio)}
            </span>
            <span className="text-sm text-gray-500">vs período anterior</span>
          </div>
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 2xl:gap-4 mb-2 2xl:mb-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Pedidos</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-medium">{reporte.total_pedidos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Completados</span>
              <span className="font-medium text-green-600">
                {reporte.pedidos_completados}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Cancelados</span>
              <span className="font-medium text-red-600">
                {reporte.pedidos_cancelados}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Reservaciones</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total</span>
              <span className="font-medium">{reporte.total_reservaciones}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Métodos de Pago</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(reporte.metodos_pago).map(([metodo, cantidad]) => (
              <div key={metodo} className="flex justify-between">
                <span className="text-sm text-gray-600">{metodo}</span>
                <span className="font-medium">{cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ventas por categoría y productos más vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 2xl:gap-4 pb-6">
        {/* Ventas por categoría */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Ventas por Categoría
          </h3>
          <div className="space-y-3">
            {Object.entries(reporte.ventas_por_categoria)
              .sort(([, a], [, b]) => b - a)
              .map(([categoria, monto]) => (
                <div key={categoria}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{categoria}</span>
                    <span className="text-sm font-medium">
                      {formatPrice(monto)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(monto / reporte.ingresos) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Productos Más Vendidos
          </h3>
          <div className="space-y-3">
            {reporte.productos_mas_vendidos.slice(0, 5).map((producto, idx) => (
              <div
                key={producto.product_id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-900">
                    {producto.product_name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {producto.cantidad} unidades
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPrice(producto.total)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
