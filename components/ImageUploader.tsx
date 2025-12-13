"use client";

import { useState } from "react";
import { Upload, X, Image as ImageIcon, Loader } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved?: (imageUrl: string) => void;
  currentImages?: string[];
  maxImages?: number;
  accept?: string;
  maxSizeMB?: number;
}

export default function ImageUploader({
  onImageUploaded,
  onImageRemoved,
  currentImages = [],
  maxImages = 5,
  accept = "image/jpeg,image/jpg,image/png,image/webp",
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    await uploadFiles(Array.from(files));
    event.target.value = ""; // Reset input
  };

  const uploadFiles = async (files: File[]) => {
    setError(null);

    // Validar número máximo de imágenes
    if (currentImages.length + files.length > maxImages) {
      setError(`Solo puedes subir un máximo de ${maxImages} imágenes`);
      return;
    }

    for (const file of files) {
      // Validar tipo
      if (!accept.split(",").includes(file.type)) {
        setError("Tipo de archivo no válido. Solo se permiten JPG, PNG y WebP");
        continue;
      }

      // Validar tamaño
      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`El archivo es demasiado grande. Máximo ${maxSizeMB}MB`);
        continue;
      }

      setUploading(true);

      try {
        // Crear FormData
        const formData = new FormData();
        formData.append("file", file);

        // Aquí llamarás a tu server action
        // Por ahora, simularemos la subida
        // const { data, error } = await uploadProductImage(productId, formData);

        // Simulación temporal - reemplazar con tu server action
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Crear URL temporal para preview
        const tempUrl = URL.createObjectURL(file);
        onImageUploaded(tempUrl);
      } catch (err) {
        console.error("Error uploading image:", err);
        setError(
          err instanceof Error ? err.message : "Error al subir la imagen"
        );
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const removeImage = (imageUrl: string) => {
    if (onImageRemoved) {
      onImageRemoved(imageUrl);
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de carga */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="image-upload"
          className="hidden"
          accept={accept}
          multiple
          onChange={handleFileChange}
          disabled={uploading || currentImages.length >= maxImages}
        />

        <label
          htmlFor="image-upload"
          className="cursor-pointer flex flex-col items-center"
        >
          {uploading ? (
            <Loader className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400 mb-4" />
          )}

          <p className="text-sm text-gray-600 mb-2">
            {uploading
              ? "Subiendo imagen..."
              : "Arrastra imágenes aquí o haz clic para seleccionar"}
          </p>

          <p className="text-xs text-gray-500">
            PNG, JPG, WebP hasta {maxSizeMB}MB ({currentImages.length}/
            {maxImages})
          </p>
        </label>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Vista previa de imágenes */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((imageUrl, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
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
                onClick={() => removeImage(imageUrl)}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Eliminar imagen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {currentImages.length === 0 && !uploading && (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No hay imágenes cargadas</p>
        </div>
      )}
    </div>
  );
}
