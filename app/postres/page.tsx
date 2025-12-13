"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Filter, X, SlidersHorizontal, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { obtenerProductos } from "@/app/actions/productos";
import { obtenerCategorias } from "@/app/actions/categorias";
import { obtenerTamanos } from "@/app/actions/tamanos";
import { agregarAlCarrito } from "@/app/actions/carrito";
import { generarSlug } from "@/utils/slugify";
import { triggerCartUpdate } from "@/utils/cartEvents";
import SizeSelector from "@/components/SizeSelector";
import DualRangeSlider from "@/components/ui/DualRangeSlider";
import RingLoader from "@/components/loaders/ringLoader";
import { formatPrice } from "@/lib/format";

interface Category {
  id: string;
  name: string;
  image_url?: string;
}

interface ProductImage {
  id: string;
  image_url: string;
  image_order: number;
}

interface SizeOption {
  id: string;
  size_id: string;
  is_default: boolean;
  size: {
    id: string;
    name: string;
    person_capacity: number;
    additional_price: number;
  };
}

interface ProductoConCategoria {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  image_url: string;
  is_offer: boolean;
  offer_price: number;
  category?: Category;
  images?: ProductImage[];
  available_sizes?: SizeOption[];
}

type SortOption =
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "newest"
  | "offers";

