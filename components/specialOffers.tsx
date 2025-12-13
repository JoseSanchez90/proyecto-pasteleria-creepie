/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { obtenerProductosOferta } from "@/app/actions/productos";
import type { ProductoConCategoria } from "@/app/actions/productos";
import { generarSlug } from "@/utils/slugify";
import { triggerCartUpdate } from "@/utils/cartEvents";
import SizeSelector from "@/components/SizeSelector";
import { agregarAlCarrito } from "@/app/actions/carrito";
import Ring2Loader from "./loaders/ringLoader";
import DotWaveLoader from "./loaders/dotWaveLoader";
import RingLoader from "./loaders/ringLoader";

function SpecialOffers() {
  const [productos, setProductos] = useState<ProductoConCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<
    Record<string, string | null>
  >({});
  const [productPrices, setProductPrices] = useState<Record<string, number>>(
    {}
  );
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfertas = async () => {
      try {
        setLoading(true);
        const { data, error } = await obtenerProductosOferta(8); // Limitar a 8 productos

        if (error) {
          setError(error);
          console.error("Error fetching offers:", error);
        } else {
          setProductos(data || []);
        }
      } catch (err) {
        setError("Error al cargar las ofertas");
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOfertas();
  }, []);

  // Calcular el porcentaje de descuento
  const calcularDescuento = (precio: number, precioOferta: number) => {
    if (!precioOferta || precioOferta >= precio) return 0;
    return Math.round(((precio - precioOferta) / precio) * 100);
  };

  // Obtener la primera imagen del producto o una por defecto
  const obtenerImagenProducto = (producto: ProductoConCategoria) => {
    if (producto.images && producto.images.length > 0) {
      const imagenOrdenada = [...producto.images].sort(
        (a, b) => a.image_order - b.image_order
      );
      return imagenOrdenada[0].image_url;
    }
    return "/images/pastel-1.webp"; // Imagen por defecto
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

  if (loading) {
    return (
      <section className="w-full py-16">
        <div className="flex flex-col justify-center items-center gap-2 h-screen">
          <RingLoader
            size="50"
            stroke="6"
            bgOpacity="0.1"
            speed="1.68"
            color="#3b82f6"
          />
          <p className="text-gray-500">Cargando Ofertas...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 mb-4">
              Ofertas Especiales
            </h2>
            <p className="text-base xl:text-lg 2xl:text-xl font-medium max-w-2xl 2xl:max-w-3xl mx-auto text-red-600">
              Error al cargar las ofertas. Por favor, intenta más tarde.
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (productos.length === 0) {
    return (
      <section className="w-full py-32">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 mb-4">
              Ofertas Especiales
            </h2>
            <p className="text-base xl:text-lg 2xl:text-xl font-medium text-zinc-600 max-w-2xl 2xl:max-w-3xl mx-auto">
              No hay ofertas disponibles en este momento.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-12 lg:py-24 2xl:py-32">
      <div className="container mx-auto px-4 md:px-0">
        {/* Header */}
        <div className="text-center mb-4 2xl:mb-12">
          <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 mb-4">
            Ofertas Especiales
          </h2>
          <p className="text-base xl:text-lg 2xl:text-xl font-medium text-zinc-600 max-w-2xl 2xl:max-w-3xl mx-auto">
            Aprovecha nuestras promociones exclusivas. Productos seleccionados
            con descuentos especiales solo por tiempo limitado.
          </p>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-xs md:max-w-xl lg:max-w-4xl xl:max-w-7xl mx-auto">
          {productos.map((producto) => {
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
                {/* Imagen del producto */}
                <Link href={`/postres/${generarSlug(producto.name)}`}>
                  <div className="relative flex justify-center items-center top-14 z-10">
                    <img
                      src={imagenUrl}
                      alt={producto.name}
                      className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badge de oferta */}
                    {producto.is_offer && descuento > 0 && (
                      <div className="absolute top-3 left-14">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                          -{descuento}%
                        </span>
                      </div>
                    )}

                    {/* Badge de categoría */}
                    {producto.category && (
                      <div className="absolute bottom-3 right-14">
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium capitalize">
                          {producto.category.name}
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Card del producto */}
                <div className="h-80 bg-white border border-gray-300 rounded-[40px] shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Contenido */}
                  <div className="flex flex-col gap-4 justify-between p-6 relative top-10">
                    {/* Nombre del producto */}
                    <div className="flex justify-center items-center text-center">
                      <h3 className="text-base 2xl:text-lg text-center font-bold text-blue-600">
                        {producto.name}
                      </h3>
                    </div>

                    {/* Descripción y precio */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex items-center gap-2 text-center mt-2">
                        <span className="text-xs 2xl:text-sm text-gray-600">
                          {producto.description || "Delicioso postre artesanal"}
                        </span>
                      </div>
                      {/* Selector de Tamaño */}
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
                          {/* Precio */}
                          {producto.is_offer ? (
                            <>
                              <span className="text-xl font-bold text-indigo-600">
                                S/{" "}
                                {(
                                  productPrices[producto.id] || precioFinal
                                ).toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                S/ {producto.price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-indigo-600">
                              S/{" "}
                              {(
                                productPrices[producto.id] || producto.price
                              ).toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Botón de agregar */}
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
                                <Ring2Loader
                                  size="20"
                                  stroke="4"
                                  bgOpacity="0.15"
                                  speed="1"
                                  color="#fff"
                                />
                              </div>
                            ) : (
                              <Plus className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="flex flex-col gap-2">
                      {/* Fecha de fin de oferta o tiempo de preparación */}
                      {/* {producto.is_offer && producto.offer_end_date && (
                        <div className="flex items-center justify-center gap-2 text-sm text-red-500 bg-gray-100 px-3 py-1 rounded-full">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">
                            Oferta Finaliza:{" "}
                            {new Date(
                              producto.offer_end_date
                            ).toLocaleDateString("es-PE", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )} */}

                      {/* Stock bajo */}
                      {producto.stock > 0 && producto.stock <= 5 && (
                        <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                          <span className="font-medium">
                            ¡Últimas {producto.stock} unidades!
                          </span>
                        </div>
                      )}

                      {/* Sin stock */}
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

        {/* CTA */}
        <div className="text-center mt-16">
          <Link
            href="/postres"
            className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-8 py-3 cursor-pointer transition-colors duration-300"
          >
            <span>Todos los Productos</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default SpecialOffers;
