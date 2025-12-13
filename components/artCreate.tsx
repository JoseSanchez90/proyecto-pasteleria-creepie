/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
import Image from "next/image";
import Seleccion from "@/public/icons/food.svg";
import Proceso from "@/public/icons/chef.svg";
import Control from "@/public/icons/quality.svg";
import Perfeccion from "@/public/icons/cake.svg";

const arte = [
  {
    number: "1",
    icon: <Image src={Seleccion} alt="IconSelected" width={120} height={120} />,
    title: "Selección Premium",
    description:
      "Escogemos solo los ingredientes más frescos y de mejor calidad del mercado",
    sub: "Elección",
  },
  {
    number: "2",
    icon: <Image src={Proceso} alt="IconProcess" width={120} height={120} />,
    title: "Proceso Artesanal",
    description:
      "Nuestros maestros pasteleros utilizan técnicas tradicionales perfeccionadas a lo largo de años",
    sub: "Preparación",
  },
  {
    number: "3",
    icon: <Image src={Control} alt="IconControl" width={120} height={120} />,
    title: "Control de Calidad",
    description:
      "Cada creación es revisada meticulosamente antes de llegar a tus manos",
    sub: "Monitorización",
  },
  {
    number: "4",
    icon: <Image src={Perfeccion} alt="IconPerfect" width={120} height={120} />,
    title: "Perfección en Sabor",
    description:
      "El resultado es un postre que combina belleza, sabor y arte en cada bocado",
    sub: "Resultado",
  },
];

function ArtCreate() {
  return (
    <section className="h-screen flex flex-col justify-center items-center">
      <div className="relative w-full h-full flex flex-col items-center justify-center gap-12 md:gap-14 overflow-hidden">
        <img
          src="/images/fondo2.webp"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative flex flex-col gap-4 text-center px-6 md:px-0">
          <h2 className="text-2xl xl:text-3xl 2xl:text-4xl font-bold text-white xl:mb-4">
            El Arte de Crear
          </h2>
          <p className="text-base xl:text-lg 2xl:text-xl font-medium text-zinc-300 max-w-xl xl:max-w-2xl 2xl:max-w-3xl mx-auto">
            Detrás de cada creación Creepie hay pasión, dedicación y un
            compromiso inquebrantable con la excelencia
          </p>
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 2xl:gap-12 max-w-xl xl:max-w-5xl 2xl:max-w-7xl px-4 md:px-0">
          {arte.map((art, i) => (
            <div
              key={i}
              className="relative bg-white shadow-lg rounded-[40px] flex flex-col justify-start p-4 md:p-6 2xl:p-10 gap-2 2xl:gap-4 overflow-hidden"
            >
              {/* Número con gradiente */}
              <div className="absolute -right-6 -top-27 text-[300px] font-black bg-linear-to-br from-blue-400/40 to-blue-600/20 bg-clip-text text-transparent select-none pointer-events-none z-0">
                {art.number}
              </div>

              {/* <p>{art.icon}</p> */}
              <div className="flex flex-col justify-center items-center gap-4 relative z-10">
                <div className="w-fit text-start bg-blue-600 text-white py-1 px-4 text-xs md:text-sm rounded-full relative z-10">
                  {art.sub}
                </div>
                <h3 className="w-full text-base md:text-lg 2xl:text-xl text-center font-medium">
                  {art.title}
                </h3>
              </div>

              <div className="flex justify-center items-center relative z-10">
                <p className="text-gray-600 text-xs md:text-sm 2xl:text-base text-start">
                  {art.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ArtCreate;
