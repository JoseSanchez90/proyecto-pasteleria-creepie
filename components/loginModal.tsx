/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { ForgotPasswordModal } from "@/components/forgotPassword";
import { createClient } from "@/utils/supabase/client";
import clsx from "clsx";
import { pacifico } from "@/lib/fonts";
import { useNotyf } from "@/app/providers/NotyfProvider";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

export function LoginModal({
  isOpen,
  onClose,
  onSwitchToRegister,
}: LoginModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const notyf = useNotyf();

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        // ❌ Notificación de error
        notyf?.error(authError.message || "Error al iniciar sesión");
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        if (profileError) {
          console.error("Error obteniendo perfil:", profileError);
          notyf?.error("No se pudo cargar tu perfil. Inténtalo de nuevo.");
          onClose();
          router.refresh();
          return;
        }

        // ✅ Notificación de éxito (opcional, antes de redirigir)
        notyf?.success("¡Inicio de sesión exitoso!");

        if (profile.role === "admin") {
          onClose();
          router.push("/dashboard");
          return;
        } else if (["staff", "supervisor"].includes(profile.role)) {
          onClose();
          router.push("/dashboard/gestion-asistencia");
          return;
        } else {
          // Para "customer", recargar página
          onClose();
          setTimeout(() => {
            window.location.reload();
          }, 300); // un poco más de margen para que el toast se vea
        }
      }
    } catch (error) {
      console.error("Error durante el login:", error);
      notyf?.error("Ocurrió un error inesperado. Inténtalo más tarde.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setError("");
    setShowPassword(false);
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-100 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={handleOverlayClick}
      >
        {/* Modal Container - Más ancho para acomodar video y formulario */}
        <div className="relative w-full max-w-3xl 2xl:max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
          {/* Sección izquierda - Video */}
          <div className="hidden md:flex md:w-1/2 relative bg-black">
            {/* Video */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover opacity-90"
            >
              {/* CAMBIA ESTA RUTA POR TU VIDEO */}
              <source src="/videos/login.mp4" type="video/mp4" />
              <source src="/videos/login.webm" type="video/webm" />
            </video>
          </div>

          {/* Sección derecha - Formulario */}
          <div className="w-full md:w-1/2 p-6 2xl:p-8 flex flex-col overflow-y-auto">
            {/* Botón cerrar */}
            <div className="relative flex justify-end">
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors absolute -bottom-8 -right-2 cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Header del formulario */}
            <div className="text-center mb-6 2xl:mb-8">
              <h2 className="text-2xl 2xl:text-3xl font-bold text-blue-600 2xl:mb-2">
                Inicia Sesión
              </h2>
              <p className="text-gray-600">
                Bienvenido de vuelta a{" "}
                <span
                  className={clsx(
                    "text-xl font-semibold text-indigo-600",
                    pacifico.className
                  )}
                >
                  Creepie
                </span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Mostrar error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="ejemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-10 disabled:opacity-50"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                  disabled={isLoading}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Mantener sesión iniciada
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  "Iniciar Sesión"
                )}
              </button>

              {/* Switch to Register */}
              <div className="text-center mt-4 2xl:mt-8">
                <p className="text-gray-600">
                  ¿No tienes una cuenta?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                  >
                    Regístrate ahora
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación de Contraseña */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </>
  );
}
