"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Clock,
  Package,
  CheckCircle,
  CreditCard,
  MapPin,
  User,
  Edit,
  Plus,
  CheckCircle2Icon,
  Truck,
} from "lucide-react";
import { BiCreditCard } from "react-icons/bi";
import { createClient } from "@/utils/supabase/client";
import {
  obtenerCarrito,
  vaciarCarrito,
  type CartItem,
} from "@/app/actions/carrito";
import { obtenerUsuarioPorId } from "@/app/actions/usuarios";
import {
  obtenerDirecciones,
  type ShippingAddress,
} from "@/app/actions/addresses";
import {
  obtenerMetodosPago,
  type PaymentMethod,
} from "@/app/actions/payment-methods";
import { crearPedido } from "@/app/actions/pedidos";
import EditContactModal from "@/components/EditContactModal";
import AddressModal from "@/components/AddressModal";
import AddPaymentMethodModal from "@/components/AddPaymentMethodModal";
import DotWaveLoader from "@/components/loaders/dotWaveLoader";

function CheckOutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [cart, setCart] = useState<{
    items: CartItem[];
    total_amount: number;
  } | null>(null);
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEditContact, setShowEditContact] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        window.location.href = "/iniciar-sesion";
        return;
      }

      setUser(session.user);

      // Cargar perfil
      const { data: profileData } = await obtenerUsuarioPorId(session.user.id);
      setProfile(profileData);

      // Cargar carrito
      const { data: cartData } = await obtenerCarrito();
      if (cartData) {
        const total = cartData.reduce(
          (sum, item) => sum + item.unit_price * item.quantity,
          0
        );
        setCart({ items: cartData, total_amount: total });
      }

      // Cargar direcciones
      const { data: addressData } = await obtenerDirecciones(session.user.id);
      if (addressData && addressData.length > 0) {
        setAddresses(addressData);
        const defaultAddress = addressData.find((addr) => addr.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress.id);
        }
      } else if (
        profileData &&
        profileData.address &&
        profileData.department &&
        profileData.province &&
        profileData.district
      ) {
        // Si no hay direcciones de envío pero sí hay dirección en el profile, crear una automáticamente
        const { agregarDireccion } = await import("@/app/actions/addresses");
        const { data: newAddress } = await agregarDireccion({
          user_id: session.user.id,
          address_name: "Dirección Principal",
          address: profileData.address,
          department: profileData.department,
          province: profileData.province,
          district: profileData.district,
          reference: "",
          is_default: true,
        });

        if (newAddress) {
          setAddresses([newAddress]);
          setSelectedAddress(newAddress.id);
        }
      }

      // Cargar métodos de pago
      const { data: paymentData } = await obtenerMetodosPago(session.user.id);
      if (paymentData) {
        setPaymentMethods(paymentData);
        const defaultPayment = paymentData.find((pm) => pm.is_default);
        if (defaultPayment) {
          setSelectedPaymentMethod(defaultPayment.id);
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !cart || !selectedAddress) {
      return;
    }

    setIsProcessing(true);

    try {
      // Obtener la dirección seleccionada
      const address = addresses.find((addr) => addr.id === selectedAddress);
      if (!address) {
        throw new Error("Dirección no encontrada");
      }

      // Formatear la dirección completa
      const fullAddress = `${address.address}, ${address.district}, ${
        address.province
      }, ${address.department}${
        address.reference ? ` - Ref: ${address.reference}` : ""
      }`;

      // Preparar los items del pedido
      const orderItems = cart.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        size_id: item.size_id || null,
      }));

      // Determinar el método de pago
      let paymentMethodStr = paymentMethod;
      if (paymentMethod === "card" && selectedPaymentMethod) {
        const selectedCard = paymentMethods.find(
          (pm) => pm.id === selectedPaymentMethod
        );
        if (selectedCard) {
          paymentMethodStr = `${selectedCard.card_type} •••• ${selectedCard.card_last_four}`;
        }
      }

      // Crear el pedido
      const { data: order, error } = await crearPedido({
        customer_id: user.id,
        items: orderItems,
        payment_method: paymentMethodStr,
        address: fullAddress,
        notes: "",
      });

      if (error) {
        throw new Error(error);
      }

      if (!order) {
        throw new Error("No se pudo crear el pedido");
      }

      // Vaciar el carrito
      await vaciarCarrito();

      // Redirigir a la página de confirmación
      router.push(`/confirmacion-pedido/${order.id}`);
    } catch (error) {
      console.error("Error processing order:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Error al procesar el pedido. Por favor, intenta nuevamente."
      );
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <DotWaveLoader size="55" speed="1" color="#3b82f6" />
          <p className="mt-4 text-gray-700 text-lg">Cargando información...</p>
        </div>
      </section>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-600 mb-6">
            Agrega productos antes de proceder al pago
          </p>
          <Link
            href="/postres"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all"
          >
            Ver Productos
          </Link>
        </div>
      </section>
    );
  }

  const selectedAddressData = addresses.find(
    (addr) => addr.id === selectedAddress
  );
  const selectedPaymentData = paymentMethods.find(
    (pm) => pm.id === selectedPaymentMethod
  );

  return (
    <section className="min-h-screen max-w-sm md:max-w-3xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto py-24 2xl:py-32">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 md:mb-2">
            Finalizar Compra
          </h1>
          <p className="text-base xl:text-lg 2xl:text-xl font-medium text-gray-600">
            Completa tu información para procesar el pedido
          </p>
        </div>

        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xl:gap-8">
            {/* Columna izquierda - Información de pago y envío */}
            <div className="space-y-4 xL:space-y-6">
              {/* Información de contacto */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base lg:text-lg xl:text-xl font-bold text-blue-600 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información de Contacto
                  </h2>
                  <button
                    onClick={() => setShowEditContact(true)}
                    className="flex items-center gap-1 xl:gap-2 text-blue-600 hover:text-blue-700 text-xs xl:text-sm font-medium cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm xl:text-base text-gray-600">
                      Correo Electrónico
                    </p>
                    <p className="text-sm xl:text-base font-medium text-gray-900">
                      {profile?.email || "No especificado"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm xl:text-base text-gray-600">
                        Nombres
                      </p>
                      <p className="text-sm xl:text-base font-medium text-gray-900">
                        {profile?.first_name || "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm xl:text-base text-gray-600">
                        Apellidos
                      </p>
                      <p className="text-sm xl:text-base font-medium text-gray-900">
                        {profile?.last_name || "No especificado"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm xl:text-base text-gray-600">DNI</p>
                      <p className="text-sm xl:text-base font-medium text-gray-900">
                        {profile?.dni_ruc || "No especificado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm xl:text-base text-gray-600">
                        Celular
                      </p>
                      <p className="text-sm xl:text-base font-medium text-gray-900">
                        {profile?.phone || "No especificado"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección de envío */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base lg:text-lg xl:text-xl font-bold text-blue-600 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Dirección de Envío
                  </h2>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="flex bg-blu-6 items-center gap-1 xl:gap-2 text-blue-600 lg:hover:bg-blue-600 lg:hover:text-white transition-all duration-300 px-2 xl:px-4 py-2 rounded-lg text-xs xl:text-sm font-medium cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    {addresses.length > 0
                      ? "Agregar dirección"
                      : "Agregar dirección"}
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">
                      No tienes direcciones guardadas
                    </p>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Agregar tu primera dirección
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        onClick={() => setSelectedAddress(address.id)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedAddress === address.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 text-sm xl:text-base">
                            {address.address_name && (
                              <p className="font-semibold text-gray-900 mb-1">
                                {address.address_name}
                              </p>
                            )}
                            <p className="text-sm xl:text-base text-gray-700">
                              {address.address}
                            </p>
                            <p className="text-xs xl:text-sm text-gray-600">
                              {address.district}, {address.province},{" "}
                              {address.department}
                            </p>
                            {address.reference && (
                              <p className="text-xs xl:text-sm text-gray-500 mt-1">
                                Ref: {address.reference}
                              </p>
                            )}
                          </div>
                          {selectedAddress === address.id && (
                            <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Método de pago */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-base lg:text-lg xl:text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Método de Pago
                </h2>
                <div className="space-y-4">
                  {/* Tarjeta de crédito/débito */}
                  <div
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "card"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <BiCreditCard className="w-6 h-6 text-gray-600" />
                    <div className="flex-1">
                      <p className="text-sm xl:text-base font-semibold text-gray-900">
                        Tarjeta de Crédito/Débito
                      </p>
                      <p className="text-xs xl:text-sm text-gray-600">
                        Pago seguro con tarjeta
                      </p>
                    </div>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="ml-4 pl-4 space-y-3">
                      {paymentMethods.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                          <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-600 mb-3">
                            No tienes métodos de pago guardados
                          </p>
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                          >
                            Agregar método de pago
                          </button>
                        </div>
                      ) : (
                        <>
                          {paymentMethods.map((pm) => (
                            <div
                              key={pm.id}
                              onClick={() => setSelectedPaymentMethod(pm.id)}
                              className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                                selectedPaymentMethod === pm.id
                                  ? "border-blue-300 bg-white"
                                  : "border-gray-200 hover:border-blue-300"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs xl:text-sm font-medium text-gray-900 capitalize">
                                    {pm.card_type} •••• {pm.card_last_four}
                                  </p>
                                  <p className="text-xs xl:text-sm text-gray-600">
                                    {pm.card_holder_name}
                                  </p>
                                </div>
                                {selectedPaymentMethod === pm.id && (
                                  <CheckCircle className="w-5 h-5 text-blue-400" />
                                )}
                              </div>
                            </div>
                          ))}
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 rounded-lg flex items-center justify-center gap-2 py-2 text-sm font-medium cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar otra tarjeta
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Yape */}
                  <div
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "yape"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("yape")}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="yape"
                      checked={paymentMethod === "yape"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Y</span>
                    </div>
                    <div>
                      <p className="text-sm xl:text-base font-semibold text-gray-900">
                        Yape
                      </p>
                      <p className="text-xs xl:text-sm text-gray-600">
                        Pago rápido y seguro
                      </p>
                    </div>
                  </div>

                  {/* Plin */}
                  <div
                    className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMethod === "plin"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                    onClick={() => setPaymentMethod("plin")}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value="plin"
                      checked={paymentMethod === "plin"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <div>
                      <p className="text-sm xl:text-base font-semibold text-gray-900">
                        Plin
                      </p>
                      <p className="text-xs xl:text-sm text-gray-600">
                        Pago rápido y seguro
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Resumen del pedido */}
            <div className="space-y-4 xl:space-y-6">
              {/* Resumen del pedido */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-6">
                <h2 className="text-lg xl:text-xl font-bold text-blue-600 mb-6">
                  Resumen del Pedido
                </h2>

                {/* Items del carrito */}
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => {
                    const product = item.product;
                    if (!product) return null;

                    const productImage =
                      product.images && product.images.length > 0
                        ? product.images.sort(
                            (a, b) => a.image_order - b.image_order
                          )[0].image_url
                        : null;

                    return (
                      <div
                        key={item.id}
                        className="flex gap-4 pb-4 border-b border-gray-100"
                      >
                        <div className="w-16 h-16 bg-gray-200 rounded-lg shrink-0">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={product.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                            {product.name}
                          </h3>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-gray-600 text-sm">
                              {item.quantity} × {formatPrice(item.unit_price)}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {formatPrice(item.unit_price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desglose de precios */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(cart.total_amount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Envío</span>
                    <span className="text-green-600">Gratis</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-4">
                    <span>Total</span>
                    <span className="text-blue-600">
                      {formatPrice(cart.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Botón de pago */}
                <button
                  onClick={handleSubmit}
                  disabled={
                    isProcessing ||
                    !selectedAddress ||
                    (paymentMethod === "card" && !selectedPaymentMethod)
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm xl:text-base cursor-pointer gap-3 mb-6"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando Pago...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Confirmar y Pagar
                    </>
                  )}
                </button>

                {/* Garantías */}
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Pago 100% seguro y encriptado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Preparación personalizada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-orange-600" />
                    <span>Entrega a domicilio</span>
                  </div>
                </div>

                {/* Información de seguridad */}
                <div className="bg-green-100 rounded-2xl p-6 mt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2Icon className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-600 mb-2">
                        Compra Protegida
                      </h3>
                      <p className="text-green-700 text-sm">
                        Tu información está protegida con encriptación de última
                        generación. Garantizamos la seguridad de tus datos y tu
                        pago.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditContact && profile && (
        <EditContactModal
          userId={user.id}
          initialData={{
            first_name: profile.first_name,
            last_name: profile.last_name,
            dni_ruc: profile.dni_ruc,
            phone: profile.phone,
            email: profile.email,
          }}
          onClose={() => setShowEditContact(false)}
          onSuccess={() => {
            setShowEditContact(false);
            loadData();
          }}
        />
      )}

      {showAddressModal && (
        <AddressModal
          userId={user.id}
          onClose={() => setShowAddressModal(false)}
          onSuccess={() => {
            setShowAddressModal(false);
            loadData();
          }}
        />
      )}

      {showPaymentModal && (
        <AddPaymentMethodModal
          userId={user.id}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadData();
          }}
        />
      )}
    </section>
  );
}

export default CheckOutPage;
