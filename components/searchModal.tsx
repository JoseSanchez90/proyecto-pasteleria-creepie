"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { buscarProductos } from "@/app/actions/productos";
import type { ProductoConCategoria } from "@/app/actions/productos";
import { generarSlug } from "@/utils/slugify";
import HourglassLoader from "./loaders/hourglassLoader";
import { useEffect, useState, useRef } from "react";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductoConCategoria[]>(
    []
  );
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Enfocar el input cuando se abre
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Manejar tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Búsqueda en tiempo real con debounce
  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await buscarProductos(searchQuery, 10);
        if (!error && data) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error searching products:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log("Buscando:", searchQuery);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  const handleProductClick = () => {
    handleClose();
  };

  // Obtener imagen del producto
  const obtenerImagenProducto = (producto: ProductoConCategoria) => {
    if (producto.images && producto.images.length > 0) {
      const imagenOrdenada = [...producto.images].sort(
        (a, b) => a.image_order - b.image_order
      );
      return imagenOrdenada[0].image_url;
    }
    return "/images/pastel-1.webp";
  };

  // Limpiar cuando se cierra
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50"
        >
          {/* Fondo con overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Contenedor del modal */}
          <div className="relative flex items-start justify-center pt-32 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 400,
                mass: 0.5,
              }}
              className="w-full max-w-2xl"
            >
              <form onSubmit={handleSearchSubmit}>
                <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                  {/* Barra de búsqueda */}
                  <div className="flex items-center px-6 py-4 border-b border-gray-200">
                    <Search className="w-6 h-6 text-indigo-600 mr-4 shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Buscar postres, tortas..."
                      className="w-full text-lg bg-transparent border-none outline-none placeholder-gray-500 text-gray-800"
                      autoFocus
                    />
                    {isSearching && (
                      <HourglassLoader
                        size="25"
                        bgOpacity="0.15"
                        speed="1.5"
                        color="#3b82f6"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleClose}
                      className="ml-4 p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200 shrink-0 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Resultados de búsqueda */}
                  {searchQuery.trim().length >= 2 && (
                    <div className="max-h-96 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        <div className="py-2">
                          {searchResults.map((producto) => {
                            const imagenUrl = obtenerImagenProducto(producto);
                            const precioFinal = producto.is_offer
                              ? producto.offer_price
                              : producto.price;

                            return (
                              <Link
                                key={producto.id}
                                href={`/postres/${generarSlug(producto.name)}`}
                                onClick={handleProductClick}
                                className="flex items-center gap-4 px-6 py-3 hover:bg-blue-50 transition-colors cursor-pointer"
                              >
                                {/* Imagen del producto */}
                                <img
                                  src={imagenUrl}
                                  alt={producto.name}
                                  className="w-16 h-16 object-cover rounded-full border-2 border-gray-200"
                                />

                                {/* Información del producto */}
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-800">
                                    {producto.name}
                                  </h3>
                                  <p className="text-sm text-gray-500 line-clamp-1">
                                    {producto.description || ""}
                                  </p>
                                </div>

                                {/* Precio */}
                                <div className="text-right">
                                  {producto.is_offer ? (
                                    <div className="flex flex-col">
                                      <span className="text-lg font-bold text-orange-600">
                                        S/ {precioFinal.toFixed(2)}
                                      </span>
                                      <span className="text-sm text-gray-500 line-through">
                                        S/ {producto.price.toFixed(2)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-lg font-bold text-gray-800">
                                      S/ {producto.price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      ) : (
                        !isSearching && (
                          <div className="py-12 text-center text-gray-500">
                            <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p className="text-lg font-medium">
                              No se encontraron productos
                            </p>
                            <p className="text-sm">
                              Intenta con otro término de búsqueda
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Mensaje inicial */}
                  {searchQuery.trim().length < 2 && (
                    <div className="py-12 text-center text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-lg font-medium">
                        Busca tus postres favoritos
                      </p>
                      <p className="text-sm">
                        Escribe al menos 2 caracteres para buscar
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
