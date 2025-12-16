"use client";

import { useState, useEffect } from "react";
import {
  Cake,
  Calendar,
  MessageSquare,
  CheckCircle,
  User,
  Phone,
  Mail,
  Clock,
  Ruler,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  UserCircle2,
  UserPlus,
} from "lucide-react";
import {
  crearReservacionMultiple,
  obtenerProductosActivos,
} from "@/app/actions/reservaciones";
import { createClient } from "@/utils/supabase/client";
import RingLoader from "@/components/loaders/ringLoader";
import { BiMessageRoundedDetail } from "react-icons/bi";
import { LoginModal } from "@/components/loginModal";
import { RegisterModal } from "@/components/registerModal";
import { useNotyf } from "@/app/providers/NotyfProvider";

interface SizeOption {
  id: string;
  size_id: string;
  is_default: boolean;
  size: {
    id: string;
    name: string;
    person_capacity: number;
    additional_price: number;
  }[];
}

interface Producto {
  id: string;
  name: string;
  price: number;
  preparation_time: number;
  description: string;
  available_sizes?: SizeOption[];
}

interface CartItem {
  product_id: string;
  product_name: string;
  size_id?: string;
  size_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function Reservaciones() {
  const notyf = useNotyf();
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingUser, setLoadingUser] = useState(true); // Nuevo estado
  const [productos, setProductos] = useState<Producto[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  // Reservation Details State
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const supabase = createClient();

  // Cargar datos del usuario y productos
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoadingProducts(true);
        setLoadingUser(true); // Iniciar carga de usuario
        // Obtener usuario actual (auto-refresca sesión si está expirada)
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user:", userError);
          setUser(null);
          setLoadingProducts(false);
          setLoadingUser(false); // Finalizar carga de usuario
          return;
        }

        setUser(user);
        setLoadingUser(false); // Finalizar carga de usuario

        // Obtener productos activos con tamaños
        const { data: productosData } = await obtenerProductosActivos();

        // Transformar datos: Supabase devuelve size como objeto, pero necesitamos array
        const productosTransformados = productosData?.map((producto: any) => ({
          ...producto,
          available_sizes: producto.available_sizes?.map((sizeOpt: any) => ({
            ...sizeOpt,
            size: Array.isArray(sizeOpt.size) ? sizeOpt.size : [sizeOpt.size],
          })),
        }));

        setProductos(productosTransformados || []);

        // Si hay usuario, obtener perfil
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("first_name, last_name, phone, email")
            .eq("id", user.id)
            .single();

