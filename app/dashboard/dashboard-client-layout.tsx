// app/dashboard/dashboard-client-layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut } from "lucide-react";
import clsx from "clsx";
import { pacifico } from "@/lib/fonts";
import {
  FaBoxOpen,
  FaCalendarAlt,
  FaChartPie,
  FaCrown,
  FaTag,
  FaTruck,
  FaUser,
  FaChartLine,
  FaReceipt,
  FaRuler,
  FaUserClock,
  FaBars,
} from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { SiGooglehome } from "react-icons/si";

interface DashboardClientLayoutProps {
  children: React.ReactNode;
  user: any;
  userProfile: any;
}

export default function DashboardClientLayout({
  children,
  user,
  userProfile,
}: DashboardClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const supabase = createClient();

  // Escuchar cambios de autenticación
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        // Forzar redirección cuando se cierra sesión
        window.location.href = "/";
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const menuItems = [
    {
      href: "/dashboard",
      label: "Resumen",
      icon: FaChartPie,
      roles: ["admin"], // Solo admin
    },
    {
      href: "/dashboard/reportes",
      label: "Reportes",
      icon: FaChartLine,
      roles: ["admin"], // Solo admin
    },
    {
      href: "/dashboard/productos",
      label: "Productos",
      icon: FaBoxOpen,
      roles: ["admin"], // Solo admin
    },
    {
      href: "/dashboard/categorias",
      label: "Categorias",
      icon: FaTag,
      roles: ["admin"], // Solo admin
    },
    {
      href: "/dashboard/tamanos",
      label: "Tamaños",
      icon: FaRuler,
      roles: ["admin"], // Solo admin
    },
    {
      href: "/dashboard/usuarios",
      label: "Usuarios",
      icon: FaUser,
      roles: ["admin"], // Solo admin
    },
    {
      href: "/dashboard/pedidos",
      label: "Pedidos",
      icon: FaTruck,
      roles: ["admin", "staff", "supervisor"], // Admin, Staff y Supervisor
    },
    {
      href: "/dashboard/reservaciones",
      label: "Reservaciones",
      icon: FaCalendarAlt,
      roles: ["admin", "staff", "supervisor"], // Admin, Staff y Supervisor
    },
    {
      href: "/dashboard/gastos",
      label: "Gastos",
      icon: FaReceipt,
      roles: ["admin"], // Solo admin
    },
    {
      href: "/dashboard/gestion-asistencia",
      label: "Gestión de Asistencia",
      icon: FaUserClock,
      roles: ["admin", "supervisor"], // Admin y Supervisor
    },
    {
      href: "/dashboard/horarios",
      label: "Horarios",
      icon: FaUserClock,
      roles: ["admin"], // Solo admin
    },
    {
      href: "/dashboard/reportes-asistencia",
      label: "Reporte Asistencia",
      icon: FaChartLine,
      roles: ["admin"], // Solo admin
    },
  ];

  // Filtrar menú según el rol del usuario
  const getFilteredMenuItems = () => {
    const userRole = userProfile?.role || "customer";
    return menuItems.filter((item) => item.roles.includes(userRole));
  };

  const getUserName = () => {
    if (userProfile?.first_name) {
      return `${userProfile.first_name}`;
    }
    return user?.email?.split("@")[0] || "Administrador";
  };

  const getUserRole = () => {
    if (userProfile?.role === "admin") return "Administrador";
    if (userProfile?.role === "supervisor") return "Supervisor";
    return "Staff";
  };

  // ✅ SOLUCIÓN CORREGIDA: Logout que funciona correctamente
  const handleLogout = async () => {
    try {
      setSidebarOpen(false);

      // 1. Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error during logout:", error);
        // Fallback: redirección forzada
        window.location.href = "/";
        return;
      }

      // 2. Forzar recarga completa para limpiar el estado del servidor
      console.log("🔄 Cerrando sesión, redirigiendo...");
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
      // Fallback final
      window.location.href = "/";
    }
  };

  return (
    <div className="flex h-screen bg-indigo-600">
      {/* Sidebar para desktop */}
      <aside className="hidden min-h-screen flex-col justify-between xl:flex w-72 py-4 bg-indigo-600">
        <div>
          {/* Logo */}
          <div className="p-4 2xl:p-6 space-y-4">
            <h1
              className={clsx(
                "text-xl 2xl:text-2xl font-bold text-white",
                pacifico.className
              )}
            >
              Creepie
            </h1>
            <p className="text-white text-base 2xl:text-lg font-semibold">
              Panel Administrativo
            </p>
          </div>

          {/* Navegación */}
          <nav className="h-[calc(80vh-12rem)] 2xl:h-[calc(85vh-12rem)] bg-indigo-500 rounded-lg overflow-y-auto ml-4 p-3 space-y-2">
            {getFilteredMenuItems().map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-2 py-1 2xl:px-4 2xl:py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-white text-indigo-600 border-r-2 border-indigo-600"
                      : "text-white hover:bg-white hover:text-indigo-600"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer del sidebar */}
        <div className="p-4">
          <div className="space-y-2">
            {/* Información del usuario */}
            <div className="flex items-center gap-2 p-2 text-white">
              <div className="w-8 h-8 flex items-center justify-center">
                <FaCrown className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  Hola, {getUserName()}
                </p>
                <p className="text-xs text-indigo-200 truncate">
                  {getUserRole()}
                </p>
              </div>
            </div>
            {/* Botón de ir al inicio */}
            <Link
              href="/"
              className="w-full bg-white hover:bg-gray-100 flex items-center gap-3 px-4 py-2 text-indigo-600 rounded-lg transition-colors cursor-pointer"
            >
              <SiGooglehome className="w-4 h-4" />
              <span className="text-sm 2xl:text-base font-medium">
                Ir a Creepie
              </span>
            </Link>
            {/* Botón de cerrar sesión */}
            <button
              onClick={handleLogout}
              className="w-full bg-gray-800 hover:bg-gray-900 flex items-center gap-3 px-4 py-2 text-white rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm 2xl:text-base font-medium">
                Cerrar Sesión
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="w-full flex flex-col overflow-hidden">
        {/* Header móvil */}
        <header className="xl:hidden bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <FaBars className="w-4 h-4" />
            </button>

            <h1
              className={clsx(
                "text-2xl font-bold text-indigo-600",
                pacifico.className
              )}
            >
              Creepie
            </h1>

            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-3 px-4 py-2 text-white rounded-lg transition-colors cursor-pointer"
            >
              <SiGooglehome className="w-4 h-4" />
              <span className="font-medium">Ir a Creepie</span>
            </Link>
          </div>
        </header>

        {/* Contenido */}
        <main className="overflow-auto h-full p-4 bg-gray-100 xl:rounded-2xl xl:m-5.5">
          {children}
        </main>
      </div>

      {/* Sidebar móvil con overlay */}
      <div
        className={`xl:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          sidebarOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop con fade */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Sidebar con slide desde la izquierda */}
        <div
          className={`relative w-64 bg-white h-full flex flex-col shadow-2xl transform transition-transform duration-300 ease-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h1 className="text-lg font-bold">Panel Administrativo</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="p-4 flex-1 overflow-y-auto">
            {getFilteredMenuItems().map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={{
                    transitionDelay: sidebarOpen ? `${index * 30}ms` : "0ms",
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer sidebar móvil */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <FaCrown className="w-4 h-4 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {getUserName()}
                  </p>
                  <p className="text-xs text-gray-500">{getUserRole()}</p>
                </div>
              </div>
              {/* Botón de ir al inicio */}
              <Link
                href="/"
                onClick={() => setSidebarOpen(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 flex items-center gap-3 px-4 py-2 text-white rounded-lg transition-colors cursor-pointer"
              >
                <SiGooglehome className="w-4 h-4" />
                <span className="font-medium">Ir a Creepie</span>
              </Link>
              {/* Botón de cerrar sesión */}
              <button
                onClick={handleLogout}
                className="w-full bg-gray-900 hover:bg-gray-800 flex items-center gap-3 px-4 py-2 text-white rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
