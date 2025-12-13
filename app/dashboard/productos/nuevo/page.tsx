"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Upload, Plus, Trash2, Loader } from "lucide-react";
import {
  crearProducto,
  agregarIngredienteProducto,
} from "@/app/actions/productos";
import { uploadProductImage } from "@/app/actions/product-images";
import { obtenerCategorias } from "@/app/actions/categorias";
import { obtenerTamanos } from "@/app/actions/tamanos";
import RingLoader from "@/components/loaders/ringLoader";
import { FaSave } from "react-icons/fa";

// Interface para categorías
interface Categoria {
  id: string;
  name: string;
  is_active: boolean;
}

interface Tamano {
  id: string;
  name: string;
  person_capacity: number;
  additional_price: number;
  is_active: boolean;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [tamanos, setTamanos] = useState<Tamano[]>([]);
  const [cargandoTamanos, setCargandoTamanos] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [defaultSizeId, setDefaultSizeId] = useState<string>("");
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [ingredientes, setIngredientes] = useState<string[]>([]);
  const [nuevoIngrediente, setNuevoIngrediente] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Estado del formulario basado en tu DB
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    offer_price: "",
    is_offer: false,
    is_active: true,
    stock: "",
    preparation_time: "",
    category_id: "",
    offer_end_date: "",
  });

  // Cargar categorías al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        // Cargar categorías
        const { data: categoriasData, error: categoriasError } =
          await obtenerCategorias();
        if (categoriasError) {
          throw new Error(categoriasError);
        }
        setCategorias(categoriasData || []);
        setCargandoCategorias(false);

        // Cargar tamaños
        const { data: tamanosData, error: tamanosError } =
          await obtenerTamanos();
        if (tamanosError) {
          console.error("Error cargando tamaños:", tamanosError);
        }
        setTamanos(tamanosData || []);
        setCargandoTamanos(false);
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("Error al cargar datos");
        setCargandoCategorias(false);
        setCargandoTamanos(false);
      }
    };

    cargarDatos();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setImagenes((prev) => [...prev, ...Array.from(files)]);
    }
    // Reset input value to allow uploading the same file again
    e.target.value = "";
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      setImagenes((prev) => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const agregarIngrediente = () => {
    if (nuevoIngrediente.trim()) {
      setIngredientes((prev) => [...prev, nuevoIngrediente.trim()]);
      setNuevoIngrediente("");
    }
  };

  const eliminarIngrediente = (index: number) => {
    setIngredientes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones básicas
    if (!formData.name || !formData.price || !formData.category_id) {
      setError("Nombre, precio y categoría son obligatorios");
      setLoading(false);
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      setError("El precio debe ser mayor a 0");
      setLoading(false);
      return;
    }

    if (formData.is_offer && parseFloat(formData.offer_price) <= 0) {
      setError("El precio de oferta debe ser mayor a 0");
      setLoading(false);
      return;
    }

    try {
      // Crear FormData para el producto principal
      const productFormData = new FormData();
      productFormData.append("name", formData.name);
      productFormData.append("description", formData.description);
      productFormData.append("price", formData.price);
      productFormData.append("offer_price", formData.offer_price || "0");
      productFormData.append("is_offer", formData.is_offer.toString());
      productFormData.append("is_active", formData.is_active.toString());
      productFormData.append("stock", formData.stock || "0");
      productFormData.append(
        "preparation_time",
        formData.preparation_time || "0"
      );
      productFormData.append("category_id", formData.category_id);
      if (formData.is_offer && formData.offer_end_date) {
        productFormData.append("offer_end_date", formData.offer_end_date);
      }

      // 1. Crear el producto principal
      const { data: producto, error: productError } = await crearProducto(
        productFormData
      );

      if (productError) {
        throw new Error(productError);
      }

      if (!producto) {
        throw new Error("No se pudo crear el producto");
      }

      // 2. Subir imágenes al storage
      for (let i = 0; i < imagenes.length; i++) {
        const imageFormData = new FormData();
        imageFormData.append("file", imagenes[i]);

        const { error: imageError } = await uploadProductImage(
          producto.id,
          imageFormData
        );

        if (imageError) {
          console.error(`Error uploading image ${i + 1}:`, imageError);
          // Continue with other images even if one fails
        }
      }

      // 3. Agregar ingredientes
      for (const ingrediente of ingredientes) {
        const { error: ingredienteError } = await agregarIngredienteProducto(
          producto.id,
          ingrediente
        );

        if (ingredienteError) {
          console.error("Error agregando ingrediente:", ingredienteError);
          // Continuamos aunque falle un ingrediente
        }
      }

      // 4. Asignar tamaños seleccionados al producto
      if (selectedSizes.length > 0) {
        const { actualizarTamanosDeProducto } = await import(
          "@/app/actions/product-size-options"
        );
        const { error: sizesError } = await actualizarTamanosDeProducto(
          producto.id,
          selectedSizes,
          defaultSizeId || selectedSizes[0]
        );

        if (sizesError) {
          console.error("Error asignando tamaños:", sizesError);
          // Continuamos aunque falle
        }
      }

      alert("Producto creado exitosamente");
      router.push("/dashboard/productos");
    } catch (error) {
      console.error("Error al crear producto:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al crear el producto. Intenta nuevamente.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (
      confirm(
        "¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán."
      )
    ) {
      router.push("/dashboard/productos");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl 2xl:text-2xl font-bold text-gray-800">
          Nuevo Producto
        </h1>
        <p className="text-sm 2xl:text-base text-gray-600">
          Agrega un nuevo producto a tu catálogo
        </p>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-1 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Información Básica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Producto *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: Torta de Chocolate Premium"
              />
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                placeholder="Describe el producto..."
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              {cargandoCategorias ? (
                <div className="w-full bg-gray-100 px-3 py-2 border border-gray-300 rounded-lg text-gray-500">
                  Cargando categorías...
                </div>
              ) : (
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="">Seleccionar categoría</option>
                  {categorias
                    .filter((cat) => cat.is_active)
                    .map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.name}
                      </option>
                    ))}
                </select>
              )}
            </div>

            {/* Tamaños Disponibles */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaños Disponibles (Opcional)
              </label>
              {cargandoTamanos ? (
                <div className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg text-gray-500">
                  <div className="flex items-center justify-center gap-2 py-8">
                    <RingLoader
                      size="30"
                      stroke="4"
                      bgOpacity="0.1"
                      speed="1.68"
                      color="#3b82f6"
                    />
                    <p className="text-gray-500">Cargando tamaños...</p>
                  </div>
                </div>
              ) : tamanos.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No hay tamaños disponibles. Crea tamaños primero.
                </div>
              ) : (
                <div className="space-y-2 border border-gray-300 rounded-lg p-4">
                  {tamanos
                    .filter((t) => t.is_active)
                    .map((tamano) => (
                      <div
                        key={tamano.id}
                        className="flex items-center justify-between hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`size-${tamano.id}`}
                            checked={selectedSizes.includes(tamano.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSizes([...selectedSizes, tamano.id]);
                                if (selectedSizes.length === 0) {
                                  setDefaultSizeId(tamano.id);
                                }
                              } else {
                                setSelectedSizes(
                                  selectedSizes.filter((id) => id !== tamano.id)
                                );
                                if (defaultSizeId === tamano.id) {
                                  setDefaultSizeId(
                                    selectedSizes.filter(
                                      (id) => id !== tamano.id
                                    )[0] || ""
                                  );
                                }
                              }
                            }}
                            disabled={loading}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <label
                            htmlFor={`size-${tamano.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <span className="font-medium">{tamano.name}</span>
                            <span className="text-gray-600 ml-2">
                              ({tamano.person_capacity} personas)
                            </span>
                            <span className="text-green-600 ml-2">
                              +S/ {tamano.additional_price.toFixed(2)}
                            </span>
                          </label>
                        </div>
                        {selectedSizes.includes(tamano.id) && (
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="default_size"
                              id={`default-${tamano.id}`}
                              checked={defaultSizeId === tamano.id}
                              onChange={() => setDefaultSizeId(tamano.id)}
                              disabled={loading}
                              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <label
                              htmlFor={`default-${tamano.id}`}
                              className="text-sm text-gray-600 cursor-pointer"
                            >
                              Predeterminado
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  {selectedSizes.length === 0 && (
                    <p className="text-sm text-gray-500 italic">
                      Selecciona los tamaños disponibles para este producto
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tiempo de preparación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiempo de Preparación (minutos)
              </label>
              <input
                type="number"
                name="preparation_time"
                value={formData.preparation_time}
                onChange={handleChange}
                min="0"
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Ej: 120"
              />
            </div>
          </div>
        </div>

        {/* Precios y Stock */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Precios y Stock
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Precio normal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Normal (S/) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="0.00"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Inicial *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                disabled={loading}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="0"
              />
            </div>

            {/* Estado */}
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  disabled={loading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-700">Producto activo</span>
              </label>
            </div>
          </div>

          {/* Oferta */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                name="is_offer"
                checked={formData.is_offer}
                onChange={handleChange}
                disabled={loading}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">
                Este producto está en oferta
              </span>
            </label>

            {formData.is_offer && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio de Oferta (S/)
                  </label>
                  <input
                    type="number"
                    name="offer_price"
                    value={formData.offer_price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    disabled={loading}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Fin de Oferta
                  </label>
                  <input
                    type="date"
                    name="offer_end_date"
                    value={formData.offer_end_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Opcional. Deja vacío para oferta sin fecha límite.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Imágenes */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Imágenes del Producto
          </h2>

          <div className="space-y-4">
            {/* Upload area con drag-and-drop */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`bg-white border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
              }`}
            >
              <Upload
                className={`mx-auto h-8 w-8 ${
                  isDragging ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <div className="mt-2">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 font-medium">
                    Sube las imágenes
                  </span>
                  <span className="text-gray-500">
                    {" "}
                    o arrastra y suelta aquí
                  </span>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={loading}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP hasta 5MB ({imagenes.length}/{5})
              </p>
            </div>

            {/* Preview de imágenes */}
            {imagenes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagenes.map((imagen, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={URL.createObjectURL(imagen)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                        Principal
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={loading}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Consejos:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Puedes arrastrar y soltar múltiples imágenes a la vez</li>
                <li>La primera imagen será la imagen principal del producto</li>
                <li>Las imágenes se subirán después de crear el producto</li>
                <li>Formatos recomendados: JPG o PNG</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Ingredientes */}
        <div className="bg-zinc-50 rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Ingredientes
          </h2>

          <div className="space-y-3">
            {/* Agregar ingrediente */}
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoIngrediente}
                onChange={(e) => setNuevoIngrediente(e.target.value)}
                placeholder="Agregar ingrediente..."
                disabled={loading}
                className="flex-1 bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nuevoIngrediente.trim() !== "") {
                    e.preventDefault();
                    agregarIngrediente();
                    setNuevoIngrediente("");
                  }
                }}
              />
              <button
                type="button"
                onClick={agregarIngrediente}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {/* Lista de ingredientes */}
            {ingredientes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {ingredientes.map((ingrediente, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {ingrediente}
                    <button
                      type="button"
                      onClick={() => eliminarIngrediente(index)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 border bg-white border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex justify-center items-center gap-2 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 transition-colors cursor-pointer"
          >
            <FaSave className="w-4 h-4" />
            {loading ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>
      </form>
    </div>
  );
}
