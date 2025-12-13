"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Clock,
  Tag,
  Plus,
  Minus,
  Star,
  ShoppingCart,
  Package,
  Loader2,
} from "lucide-react";
import {
  obtenerProductoPorSlug,
  obtenerProductosRelacionados,
} from "@/app/actions/productos";
import type {
  ProductoCompleto,
  ProductoConCategoria,
} from "@/app/actions/productos";
import { agregarAlCarrito } from "@/app/actions/carrito";
import { generarSlug } from "@/utils/slugify";
import DotWaveLoader from "@/components/loaders/dotWaveLoader";
import SizeSelector from "@/components/SizeSelector";
import { formatPrice } from "@/lib/format";
import { triggerCartUpdate } from "@/utils/cartEvents";

export default function PostreDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: slug } = use(params);
  const [producto, setProducto] = useState<ProductoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [cantidad, setCantidad] = useState(1);
  const [imagenActual, setImagenActual] = useState(0);
  const [agregandoCarrito, setAgregandoCarrito] = useState(false);
  const [productosRelacionados, setProductosRelacionados] = useState<
    ProductoConCategoria[]
  >([]);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [selectedSizes, setSelectedSizes] = useState<
    Record<string, string | null>
  >({});
  const [productPrices, setProductPrices] = useState<Record<string, number>>(
    {}
  );
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        setLoading(true);
        const { data, error } = await obtenerProductoPorSlug(slug);

        if (error || !data) {
          setProducto(null);
        } else {
          setProducto(data);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setProducto(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [slug]);

  // Obtener productos relacionados cuando se carga el producto
  useEffect(() => {
    const fetchRelacionados = async () => {
      if (producto?.category_id) {
        const { data } = await obtenerProductosRelacionados(
          producto.id,
          producto.category_id,
          3
        );
        if (data) {
          setProductosRelacionados(data);
        }
      }
    };

    fetchRelacionados();
  }, [producto]);

  // Calcular el porcentaje de descuento
  const calcularDescuento = () => {
    if (!producto || !producto.is_offer || !producto.offer_price) return 0;
    if (producto.offer_price >= producto.price) return 0;
    return Math.round(
      ((producto.price - producto.offer_price) / producto.price) * 100
    );
  };

  // Calcular días restantes de oferta
  const calcularDiasRestantes = () => {
    if (!producto?.offer_end_date) return null;
    const hoy = new Date();
    const fechaFin = new Date(producto.offer_end_date);
    const diferencia = fechaFin.getTime() - hoy.getTime();
    const dias = Math.ceil(diferencia / (1000 * 60 * 60 * 24));
    return dias > 0 ? dias : 0;
  };

  // Obtener imágenes ordenadas
  const obtenerImagenes = () => {
    if (!producto?.images || producto.images.length === 0) {
      return ["/images/pastel-1.webp"];
    }
    return [...producto.images]
      .sort((a, b) => a.image_order - b.image_order)
      .map((img) => img.image_url);
  };

  // manejar agregar al carrito
  const handleAddToCart = async (productId: string) => {
    if (!producto) return;

    // Verificar si el producto tiene tallas y si se ha seleccionado una
    if (
      producto.available_sizes &&
      producto.available_sizes.length > 0 &&
      !selectedSizes[productId] &&
      !selectedSizeId
    ) {
      alert("Por favor selecciona un tamaño");
      return;
    }

    try {
      setAddingToCart(productId);
      // Usar selectedSizeId para el producto principal o buscar en selectedSizes map (para relacionados)
      const sizeId =
        productId === producto.id
          ? selectedSizeId
          : selectedSizes[productId] || null;

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
      <section className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <DotWaveLoader size="55" speed="1" color="#3b82f6" />
          <p className="mt-4 text-gray-600 text-lg">Cargando producto...</p>
        </div>
      </section>
    );
  }

  if (!producto) {
    return (
      <section className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <Tag className="w-20 h-20 text-gray-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-700 mb-2">
            Producto no encontrado
          </h2>
          <Link
            href="/postres"
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg inline-block mt-4"
          >
            Volver a Productos
          </Link>
        </div>
      </section>
    );
  }

  const imagenes = obtenerImagenes();
  const descuento = calcularDescuento();
  const diasRestantes = calcularDiasRestantes();
  const precioFinal = producto.is_offer ? producto.offer_price : producto.price;
  const stockDisponible = producto.stock > 0;

  return (
    <section className="w-full min-h-screen max-w-xs md:max-w-xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto py-24 2xl:py-32">
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Galería de imágenes */}
          <div className="space-y-6">
            {/* Imagen principal */}
            <div>
              <div className="relative flex justify-center items-center">
                <img
                  src={imagenes[imagenActual]}
                  alt={producto.name}
                  className="w-60 h-60 lg:w-70 lg:h-70 xl:w-75 xl:h-75 2xl:w-100 2xl:h-100 object-cover rounded-full"
                />

                {/* Badge de oferta */}
                {producto.is_offer && descuento > 0 && (
                  <div className="absolute top-4 left-35">
                    <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                      -{descuento}%
                    </span>
                  </div>
                )}

                {/* Indicador de galería */}
                {imagenes.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                    {imagenActual + 1} / {imagenes.length}
                  </div>
                )}
              </div>
            </div>

            {/* Miniaturas - solo mostrar si hay más de 1 imagen */}
            {imagenes.length > 1 && (
              <div className="flex justify-center gap-4">
                {imagenes.map((imagen, index) => (
                  <button
                    key={index}
                    onClick={() => setImagenActual(index)}
                    className={`w-14 h-14 xl:-20 xl:h-20 rounded-full border-2 overflow-hidden transition-all cursor-pointer ${
                      imagenActual === index
                        ? "border-blue-500 scale-110"
                        : "border-gray-300 hover:border-blue-300"
                    }`}
                  >
                    <img
                      src={imagen}
                      alt={`${producto.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div className="space-y-2 2xl:space-y-6">
            {/* Categoría */}
            {producto.category && (
              <div className="inline-block bg-blue-600 text-white px-4 py-1 2xl:py-2 rounded-full text-sm font-semibold">
                {producto.category.name}
              </div>
            )}

            {/* Nombre */}
            <h1 className="text-2xl xl:text-3xl 2xl:text-5xl font-bold text-gray-800">
              {producto.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <span className="text-gray-600">(4.8 • 124 reseñas)</span>
            </div>

            {/* Descripción */}
            <p className="text-base xl:text-lg text-gray-700 leading-relaxed">
              {producto.description || "Delicioso producto artesanal"}
            </p>

            <div className="grid grid-cols-2 gap-4 md:gap-24 lg:gap-12 mb-4">
              {/* Selector de Tamaño */}
              {producto.available_sizes &&
              producto.available_sizes.length > 0 ? (
                <div className="w-full">
                  <SizeSelector
                    availableSizes={producto.available_sizes}
                    basePrice={producto.price}
                    isOffer={producto.is_offer}
                    offerPrice={producto.offer_price}
                    onSizeChange={(sizeId, totalPrice) => {
                      setSelectedSizeId(sizeId);
                      setCurrentPrice(totalPrice);
                    }}
                    disabled={agregandoCarrito}
                  />
                </div>
              ) : (
                <div className="w-full text-center py-2 bg-white border border-gray-300 rounded-lg">
                  <span className="text-base font-semibold text-gray-800">
                    Tamaño único
                  </span>
                </div>
              )}

              {/* Tiempo de cocción */}
              {producto.preparation_time ? (
                <div className="w-full flex flex-col justify-center items-center gap-1">
                  <span className="text-sm font-medium text-indigo-600">
                    Tiempo de cocción
                  </span>
                  <div className="w-full h-full items-center justify-center text-center py-1.5 bg-white border border-gray-300 rounded-lg">
                    <span className="text-sm font-semibold text-gray-800">
                      {producto.preparation_time} minutos
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col justify-center items-center gap-1">
                  <span className="text-sm font-medium text-indigo-600">
                    Tiempo de cocción:
                  </span>
                  <div className="w-full h-full items-center justify-center text-center py-1.5 bg-white border border-gray-300 rounded-lg">
                    <span className="text-sm font-semibold text-gray-800">
                      No disponible
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Precio y oferta */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {producto.is_offer ? (
                  <>
                    <span className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600">
                      {formatPrice(currentPrice || precioFinal)}
                    </span>
                    <span className="text-xl 2xl:text-2xl text-gray-600 line-through">
                      {formatPrice(producto.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600">
                    {formatPrice(currentPrice || producto.price)}
                  </span>
                )}
              </div>

              {/* Tiempo restante de oferta */}
              {producto.is_offer &&
                diasRestantes !== null &&
                diasRestantes > 0 && (
                  <div className="flex items-center gap-2 text-red-600 font-semibold mb-4">
                    <Clock className="w-5 h-5" />
                    <span>
                      Oferta termina en: {diasRestantes}{" "}
                      {diasRestantes === 1 ? "día" : "días"}
                    </span>
                  </div>
                )}
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-semibold text-gray-700">
                    Cantidad:
                  </span>
                  <div className="flex items-center gap-3 bg-white rounded-full px-2 xl:px-4 py-2 border border-gray-300">
                    <button
                      onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      disabled={cantidad <= 1}
                      className="p-1 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-5 h-5 text-blue-600" />
                    </button>
                    <span className="text-xl font-bold text-gray-800 w-8 text-center">
                      {cantidad}
                    </span>
                    <button
                      onClick={() =>
                        setCantidad(Math.min(producto.stock, cantidad + 1))
                      }
                      disabled={cantidad >= producto.stock}
                      className="p-1 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-5 h-5 text-blue-600" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleAddToCart(producto.id)}
                    disabled={!stockDisponible || addingToCart === producto.id}
                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-3 xl:px-8 rounded-2xl font-semibold text-sm xl:text-base 2xl:text-lg transition-all ${
                      stockDisponible
                        ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    } disabled:opacity-50`}
                  >
                    {addingToCart === producto.id ? (
                      <>
                        <Loader2 className="w-4 h-4 xl:w-5 xl:h-5 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4 xl:w-5 xl:h-5" />
                        {stockDisponible ? "Agregar al Carrito" : "Sin Stock"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Mensaje de stock bajo */}
              {stockDisponible && producto.stock <= 5 && (
                <div className="text-center">
                  <span className="text-sm font-semibold text-amber-600 flex items-center justify-center gap-2">
                    <Package className="w-4 h-4" />
                    ¡Solo {producto.stock} unidades disponibles!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de productos relacionados */}
        {productosRelacionados.length > 0 && (
          <div className="mt-18 xl:mt-22 2xl:mt-26">
            <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 mb-8 text-center">
              Productos Relacionados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 xl:gap-24 2xl:gap-6">
              {productosRelacionados.map((productoRelacionado) => {
                const descuentoRelacionado =
                  productoRelacionado.is_offer &&
                  productoRelacionado.offer_price
                    ? Math.round(
                        ((productoRelacionado.price -
                          productoRelacionado.offer_price) /
                          productoRelacionado.price) *
                          100
                      )
                    : 0;

                const imagenRelacionada =
                  productoRelacionado.images &&
                  productoRelacionado.images.length > 0
                    ? [...productoRelacionado.images].sort(
                        (a, b) => a.image_order - b.image_order
                      )[0].image_url
                    : "/images/pastel-1.webp";

                const precioFinalRelacionado = productoRelacionado.is_offer
                  ? productoRelacionado.offer_price
                  : productoRelacionado.price;

                return (
                  <div
                    key={productoRelacionado.id}
                    className="flex flex-col group"
                  >
                    {/* Imagen del producto */}
                    <Link
                      href={`/postres/${generarSlug(productoRelacionado.name)}`}
                    >
                      <div className="relative flex justify-center items-center top-14 z-10">
                        <img
                          src={imagenRelacionada}
                          alt={productoRelacionado.name}
                          className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Badge de oferta */}
                        {productoRelacionado.is_offer &&
                          descuentoRelacionado > 0 && (
                            <div className="absolute top-3 left-12">
                              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                -{descuentoRelacionado}%
                              </span>
                            </div>
                          )}

                        {/* Badge de categoría */}
                        {productoRelacionado.category && (
                          <div className="absolute bottom-3 right-10">
                            <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium capitalize">
                              {productoRelacionado.category.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Card del producto */}
                    <div className="h-80 bg-white border border-gray-300 rounded-[40px] shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                      {/* Contenido */}
                      <div className="flex flex-col gap-4 justify-between p-6 relative top-14">
                        {/* Nombre del producto */}
                        <div className="flex justify-center items-start text-center">
                          <h3 className="text-base 2xl:text-lg text-center font-bold text-blue-600">
                            {productoRelacionado.name}
                          </h3>
                        </div>

                        {/* Descripción y precio */}
                        <div className="flex flex-col items-start gap-4">
                          <div className="flex items-center gap-2 text-center mt-2">
                            <span className="text-xs 2xl:text-sm text-gray-600">
                              {productoRelacionado.description}
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

                          <div className="w-full h-full flex justify-between items-end">
                            <div className="flex items-center gap-4">
                              {/* Precio */}
                              {productoRelacionado.is_offer ? (
                                <>
                                  <span className="text-xl font-bold text-indigo-600">
                                    S/ {precioFinalRelacionado.toFixed(2)}
                                  </span>
                                  <span className="text-sm text-gray-500 line-through">
                                    S/ {productoRelacionado.price.toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl font-bold text-indigo-600">
                                  S/ {productoRelacionado.price.toFixed(2)}
                                </span>
                              )}
                            </div>

                            {/* Botón de ver detalles */}
                            <Link
                              href={`/postres/${generarSlug(
                                productoRelacionado.name
                              )}`}
                              className="bg-indigo-600 p-2 rounded-full transition-all duration-200 flex items-center justify-center gap-2 font-semibold cursor-pointer hover:bg-indigo-700 hover:shadow-lg"
                            >
                              <Plus className="w-5 h-5 text-white" />
                            </Link>
                          </div>
                        </div>

                        {/* Stock bajo */}
                        {productoRelacionado.stock > 0 &&
                          productoRelacionado.stock <= 5 && (
                            <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                              <span className="font-medium">
                                ¡Últimas {productoRelacionado.stock} unidades!
                              </span>
                            </div>
                          )}

                        {/* Sin stock */}
                        {productoRelacionado.stock === 0 && (
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            <span className="font-medium">
                              Agotado temporalmente
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
