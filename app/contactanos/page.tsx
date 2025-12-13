"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { BsWhatsapp } from "react-icons/bs";

export default function ContactanosPage() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="w-full min-h-screen max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto flex flex-col items-center justify-center py-24 2xl:py-32">
      {/* HERO */}
      <section className="mb-10 2xl:mb-16 text-center">
        <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-blue-600 mb-2 xl:mb-4">
          Contáctanos
        </h1>
        <p className="text-zinc-600 text-base xl:text-lg 2xl:text-xl max-w-xl 2xl:max-w-2xl mx-auto">
          Estamos aquí para ayudarte con pedidos, cotizaciones,
          personalizaciones y consultas sobre nuestros productos.
        </p>
      </section>

      {/* GRID PRINCIPAL */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 pb-20">
        {/* FORMULARIO */}
        <div className="bg-white rounded-4xl shadow-md p-6 lg:p-8 border border-indigo-100">
          <h2 className="text-lg lg:text-xl 2xl:text-2xl font-semibold mb-6 text-zinc-800">
            Envíanos un mensaje
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm lg:text-base mb-1 text-zinc-700 font-medium">
                Nombre
              </label>
              <input
                type="text"
                className="w-full text-sm lg:text-base border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-600 transition"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm lg:text-base mb-1 text-zinc-700 font-medium">
                Correo
              </label>
              <input
                type="email"
                className="w-full text-sm lg:text-base border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-600 transition"
                placeholder="ejemplo@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm lg:text-base mb-1 text-zinc-700 font-medium">
                Asunto
              </label>
              <select className="w-full text-sm lg:text-base border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-600 transition">
                <option>Consulta general</option>
                <option>Pedido personalizado</option>
                <option>Cotización de evento</option>
              </select>
            </div>

            <div>
              <label className="block text-sm lg:text-base mb-1 text-zinc-700 font-medium">
                Mensaje
              </label>
              <textarea
                rows={3}
                className="w-full text-sm lg:text-base border border-zinc-300 rounded-xl p-3 outline-none focus:border-indigo-600 transition resize-none"
                placeholder="Escribe tu mensaje aquí..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-sm lg:text-base bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-xl transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex justify-center items-center gap-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Enviando...
                </div>
              ) : (
                <div className="flex justify-center items-center gap-4">
                  <Send className="w-5 h-5" />
                  Enviar mensaje
                </div>
              )}
            </button>
          </form>
        </div>

        {/* PANEL DERECHO CREATIVO */}
        <div className="flex flex-col gap-4 lg:gap-6">
          {/* Caja 1 */}
          <div className="bg-indigo-600 text-white rounded-4xl p-6 lg:p-8 shadow-lg">
            <h3 className="text-base lg:text-xl 2xl:text-2xl font-semibold mb-2">
              Atención inmediata
            </h3>
            <p className="text-sm lg:text-base text-white/90">
              Escríbenos para pedidos urgentes o consultas rápidas, hablemos
              ahora:
            </p>

            <div className="mt-4">
              <a
                href="#"
                className="flex justify-center items-center gap-3 text-sm lg:text-base bg-white text-indigo-600 py-2 rounded-xl font-semibold hover:bg-indigo-50 transition"
              >
                <BsWhatsapp className="w-5 h-5" />
                WhatsApp
              </a>
            </div>
          </div>
          {/* Caja 2 */}
          <div className="bg-white rounded-4xl p-6 lg:p-8 shadow-md border border-indigo-100">
            <h3 className="text-base lg:text-xl font-semibold mb-3 text-zinc-800">
              ¿Necesitas una cotización?
            </h3>
            <p className="text-sm lg:text-base text-zinc-600">
              Puedes solicitarnos precios para tortas personalizadas, eventos,
              bocaditos o combos especiales. Respuesta en 5 a 15 minutos.
            </p>
          </div>
          {/* Caja 3 */}
          <div className="bg-indigo-600 text-white rounded-4xl p-6 lg:p-8 shadow-md">
            <h3 className="text-base lg:text-xl font-semibold mb-3">
              Preparación Personalizada
            </h3>
            <p className="text-sm lg:text-base text-white/90">
              Ideal para reuniones, empresas o eventos grandes. Podemos preparar
              tortas, bocaditos y pasteles en cantidades grandes y con entrega
              programada.
            </p>
          </div>
        </div>
      </section>

      {/* NUEVA SECCIÓN: PREGUNTAS FRECUENTES */}
      <section className="w-full max-w-xl 2xl:max-w-3xl mx-auto lg:pb-20">
        <h2 className="text-2xl xl:text-3xl font-bold text-blue-600 mb-8 text-center">
          Preguntas Frecuentes
        </h2>

        <div className="space-y-4">
          {/* Item */}
          <details className="group bg-white border border-indigo-100 rounded-xl p-5 shadow-sm cursor-pointer">
            <summary className="font-medium text-zinc-800 cursor-pointer">
              ¿Con cuánta anticipación debo pedir una torta?
            </summary>
            <p className="pt-3 text-zinc-600">
              Recomendamos 24h antes, pero depende del diseño.
            </p>
          </details>

          <details className="group bg-white border border-indigo-100 rounded-xl p-5 shadow-sm cursor-pointer">
            <summary className="font-medium text-zinc-800 cursor-pointer">
              ¿Hacen entregas a domicilio?
            </summary>
            <p className="pt-3 text-zinc-600">
              Sí, dentro de Lima / Callao. Costo según distrito.
            </p>
          </details>

          <details className="group bg-white border border-indigo-100 rounded-xl p-5 shadow-sm cursor-pointer">
            <summary className="font-medium text-zinc-800 cursor-pointer">
              ¿Hacen combos para eventos?
            </summary>
            <p className="pt-3 text-zinc-600">
              Sí, tortas + bocaditos para 5, 10, 15, 20 y 25 personas.
            </p>
          </details>
        </div>
      </section>
    </div>
  );
}
