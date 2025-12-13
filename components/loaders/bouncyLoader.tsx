"use client";

import { useEffect, useRef } from "react";

interface BouncyLoaderProps {
  size?: string;
  speed?: string;
  color?: string;
}

export default function BouncyLoader({
  size = "45",
  speed = "1.75",
  color = "black",
}: BouncyLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Importar y registrar el componente solo en el cliente
    const loadLoader = async () => {
      const { bouncy } = await import("ldrs");
      bouncy.register();
    };

    loadLoader();
  }, []);

  return (
    <div ref={loaderRef}>
      <l-bouncy size={size} speed={speed} color={color}></l-bouncy>
    </div>
  );
}
