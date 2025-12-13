"use client";

import { useEffect, useRef } from "react";

interface HourglassLoaderProps {
  size?: string;
  bgOpacity?: string;
  speed?: string;
  color?: string;
}

export default function HourglassLoader({
  size = "40",
  bgOpacity = "0.1",
  speed = "1.75",
  color = "black",
}: HourglassLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Importar y registrar el componente solo en el cliente
    const loadLoader = async () => {
      const { hourglass } = await import("ldrs");
      hourglass.register();
    };

    loadLoader();
  }, []);

  return (
    <div ref={loaderRef}>
      <l-hourglass
        size={size}
        bg-opacity={bgOpacity}
        speed={speed}
        color={color}
      ></l-hourglass>
    </div>
  );
}
