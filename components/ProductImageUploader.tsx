"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { uploadProductImage } from "@/app/actions/product-images";
import { useNotyf } from "@/app/providers/NotyfProvider";

interface ProductImageUploaderProps {
  productId: string | null; // null cuando es nuevo producto
  onImagesChange?: (imageUrls: string[]) => void;
  maxImages?: number;
}

export default function ProductImageUploader({
  productId,
  onImagesChange,
  maxImages = 5,
}: ProductImageUploaderProps) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const notyf = useNotyf();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    // Validar número máximo
    if (images.length + files.length > maxImages) {
      setError(`Solo puedes subir un máximo de ${maxImages} imágenes`);
      notyf?.error(`Solo puedes subir un máximo de ${maxImages} imágenes`);
      return;
    }

    // Si no hay productId, solo mostrar preview local
    if (!productId) {
      const newImages: string[] = [];
      for (const file of Array.from(files)) {
        newImages.push(URL.createObjectURL(file));
      }
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesChange?.(updatedImages);
      event.target.value = "";
      return;
    }

    // Si hay productId, subir a Supabase
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const { data, error } = await uploadProductImage(productId, formData);

        if (error) {
          setError(error);
          notyf?.error(error);
          continue;
        }

        if (data) {
          const updatedImages = [...images, data.image_url];
          setImages(updatedImages);
          onImagesChange?.(updatedImages);
        }
      } catch (err) {
        console.error("Error uploading image:", err);
        notyf?.error("Error al subir la imagen");
      }
    }

    setUploading(false);
    event.target.value = "";
    notyf?.success("Imágenes subidas correctamente");
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Imágenes del Producto
        </h3>
        <span className="text-sm text-gray-500">
          {images.length}/{maxImages}
        </span>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-700 hover:text-red-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Área de carga */}
      {images.length < maxImages && (
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors bg-white">
          <input
            type="file"
            id="image-upload"
            className="hidden"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
          />

          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            {uploading ? (
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            ) : (
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
            )}

            <p className="text-sm text-gray-600 mb-1">
              {uploading
                ? "Subiendo imagen..."
                : "Haz clic para seleccionar imágenes"}
            </p>

            <p className="text-xs text-gray-500">PNG, JPG, WebP hasta 5MB</p>
          </label>
        </div>
      )}

      {/* Grid de imágenes */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 hover:border-blue-400 transition-colors"
            >
              <Image
                src={imageUrl}
                alt={`Imagen ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Badge de imagen principal */}
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Principal
                </div>
              )}

              {/* Botón de eliminar */}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">No hay imágenes</p>
          <p className="text-xs mt-1">
            Sube la primera imagen de este producto
          </p>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <p className="font-medium mb-1">💡 Consejos:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>La primera imagen será la imagen principal del producto</li>
          <li>Usa imágenes de alta calidad para mejor presentación</li>
          <li>Formatos recomendados: JPG o PNG</li>
        </ul>
      </div>
    </div>
  );
}
