"use client";

import { usePathname } from "next/navigation";
import NavbarMobile from "./navbarMobile";

export default function NavbarHandlerMobile() {
  const pathname = usePathname();

  // Rutas donde NO mostrar el navbar
  const hideNavbarRoutes = ["/dashboard", "/iniciar-sesion", "/registrarse"];

  const shouldHideNavbar = hideNavbarRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (shouldHideNavbar) {
    return null;
  }

  return <NavbarMobile />;
}
