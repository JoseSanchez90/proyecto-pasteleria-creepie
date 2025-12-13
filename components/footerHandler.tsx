"use client";

import { usePathname } from "next/navigation";
import Footer from "./footer";

export default function FooterHandler() {
  const pathname = usePathname();

  // Rutas donde NO mostrar el footer (las mismas que para el navbar)
  const hideFooterRoutes = ["/dashboard", "/iniciar-sesion", "/registrarse"];

  const shouldHideFooter = hideFooterRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (shouldHideFooter) {
    return null;
  }

  return <Footer />;
}
