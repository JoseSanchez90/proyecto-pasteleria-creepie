"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface DualRangeSliderProps {
  min: number;
  max: number;
  initialMin?: number;
  initialMax?: number;
  onChange: (values: { min: number; max: number }) => void;
  step?: number;
  className?: string;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  min,
  max,
  initialMin,
  initialMax,
  onChange,
  step = 1,
  className = "",
}) => {
  const [minVal, setMinVal] = useState(initialMin || min);
  const [maxVal, setMaxVal] = useState(initialMax || max);
  const [activeThumb, setActiveThumb] = useState<"min" | "max" | null>(null);
  const minValRef = useRef<HTMLInputElement>(null);
  const maxValRef = useRef<HTMLInputElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convertir valor a porcentaje
  const getPercent = useCallback(
    (value: number) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  );

  // Actualizar el rango visual
  useEffect(() => {
    if (rangeRef.current) {
      const minPercent = getPercent(minVal);
      const maxPercent = getPercent(maxVal);

      rangeRef.current.style.left = `${minPercent}%`;
      rangeRef.current.style.width = `${maxPercent - minPercent}%`;
    }
  }, [minVal, maxVal, getPercent]);

  // Debounce para evitar demasiadas llamadas a onChange
  useEffect(() => {
    if (activeThumb === null) {
      const timeoutId = setTimeout(() => {
        onChange({ min: minVal, max: maxVal });
      }, 150);

      return () => clearTimeout(timeoutId);
    }
  }, [minVal, maxVal, activeThumb, onChange]);

  // Handler para el thumb izquierdo
  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(event.target.value), maxVal - step);
    setMinVal(value);
    setActiveThumb("min");
  };

  // Handler para el thumb derecho
  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(event.target.value), minVal + step);
    setMaxVal(value);
    setActiveThumb("max");
  };

  // Handlers para arrastrar
  const handleMouseDown = (thumb: "min" | "max") => {
    setActiveThumb(thumb);
  };

  const handleMouseUp = () => {
    setActiveThumb(null);
  };

  const handleTouchStart = (thumb: "min" | "max") => {
    setActiveThumb(thumb);
  };

  const handleTouchEnd = () => {
    setActiveThumb(null);
  };

  // Handler para arrastrar directamente en el contenedor
  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    const value = Math.round(min + (percent / 100) * (max - min));

    // Determinar qué thumb mover basado en la posición
    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    if (
      percent < minPercent ||
      Math.abs(percent - minPercent) < Math.abs(percent - maxPercent)
    ) {
      // Más cerca del mínimo
      const newMin = Math.min(value, maxVal - step);
      setMinVal(newMin);
      setActiveThumb("min");
    } else {
      // Más cerca del máximo
      const newMax = Math.max(value, minVal + step);
      setMaxVal(newMax);
      setActiveThumb("max");
    }
  };

  const handleContainerTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;

    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percent = (x / rect.width) * 100;
    const value = Math.round(min + (percent / 100) * (max - min));

    const minPercent = getPercent(minVal);
    const maxPercent = getPercent(maxVal);

    if (
      percent < minPercent ||
      Math.abs(percent - minPercent) < Math.abs(percent - maxPercent)
    ) {
      const newMin = Math.min(value, maxVal - step);
      setMinVal(newMin);
      setActiveThumb("min");
    } else {
      const newMax = Math.max(value, minVal + step);
      setMaxVal(newMax);
      setActiveThumb("max");
    }
  };

  return (
    <div
      className={`flex flex-col gap-4 ${className}`}
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
      onTouchStart={handleContainerTouchStart}
    >
      {/* Rango visual */}
      <div className="relative w-full h-8 flex items-center">
        {/* Track de fondo */}
        <div className="absolute w-full h-2 rounded-full bg-gray-200" />

        {/* Rango seleccionado */}
        <div
          ref={rangeRef}
          className="absolute h-2 rounded-full bg-indigo-600 transition-all duration-150"
        />

        {/* Thumb izquierdo - Área de arrastre más grande */}
        <div
          className="absolute h-6 w-6 -translate-x-1/2 cursor-pointer z-20 flex items-center justify-center"
          style={{ left: `${getPercent(minVal)}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown("min");
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleTouchStart("min");
          }}
        >
          {/* Thumb izquierdo visual */}
          <div className="w-5 h-5 rounded-full bg-white border-2 border-indigo-600 shadow-md" />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
            S/ {minVal}
          </div>
        </div>

        {/* Thumb derecho - Área de arrastre más grande */}
        <div
          className="absolute h-6 w-6 -translate-x-1/2 cursor-pointer z-30 flex items-center justify-center"
          style={{ left: `${getPercent(maxVal)}%` }}
          onMouseDown={(e) => {
            e.stopPropagation();
            handleMouseDown("max");
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            handleTouchStart("max");
          }}
        >
          {/* Thumb derecho visual */}
          <div className="w-5 h-5 rounded-full bg-white border-2 border-indigo-600 shadow-md" />
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
            S/ {maxVal}
          </div>
        </div>

        {/* Inputs ocultos para controlar los valores */}
        <input
          ref={minValRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={minVal}
          onChange={handleMinChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleTouchEnd}
          className="sr-only"
          aria-label="Precio mínimo"
        />

        <input
          ref={maxValRef}
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxVal}
          onChange={handleMaxChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleTouchEnd}
          className="sr-only"
          aria-label="Precio máximo"
        />
      </div>

      {/* Event listeners globales para arrastrar */}
      <GlobalMouseListeners
        activeThumb={activeThumb}
        onMouseUp={handleMouseUp}
        onMouseMove={(e) => {
          if (activeThumb && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
            const value = Math.round(min + (percent / 100) * (max - min));

            if (activeThumb === "min") {
              const newMin = Math.min(value, maxVal - step);
              setMinVal(newMin);
            } else {
              const newMax = Math.max(value, minVal + step);
              setMaxVal(newMax);
            }
          }
        }}
      />

      {/* Display de valores */}
      <div className="flex flex-col items-center justify-between gap-4">
        <div className="w-full flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium mb-1">
              Mínimo
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">S/</span>
              <input
                type="number"
                min={min}
                max={maxVal - step}
                value={minVal}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value)) {
                    setMinVal(Math.min(value, maxVal - step));
                  }
                }}
                onBlur={() => setActiveThumb(null)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                aria-label="Precio mínimo"
              />
            </div>
          </div>

          <div className="flex flex-col items-end sm:items-start">
            <span className="text-xs text-gray-500 font-medium mb-1">
              Máximo
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-700">S/</span>
              <input
                type="number"
                min={minVal + step}
                max={max}
                value={maxVal}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value)) {
                    setMaxVal(Math.max(value, minVal + step));
                  }
                }}
                onBlur={() => setActiveThumb(null)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                aria-label="Precio máximo"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar para listeners globales
interface GlobalMouseListenersProps {
  activeThumb: "min" | "max" | null;
  onMouseUp: () => void;
  onMouseMove: (e: MouseEvent) => void;
}

const GlobalMouseListeners: React.FC<GlobalMouseListenersProps> = ({
  activeThumb,
  onMouseUp,
  onMouseMove,
}) => {
  useEffect(() => {
    if (activeThumb) {
      const handleMouseMove = (e: MouseEvent) => {
        onMouseMove(e);
      };

      const handleMouseUp = () => {
        onMouseUp();
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [activeThumb, onMouseMove, onMouseUp]);

  return null;
};

export default DualRangeSlider;
