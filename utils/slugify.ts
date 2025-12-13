// Generar slug desde nombre de producto
export function generarSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD") // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos (acentos)
    .replace(/[^a-z0-9\s-]/g, "") // Eliminar caracteres especiales
    .trim()
    .replace(/\s+/g, "-") // Reemplazar espacios con guiones
    .replace(/-+/g, "-"); // Eliminar guiones duplicados
}
