"use client";

import { LogOut } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { LoginModal } from "./loginModal";
import { RegisterModal } from "./registerModal";
import {
  IoIosArrowDropdownCircle,
  IoIosArrowDropupCircle,
} from "react-icons/io";
import { PiUserBold } from "react-icons/pi";
import RingLoader from "./loaders/ringLoader";
import { FaUserLarge } from "react-icons/fa6";
import { MdWork } from "react-icons/md";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [userProfile, setUserProfile] = useState<{
    first_name?: string;
    last_name?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        // Obtener usuario actual (auto-refresca sesión si está expirada)
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          // console.error("Error getting user:", error);
          if (!isLoggingOut) {
            setUser(null);
            setUserRole("");
          }
          return;
        }

        if (user && !isLoggingOut) {
          // 🔥 No actualizar si estamos en logout
          setUser(user);

          // Obtener el perfil del usuario
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, first_name, last_name")
            .eq("id", user.id)
            .single();

          if (profileError) {
            // console.error("Error fetching profile:", profileError);
            // Continuar con rol por defecto
            setUserRole("customer");
            setUserProfile(null);
          } else {
            setUserRole(profile?.role || "customer");
            setUserProfile({
              first_name: profile?.first_name,
              last_name: profile?.last_name,
            });
          }
        } else if (!user) {
          setUser(null);
          setUserRole("");
        }
      } catch (error) {
        // console.error("Error initializing auth:", error);
        if (!isLoggingOut) {
          setUser(null);
          setUserRole("");
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // 🔥 IGNORAR todos los eventos si estamos en proceso de logout
      if (isLoggingOut) {
        // console.log("🔒 Ignorando evento durante logout:", event);
        return;
      }

      // console.log("🔄 UserMenu Auth event:", event);

      if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRole("");
        setUserProfile(null);
        // Recarga más agresiva
        setTimeout(() => {
          window.location.href = "/?t=" + Date.now();
        }, 50);
      } else if (session?.user && event !== "SIGNED_IN") {
        // 🔥 Ignorar SIGNED_IN después de logout
        setUser(session.user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("role, first_name, last_name")
          .eq("id", session.user.id)
          .single();

        setUserRole(profile?.role || "customer");
        setUserProfile({
          first_name: profile?.first_name,
          last_name: profile?.last_name,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, isLoggingOut]); // 🔥 Agregar isLoggingOut como dependencia

  // Refrescar sesión cuando el usuario vuelve a la pestaña
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && !loading && !isLoggingOut) {
        try {
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();

          if (error) {
            // console.error("Error refreshing session:", error);
            setUser(null);
            setUserRole("");
            return;
          }

          if (user) {
            setUser(user);

            // Actualizar perfil si es necesario
            const { data: profile } = await supabase
              .from("profiles")
              .select("role, first_name, last_name")
              .eq("id", user.id)
              .single();

            if (profile) {
              setUserRole(profile?.role || "customer");
              setUserProfile({
                first_name: profile?.first_name,
                last_name: profile?.last_name,
              });
            }
          } else {
            setUser(null);
            setUserRole("");
            setUserProfile(null);
          }
        } catch (error) {
          // console.error("Error handling visibility change:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [supabase, loading, isLoggingOut]);

  // 🔥 SOLUCIÓN: Logout con estado de bloqueo
  const handleLogout = async () => {
    try {
      setIsOpen(false);
      setIsLoggingOut(true); // 🔥 BLOQUEAR actualizaciones de estado
      // console.log("🚪 Iniciando logout...");

      // 1. Limpiar estados inmediatamente
      setUser(null);
      setUserRole("");
      setUserProfile(null);

      // 2. Cerrar sesión en Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        // console.log("❌ Error en signOut:", error);
        throw error;
      }

      // console.log("✅ Sesión cerrada en Supabase");

      // 3. Limpiar almacenamiento
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();

      // 4. Forzar recarga completa inmediata
      setTimeout(() => {
        // console.log("🔄 Redirigiendo a home...");
        // Usar replace para evitar que el usuario pueda volver atrás
        window.location.replace("/?logout=" + Date.now());
      }, 10);
    } catch (error) {
      // console.error("❌ Error durante logout:", error);
      // Fallback nuclear
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.clear();
      window.location.replace("/");
    }
  };

  // Efecto para detectar clics fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (user && !loading && !isLoggingOut) {
      setIsOpen(!isOpen);
    }
  };

  const getUserName = () => {
    // Priorizar el nombre del perfil sobre user_metadata
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    return user?.email?.split("@")[0] || "Usuario";
  };

  if (loading || isLoggingOut) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 h-full">
        <RingLoader
          size="20"
          stroke="3"
          bgOpacity="0.1"
          speed="1.68"
          color="#3b82f6"
        />
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      {user ? (
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-2 p-2 cursor-pointer group"
          disabled={loading || isLoggingOut}
        >
          <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
            <p className="text-black text-xs lg:text-sm font-medium">
              Hola, {getUserName()}
            </p>

            <div className="relative w-5 h-5 flex items-center justify-center">
              {/* Fondo circular animado */}
              <div
                className={`absolute inset-0 bg-linear-to-r from-gray-200 to-gray-300 rounded-full transition-all duration-300 ${
                  isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              ></div>

              {/* Icono con transform */}
              <div
                className={`relative transition-all duration-500 ${
                  isOpen ? "rotate-360 scale-125" : "rotate-0 scale-100"
                }`}
              >
                {isOpen ? (
                  <IoIosArrowDropupCircle className="w-5 h-5 text-indigo-600" />
                ) : (
                  <IoIosArrowDropdownCircle className="w-5 h-5 text-indigo-600" />
                )}
              </div>
            </div>
          </div>
        </button>
      ) : (
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm cursor-pointer"
          disabled={loading || isLoggingOut}
        >
          <PiUserBold className="w-5 h-5 text-zinc-600 mb-0.5" />
          <p className="text-xs lg:text-sm text-gray-500">Iniciar Sesión</p>
        </button>
      )}

      {/* Dropdown */}
      <div
        className={`absolute right-0 top-full overflow-hidden rounded-xl z-50 ${
          isOpen ? "visible" : "invisible"
        }`}
      >
        <div
          className={`w-52 bg-white rounded-xl shadow-xl border border-gray-200 transition-all duration-300 ease-out ${
            isOpen
              ? "translate-y-0 opacity-100 scale-100"
              : "-translate-y-4 opacity-0 scale-95"
          }`}
        >
          <div className="p-2 space-y-1">
            {/* Items con animaciones individuales */}
            {[
              {
                icon: <FaUserLarge className="w-4 h-4 text-indigo-600 mb-1" />,
                text: "Mi cuenta",
                onClick: () => {
                  router.push("/mi-cuenta");
                  setIsOpen(false);
                },
                delay: "0ms",
                show: true, // Siempre mostrar
              },
              // Botón condicional para volver al Dashboard (solo admin/staff/supervisor)
              ...(["admin", "staff", "supervisor"].includes(userRole)
                ? [
                    {
                      icon: (
                        <MdWork className="w-4 h-4 text-indigo-600 mb-0.5" />
                      ),
                      text: "Ir al Dashboard",
                      onClick: () => {
                        const dashboardUrl =
                          userRole === "admin"
                            ? "/dashboard"
                            : "/dashboard/gestion-asistencia";
                        router.push(dashboardUrl);
                        setIsOpen(false);
                      },
                      delay: "50ms",
                      isBlue: true,
                      show: true,
                    },
                  ]
                : []),
              {
                icon: <LogOut className="w-4 h-4" />,
                text: isLoggingOut ? "Cerrando sesión..." : "Cerrar Sesión",
                onClick: handleLogout,
                isRed: true,
                disabled: isLoggingOut,
                delay: "100ms",
                show: true,
              },
            ]
              .filter((item) => item.show) // Filtrar solo items que se deben mostrar
              .map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-all duration-300 ease-out cursor-pointer transform ${
                    isOpen
                      ? "translate-x-0 opacity-100"
                      : "translate-x-4 opacity-0"
                  } ${
                    item.isRed
                      ? "text-red-600 hover:bg-red-50"
                      : item.isBlue
                      ? "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                      : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                  style={{
                    transitionDelay: isOpen ? item.delay : "0ms",
                  }}
                >
                  {item.icon}
                  <span>{item.text}</span>
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Authentication Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
}