function Postres() {
  const searchParams = useSearchParams();
  const [productos, setProductos] = useState<ProductoConCategoria[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [tamanos, setTamanos] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 9999 });
  const [selectedSizeFilters, setSelectedSizeFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<{
    [key: string]: string | null;
  }>({});
  const [productPrices, setProductPrices] = useState<{ [key: string]: number }>(
    {}
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resProductos, resCategorias, resTamanos] = await Promise.all([
          obtenerProductos(),
          obtenerCategorias(),
          obtenerTamanos(),
        ]);

        if (resProductos.error || resCategorias.error || resTamanos.error) {
          throw new Error(
            (resProductos.error ||
              resCategorias.error ||
              resTamanos.error) as string
          );
        }

        // Filter valid products (active and with stock/price)
        const validProducts = (resProductos.data || []).filter(
          (p: any) => p.is_active && p.stock >= 0 && p.price > 0
        );
        setProductos(validProducts);
        setCategorias(resCategorias.data || []);
        setTamanos(resTamanos.data || []);

        // Handle initial category filter from URL (e.g. from navbar)
        const categorySlug = searchParams.get("categoria");
        if (categorySlug && resCategorias.data) {
          const category = resCategorias.data.find(
            (c: any) => generarSlug(c.name) === categorySlug
          );
          if (category) {
            setSelectedCategories([category.id]);
          }
        }
      } catch (err) {
        setError("Error al cargar los datos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...productos];

    // Filter by Categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) =>
        selectedCategories.includes(p.category_id)
      );
    }

    // Filter by Price
    filtered = filtered.filter((p) => {
      const precio = p.is_offer ? p.offer_price : p.price;
      return precio >= priceRange.min && precio <= priceRange.max;
    });

    // Filter by Size (if product has that size available)
    if (selectedSizeFilters.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.available_sizes || p.available_sizes.length === 0) return false;
        return p.available_sizes.some((ps) =>
          selectedSizeFilters.includes(ps.size_id)
        );
      });
    }

    // Sort
    if (sortBy) {
      filtered.sort((a, b) => {
        const priceA = a.is_offer ? a.offer_price : a.price;
        const priceB = b.is_offer ? b.offer_price : b.price;

        switch (sortBy) {
          case "price-asc":
            return priceA - priceB;
          case "price-desc":
            return priceB - priceA;
          case "name-asc":
            return a.name.localeCompare(b.name);
          case "name-desc":
            return b.name.localeCompare(a.name);
          case "newest":
            return b.name.localeCompare(a.name);
          case "offers":
            return (b.is_offer ? 1 : 0) - (a.is_offer ? 1 : 0);
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [productos, selectedCategories, priceRange, selectedSizeFilters, sortBy]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count++;
    if (priceRange.min > 0 || priceRange.max < 9999) count++;
    if (selectedSizeFilters.length > 0) count++;
    if (sortBy) count++;
    return count;
  }, [selectedCategories, priceRange, selectedSizeFilters, sortBy]);

  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange({ min: 0, max: 9999 });
    setSelectedSizeFilters([]);
    setSortBy("");
  };

  const calcularDescuento = (precio: number, precioOferta: number) => {
    if (!precio || !precioOferta) return 0;
    return Math.round(((precio - precioOferta) / precio) * 100);
  };

  const obtenerImagenProducto = (producto: ProductoConCategoria) => {
    if (producto.images && producto.images.length > 0) {
      const imagenOrdenada = [...producto.images].sort(
        (a, b) => a.image_order - b.image_order
      );
      return imagenOrdenada[0].image_url;
    }
    return "/images/pastel-1.webp";
  };

  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCart(productId);
      const sizeId = selectedSizes[productId] || null;
      const { error } = await agregarAlCarrito(productId, 1, sizeId);

      if (error) {
        alert(error);
      } else {
        triggerCartUpdate();
        alert("✅ Producto agregado al carrito");
      }
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert("Error al agregar al carrito");
    } finally {
      setAddingToCart(null);
    }
  };

  const sortOptions = [
    { value: "name-asc", label: "Nombre (A-Z)" },
    { value: "name-desc", label: "Nombre (Z-A)" },
    { value: "price-asc", label: "Precio: Menor a Mayor" },
    { value: "price-desc", label: "Precio: Mayor a Menor" },
    { value: "newest", label: "Más Recientes" },
    { value: "offers", label: "En Oferta Primero" },
  ];

  const renderFilterSection = (isMobile: boolean = false) => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-lg font-bold text-indigo-600 mb-3 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Categorías
        </h3>
        <div className="space-y-3">
          {categorias.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedCategories([...selectedCategories, cat.id]);
                  } else {
                    setSelectedCategories(
                      selectedCategories.filter((id) => id !== cat.id)
                    );
                  }
                }}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-sm text-gray-700 font-medium">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-bold text-indigo-600 mb-8">
          Rango de Precio
        </h3>
        <div className="px-2">
          <DualRangeSlider
            key={`price-slider-${priceRange.min}-${priceRange.max}`}
            min={0}
            max={500}
            step={5}
            initialMin={priceRange.min}
            initialMax={priceRange.max > 500 ? 500 : priceRange.max}
            onChange={({ min, max }) => setPriceRange({ min, max })}
          />
        </div>
      </div>

      {/* Sizes */}
      {tamanos.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-indigo-600 mb-3">Tamaños</h3>
          <div className="space-y-3">
            {tamanos.map((tam) => (
              <label
                key={tam.id}
                className="flex items-center gap-3 px-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSizeFilters.includes(tam.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSizeFilters([...selectedSizeFilters, tam.id]);
                    } else {
                      setSelectedSizeFilters(
                        selectedSizeFilters.filter((id) => id !== tam.id)
                      );
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm text-gray-700 font-medium">
                  {tam.name} ({tam.person_capacity} personas)
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div>
        <h3 className="text-lg font-bold text-indigo-600 mb-3">Ordenar Por</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption | "")}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium text-gray-700 bg-white cursor-pointer hover:border-indigo-400 transition-colors"
        >
          <option value="" disabled>
            Seleccione un orden
          </option>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 h-screen">
        <RingLoader
          size="50"
          stroke="6"
          bgOpacity="0.1"
          speed="1.68"
          color="#3b82f6"
        />
        <p className="text-gray-500">Cargando Postres...</p>
      </div>
    );
  }

  if (error) {
    return (
      <section className="w-full min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
            <p className="text-xl font-medium text-gray-600">
              {error}. Por favor, intenta más tarde.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (productos.length === 0) {
    return (
      <section className="w-full min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-blue-600 mb-4">
              Nuestros Productos
            </h2>
            <p className="text-xl font-medium text-gray-600">
              No hay productos disponibles en este momento.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full min-h-screen py-24 2xl:py-32">
      <div className="max-w-2xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 md:px-0 lg:px-8 xl:px-0">
        {/* Header */}
        <div className="text-center mb-12 px-4">
          <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 mb-2 2xl:mb-4">
            Nuestros Productos
          </h2>
          <p className="text-base xl:text-lg 2xl:text-xl font-medium text-gray-600 max-w-3xl mx-auto">
            Descubre nuestra deliciosa selección de productos artesanales
            frescos
          </p>
        </div>

        {/* Filter Bar - Mobile */}
        <div className="lg:hidden mb-6 flex items-center justify-between gap-3 px-4">
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-medium transition-all shadow-md"
          >
            <SlidersHorizontal className="w-5 h-5" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-white text-indigo-600 px-2 py-0.5 rounded-full text-xs font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 xl:w-80 shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                  Filtros
                </h2>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Limpiar
                  </button>
                )}
              </div>
              {renderFilterSection()}
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {/* Results Info */}
            <div className="w-full flex justify-end">
              <p className="text-sm text-gray-600">
                Mostrando{" "}
                <span className="font-bold text-indigo-600">
                  {filteredAndSortedProducts.length}
                </span>{" "}
                de{" "}
                <span className="font-bold text-gray-900">
                  {productos.length}
                </span>{" "}
                productos
              </p>
            </div>

            {filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-16">
                <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  No se encontraron productos
                </h3>
                <p className="text-gray-600 mb-4">
                  Intenta ajustar los filtros para ver más resultados
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-8 max-w-xs md:max-w-5xl mx-auto">
                {filteredAndSortedProducts.map((producto) => {
                  const descuento = calcularDescuento(
                    producto.price,
                    producto.offer_price
                  );
                  const imagenUrl = obtenerImagenProducto(producto);
                  const precioFinal = producto.is_offer
                    ? producto.offer_price
                    : producto.price;

                  return (
                    <div key={producto.id} className="flex flex-col group">
                      <Link
                        href={`/postres/${generarSlug(producto.name)}`}
                        className="relative flex justify-center items-center top-14 z-10"
                      >
                        <img
                          src={imagenUrl}
                          alt={producto.name}
                          className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                        />

                        {producto.is_offer && descuento > 0 && (
                          <div className="absolute top-3 left-14">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                              -{descuento}%
                            </span>
                          </div>
                        )}

                        {producto.category && (
                          <div className="absolute bottom-5 right-14">
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              {producto.category.name}
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="h-75 2xl:h-80 bg-white border border-gray-300 rounded-t-[100px] rounded-b-[40px] shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                        <div className="flex flex-col gap-2 justify-between p-6 relative top-14">
                          <div className="flex justify-center items-start text-center">
                            <h3 className="text-base 2xl:text-lg text-center font-semibold text-blue-600">
                              {producto.name}
                            </h3>
                          </div>

                          <div className="flex flex-col items-start gap-4">
                            <div className="flex items-center gap-2 text-center mt-2">
                              <span className="text-xs 2xl:text-sm text-gray-600">
                                {producto.description ||
                                  "Delicioso postre artesanal"}
                              </span>
                            </div>
                          </div>

                          {producto.available_sizes &&
                          producto.available_sizes.length > 0 ? (
                            <div className="w-full h-full items-start">
                              <SizeSelector
                                availableSizes={producto.available_sizes}
                                basePrice={producto.price}
                                isOffer={producto.is_offer}
                                offerPrice={producto.offer_price}
                                onSizeChange={(sizeId, totalPrice) => {
                                  setSelectedSizes((prev) => ({
                                    ...prev,
                                    [producto.id]: sizeId,
                                  }));
                                  setProductPrices((prev) => ({
                                    ...prev,
                                    [producto.id]: totalPrice,
                                  }));
                                }}
                                disabled={addingToCart === producto.id}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full items-center justify-center text-center py-1.5 bg-gray-100 border border-gray-300 rounded-lg mt-1">
                              <span className="text-sm font-semibold text-gray-800">
                                Tamaño único
                              </span>
                            </div>
                          )}

                          <div className="w-full flex justify-between items-center">
                            <div className="flex items-center gap-4">
                              {producto.is_offer ? (
                                <>
                                  <span className="text-xl font-bold text-indigo-600">
                                    S/{" "}
                                    {formatPrice(
                                      productPrices[producto.id] || precioFinal
                                    )}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through">
                                    S/ {formatPrice(producto.price)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl font-bold text-indigo-600">
                                  S/{" "}
                                  {formatPrice(
                                    productPrices[producto.id] || producto.price
                                  )}
                                </span>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAddToCart(producto.id)}
                                className="bg-indigo-600 p-2 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-semibold cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 hover:shadow-lg"
                                disabled={
                                  producto.stock === 0 ||
                                  addingToCart === producto.id
                                }
                                aria-label={`Agregar ${producto.name} al carrito`}
                              >
                                {addingToCart === producto.id ? (
                                  <div className="w-5 h-5">
                                    <RingLoader
                                      size="20"
                                      stroke="4"
                                      bgOpacity="0.1"
                                      speed="1.68"
                                      color="#3b82f6"
                                    />
                                  </div>
                                ) : (
                                  <Plus className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            {producto.stock > 0 && producto.stock <= 5 && (
                              <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                                <span className="font-medium">
                                  ¡Últimas {producto.stock} unidades!
                                </span>
                              </div>
                            )}

                            {producto.stock === 0 && (
                              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                                <span className="font-medium">
                                  Agotado temporalmente
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setShowFilterModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
                  Filtros
                </h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto px-6 py-6 max-h-[calc(85vh-140px)]">
                {renderFilterSection(true)}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                <button
                  onClick={resetFilters}
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-4 py-3 rounded-xl font-medium transition-all"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-medium transition-all"
                >
                  Aplicar Filtros
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function PostresWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center gap-2 h-screen">
          <RingLoader
            size="50"
            stroke="6"
            bgOpacity="0.1"
            speed="1.68"
            color="#3b82f6"
          />
          <p className="text-gray-500">Cargando Postres...</p>
        </div>
      }
    >
      <Postres />
    </Suspense>
  );
}
