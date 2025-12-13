"use client";

import { useEffect, useRef } from "react";

interface DotWaveLoaderProps {
  size?: string;
  speed?: string;
  color?: string;
}

export default function DotWaveLoader({
  size = "47",
  speed = "1",
  color = "black",
}: DotWaveLoaderProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Importar y registrar el componente solo en el cliente
    const loadLoader = async () => {
      const { dotWave } = await import("ldrs");
      dotWave.register();
    };

    loadLoader();
  }, []);

  return (
    <div ref={loaderRef}>
      <l-dot-wave size={size} speed={speed} color={color}></l-dot-wave>
    </div>
  );
}
