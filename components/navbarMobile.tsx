"use client";

import {
  ShoppingBasket,
  Search,
  Home,
  Dessert,
  Calendar,
  Users,
  Phone,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserMenu } from "./userMenu";
import Notifications from "./notifications";
import { useState, useEffect } from "react";
import clsx from "clsx";
import { pacifico } from "@/lib/fonts";
import CartBadge from "./CartBadge";
import { SearchModal } from "./searchModal";

const mobileLinks = [
  { label: "Inicio", href: "/", icon: Home },
  { label: "Postres", href: "/postres", icon: Dessert },
  { label: "Reservas", href: "/reservaciones", icon: Calendar },
  { label: "Nosotros", href: "/quienes-somos", icon: Users },
  { label: "Contacto", href: "/contactanos", icon: Phone },
];

function NavbarMobile() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeLabel, setActiveLabel] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Efecto para actualizar la etiqueta activa cuando cambia la ruta
  useEffect(() => {
    const activeLink = mobileLinks.find(
      (link) => pathname === link.href || pathname.startsWith(link.href + "/")
    );
    if (activeLink) {
      setActiveLabel(activeLink.label);
    } else {
      setActiveLabel("Creepie");
    }
  }, [pathname]);

  // Función para manejar clic en un item
  const handleItemClick = (label: string) => {
    setActiveLabel(label);
  };

  return (
    <>
      <section>
        {/* Barra superior móvil */}
        <div className="fixed top-0 left-0 right-0 bg-white z-50 lg:hidden shadow-sm">
          {/* Contenedor principal con título dinámico */}
          <div className="flex items-center justify-between px-4 py-2">
            {/* Título dinámico */}
            <h1
              className={clsx(
                "text-xl font-semibold text-indigo-600 transition-all duration-300",
                pacifico.className
              )}
            >
              Creepie
            </h1>

            {/* Acciones derecha */}
            <div className="flex items-center gap-1 lg:gap-3">
              {/* Botón de búsqueda */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>

              <Notifications />
              <UserMenu />

              <CartBadge />
            </div>
          </div>
        </div>

        {/* Navbar móvil fijo en la parte inferior */}
        <div className="fixed w-full bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden shadow-lg">
          <div className="w-full flex items-center justify-between px-2 py-3">
            {mobileLinks.map((link, index) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={index}
                  href={link.href}
                  onClick={() => handleItemClick(link.label)}
                  className={`w-full flex items-center justify-center p-2 rounded-xl transition-all duration-300 relative group ${
                    isActive ? "bg-indigo-100" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Contenedor para icono y texto */}
                  <div className="flex items-center justify-center py-1 gap-2 relative">
                    {/* Icono */}
                    <div
                      className={`rounded-full transition-all duration-300 ${
                        isActive
                          ? "bg-indigo-100 text-indigo-600"
                          : "text-gray-600 group-hover:text-indigo-500"
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 transition-all duration-300 ${
                          isActive ? "scale-110" : ""
                        }`}
                      />
                    </div>

                    {/* Etiqueta a la derecha del icono - SOLO VISIBLE CUANDO ESTÁ ACTIVO */}
                    <span
                      className={`text-xs font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${
                        isActive
                          ? "text-indigo-600 opacity-100 max-w-24"
                          : "opacity-0 max-w-0"
                      }`}
                    >
                      {link.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal de Búsqueda */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

export default NavbarMobile;
