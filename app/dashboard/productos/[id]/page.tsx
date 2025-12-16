"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, X, Upload, Plus, Trash2, Loader, Package } from "lucide-react";
import {
  obtenerProductoPorId,
  actualizarProducto,
  agregarIngredienteProducto,
  eliminarIngredienteProducto,
  type ProductoCompleto,
} from "@/app/actions/productos";
import {
  uploadProductImage,
  deleteProductImage,
} from "@/app/actions/product-images";
import { obtenerCategorias } from "@/app/actions/categorias";
import { obtenerTamanos } from "@/app/actions/tamanos";
import RingLoader from "@/components/loaders/ringLoader";
import { FaSave } from "react-icons/fa";
import { useNotyf } from "@/app/providers/NotyfProvider";

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

export default function EditarProductoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [producto, setProducto] = useState<ProductoCompleto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [tamanos, setTamanos] = useState<Tamano[]>([]);
  const notyf = useNotyf();
  const [nuevoIngrediente, setNuevoIngrediente] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [defaultSizeId, setDefaultSizeId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Set<string>>(
    new Set()
  );

  // Estado del formulario
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

  // Cargar producto y categorías al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      if (!params.id) return;

      try {
        setLoading(true);
        setError(null);

        // Cargar categorías
        const { data: categoriasData, error: categoriasError } =
          await obtenerCategorias();
        if (categoriasError) {
          throw new Error(categoriasError);
        }
        setCategorias(categoriasData || []);

        // Cargar tamaños
        const { data: tamanosData, error: tamanosError } =
          await obtenerTamanos();
        if (tamanosError) {
          console.error("Error cargando tamaños:", tamanosError);
          notyf?.error("Error cargando tamaños");
        }
        setTamanos(tamanosData || []);

        // Cargar producto
        const { data: productoData, error: productoError } =
          await obtenerProductoPorId(params.id as string);

        if (productoError) {
          throw new Error(productoError);
        }

        if (productoData) {
          setProducto(productoData);
          setFormData({
            name: productoData.name || "",
            description: productoData.description || "",
            price: productoData.price.toString(),
            offer_price: productoData.offer_price?.toString() || "",
            is_offer: productoData.is_offer || false,
            is_active: productoData.is_active || true,
            stock: productoData.stock.toString(),
            preparation_time: productoData.preparation_time.toString(),
            category_id: productoData.category_id,
            offer_end_date: productoData.offer_end_date || "",
          });

          // Load existing sizes
          if (
            productoData.available_sizes &&
            productoData.available_sizes.length > 0
          ) {
            const sizeIds = productoData.available_sizes.map(
              (s: any) => s.size_id
            );
            setSelectedSizes(sizeIds);
            const defaultSize = productoData.available_sizes.find(
              (s: any) => s.is_default
            );
            setDefaultSizeId(defaultSize?.size_id || sizeIds[0] || "");
          }
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(err instanceof Error ? err.message : "Error al cargar datos");
        notyf?.error("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [params.id]);

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

    if (error) setError(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && producto) {
      await uploadImages(Array.from(files));
    }
    // Reset input value to allow uploading the same file again
    e.target.value = "";
  };

  const uploadImages = async (files: File[]) => {
    if (!producto) return;

    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`;

      try {
        // Add to uploading set
        setUploadingImages((prev) => new Set(prev).add(fileId));

        const imageFormData = new FormData();
        imageFormData.append("file", file);

        const { data, error: imageError } = await uploadProductImage(
          producto.id,
          imageFormData
        );

        if (imageError) {
          throw new Error(imageError);
        }

        // Update producto with new image
        if (data) {
          setProducto((prev) =>
            prev
              ? {
                  ...prev,
                  images: [...prev.images, data],
                }
              : null
          );
        }
      } catch (err) {
        console.error(`Error uploading image ${file.name}:`, err);
        notyf?.error(
          err instanceof Error
            ? err.message
            : `Error al subir la imagen ${file.name}`
        );
      } finally {
        // Remove from uploading set
        setUploadingImages((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }
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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0 && producto) {
      await uploadImages(files);
    }
  };

  const removeImagenExistente = async (imagenId: string) => {
    if (!producto) return;

    try {
      const { error } = await deleteProductImage(imagenId);

      if (error) {
        throw new Error(error);
      }

      // Actualizar estado local
      setProducto((prev) =>
        prev
          ? {
              ...prev,
              images: prev.images.filter((img) => img.id !== imagenId),
            }
          : null
      );
    } catch (err) {
      console.error("Error eliminando imagen:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al eliminar imagen"
      );
    }
  };

  const agregarIngrediente = async () => {
    if (!producto || !nuevoIngrediente.trim()) return;

    try {
      const { error } = await agregarIngredienteProducto(
        producto.id,
        nuevoIngrediente.trim()
      );

      if (error) {
        throw new Error(error);
      }

      // Actualizar estado local
      setProducto((prev) =>
        prev
          ? {
              ...prev,
              ingredients: [
                ...prev.ingredients,
                {
                  id: Date.now().toString(),
                  ingredient: nuevoIngrediente.trim(),
                },
              ],
            }
          : null
      );

      setNuevoIngrediente("");
    } catch (err) {
      console.error("Error agregando ingrediente:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al agregar ingrediente"
      );
    }
  };

  const eliminarIngrediente = async (ingredienteId: string) => {
    if (!producto) return;

    try {
      const { error } = await eliminarIngredienteProducto(ingredienteId);

      if (error) {
        throw new Error(error);
      }

      // Actualizar estado local
      setProducto((prev) =>
        prev
          ? {
              ...prev,
              ingredients: prev.ingredients.filter(
                (ing) => ing.id !== ingredienteId
              ),
            }
          : null
      );
    } catch (err) {
      console.error("Error eliminando ingrediente:", err);
      notyf?.error(
        err instanceof Error ? err.message : "Error al eliminar ingrediente"
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto) return;

    setSaving(true);
    setError(null);

    // Validaciones básicas
    if (!formData.name || !formData.price || !formData.category_id) {
      setError("Nombre, precio y categoría son obligatorios");
      setSaving(false);
      notyf?.error("Nombre, precio y categoría son obligatorios");
      return;
    }

    if (parseFloat(formData.price) <= 0) {
      setError("El precio debe ser mayor a 0");
      setSaving(false);
      notyf?.error("El precio debe ser mayor a 0");
      return;
    }

    if (formData.is_offer && parseFloat(formData.offer_price) <= 0) {
      setError("El precio de oferta debe ser mayor a 0");
      setSaving(false);
      notyf?.error("El precio de oferta debe ser mayor a 0");
      return;
    }

    try {
      // Crear FormData para la actualización
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

      // Actualizar producto principal
      const { error: productError } = await actualizarProducto(
        producto.id,
        productFormData
      );

      if (productError) {
        throw new Error(productError);
      }

      // Images are now uploaded immediately when selected, so no need to upload here

      // Actualizar tamaños del producto
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
          console.error("Error actualizando tamaños:", sizesError);
          notyf?.error("Error actualizando tamaños");
          // Continuamos aunque falle
        }
      } else {
        // Si no hay tamaños seleccionados, eliminar todos
        const { actualizarTamanosDeProducto } = await import(
          "@/app/actions/product-size-options"
        );
        await actualizarTamanosDeProducto(producto.id, [], "");
      }

      notyf?.success("Producto actualizado");
      router.push("/dashboard/productos");
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al actualizar el producto. Intenta nuevamente.";
      setError(errorMessage);
      notyf?.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/productos");
    notyf?.error("Operación cancelada");
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center gap-2 h-full">
        <RingLoader
          size="50"
          stroke="6"
          bgOpacity="0.1"
          speed="1.68"
          color="#3b82f6"
        />
        <p className="text-gray-500">Cargando producto...</p>
      </div>
    );
  }

  if (error && !producto) {
    return (
      <div className="max-w-4xl mx-auto h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">Error</h3>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={() => router.push("/dashboard/productos")}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-full">
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Producto no encontrado
          </h3>
          <button
            onClick={() => router.push("/dashboard/productos")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl 2xl:text-2xl font-bold text-gray-800">
          Editar Producto:{" "}
          <p className="text-xl 2xl:text-2xl font-bold text-indigo-600">
            {producto.name}
          </p>
        </h1>
        <p className="text-sm 2xl:text-base text-gray-600">
          Actualiza la información del producto
        </p>
      </div>

      {/* Información del producto */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {/* <div>
            <span className="font-medium">ID:</span> {producto.id}
          </div> */}
          <div>
            <span className="font-medium">Categoría actual:</span>{" "}
            {producto.category?.name}
          </div>
          <div>
            <span className="font-medium">Creado:</span>{" "}
            {new Date(producto.created_at).toLocaleDateString("es-PE")}
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <X className="h-5 w-5 text-red-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
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
                disabled={saving}
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
                disabled={saving}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                placeholder="Describe el producto..."
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
                disabled={saving}
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
            </div>

            {/* Tamaños Disponibles */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tamaños Disponibles (Opcional)
              </label>
              {tamanos.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No hay tamaños disponibles. Crea tamaños primero.
                </div>
              ) : (
                <div className="2xl:space-y-2 border border-gray-300 rounded-lg p-4">
                  {tamanos
                    .filter((t) => t.is_active)
                    .map((tamano) => (
                      <div
                        key={tamano.id}
                        className="flex flex-col md:flex-row items-start md:items-center gap-2 justify-between p-2 hover:bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
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
                            disabled={saving}
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
                              disabled={saving}
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
                disabled={saving}
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
                disabled={saving}
                className="w-full bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="0.00"
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock *
              </label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                required
                min="0"
                disabled={saving}
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
                  disabled={saving}
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
                disabled={saving}
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
                    disabled={saving}
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
                    disabled={saving}
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
                    Sube imágenes
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
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={saving || uploadingImages.size > 0}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP hasta 10MB
              </p>
              {uploadingImages.size > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2 text-blue-600">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    Subiendo {uploadingImages.size} imagen(es)...
                  </span>
                </div>
              )}
            </div>

            {/* Imágenes existentes */}
            {producto.images && producto.images.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Imágenes del producto ({producto.images.length})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {producto.images.map((imagen, index) => (
                    <div key={imagen.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={imagen.image_url || "/placeholder-image.jpg"}
                          alt={`Imagen del producto`}
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
                        onClick={() => removeImagenExistente(imagen.id)}
                        disabled={saving}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Consejos:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Las imágenes se suben automáticamente al seleccionarlas</li>
                <li>Puedes arrastrar y soltar múltiples imágenes a la vez</li>
                <li>La primera imagen será la imagen principal del producto</li>
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
                disabled={saving}
                className="flex-1 bg-white px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && nuevoIngrediente.trim() !== "") {
                    e.preventDefault();
                    agregarIngrediente();
                  }
                }}
              />
              <button
                type="button"
                onClick={agregarIngrediente}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>

            {/* Lista de ingredientes */}
            {producto.ingredients && producto.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {producto.ingredients.map((ingrediente) => (
                  <span
                    key={ingrediente.id}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {ingrediente.ingredient}
                    <button
                      type="button"
                      onClick={() => eliminarIngrediente(ingrediente.id)}
                      disabled={saving}
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
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FaSave className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}
