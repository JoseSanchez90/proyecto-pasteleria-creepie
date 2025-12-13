// components/Notifications.tsx
"use client";

import { useEffect, useState } from "react";
import { Bell, X, Loader } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
} from "@/app/actions/notifications";
import { FaCheckCircle, FaClock, FaTruck } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { RiForbid2Fill } from "react-icons/ri";
import { PiBellBold } from "react-icons/pi";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

export default function Notifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        loadNotifications();
        loadUnreadCount();
      }
    };

    checkUser();

    // Escuchar cambios de autenticación
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadNotifications();
        loadUnreadCount();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Suscribirse a cambios en notificaciones en tiempo real
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const channel = supabase
      .channel("notifications-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Cambio en notificaciones:", payload);
          loadNotifications();
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await getNotifications(20);
      if (!error && data) {
        setNotifications(data);
      }
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const { count, error } = await getUnreadCount();
      if (!error) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error("Error loading unread count:", err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      loadNotifications();
      loadUnreadCount();
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setLoading(true);
      await markAllNotificationsAsRead();
      loadNotifications();
      loadUnreadCount();
    } catch (err) {
      console.error("Error marking all as read:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setLoadingDelete(true);
      await deleteNotification(notificationId);
      loadNotifications();
    } catch (error) {
      console.error("Error al eliminar la notificación:", error);
    } finally {
      setLoadingDelete(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      // Iconos para Reservaciones
      case "reservation_confirmed":
        return <FaCheckCircle className="w-5 h-5 text-green-600" />;
      case "reservation_completed":
        return <FaStar className="w-5 h-5 text-yellow-600" />;
      case "reservation_preparing":
        return <FaClock className="w-5 h-5 text-amber-900" />;
      case "reservation_on_the_way":
        return <FaTruck className="w-5 h-5 text-indigo-600" />;
      case "reservation_cancelled":
        return <RiForbid2Fill className="w-5 h-5 text-red-600" />;

      // Iconos para Pedidos (Orders)
      case "order_confirmed":
        return <FaCheckCircle className="w-5 h-5 text-green-600" />;
      case "order_preparing":
        return <FaClock className="w-5 h-5 text-amber-900" />;
      case "order_on_the_way":
        return <FaTruck className="w-5 h-5 text-indigo-600" />;
      case "order_completed":
        return <FaStar className="w-5 h-5 text-yellow-600" />;
      case "order_cancelled":
        return <RiForbid2Fill className="w-5 h-5 text-red-600" />;

      default:
        return <Bell className="w-5 h-5 text-purple-600" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Ahora";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    return date.toLocaleDateString("es-PE");
  };

  // Si no hay usuario, no renderizar el componente
  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="relative cursor-pointer p-2"
        title="Notificaciones"
      >
        {isOpen ? (
          <PiBellBold className="w-5 h-5 text-blue-600" />
        ) : (
          <PiBellBold className="w-5 h-5 text-zinc-600" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader className="w-4 h-4 text-indigo-600 animate-spin" />
          </div>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      <div
        className={`absolute right-0 top-full mt-2 z-50 transition-all duration-300 ${
          isOpen
            ? "opacity-100 translate-y-0 visible"
            : "opacity-0 -translate-y-2 invisible"
        }`}
      >
        <div className="w-80 xl:w-96 bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header con animación suave */}
          <div
            className={`px-4 py-3 flex justify-between items-center transition-all duration-300 ${
              isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
            }`}
          >
            <div>
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-500">
                  {unreadCount} no leída{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-600 hover:bg-gray-100 p-2 transition-all duration-200 rounded-lg cursor-pointer hover:scale-110 active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div
                className={`p-8 text-center text-gray-500 transition-all duration-300 ${
                  isOpen ? "opacity-100" : "opacity-0"
                }`}
              >
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <div className="p-1">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`flex gap-6 p-4 border-b border-gray-100 hover:bg-gray-50 transition-all duration-300 cursor-pointer transform ${
                      !notification.is_read ? "bg-blue-50" : ""
                    } ${
                      isOpen
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0"
                    }`}
                    onClick={() => handleMarkAsRead(notification.id)}
                    style={{
                      transitionDelay: isOpen ? `${index * 0.1}s` : "0s",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`text-2xl shrink-0 ${
                          !notification.is_read ? "animate-pulse" : ""
                        }`}
                      >
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`text-sm font-medium ${
                              !notification.is_read
                                ? "text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full shrink-0 mt-1 animate-ping"></span>
                          )}
                        </div>
                        <p className="text-xs xl:text-sm text-gray-600 mt-1 ">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="h-full relative -top-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-all duration-200 rounded cursor-pointer hover:scale-110 active:scale-95"
                      >
                        {loadingDelete ? (
                          <Loader size={20} className="animate-spin" />
                        ) : (
                          <X size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para cerrar al hacer click fuera */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
