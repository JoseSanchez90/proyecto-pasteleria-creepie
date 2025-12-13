"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { obtenerCantidadCarrito } from "@/app/actions/carrito";
import { PiShoppingBagBold } from "react-icons/pi";

export default function CartBadge() {
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCartCount();

    // Escuchar eventos de actualización del carrito
    const handleCartUpdate = () => {
      loadCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  const loadCartCount = async () => {
    try {
      const { count } = await obtenerCantidadCarrito();
      setCartCount(count);
    } catch (error) {
      console.error("Error loading cart count:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href="/carrito-compras" className="relative">
      <button className="cursor-pointer p-2 relative">
        <PiShoppingBagBold className="w-5 h-5 text-zinc-600" />
        {!loading && cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </button>
    </Link>
  );
}
