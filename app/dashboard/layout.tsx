// app/dashboard/layout.tsx
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import DashboardClientLayout from "./dashboard-client-layout";

// Definir permisos de rutas basado en roles (mismo que menuItems)
const routePermissions: Record<string, string[]> = {
  "/dashboard": ["admin"],
  "/dashboard/reportes": ["admin"],
  "/dashboard/productos": ["admin"],
  "/dashboard/categorias": ["admin"],
  "/dashboard/tamanos": ["admin"],
  "/dashboard/usuarios": ["admin"],
  "/dashboard/pedidos": ["admin", "staff", "supervisor"],
  "/dashboard/reservaciones": ["admin", "staff", "supervisor"],
  "/dashboard/gastos": ["admin"],
  "/dashboard/gestion-asistencia": ["admin", "supervisor"],
  "/dashboard/horarios": ["admin"],
  "/dashboard/reportes-asistencia": ["admin"],
};

// Obtener la ruta por defecto según el rol
function getDefaultRouteForRole(role: string): string {
  if (role === "admin") return "/dashboard";
  if (role === "supervisor") return "/dashboard/gestion-asistencia";
  // Staff por defecto va a pedidos
  return "/dashboard/pedidos";
}

// Verificar si una ruta está permitida para un rol
function isRouteAllowed(pathname: string, role: string): boolean {
  // Normalizar pathname (remover trailing slash, query params, etc)
  const normalizedPath = pathname.split("?")[0].replace(/\/$/, "");

  // Verificar coincidencia exacta primero
  if (routePermissions[normalizedPath]) {
    return routePermissions[normalizedPath].includes(role);
  }

  // Verificar rutas dinámicas (ej: /dashboard/usuarios/[id])
  // Buscar la ruta padre más cercana
  const pathParts = normalizedPath.split("/").filter(Boolean);
  for (let i = pathParts.length; i > 0; i--) {
    const parentPath = "/" + pathParts.slice(0, i).join("/");
    if (routePermissions[parentPath]) {
      return routePermissions[parentPath].includes(role);
    }
  }

  // Si no hay permisos definidos, solo permitir admin por defecto
  return role === "admin";
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "/dashboard";

  // ✅ VERIFICAR SESIÓN EN EL SERVIDOR
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  console.log("🔍 [SERVER] Session check:", {
    hasSession: !!session,
    hasError: !!error,
    error: error?.message,
    user: session?.user?.email,
  });

  if (error) {
    console.error("❌ [SERVER] Session error:", error);
  }

  if (!session) {
    console.log("🚫 [SERVER] No session, redirecting to login");
    redirect("/");
  }

  // Verificar rol de usuario
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, first_name, last_name")
    .eq("id", session.user.id)
    .single();

  if (profileError) {
    console.error("❌ [SERVER] Profile error:", profileError);
    redirect("/no-autorizado");
  }

  if (!profile || !["admin", "staff", "supervisor"].includes(profile.role)) {
    console.log("🚫 [SERVER] Unauthorized role:", profile?.role);
    redirect("/no-autorizado");
  }

  console.log("✅ [SERVER] User authorized:", profile.role);

  // ✅ NUEVA VALIDACIÓN: Verificar si el usuario tiene permiso para esta ruta
  const currentPath =
    pathname || headersList.get("x-invoke-path") || "/dashboard";

  if (!isRouteAllowed(currentPath, profile.role)) {
    const defaultRoute = getDefaultRouteForRole(profile.role);
    console.log(
      `🚫 [SERVER] Route ${currentPath} not allowed for role ${profile.role}, redirecting to ${defaultRoute}`
    );
    redirect(defaultRoute);
  }

  console.log(
    `✅ [SERVER] Route ${currentPath} allowed for role ${profile.role}`
  );

  return (
    <DashboardClientLayout user={session.user} userProfile={profile}>
      {children}
    </DashboardClientLayout>
  );
}
