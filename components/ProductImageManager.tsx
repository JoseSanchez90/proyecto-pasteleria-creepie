"use client";

import { useState, useEffect } from "react";
import { Upload, X, Star, Loader, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import {
  uploadProductImage,
  deleteProductImage,
  getProductImages,
  setMainImage,
  type ProductImage,
} from "@/app/actions/product-images";
import { useNotyf } from "@/app/providers/NotyfProvider";

interface ProductImageManagerProps {
  productId: string;
  maxImages?: number;
}

export default function ProductImageManager({
  productId,
  maxImages = 5,
}: ProductImageManagerProps) {
  const notyf = useNotyf();
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar imágenes al montar
  useEffect(() => {
    loadImages();
  }, [productId]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const { data, error } = await getProductImages(productId);

      if (error) {
        setError(error);
        notyf?.error(error);
        return;
      }

      setImages(data || []);
    } catch (err) {
      console.error("Error loading images:", err);
      notyf?.error("Error al cargar las imágenes");
    } finally {
      setLoading(false);
    }
  };

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
          setImages((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("Error uploading image:", err);
        notyf?.error("Error al subir la imagen");
      }
    }

    setUploading(false);
    event.target.value = ""; // Reset input
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta imagen?")) return;

    try {
      const { error } = await deleteProductImage(imageId);

      if (error) {
        setError(error);
        notyf?.error(error);
        return;
      }

      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      console.error("Error deleting image:", err);
      notyf?.error("Error al eliminar la imagen");
    }
  };

  const handleSetMainImage = async (imageId: string) => {
    try {
      const { error } = await setMainImage(imageId, productId);

      if (error) {
        setError(error);
        notyf?.error(error);
        return;
      }

      // Recargar imágenes para actualizar el orden
      await loadImages();
    } catch (err) {
      console.error("Error setting main image:", err);
      notyf?.error("Error al establecer imagen principal");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
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
              <Loader className="w-10 h-10 text-blue-500 animate-spin mb-3" />
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
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 hover:border-blue-400 transition-colors"
            >
              <Image
                src={image.image_url}
                alt={`Imagen ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Badge de imagen principal */}
              {image.image_order === 0 && (
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Principal
                </div>
              )}

              {/* Controles (visible al hover) */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {image.image_order !== 0 && (
                  <button
                    onClick={() => handleSetMainImage(image.id)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
                    title="Establecer como principal"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  title="Eliminar imagen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
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
