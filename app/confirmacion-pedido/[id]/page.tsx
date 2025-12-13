/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  CheckCircle,
  Package,
  Clock,
  MapPin,
  CreditCard,
  ArrowRight,
  Loader,
  Home,
  Eye,
} from "lucide-react";
import { obtenerPedidoPorId, type PedidoCompleto } from "@/app/actions/pedidos";

export default function OrderConfirmationPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<PedidoCompleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const { data, error } = await obtenerPedidoPorId(orderId);

      if (error) {
        throw new Error(error);
      }

      setOrder(data);
    } catch (err) {
      console.error("Error loading order:", err);
      setError(
        err instanceof Error ? err.message : "Error al cargar el pedido"
      );
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-700 text-lg">Cargando información...</p>
        </div>
      </section>
    );
  }

  if (error || !order) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error al cargar el pedido
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "No se pudo encontrar el pedido"}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
          >
            <Home className="w-5 h-5" />
            Volver al Inicio
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen max-w-sm md:max-w-xl lg:max-w-2xl 2xl:max-w-3xl mx-auto py-24 2xl:py-32">
      <div className="container mx-auto px-4">
        <div>
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 2xl:w-20 2xl:h-20 bg-indigo-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 2xl:w-12 2xl:h-12 text-white" />
            </div>
            <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 mb-2">
              ¡Pedido Confirmado!
            </h1>
            <p className="text-base xl:text-lg 2xl:text-xl text-gray-600">
              Tu pedido ha sido procesado exitosamente
            </p>
          </div>

          {/* Order Number */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Número de Pedido</p>
              <p className="text-3xl font-bold text-indigo-600">
                #{order.id.slice(-8).toUpperCase()}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {formatDate(order.created_at)}
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-blue-600 mb-4">
              Detalles del Pedido
            </h2>

            {/* Items */}
            <div className="space-y-4 mb-6">
              {order.items?.map((item: any) => {
                // Obtener la primera imagen del producto
                const productImage =
                  item.products?.images?.[0]?.image_url ||
                  "/images/pastel-1.webp";
                const productName =
                  item.products?.name ||
                  `Producto #${item.product_id.slice(-6)}`;
                const sizeName = item.size?.name || null;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col md:flex-row gap-4 pb-4 border-b border-gray-100 last:border-0"
                  >
                    {/* Imagen del producto */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-600">
                        {productName}
                      </h3>
                      {sizeName && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          Tamaño: {sizeName}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-600 text-sm">
                          {item.quantity} × {formatPrice(item.unit_price)}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-xl md:text-2xl font-semibold text-blue-600">
                Total
              </span>
              <span className="text-xl md:text-2xl font-bold text-blue-600">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg md:text-xl font-bold text-blue-600 mb-4">
              Información de Entrega
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Dirección de Entrega</p>
                  <p className="font-medium text-gray-900">{order.address}</p>
                </div>
              </div>
              {order.estimated_delivery && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Entrega Estimada</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(order.estimated_delivery)}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Método de Pago</p>
                  <p className="font-medium text-gray-900">
                    {order.payment_method || "No especificado"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-green-100 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <Package className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 mb-2">
                  ¿Qué sigue?
                </h3>
                <ul className="space-y-2 text-green-800 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>
                      Recibirás una confirmación por correo electrónico
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>Nuestro equipo comenzará a preparar tu pedido</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span>
                      Podrás hacer seguimiento del estado en tu cuenta
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Link
              href="/mi-cuenta"
              className="flex-1 flex items-center justify-center text-sm md:text-base gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition-all"
            >
              <Eye className="w-4 h-4 md:w-5 md:h-5" />
              Seguimiento
            </Link>
            <Link
              href="/postres"
              className="flex-1 flex items-center justify-center text-sm md:text-base gap-2 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 px-6 py-2 rounded-xl font-medium transition-all"
            >
              Ir a Postres
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
