"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  Shield,
  Package,
  LockKeyholeIcon,
} from "lucide-react";
import {
  obtenerCarrito,
  actualizarCantidadCarrito,
  eliminarDelCarrito,
  vaciarCarrito,
  type CartItem,
} from "@/app/actions/carrito";
import { createClient } from "@/utils/supabase/client";
import { BiCreditCard } from "react-icons/bi";
import DotWaveLoader from "@/components/loaders/dotWaveLoader";
import { triggerCartUpdate } from "@/utils/cartEvents";
import { LoginModal } from "@/components/loginModal";
import { RegisterModal } from "@/components/registerModal";

export default function CarritoCompras() {
  const router = useRouter();
  const [cart, setCart] = useState<{
    items: CartItem[];
    total_amount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  useEffect(() => {
    checkUserAndLoadCart();
  }, []);

  const checkUserAndLoadCart = async () => {
    try {
      setAuthLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user || null);
      setAuthLoading(false);

      if (session?.user) {
        await loadCart();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Error checking user:", err);
      setAuthLoading(false);
      setLoading(false);
    }
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      const { data, error: cartError } = await obtenerCarrito();

      if (cartError) {
        setError(cartError);
      } else {
        const items = data || [];
        const total = items.reduce(
          (sum, item) => sum + item.unit_price * item.quantity,
          0
        );
        setCart({ items, total_amount: total });
      }
    } catch (err) {
      setError("Error al cargar el carrito");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      const { error } = await actualizarCantidadCarrito(itemId, newQuantity);

      if (error) {
        alert(error);
      } else {
        await loadCart();
        triggerCartUpdate();
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      alert("Error al actualizar cantidad");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!confirm("¿Eliminar este producto del carrito?")) return;

    try {
      const { error } = await eliminarDelCarrito(itemId);

      if (error) {
        alert(error);
      } else {
        await loadCart();
        triggerCartUpdate();
      }
    } catch (err) {
      console.error("Error removing item:", err);
      alert("Error al eliminar producto");
    }
  };

  const handleClearCart = async () => {
    if (!confirm("¿Vaciar todo el carrito?")) return;

    try {
      const { error } = await vaciarCarrito();

      if (error) {
        alert(error);
      } else {
        await loadCart();
        triggerCartUpdate();
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
      alert("Error al vaciar carrito");
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    // Redirigir a la página de verificación de pago
    router.push("/verificacion-de-pago");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(price);
  };

  const calculateDiscount = (price: number, offerPrice: number | null) => {
    if (!offerPrice || offerPrice >= price) return 0;
    return Math.round(((price - offerPrice) / price) * 100);
  };

  const getCategoryName = (product: any) => {
    return product.category?.name || "Sin categoría";
  };

  // Loading state
  if (loading || authLoading) {
    return (
      <section className="w-full min-h-screen flex justify-center items-center">
        <div className="text-center">
          <DotWaveLoader size="55" speed="1" color="#3b82f6" />
          <p className="mt-4 text-gray-700 text-lg">
            {authLoading
              ? "Verificando autenticación..."
              : "Cargando carrito..."}
          </p>
        </div>
      </section>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <>
        <section className="w-full min-h-screen flex justify-center items-center">
          <div className="text-center max-w-md">
            <ShoppingCart className="w-16 h-16 xl:w-20 xl:h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl 2xl:text-3xl font-bold text-gray-700 mb-4">
              Inicia sesión para ver tu carrito
            </h2>
            <p className="text-gray-600 mb-6">
              Necesitas iniciar sesión para agregar productos al carrito
            </p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all"
            >
              Iniciar Sesión
            </button>
          </div>
        </section>
        {/* Authentication Modals */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSwitchToRegister={() => {
            setIsLoginModalOpen(false);
            setIsRegisterModalOpen(true);
          }}
        />
        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSwitchToLogin={() => {
            setIsRegisterModalOpen(false);
            setIsLoginModalOpen(true);
          }}
        />
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="w-full min-h-screen flex justify-center items-center">
        <div className="text-center">
          <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl 2xl:text-3xl font-bold text-gray-700 mb-2">
            Error cargando carrito
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  // Empty cart state
  if (!cart || cart.items.length === 0) {
    return (
      <section className="w-full min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 2xl:w-24 2xl:h-24 bg-indigo-600 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 2xl:w-12 2xl:h-12 text-white" />
              </div>
            </div>

            <h2 className="text-2xl 2xl:text-4xl font-bold text-blue-600 mb-4">
              Tu Carrito está Vacío
            </h2>
            <p className="text-lg 2xl:text-xl font-medium text-gray-600 max-w-3xl mx-auto">
              Descubre nuestros deliciosos productos y agrega algunos a tu
              carrito
            </p>
          </div>

          {/* CTA */}
          <div className="w-full flex justify-center">
            <Link
              href="/postres"
              className="w-fit flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl"
            >
              <Tag className="w-5 h-5" />
              <span className="font-semibold">Explorar Productos</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full max-w-sm md:max-w-xl lg:max-w-4xl 2xl:max-w-6xl mx-auto min-h-screen py-24 2xl:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 lg:mb-12">
          <div className="text-center mb-6">
            <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 2xl:mb-4">
              Tu Carrito de Compras
            </h2>
            <p className="text-base xl:text-lg 2xl:text-xl font-medium text-gray-600 max-w-3xl mx-auto">
              Revisa tus productos antes de finalizar tu pedido
            </p>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos - Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Lista de items */}
              <div className="space-y-4">
                {cart.items.map((item) => {
                  const product = item.product;
                  if (!product) return null;

                  const hasOffer =
                    product.is_offer &&
                    product.offer_price !== null &&
                    product.offer_price > 0;
                  const discount = calculateDiscount(
                    product.price,
                    product.offer_price
                  );
                  const productImage =
                    product.images && product.images.length > 0
                      ? product.images.sort(
                          (a, b) => a.image_order - b.image_order
                        )[0].image_url
                      : null;

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:flex gap-6">
                          {/* Imagen del producto */}
                          <Link
                            href={`/postres/${product.id}`}
                            className="shrink-0 group"
                          >
                            <div className="relative">
                              <div className="w-42 h-42 mx-auto md:w-32 md:h-32 rounded-full overflow-hidden shadow-lg group-hover:scale-105 transition-transform">
                                {productImage ? (
                                  <img
                                    src={productImage}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-linear-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                    <Package className="w-8 h-8 text-blue-400" />
                                  </div>
                                )}
                              </div>

                              {/* Badge de oferta */}
                              {hasOffer && discount > 0 && (
                                <div className="absolute top-0 left-22 md:left-2">
                                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                    -{discount}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Información del producto */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1 pr-2 lg:pr-4">
                                {/* Categoría */}
                                <div className="mb-2">
                                  <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                    {getCategoryName(product)}
                                  </span>
                                </div>

                                {/* Nombre del producto */}
                                <h4 className="text-lg lg:text-xl font-bold text-indigo-600 mb-2 line-clamp-2">
                                  {product.name}
                                </h4>

                                {/* Tamaño */}
                                {item.size && (
                                  <div className="flex flex-col md:flex-row items-start md:items-center md:gap-2 font-medium mb-4">
                                    <p className="font-semibold text-orange-600">
                                      Tamaño:
                                    </p>
                                    <p className="text-xs lg:text-sm px-2 lg:px-4 py-1 bg-orange-600 rounded-full text-white">
                                      {item.size.name} -{" "}
                                      {item.size.person_capacity} personas
                                    </p>
                                  </div>
                                )}

                                {/* Precios */}
                                <div className="flex items-center gap-3">
                                  {hasOffer && product.offer_price ? (
                                    <>
                                      <span className="text-xl lg:text-2xl font-bold text-indigo-600">
                                        {formatPrice(item.unit_price)}
                                      </span>
                                      <span className="text-base lg:text-lg text-gray-500 line-through">
                                        {formatPrice(
                                          product.price +
                                            (item.size?.additional_price || 0)
                                        )}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-xl lg:text-2xl font-bold text-gray-600">
                                      {formatPrice(item.unit_price)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Precio total del item */}
                              <div className="text-right">
                                <p className="text-2xl font-bold text-indigo-600">
                                  {formatPrice(item.quantity * item.unit_price)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                  {item.quantity} ×{" "}
                                  {formatPrice(item.unit_price)}
                                </p>
                              </div>
                            </div>

                            {/* Controles y acciones */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700">
                                  Cantidad:
                                </span>

                                {/* Selector de cantidad */}
                                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-2 border border-gray-200">
                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id,
                                        item.quantity - 1
                                      )
                                    }
                                    disabled={item.quantity === 1}
                                    className="w-6 h-6 md:w-8 md:h-8 cursor-pointer rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>

                                  <span className="w-6 md:w-8 text-center font-bold text-gray-900 text-base md:text-lg">
                                    {item.quantity}
                                  </span>

                                  <button
                                    onClick={() =>
                                      handleQuantityChange(
                                        item.id,
                                        item.quantity + 1
                                      )
                                    }
                                    disabled={item.quantity >= product.stock}
                                    className="w-6 h-6 md:w-8 md:h-8 cursor-pointer rounded-lg bg-white border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Stock info */}
                                {product.stock <= 5 && (
                                  <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                    ¡Solo {product.stock} disponibles!
                                  </span>
                                )}
                              </div>

                              {/* Botón eliminar */}
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="flex items-center gap-2 px-4 py-3 md:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg cursor-pointer"
                                title="Eliminar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="md:flex hidden text-sm font-medium">
                                  Eliminar
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Resumen del pedido - Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Resumen del Pedido
                </h3>

                {/* Detalles del precio */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(cart.total_amount)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Envío:</span>
                    <span className="font-semibold text-green-600">Gratis</span>
                  </div>

                  <div className="flex justify-between items-center text-lg font-bold border-t border-gray-200 pt-4">
                    <span>Total:</span>
                    <span className="text-blue-600 text-xl">
                      {formatPrice(cart.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Botón de checkout */}
                <button
                  onClick={handleCheckout}
                  disabled={isProcessing || cart.items.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 mb-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <BiCreditCard className="w-5 h-5" />
                      Proceder al Pago
                    </>
                  )}
                </button>
                <button
                  onClick={handleClearCart}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-3 mb-4 cursor-pointer"
                >
                  Vaciar Carrito
                </button>

                {/* Garantías */}
                <div className="space-y-3 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Pago 100% seguro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <LockKeyholeIcon className="w-4 h-4 text-blue-600" />
                    <span>Seguridad garantizada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-600" />
                    <span>Entrega priorizada</span>
                  </div>
                </div>

                {/* Ofertas especiales */}
                <div className="p-4 bg-green-50 rounded-xl border-none">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-600" />
                    <p className="text-green-800">Oferta Especial</p>
                  </h4>
                  <p className="text-sm text-green-700">
                    ¡Envío gratis en todos los pedidos!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
