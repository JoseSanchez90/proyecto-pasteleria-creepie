"use client";

import { useState, useEffect } from "react";
import { obtenerPedidosClienteConImagenes } from "@/app/actions/pedidos";
import DotWaveLoader from "./loaders/dotWaveLoader";
import { formatPrice } from "@/lib/format";
import RingLoader from "./loaders/ringLoader";

// Tipos
type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "on_the_way"
  | "completed"
  | "cancelled";

type Order = {
  id: string;
  customer_id: string;
  total_amount: number;
  status: OrderStatus;
  payment_status: string;
  payment_method: string;
  address: string;
  notes: string;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
};

type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: {
    id: string;
    name: string;
    price: number;
    images: { image_url: string; image_order: number }[];
  };
};

interface OrderTrackingProps {
  userId: string;
}

export default function OrderTracking({ userId }: OrderTrackingProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const { data, error } = await obtenerPedidosClienteConImagenes(userId);

        if (error) {
          console.error("Error loading orders:", error);
          setOrders([]);
        } else {
          setOrders((data as Order[]) || []);
        }
      } catch (error) {
        console.error("Error in loadOrders:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [userId]);

  const getStatusSteps = (currentStatus: OrderStatus) => {
    const steps = [
      { name: "pending" as OrderStatus, label: "Pendiente" },
      { name: "confirmed" as OrderStatus, label: "Confirmado" },
      { name: "preparing" as OrderStatus, label: "En preparación" },
      { name: "on_the_way" as OrderStatus, label: "En camino" },
      { name: "completed" as OrderStatus, label: "Completado" },
    ];

    const stepsCount = steps.length;
    const currentIndex = steps.findIndex((step) => step.name === currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentIndex,
      current: index === currentIndex,
    }));
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      preparing: "En preparación",
      on_the_way: "En camino",
      completed: "Completado",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      on_the_way: "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getProductImage = (product: OrderItem["products"]) => {
    if (product?.images && product.images.length > 0) {
      const sortedImages = [...product.images].sort(
        (a, b) => a.image_order - b.image_order
      );
      return sortedImages[0].image_url;
    }
    return "/images/pastel-1.webp";
  };

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
        <p className="text-gray-500">Cargando Seguimiento de Pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-blue-600">
        Seguimiento de Pedidos
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg border">
          <p className="text-gray-500 mb-4">No tienes pedidos aún.</p>
          <button
            onClick={() => (window.location.href = "/postres")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Hacer mi primer pedido
          </button>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="bg-white rounded-lg shadow border p-6">
            {/* Header del pedido */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold">Pedido #{order.id.slice(-8)}</h3>
                <p className="text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {order.address && (
                  <p className="text-sm text-gray-600 mt-1">
                    📍 {order.address}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold">
                  {formatPrice(order.total_amount)}
                </p>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            {/* Barra de progreso */}
            {order.status !== "cancelled" && (
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  {getStatusSteps(order.status).map((step) => (
                    <div
                      key={step.name}
                      className={`text-xs text-center ${
                        step.completed || step.current
                          ? "text-blue-600 font-medium"
                          : "text-gray-400"
                      }`}
                      style={{
                        width: `${100 / getStatusSteps(order.status).length}%`,
                      }}
                    >
                      {step.label}
                    </div>
                  ))}
                </div>
                <div className="relative flex justify-center items-center left-16 2xl:left-18">
                  {getStatusSteps(order.status).map((step, index, array) => (
                    <div key={step.name} className="flex items-center w-full">
                      <div
                        className={`w-3 h-3 rounded-full z-10 ${
                          step.completed ? "bg-blue-600" : "bg-gray-300"
                        } ${
                          step.current
                            ? "ring-2 ring-blue-600 bg-indigo-600"
                            : "bg-blue-800"
                        }`}
                      />
                      {index < array.length - 1 && (
                        <div
                          className={`w-full h-1 ${
                            step.completed ? "bg-blue-600" : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Productos del pedido */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Productos:</h4>
              <div className="space-y-2">
                {order.order_items?.map((item, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center gap-3"
                  >
                    <img
                      src={getProductImage(item.products)}
                      alt={item.products?.name || "Producto"}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm">
                        {item.products?.name || "Producto"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} x S/. {item.unit_price}
                      </p>
                    </div>
                    <p className="font-medium">S/. {item.subtotal}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Información adicional */}
            <div className="border-t pt-4 mt-4 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Método de pago:</span>
                <span className="font-medium">
                  {order.payment_method || "No especificado"}
                </span>
              </div>
              {order.estimated_delivery && (
                <div className="flex justify-between mt-1">
                  <span>Entrega estimada:</span>
                  <span className="font-medium">
                    {new Date(order.estimated_delivery).toLocaleDateString(
                      "es-ES"
                    )}
                  </span>
                </div>
              )}
              {order.notes && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <span className="font-medium">Notas: </span>
                  {order.notes}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
