"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

const cakes = ["/images/1.webp", "/images/2.webp", "/images/3.webp"];

export default function CakeCarousel() {
  const [order, setOrder] = useState([0, 1, 2]);

  useEffect(() => {
    const interval = setInterval(() => {
      setOrder(([a, b, c]) => [c, a, b]); // rota infinitamente
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const positions = [
    { x: "-270px", scale: 0.6, zIndex: 1 }, // izquierda
    { x: "0px", scale: 1.2, zIndex: 3 }, // centro
    { x: "270px", scale: 0.6, zIndex: 2 }, // derecha
  ];

  return (
    <div className="relative w-[350px] h-[250px] flex justify-center items-center">
      {order.map((i, index) => (
        <motion.img
          key={cakes[i]}
          src={cakes[i]}
          alt="Cake"
          className="absolute object-contain w-40 h-40 2xl:w-80 2xl:h-80"
          animate={{
            x: positions[index].x,
            scale: positions[index].scale,
            zIndex: positions[index].zIndex,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
