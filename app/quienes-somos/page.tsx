import NuestraHistoria from "@/components/nuestraHistoria";
import { GiCookingGlove, GiCupcake } from "react-icons/gi";
import { FaCookieBite } from "react-icons/fa";
import { FiClock, FiSmile, FiHeart, FiUsers } from "react-icons/fi";
import { FaSmile } from "react-icons/fa";

const beneficios = [
  {
    icono: <FiClock className="w-6 h-6 2xl:w-8 2xl:h-8" />,
    porcentaje: "+50%",
    titulo: "ahorrados por pedido",
    descripcion:
      "Postres recién horneados, ahorrándote tiempo para disfrutar con quienes más quieres.",
    color: "bg-white",
    iconColor: "text-yellow-800",
    textColor: "text-gray-800",
    descriptionColor: "text-gray-600",
  },
  {
    icono: <FiSmile className="w-6 h-6 2xl:w-8 2xl:h-8" />,
    porcentaje: "+40%",
    titulo: "Clientes Más Felices",
    descripcion:
      "Delicias perfectamente elaboradas y entregadas a tiempo para endulzar sus momentos.",
    color: "bg-indigo-600",
    iconColor: "text-white",
    textColor: "text-gray-100",
    descriptionColor: "text-gray-200",
  },
  {
    icono: <FiHeart className="w-6 h-6 2xl:w-8 2xl:h-8" />,
    porcentaje: "+12%",
    titulo: "Momentos Más Dulces",
    descripcion:
      "Llevando más dulzura y rapidez, para esos instantes que realmente importan en la vida.",
    color: "bg-white",
    iconColor: "text-red-600",
    textColor: "text-gray-800",
    descriptionColor: "text-gray-600",
  },
  {
    icono: <FiUsers className="w-6 h-6 2xl:w-8 2xl:h-8" />,
    porcentaje: "+60%",
    titulo: "Clientes que Regresan",
    descripcion:
      "Alta calidad en repostería entregada a tiempo para endulzar tu día y hacerlo especial.",
    color: "bg-indigo-600",
    iconColor: "text-white",
    textColor: "text-gray-100",
    descriptionColor: "text-gray-200",
  },
];

