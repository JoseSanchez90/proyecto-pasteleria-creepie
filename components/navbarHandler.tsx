"use client";

import { usePathname } from "next/navigation";
import Navbar from "./navbar";

export default function NavbarHandler() {
  const pathname = usePathname();

  // Rutas donde NO mostrar el navbar
  const hideNavbarRoutes = ["/dashboard"];

  const shouldHideNavbar = hideNavbarRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (shouldHideNavbar) {
    return null;
  }

  return <Navbar />;
}
