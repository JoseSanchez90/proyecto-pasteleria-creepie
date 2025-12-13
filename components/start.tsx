import Link from "next/link";
import SpecialOffers from "./specialOffers";
import ArtCreate from "./artCreate";
import Tradition from "./tradition";

function Start() {
  return (
    <>
      <section className="h-screen flex flex-col justify-center items-center">
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src="/images/fondocreepie.webp"
            className="hidden lg:flex absolute inset-0 h-full w-full object-cover"
          />
          <img
            src="/images/fondoMobile.webp"
            className="flex lg:hidden absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/20 lg:bg-black/10"></div>
          <div className="relative w-full max-w-xl xl:max-w-3xl 2xl:max-w-4xl flex flex-col justify-center gap-8 px-6 lg:px-0 pb-24 lg:pb-0">
            <h1 className="text-3xl md:text-4xl xl:text-5xl 2xl:text-6xl text-center font-extrabold text-indigo-300 lg:text-blue-600">
              El pastel horneado perfecto todos los días
            </h1>
            <p className="text-lg md:text-xl xl:text-2xl 2xl:text-3xl text-center font-bold lg:font-medium text-zinc-100 lg:text-zinc-700">
              Disfruta sabores únicos, texturas suaves y el aroma irresistible
              de lo recién hecho. Perfecto para tus momentos más especiales.
            </p>
            <div className="flex items-center justify-center gap-8">
              <Link
                href="/reservaciones"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 lg:px-10 py-3 cursor-pointer"
              >
                ¡Reserva ya!
              </Link>
              <Link
                href="/postres"
                className="bg-white lg:border-2 lg:border-gray-300 text-zinc-800 rounded-xl px-6 lg:px-10 py-3 cursor-pointer"
              >
                Ver Postres
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* OFERTAS ESPECIALES| */}
      <SpecialOffers />

      <ArtCreate />

      <Tradition />
    </>
  );
}

export default Start;