          if (profileError) {
            console.error("Error fetching profile:", profileError);
            // Continuar sin datos de perfil
          } else if (profile) {
            setUserProfile(profile);
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    cargarDatos();
  }, [supabase]);

  // Refrescar sesión cuando el usuario vuelve a la pestaña
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible" && !loadingProducts) {
        try {
          // Refrescar sesión cuando la pestaña se vuelve visible
          const {
            data: { user },
            error,
          } = await supabase.auth.getUser();

          if (error) {
            console.error("Error refreshing session:", error);
            setUser(null);
            return;
          }

          if (user) {
            setUser(user);

            // Actualizar perfil si es necesario
            if (!userProfile) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, last_name, phone, email")
                .eq("id", user.id)
                .single();

              if (profile) {
                setUserProfile(profile);
              }
            }
          } else {
            setUser(null);
            setUserProfile(null);
          }
        } catch (error) {
          console.error("Error handling visibility change:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [supabase, loadingProducts, userProfile]);

  // Reset size and quantity when product changes
  useEffect(() => {
    if (selectedProduct) {
      setQuantity(1);
      if (
        selectedProduct.available_sizes &&
        selectedProduct.available_sizes.length > 0
      ) {
        const defaultSize = selectedProduct.available_sizes.find(
          (opt) => opt.is_default
        );
        const initialSizeId =
          defaultSize?.size_id || selectedProduct.available_sizes[0].size_id;
        setSelectedSizeId(initialSizeId);
      } else {
        setSelectedSizeId("");
      }
    }
  }, [selectedProduct]);

  // Generar horarios disponibles
  const generarHorariosDisponibles = () => {
    const horarios = [];
    const horaInicio = 8; // 8:00 AM
    const horaFin = 20; // 8:00 PM

    for (let hora = horaInicio; hora < horaFin; hora++) {
      for (let minuto = 0; minuto < 60; minuto += 30) {
        const tiempo = `${hora.toString().padStart(2, "0")}:${minuto
          .toString()
          .padStart(2, "0")}`;
        horarios.push(tiempo);
      }
    }
    return horarios;
  };

  const horariosDisponibles = generarHorariosDisponibles();

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    const product = productos.find((p) => p.id === productId);
    setSelectedProduct(product || null);
  };

  const calculateItemPrice = () => {
    if (!selectedProduct) return 0;

    let price = selectedProduct.price;

    if (selectedSizeId && selectedProduct.available_sizes) {
      const selectedSize = selectedProduct.available_sizes.find(
        (opt) => opt.size_id === selectedSizeId
      );
      if (selectedSize && selectedSize.size && selectedSize.size[0]) {
        price += selectedSize.size[0].additional_price;
      }
    }

    return price;
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const unitPrice = calculateItemPrice();
    const totalPrice = unitPrice * quantity;

    let sizeName = undefined;
    if (selectedSizeId && selectedProduct.available_sizes) {
      const selectedSize = selectedProduct.available_sizes.find(
        (opt) => opt.size_id === selectedSizeId
      );
      if (selectedSize && selectedSize.size && selectedSize.size[0]) {
        sizeName = `${selectedSize.size[0].name} - ${selectedSize.size[0].person_capacity} personas`;
      }
    }

    const newItem: CartItem = {
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      size_id: selectedSizeId || undefined,
      size_name: sizeName,
      quantity: quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
    };

    setCart([...cart, newItem]);

    // Reset selection
    setSelectedProduct(null);
    setSelectedSizeId("");
    setQuantity(1);
  };

  const removeFromCart = (index: number) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total_price, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (cart.length === 0) {
        notyf?.error("Por favor agrega al menos un producto al carrito");
        return;
      }

      if (!reservationDate || !reservationTime) {
        notyf?.error("Por favor selecciona fecha y hora de recogida");
        return;
      }

      if (!user) {
        notyf?.error("Debes iniciar sesión para hacer una reservación");
        return;
      }

      const reservacionData = {
        customer_id: user.id,
        items: cart,
        reservation_date: reservationDate,
        reservation_time: reservationTime,
        special_requests: specialRequests,
        customer_phone: userProfile?.phone,
        customer_name: userProfile
          ? `${userProfile.first_name} ${userProfile.last_name}`
          : undefined,
      };

      const { error } = await crearReservacionMultiple(reservacionData);

      if (error) throw new Error(error);

      notyf?.success(
        "¡Reservación creada exitosamente! Nos pondremos en contacto contigo."
      );

      // Reset form
      setCart([]);
      setReservationDate("");
      setReservationTime("");
      setSpecialRequests("");
    } catch (error) {
      console.error("Error creando reservación:", error);
      notyf?.error(
        error instanceof Error ? error.message : "Error al crear la reservación"
      );
    } finally {
      setLoading(false);
    }
  };

  // Calcular fecha mínima (hoy) y máxima (3 meses desde hoy)
  const hoy = new Date().toISOString().split("T")[0];
  const fechaMaxima = new Date();
  fechaMaxima.setMonth(fechaMaxima.getMonth() + 3);
  const fechaMaximaStr = fechaMaxima.toISOString().split("T")[0];

  // Mostrar loader mientras se carga el usuario o los productos
  if (loadingUser || loadingProducts) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 h-screen">
        <RingLoader
          size="50"
          stroke="6"
          bgOpacity="0.1"
          speed="1.68"
          color="#3b82f6"
        />
        <p className="text-gray-500">Cargando reservaciones...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <section className="min-h-screen w-full flex flex-col justify-center items-center md:py-24 2xl:py-32">
        <div className="w-full max-w-xs md:max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl">
          <div className="md:grid md:grid-cols-12 2xl:gap-8">
            {/* Columna izquierda - Video */}
            <div className="hidden md:block md:col-span-4">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl h-full min-h-[500px]">
                {/* Video de fondo */}
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  {/* REEMPLAZA ESTA RUTA CON TU VIDEO */}
                  <source src="/videos/creepie-video.mp4" type="video/mp4" />
                  <source src="/videos/creepie-video.webm" type="video/webm" />
                  {/* Fallback si el video no carga */}
                  <div className="absolute inset-0 bg-linear-to-br from-blue-600 to-indigo-700"></div>
                </video>

                {/* Overlay oscuro para mejor contraste */}
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/50 to-transparent"></div>

                {/* Capa adicional para mejorar legibilidad */}
                <div className="absolute inset-0 bg-linear-to-br from-blue-900/30 to-indigo-800/20"></div>

                {/* Contenido sobre el video */}
                <div className="relative h-full flex flex-col justify-center md:p-4 lg:p-8 xl:p-12 text-white">
                  <div className="mb-8">
                    <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold mb-4">
                      Postres que <br />
                      <span className="text-green-300">endulzan momentos</span>
                    </h2>
                    <p className="text-blue-100 opacity-90">
                      Cada pedido es una experiencia personalizada
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {[
                      { icon: "🎂", text: "Postres personalizados" },
                      { icon: "🚚", text: "Entrega programada" },
                      { icon: "⭐", text: "Seguimiento en tiempo real" },
                      { icon: "💝", text: "Sorpresas especiales" },
                    ].map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex md:items-start lg:items-center gap-3"
                      >
                        <span className="md:text-sm lg:text-xl">
                          {feature.icon}
                        </span>
                        <span className="md:text-sm lg:text-base text-white/90 font-medium">
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Formulario de login/registro */}
            <div className="md:col-span-8">
              <div className="h-full">
                <div className="max-w-sm xl:max-w-md mx-auto">
                  {/* Logo */}
                  <div className="text-center mb-8 2xl:mb-10">
                    <div className="inline-flex items-center gap-2 text-2xl 2xl:text-3xl font-bold text-gray-900 mb-2">
                      <Cake className="w-8 h-8 text-blue-600 mb-1" />
                      <span>Creepie</span>
                      <span className="text-blue-600">Reservas</span>
                    </div>
                    <p className="text-sm xl:text-base text-gray-600">
                      Accede a tu cuenta para disfrutar de beneficios exclusivos
                    </p>
                  </div>

                  {/* Card de acceso */}
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl 2xl:text-2xl font-bold text-gray-900 mb-2">
                        Accede a tu cuenta
                      </h3>
                      <p className="text-gray-500">
                        Para realizar reservas y gestionar tus pedidos
                      </p>
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-4">
                      <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="flex items-center justify-center gap-3 w-full bg-linear-to-r from-blue-600 to-indigo-600 text-white py-2 2xl:py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl group cursor-pointer"
                      >
                        <User className="w-4 h-4 mb-0.5" />
                        <span>Iniciar Sesión</span>
                      </button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-3 text-gray-500">
                            ¿Primera vez?
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="flex items-center justify-center gap-3 w-full bg-gray-700 hover:bg-gray-800 text-white py-2 2xl:py-3 px-6 rounded-xl font-semibold transition-all duration-300 group cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 mb-0.5" />
                        <span>Crear Cuenta</span>
                      </button>
                    </div>

                    {/* Beneficios */}
                    <div className="pt-4">
                      <p className="text-sm text-gray-500 mb-3">
                        Al crear una cuenta podrás:
                      </p>
                      <ul className="space-y-2">
                        {[
                          "Programar entregas con anticipación",
                          "Guardar tus pedidos favoritos",
                          "Recibir notificaciones de estado",
                          "Acceder a promociones exclusivas",
                          "Historial completo de compras",
                        ].map((benefit, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-700"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
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
      </section>
    );
  }

  return (
    <section className="min-h-screen max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex flex-col justify-center items-center py-24 2xl:py-32 px-6 xl:px-0">
      {/* HERO / INTRO */}
      <div className="text-center px-4 mb-8 2xl:mb-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 xl:mb-4">
            Haz tu Pedido Especial
          </h2>
          <p className="text-base xl:text-lg 2xl:text-xl text-zinc-600 leading-relaxed">
            Personaliza tu pedido seleccionando tus productos favoritos.
          </p>
        </div>
      </div>

      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-8 gap-4">
          {/* LEFT COLUMN - Product Selection & Cart */}
          <div className="lg:col-span-2 w-full h-full">
            <video
              src="/videos/creepie-video.mp4"
              autoPlay
              loop
              muted
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Product Selection Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-lg xl:text-xl font-bold text-indigo-600 mb-4 flex items-center gap-2">
                <Cake className="w-5 h-5" /> Selecciona tus Productos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-4">
                <div className="col-span-4 flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Producto
                  </label>
                  <select
                    value={selectedProduct?.id || ""}
                    onChange={handleProductChange}
                    className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Seleccionar producto...</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Cantidad
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-full text-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                      min="1"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {selectedProduct?.available_sizes &&
                selectedProduct.available_sizes.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Tamaño
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                      {selectedProduct.available_sizes.map((opt) => (
                        <button
                          key={opt.size_id}
                          onClick={() => setSelectedSizeId(opt.size_id)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            selectedSizeId === opt.size_id
                              ? "bg-blue-600 text-white border-2 border-indigo-400"
                              : "bg-gray-50 border-gray-300 hover:border-indigo-400 text-gray-700"
                          }`}
                        >
                          <div className="text-sm xl:text-base font-medium">
                            {opt.size && opt.size[0]
                              ? opt.size[0].name
                              : "Tamaño"}
                          </div>
                          <div className="text-xs xl:text-sm">
                            {opt.size && opt.size[0]
                              ? `${opt.size[0].person_capacity} personas`
                              : ""}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              <button
                onClick={addToCart}
                disabled={!selectedProduct}
                className="w-full bg-indigo-600 text-white py-2 rounded-xl font-semibold hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5" /> Agregar al Pedido
              </button>
            </div>

            {/* Cart Summary */}
            <div className="h-full bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-lg xl:text-xl font-bold text-indigo-600 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Resumen del Pedido</span>
                </div>
                {cart.length > 0 && (
                  <span className="text-sm font-medium bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                    {cart.length} item{cart.length !== 1 ? "s" : ""}
                  </span>
                )}
              </h3>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-linear-to-b from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-400">
                    Carrito vacío
                  </p>
                  <p className="text-sm mt-1">
                    Agrega productos para continuar
                  </p>
                </div>
              ) : (
                <>
                  {/* Lista de productos con altura limitada */}
                  <div className="relative py-4">
                    {/* Gradiente superior para indicar scroll */}
                    {cart.length > 2 && (
                      <div className="absolute top-0 left-0 right-0 h-6 bg-linear-to-b from-white to-transparent z-10 pointer-events-none rounded-t-xl" />
                    )}

                    {/* Contenedor scrollable */}
                    <div className="max-h-64 overflow-y-auto pr-2 space-y-3 rounded-lg">
                      {cart.map((item, idx) => (
                        <div
                          key={idx}
                          className="group flex justify-between items-start p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              {/* Número de item */}
                              <div className="shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">
                                {idx + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate group-hover:text-indigo-700">
                                  {item.product_name}
                                </h4>
                                {item.size_name && (
                                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                    <Ruler className="w-3 h-3 shrink-0" />
                                    <span className="truncate">
                                      {item.size_name}
                                    </span>
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {item.quantity} unidad
                                    {item.quantity !== 1 ? "es" : ""}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    S/ {item.unit_price.toFixed(2)} c/u
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-3 ml-4">
                            <span className="font-bold text-indigo-600 whitespace-nowrap text-lg">
                              S/ {item.total_price.toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeFromCart(idx)}
                              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 cursor-pointer"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Gradiente inferior para indicar scroll */}
                    {cart.length > 2 && (
                      <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-white to-transparent z-10 pointer-events-none rounded-b-xl" />
                    )}
                  </div>

                  {/* Total final */}
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-lg xl:text-xl font-bold text-gray-900">
                        Total
                      </span>
                      <p className="text-xs text-gray-500 mt-1">IGV incluido</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl xl:text-2xl font-bold text-indigo-600">
                        S/ {cartTotal.toFixed(2)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Precio estimado
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Reservation Details Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 sticky top-8"
            >
              <h3 className="text-lg xl:text-xl font-bold text-indigo-600 mb-4 flex items-center gap-2">
                <BiMessageRoundedDetail className="w-5 h-5" />
                Detalles de Entrega
              </h3>

              {/* Read-Only Contact Info */}
              <div className="space-y-4 mb-6">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 text-gray-400" /> Datos de Contacto
                </label>
                <div className="p-4 bg-gray-50 rounded-xl border border-indigo-100">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <UserCircle2 className="w-3 h-3 text-gray-400" />
                      <span className="font-medium text-xs xl:text-sm">
                        {userProfile
                          ? `${userProfile.first_name} ${userProfile.last_name}`
                          : "Cargando..."}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="w-3 h-3 text-gray-400" />
                      <span className="text-xs xl:text-sm">
                        {userProfile?.phone || "Sin teléfono registrado"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="text-xs xl:text-sm truncate">
                        {userProfile?.email || user?.email}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-indigo-600">
                    * Estos datos se tomarán de tu perfil
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    Fecha de Entrega
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={reservationDate}
                      onChange={(e) => setReservationDate(e.target.value)}
                      min={hoy}
                      max={fechaMaximaStr}
                      className="w-full px-4 py-2 text-sm xl:text-base bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Hora de Entrega
                  </label>
                  <div className="relative">
                    <select
                      value={reservationTime}
                      onChange={(e) => setReservationTime(e.target.value)}
                      className="w-full px-4 py-2 text-sm xl:text-base bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    >
                      <option value="">Seleccionar hora...</option>
                      {horariosDisponibles.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MessageSquare className="w-4 h-4 text-gray-400" />
                  Instrucciones Especiales
                </label>
                <div className="relative">
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-full text-sm xl:text-base resize-none"
                    placeholder="Dedicatorias, alergias, detalles de decoración..."
                  ></textarea>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || cart.length === 0}
                className="w-full bg-indigo-600 text-white py-2 rounded-xl font-medium xl:font-bold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl text-sm xl:text-base flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RingLoader size="20" speed="1" color="#ffffff" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> Confirmar Reservación
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
