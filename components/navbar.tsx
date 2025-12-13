"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";
import Link from "next/link";
import { pacifico } from "@/lib/fonts";
import Notifications from "./notifications";
import { UserMenu } from "./userMenu";
import CartBadge from "./CartBadge";
import { BiSearchAlt } from "react-icons/bi";
import { SearchModal } from "./searchModal";

const links = [
  { label: "Inicio", href: "/" },
  { label: "Postres", href: "/postres" },
  { label: "Reservaciones", href: "/reservaciones" },
  { label: "¿Quienes Somos?", href: "/quienes-somos" },
  { label: "Contáctanos", href: "/contactanos" },
];

function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={clsx(
          "flex items-center justify-between fixed top-0 left-0 right-0 mx-auto transition-all duration-500 z-30",
          isScrolled
            ? "w-full max-w-236 xl:max-w-5xl 2xl:max-w-6xl backdrop-blur-md bg-white/80 shadow-lg rounded-4xl py-2 px-6 xl:py-2 2xl:py-3 xl:px-8 2xl:px-12 mt-3 xl:mt-2"
            : "w-full max-w-4xl xl:max-w-6xl 2xl:max-w-7xl flex justify-center items-center py-2 2xl:py-6"
        )}
      >
        <div className="w-full flex items-center justify-between">
          {/* Lado izquierdo: Logo */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className={clsx(
                "text-zinc-600 hover:text-zinc-700 cursor-pointer mb-2 transition-all duration-500",
                pacifico.className,
                isScrolled
                  ? "xl:text-xl 2xl:text-2xl"
                  : "xl:text-2xl 2xl:text-3xl"
              )}
            >
              Creepie
            </Link>
          </div>

          {/* Centro: Enlaces de navegación */}
          <div className="flex gap-8 mx-8">
            {links.map((link, i) => (
              <Link
                key={i}
                href={link.href}
                className="cursor-pointer transition-colors duration-200 text-sm 2xl:text-base font-medium text-zinc-600 hover:text-zinc-700 whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Lado derecho: Iconos */}
          <div className="flex items-center gap-2">
            {/* Botón de búsqueda (solo icono) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="cursor-pointer p-2"
              title="Buscar"
            >
              {isSearchOpen ? (
                <BiSearchAlt className="w-5 h-5 text-blue-600" />
              ) : (
                <BiSearchAlt className="w-5 h-5 text-zinc-600" />
              )}
            </button>

            <Notifications />

            <UserMenu />

            <CartBadge />
          </div>
        </div>
      </nav>

      {/* Modal de Búsqueda */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

export default Navbar;
