"use client";

import { useEffect, useRef } from "react";

interface RingLoaderProps {
  size?: string;
  stroke?: string;
  bgOpacity?: string;
  speed?: string;
  color?: string;
}

export default function RingLoader({
  size = "40",
  stroke = "5",
  bgOpacity = "0",
  speed = "2",
  color = "black",
}: RingLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Importar y registrar el componente solo en el cliente
    const loadLoader = async () => {
      const { ring } = await import("ldrs");
      ring.register();
    };

    loadLoader();
  }, []);

  return (
    <div ref={loaderRef}>
      <l-ring
        size={size}
        stroke={stroke}
        bg-opacity={bgOpacity}
        speed={speed}
        color={color}
      ></l-ring>
    </div>
  );
}
