// lib/supabase-server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Ignorar errores en Server Components
          }
        },
      },
    }
  );

  // Usar getUser() en lugar de getSession() para eliminar advertencias
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("🔄 [SERVER] User verified:", user?.email);
  } catch (error) {
    console.error("❌ [SERVER] User verification error:", error);
  }

  return supabase;
}
