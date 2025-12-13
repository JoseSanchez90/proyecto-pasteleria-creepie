"use client";

import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";

function Tradition() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "center",
    skipSnaps: false,
    containScroll: "trimSnaps",
    startIndex: 1, // Esto hace que empiece en el segundo slide (índice 1)
  });

  const cards = [
    {
      id: 1,
      title: "Ingredientes Naturales",
      description:
        "Sin aditivos artificiales, solo bondad pura en cada creación",
      image: "/images/3.webp",
      bgColor: "bg-violet-950",
      textColor: "text-white",
      height: "h-[300px]",
      imageClass: "bottom-28",
    },
    {
      id: 2,
      title: "Recetas Exclusivas",
      description:
        "Desarrolladas por nuestros maestros pasteleros con décadas de experiencia",
      image: "/images/1.webp",
      bgColor: "bg-white border border-zinc-300",
      textColor: "text-zinc-700",
      height: "h-[350px]",
      imageClass: "bottom-28",
    },
    {
      id: 3,
      title: "Producción Sostenible",
      description: "Comprometidos con el ambiente en cada paso del proceso",
      image: "/images/2.webp",
      bgColor: "bg-violet-950",
      textColor: "text-white",
      height: "h-[300px]",
      imageClass: "bottom-28",
    },
  ];

  const scrollTo = (index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  };

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Configurar el evento de selección
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    // Asegurarnos de que empiece en el índice 1 después de la inicialización
    const timeoutId = setTimeout(() => {
      emblaApi.scrollTo(1);
      setSelectedIndex(1);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="min-h-screen max-w-3xl xl:max-w-7xl mx-auto flex flex-col justify-center items-center py-12 lg:py-24 2xl:py-32 overflow-hidden">
      <div className="flex justify-items-center items-center gap-10">
        <div className="flex flex-col 2xl:gap-6">
          <div className="w-full flex flex-col justify-center items-center px-6 md:px-0">
            <h2 className="text-2xl xl:text-3xl 2xl:text-4xl text-center font-bold text-blue-600 mb-4">
              Donde la Tradición Encuentra la Innovación
            </h2>
            <p className="text-base xl:text-lg 2xl:text-xl font-medium text-zinc-600 max-w-xl xl:max-w-4xl 2xl:max-w-5xl text-center">
              En Creepie, no solo hacemos postres. Creamos experiencias que
              perduran en la memoria. Cada producto es una manifestación de
              nuestro amor por la pastelería y nuestro respeto por quienes los
              disfrutan.
            </p>
          </div>

          {/* Versión Desktop (igual que antes) */}
          <div className="hidden lg:grid grid-cols-3 items-center gap-6 xl:gap-10 2xl:gap-18 mt-38">
            <div className="w-60 h-70 2xl:w-80 2xl:h-90 bg-violet-950 p-8 flex flex-col gap-2 rounded-t-[80px] rounded-b-[40px]">
              <div className="relative bottom-35 2xl:bottom-40 flex justify-center items-center">
                <img
                  src="/images/3.webp"
                  alt="recetas exclusivas"
                  className="w-60 h-auto"
                />
              </div>
              <div className="relative bottom-30 2xl:bottom-35 flex flex-col gap-2 2xl:gap-6 text-center">
                <h3 className="text-lg xl:text-xl 2xl:text-3xl text-white font-medium">
                  Ingredientes Naturales
                </h3>
                <p className="text-base 2xl:text-lg text-white">
                  Sin aditivos artificiales, solo bondad pura en cada creación
                </p>
              </div>
            </div>
            <div className="w-60 h-90 2xl:w-80 2xl:h-120 bg-white border border-zinc-300 p-8 flex flex-col gap-2 rounded-t-[80px] rounded-b-[40px]">
              <div className="relative bottom-30 2xl:bottom-40 flex justify-center items-center">
                <img
                  src="/images/1.webp"
                  alt="ingredientes naturales"
                  className="w-60 h-auto"
                />
              </div>
              <div className="relative bottom-15 2xl:bottom-25 flex flex-col gap-2 2xl:gap-6 text-center">
                <h3 className="text-xl 2xl:text-3xl text-zinc-700 font-medium">
                  Recetas Exclusivas
                </h3>
                <p className="text-base 2xl:text-lg text-zinc-700">
                  Desarrolladas por nuestros maestros pasteleros con décadas de
                  experiencia
                </p>
              </div>
            </div>
            <div className="w-60 h-70 2xl:w-80 2xl:h-90 bg-violet-950 p-8 flex flex-col gap-2 rounded-t-[80px] rounded-b-[40px]">
              <div className="relative bottom-35 2xl:bottom-40 flex justify-center items-center">
                <img
                  src="/images/2.webp"
                  alt="produccion sostenible"
                  className="w-60 h-auto"
                />
              </div>
              <div className="relative bottom-30 2xl:bottom-35 flex flex-col gap-2 2xl:gap-6 text-center">
                <h3 className="text-xl 2xl:text-3xl text-white font-medium">
                  Producción Sostenible
                </h3>
                <p className="text-base 2xl:text-lg text-white">
                  Comprometidos con el ambiente en cada paso del proceso
                </p>
              </div>
            </div>
          </div>

          {/* Versión Mobile - Embla Carousel */}
          <div className="lg:hidden mt-32 max-w-sm mx-auto px-2">
            <div className="embla" ref={emblaRef}>
              <div className="embla__container flex gap-2">
                {cards.map((card, index) => (
                  <div key={card.id} className="embla__slide flex-[0_0_65%]">
                    <div
                      className={`
                      ${
                        card.bgColor
                      } p-6 flex flex-col items-center justify-center gap-2 
                      rounded-t-[60px] rounded-b-[30px] ${card.height}
                      transition-transform duration-300
                      ${
                        index === selectedIndex
                          ? "scale-100 opacity-100"
                          : "scale-90 opacity-70"
                      }
                    `}
                    >
                      <div
                        className={`relative ${card.imageClass} flex justify-center items-center`}
                      >
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-48 h-auto"
                        />
                      </div>
                      <div
                        className={`
                        relative flex flex-col gap-3 text-center
                        ${index === 1 ? "bottom-15" : "bottom-20"}
                      `}
                      >
                        <h3 className={`text-lg font-medium ${card.textColor}`}>
                          {card.title}
                        </h3>
                        <p className={`text-sm ${card.textColor}`}>
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center mt-6 space-x-2">
              {cards.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? "bg-violet-950 w-6"
                      : "bg-gray-300"
                  }`}
                  onClick={() => scrollTo(index)}
                  aria-label={`Ir a slide ${index + 1}`}
                />
              ))}
            </div>

            <p className="text-center text-gray-600 text-sm mt-4">
              Desliza para ver todos los elementos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Tradition;
