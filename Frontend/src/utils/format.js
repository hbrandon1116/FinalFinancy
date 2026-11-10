/**
 * utils/format.js
 *
 * Funciones de formateo reutilizables para moneda y fechas.
 * Centralizan la lógica para que los componentes no repitan este código.
 */

/**
 * Formatea un número como moneda colombiana (COP).
 * @param {number} valor
 * @returns {string} Ej: "$1.200.000"
 */
export function formatearMoneda(valor) {
  return '$' + Math.abs(valor).toLocaleString('es-CO')
}

/**
 * Devuelve una fecha relativa legible.
 * @param {string|Date} fecha
 * @returns {string} Ej: "Hoy", "Hace 1 día", "Hace 3 días"
 */
export function fechaRelativa(fecha) {
  const ahora = new Date()
  const objetivo = new Date(fecha)

  // Normalizar a medianoche para comparar por días calendario.
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
  const dia = new Date(
    objetivo.getFullYear(),
    objetivo.getMonth(),
    objetivo.getDate(),
  )

  const diffMs = hoy.getTime() - dia.getTime()
  const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24))

  if (diffDias === 0) return 'Hoy'
  if (diffDias === 1) return 'Hace 1 día'
  if (diffDias < 30) return `Hace ${diffDias} días`
  if (diffDias < 365) {
    const meses = Math.floor(diffDias / 30)
    return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`
  }

  return objetivo.toLocaleDateString('es-CO')
}
