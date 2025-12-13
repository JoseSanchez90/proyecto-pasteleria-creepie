"use client";

import { useState, useEffect, useRef } from "react";

interface SizeOption {
  id: string;
  size_id: string;
  is_default: boolean;
  size: {
    id: string;
    name: string;
    person_capacity: number;
    additional_price: number;
  };
}

interface SizeSelectorProps {
  availableSizes?: SizeOption[];
  basePrice: number;
  isOffer: boolean;
  offerPrice?: number;
  onSizeChange: (sizeId: string | null, totalPrice: number) => void;
  disabled?: boolean;
}

export default function SizeSelector({
  availableSizes,
  basePrice,
  isOffer,
  offerPrice,
  onSizeChange,
  disabled = false,
}: SizeSelectorProps) {
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);

  // Set default size on mount
  const onSizeChangeRef = useRef(onSizeChange);

  useEffect(() => {
    onSizeChangeRef.current = onSizeChange;
  }, [onSizeChange]);

  // Set default size on mount
  useEffect(() => {
    if (availableSizes && availableSizes.length > 0) {
      const defaultSize = availableSizes.find((opt) => opt.is_default);
      const initialSizeId = defaultSize?.size_id || availableSizes[0].size_id;
      setSelectedSizeId(initialSizeId);

      const selectedOption = availableSizes.find(
        (opt) => opt.size_id === initialSizeId
      );
      const effectiveBasePrice = isOffer && offerPrice ? offerPrice : basePrice;
      const totalPrice =
        effectiveBasePrice + (selectedOption?.size.additional_price || 0);
      onSizeChangeRef.current(initialSizeId, totalPrice);
    } else {
      const effectiveBasePrice = isOffer && offerPrice ? offerPrice : basePrice;
      onSizeChangeRef.current(null, effectiveBasePrice);
    }
  }, [availableSizes, basePrice, isOffer, offerPrice]);

  if (!availableSizes || availableSizes.length === 0) {
    return null;
  }

  const handleSizeChange = (sizeId: string) => {
    setSelectedSizeId(sizeId);
    const selectedOption = availableSizes.find((opt) => opt.size_id === sizeId);
    const effectiveBasePrice = isOffer && offerPrice ? offerPrice : basePrice;
    const totalPrice =
      effectiveBasePrice + (selectedOption?.size.additional_price || 0);
    onSizeChange(sizeId, totalPrice);
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-indigo-600">
        Seleccione el tamaño:
      </label>
      <select
        value={selectedSizeId || ""}
        onChange={(e) => handleSizeChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {availableSizes.map((option) => (
          <option key={option.size_id} value={option.size_id}>
            {option.size.name} - {option.size.person_capacity} personas
          </option>
        ))}
      </select>
    </div>
  );
}