function About() {
  return (
    <div>
      {/* SECCIÓN PRINCIPAL */}
      <section className="h-screen max-w-2xl lg:max-w-4xl xl:max-w-5xl 2xl:max-w-7xl mx-auto flex justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-12 2xl:gap-18">
          <div className="flex flex-col justify-center items-center gap-6">
            <h2 className="text-2xl lg:text-3xl 2xl:text-4xl font-bold text-blue-600">
              Pasión, Creatividad y Dulces Momentos
            </h2>

            <p className="text-base lg:text-lg 2xl:text-xl font-medium text-zinc-600 max-w-4xl text-center">
              En Creepie, creemos que cada postre cuenta una historia.
              Combinamos recetas tradicionales con técnicas modernas para crear
              tortas, cupcakes, pasteles y bocaditos que enamoran desde el
              primer bocado.
            </p>
          </div>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-6">
            <div className="col-span-2 relative rounded-4xl shadow-black/30 hover:shadow-xl transition-all duration-300">
              <img
                src="/images/horno.webp"
                alt="Horno con pastel"
                className="w-[400px] lg:w-full h-[280px] xl:h-[250px] 2xl:h-[300px] object-cover rounded-4xl"
              />
              <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-linear-to-t from-black/80 to-transparent rounded-4xl"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
                <GiCupcake className="w-8 h-8 text-white" />
                <h2 className="text-sm xl:text-base 2xl:text-lg font-medium text-white">
                  Al horno con pasión, elaborada con cuidado.
                </h2>
              </div>
            </div>
            <div className="col-span-2 relative rounded-4xl shadow-black/30 hover:shadow-xl transition-all duration-300">
              <img
                src="/images/inspirada.webp"
                alt="Pastel inspirado en el patrimonio"
                className="w-[400px] lg:w-full h-[280px] xl:h-[250px] 2xl:h-[300px] object-cover rounded-4xl"
              />
              <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-linear-to-t from-black/80 to-transparent rounded-4xl"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
                <GiCookingGlove className="w-8 h-8 text-white" />
                <h2 className="text-sm xl:text-base 2xl:text-lg font-medium text-white">
                  Inspirada en el patrimonio, perfeccionada por nosotras.
                </h2>
              </div>
            </div>
            <div className="col-span-4 relative rounded-4xl shadow-black/30 hover:shadow-xl transition-all duration-300">
              <img
                src="/images/frescura.webp"
                alt="Pastel fresco"
                className="w-[800px] lg:w-full h-[280px] xl:h-[250px] 2xl:h-[300px] object-cover rounded-4xl"
              />
              <div className="absolute bottom-0 left-0 right-0 h-3/4 bg-linear-to-t from-black/80 to-transparent rounded-4xl"></div>
              <div className="absolute bottom-0 w-full max-w-xs left-0 right-0 p-4 space-y-4">
                <FaCookieBite className="w-8 h-8 text-white" />
                <h2 className="text-sm xl:text-base 2xl:text-lg font-medium text-white">
                  Frescura en cada bocado, en cada ocasión.
                </h2>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN: NUESTRA HISTORIA */}
      <NuestraHistoria />

      {/* SECCIÓN: POR QUÉ ELEGIRNOS */}
      <section className="h-screen max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex justify-center items-center lg:py-24 2xl:py-0">
        <div className="flex flex-col gap-4">
          {/* Título y subtítulo */}
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl font-bold text-blue-600">
              Nuestro Impacto Dulce
            </h2>
          </div>

          {/* Línea de tiempo con línea recta y círculos */}
          <div className="relative mb-6 2xl:mb-12">
            {/* Línea base (gris claro) */}
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-300 transform -translate-y-1/2"></div>

            {/* Línea coloreada (hasta 2025) */}
            <div
              className="absolute left-0 top-1/2 h-1 bg-blue-500 transform -translate-y-1/2"
              style={{ width: "75%" }} // 3 de 4 segmentos = 75% (2018-2025)
            ></div>

            {/* Contenedor de años y puntos */}
            <div className="relative flex justify-between">
              {/* Punto 2018 */}
              <div className="text-center relative">
                <div className="text-lg xl:text-xl 2xl:text-2xl font-bold text-black">
                  2018
                </div>
                <div className="w-5 h-5 2xl:w-6 2xl:h-6 bg-indigo-600 rounded-full mx-auto border-4 border-white z-10 relative"></div>
                <div className="text-sm text-gray-500 mt-2">Inicio</div>
              </div>

              {/* Punto 2020 */}
              <div className="text-center relative">
                <div className="text-lg xl:text-xl 2xl:text-2xl font-bold text-black">
                  2020
                </div>
                <div className="w-5 h-5 2xl:w-6 2xl:h-6 bg-indigo-600 rounded-full mx-auto border-4 border-white z-10 relative"></div>
                <div className="text-sm text-gray-500 mt-2">Reconocimiento</div>
              </div>

              {/* Punto 2022 */}
              <div className="text-center relative">
                <div className="text-lg xl:text-xl 2xl:text-2xl font-bold text-black">
                  2022
                </div>
                <div className="w-5 h-5 2xl:w-6 2xl:h-6 bg-indigo-600 rounded-full mx-auto border-4 border-white z-10 relative"></div>
                <div className="text-sm text-gray-500 mt-2">Expansión</div>
              </div>

              {/* Punto 2025 (actual) */}
              <div className="text-center relative">
                <div className="text-xl 2xl:text-2xl font-bold text-black">
                  2025
                </div>
                <div className="w-6 h-6 2xl:w-8 2xl:h-8 bg-indigo-600 rounded-full mx-auto border-4 border-white z-10 relative shadow-lg"></div>
                <div className="text-sm text-gray-500 mt-2">Actual</div>
              </div>

              {/* Punto 2028 (futuro - color gris) */}
              <div className="text-center relative">
                <div className="text-lg xl:text-xl 2xl:text-2xl font-bold text-gray-400">
                  2028
                </div>
                <div className="w-5 h-5 2xl:w-6 2xl:h-6 bg-gray-300 rounded-full mx-auto border-4 border-white z-10 relative"></div>
                <div className="text-sm text-gray-400 mt-2">Próximo</div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="grid md:grid-cols-2 items-center gap-8 mb-6">
            {/* Columna izquierda */}
            <div className="flex flex-col gap-2 xl:gap-4">
              <div className="text-2xl xl:text-3xl 2xl:text-5xl font-bold text-indigo-600">
                8 AÑOS
              </div>

              <p className="text-sm 2xl:text-base text-gray-700">
                Desde 2016, nuestra pastelería ha estado creando repostería
                artesanal en Chincha. Desde bocaditos hasta pasteles, cada
                postre está hecho con cuidado y pasión por la calidad.
              </p>
            </div>

            {/* Columna derecha */}
            <div className="bg-white border border-gray-300 p-4 xl:p-6 flex flex-col gap-4 rounded-4xl">
              <p className="text-sm 2xl:text-base text-gray-700 italic">
                "En Creepie, estamos orgullosos de compartir nuestra pasión por
                la repostería contigo y tus seres queridos."
              </p>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <FaSmile className="text-white" />
                </div>
                <div className="font-medium text-black">
                  María Palermo
                  <p className="text-sm text-gray-500">CEO/Fundadora Creepie</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de beneficios */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {beneficios.map((beneficio, index) => (
              <div
                key={index}
                className={`${beneficio.color} rounded-3xl p-6 2xl:p-8 shadow-sm shadow-black/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-2`}
              >
                <div className="flex flex-row-reverse items-center justify-between">
                  {/* Icono */}
                  <div className={`mb-2 ${beneficio.iconColor}`}>
                    {beneficio.icono}
                  </div>

                  {/* Tiempo/porcentaje */}
                  <div className="mb-2">
                    <p
                      className={`text-xl xl:text-2xl 2xl:text-4xl font-bold ${beneficio.textColor}`}
                    >
                      {beneficio.porcentaje}
                    </p>
                  </div>
                </div>

                {/* Título */}
                <h3
                  className={`text-sm xl:text-base 2xl:text-xl font-semibold ${beneficio.textColor} mb-3`}
                >
                  {beneficio.titulo}
                </h3>

                {/* Descripción */}
                <p
                  className={`text-xs xl:text-sm 2xl:text-base leading-relaxed ${beneficio.descriptionColor}`}
                >
                  {beneficio.descripcion}
                </p>

                {/* Línea decorativa */}
                <div className="mt-4">
                  <div
                    className={`w-12 h-1 2xl:h-2 rounded-full ${
                      index === 0
                        ? "bg-blue-400"
                        : index === 1
                        ? "bg-green-400"
                        : index === 2
                        ? "bg-orange-400"
                        : "bg-purple-400"
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
