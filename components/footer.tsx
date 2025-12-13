// components/Footer.tsx
import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { BsFacebook, BsInstagram } from "react-icons/bs";
import clsx from "clsx";
import { pacifico } from "@/lib/fonts";

export default function Footer() {
  return (
    <footer className="bg-blue-800 text-white pb-14 lg:pb-0">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link
              href="/"
              className={clsx(
                "text-2xl xl:text-3xl font-bold text-white mb-4 inline-block",
                pacifico.className
              )}
            >
              Creepie
            </Link>
            <p className="text-blue-200 mb-6 leading-relaxed">
              Creando momentos dulces e inolvidables con nuestros postres
              artesanales. Calidad y sabor en cada bocado.
            </p>
            <div className="flex space-x-4">
              <a href="#">
                <BsFacebook className="w-5 h-5" />
              </a>
              <a href="#">
                <BsInstagram className="w-5 h-5" />
              </a>
              <a href="#"></a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              Enlaces Rápidos
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Inicio
                </Link>
              </li>
              <li>
                <Link
                  href="/postres"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Nuestros Postres
                </Link>
              </li>
              <li>
                <Link
                  href="/ofertas"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Ofertas Especiales
                </Link>
              </li>
              <li>
                <Link
                  href="/nosotros"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  href="/contacto"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">
              Categorías
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/categoria/tortas"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Tortas Personalizadas
                </Link>
              </li>
              <li>
                <Link
                  href="/categoria/cupcakes"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Cupcakes
                </Link>
              </li>
              <li>
                <Link
                  href="/categoria/galletas"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Galletas Decoradas
                </Link>
              </li>
              <li>
                <Link
                  href="/categoria/postres"
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  Postres Individuales
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white">Contacto</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-300" />
                <span className="text-blue-200">
                  Av. Principal 123, Lima, Perú
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-300" />
                <span className="text-blue-200">+51 987 654 321</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-300" />
                <span className="text-blue-200">hola@creepie.com</span>
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3 text-white">
                Recibe Nuestras Ofertas
              </h4>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Tu correo electrónico"
                  className="flex-1 px-3 py-2 bg-white border border-blue-600 rounded-l-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-r-lg transition-colors text-sm font-medium cursor-pointer">
                  Suscribir
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-blue-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-blue-300 text-sm">
              © 2025 Creepie. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6 text-sm">
              <Link
                href="/privacidad"
                className="text-blue-300 hover:text-white transition-colors"
              >
                Política de Privacidad
              </Link>
              <Link
                href="/terminos"
                className="text-blue-300 hover:text-white transition-colors"
              >
                Términos de Servicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
