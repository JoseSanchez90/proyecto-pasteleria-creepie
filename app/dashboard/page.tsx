import { obtenerDatosDashboard } from "@/app/actions/dashboard";
import {
  Users,
  Package,
  ShoppingCart,
  Calendar,
  TrendingUp,
  DollarSign,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import BarChart from "@/components/charts/bar-chart";
import DonutChart from "@/components/charts/donut-chart";
import MetricCard from "@/components/charts/metric-card";
import { formatPrice } from "@/lib/format";

export default async function DashboardPage() {
  const {
    metricas,
    pedidosRecientes,
    productosPopulares,
    ventasMensuales,
    productosPorCategoria,
  } = await obtenerDatosDashboard();

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const obtenerBadgeEstado = (estado: string) => {
    const estilos = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const textos = {
      pending: "Pendiente",
      processing: "En Proceso",
      shipped: "Enviado",
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

  // Preparar datos para el gráfico de barras
  const datosBarChart = ventasMensuales.map((item) => ({
    label: item.mes,
    value: item.ventas,
  }));

  // Preparar datos para el gráfico donut
  const datosDonutChart = productosPorCategoria.map((item) => ({
    label: item.categoria,
    value: item.cantidad,
    color: item.color,
  }));

  return (
    <div className="space-y-2 2xl:space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center">
        <div>
          <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
            Dashboard Principal
          </h1>
          <p className="text-sm 2xl:text-base text-gray-600 mt-1">
            Bienvenido al panel de control de Creepie
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center gap-2 text-sm text-gray-500">
          <CalendarDays className="w-4 h-4" />
          <span>
            {new Date().toLocaleDateString("es-PE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Métricas Principales con MetricCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 2xl:gap-6">
        <MetricCard
          title="Ventas Totales"
          value={formatPrice(metricas.ventasTotales)}
          icon={<DollarSign className="w-6 h-6" />}
          gradient="from-blue-500 to-blue-600"
          iconBgColor="bg-blue-600"
        />

        <MetricCard
          title="Ventas Hoy"
          value={formatPrice(metricas.ventasHoy)}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-emerald-500 to-emerald-600"
          iconBgColor="bg-emerald-600"
        />

        <MetricCard
          title="Total Usuarios"
          value={metricas.totalUsuarios}
          icon={<Users className="w-6 h-6" />}
          gradient="from-purple-500 to-purple-600"
          iconBgColor="bg-purple-600"
        />

        <MetricCard
          title="Productos Activos"
          value={metricas.totalProductos}
          icon={<Package className="w-6 h-6" />}
          gradient="from-orange-500 to-orange-600"
          iconBgColor="bg-orange-600"
        />
      </div>

      {/* Segunda fila de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Pedidos Pendientes"
          value={metricas.pedidosPendientes}
          icon={<ShoppingCart className="w-6 h-6" />}
          gradient="from-amber-500 to-amber-600"
          iconBgColor="bg-amber-800"
        />

        <MetricCard
          title="Tasa de Conversión"
          value={`${metricas.tasaConversion}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="from-yellow-500 to-yellow-600"
          iconBgColor="bg-yellow-500"
        />

        <MetricCard
          title="Reservaciones Hoy"
          value={0}
          icon={<Calendar className="w-6 h-6" />}
          gradient="from-teal-500 to-teal-600"
          iconBgColor="bg-teal-500"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Gráfico de Ventas Mensuales */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Ventas Mensuales
              </h2>
              <p className="text-sm text-gray-500 mt-1">Últimos 8 meses</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
              <span className="text-gray-600">Ingresos</span>
            </div>
          </div>
          <BarChart
            data={datosBarChart}
            height={220}
            color="#6366f1"
            showValues={false}
          />
        </div>

        {/* Gráfico de Productos por Categoría */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Productos por Categoría
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Distribución del catálogo
            </p>
          </div>
          <div className="flex items-center justify-center">
            {datosDonutChart.length > 0 ? (
              <DonutChart
                data={datosDonutChart}
                size={240}
                thickness={45}
                showLegend={true}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                No hay datos de categorías
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Listas de Pedidos y Productos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pedidos Recientes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Pedidos Recientes
            </h2>
            <Link href="/dashboard/pedidos">
              <button className="hover:bg-blue-600 hover:text-white text-sm text-blue-600 font-medium rounded-lg px-4 py-2 cursor-pointer transition-colors">
                Ver todos →
              </button>
            </Link>
          </div>

          <div className="space-y-4">
            {pedidosRecientes.length > 0 ? (
              pedidosRecientes.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="font-medium text-gray-800">{pedido.id}</p>
                        <p className="text-sm text-gray-600">
                          {pedido.cliente}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">
                      {formatPrice(pedido.total)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatearFecha(pedido.fecha)}
                    </p>
                  </div>
                  <div className="ml-4">
                    {obtenerBadgeEstado(pedido.estado)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay pedidos recientes
              </div>
            )}
          </div>
        </div>

        {/* Productos Populares */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Productos Populares
            </h2>
            <Link href="/dashboard/productos">
              <button className="hover:bg-blue-600 hover:text-white text-sm text-blue-600 font-medium rounded-lg px-4 py-2 cursor-pointer transition-colors">
                Ver todos →
              </button>
            </Link>
          </div>

          <div className="space-y-4">
            {productosPopulares.length > 0 ? (
              productosPopulares.map((producto, index) => (
                <div
                  key={producto.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-linear-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 truncate">
                        {producto.nombre}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-600">
                          {producto.ventas} ventas
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-green-400 to-green-600 rounded-full"
                        style={{
                          width: `${Math.min(
                            (producto.ventas / 50) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {producto.ventas} unidades
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No hay datos de productos populares
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
