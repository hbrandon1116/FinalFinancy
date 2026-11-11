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
  const num = Number(valor) || 0
  return '$' + Math.abs(num).toLocaleString('es-CO')
}

/**
 * Devuelve una fecha relativa legible.
 * @param {string|Date} fecha
 * @returns {string} Ej: "Hoy", "Hace 1 día", "Hace 3 días"
 */
export function fechaRelativa(fecha) {
  if (!fecha) return ''
  const ahora = new Date()
  const objetivo = new Date(fecha)

  if (Number.isNaN(objetivo.getTime())) return ''

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
  if (diffDias > 1 && diffDias < 30) return `Hace ${diffDias} días`
  if (diffDias < 0 && diffDias === -1) return 'Mañana'
  if (diffDias < 0) return objetivo.toLocaleDateString('es-CO')
  if (diffDias < 365) {
    const meses = Math.floor(diffDias / 30)
    return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`
  }

  return objetivo.toLocaleDateString('es-CO')
}

/**
 * Formatea una fecha a formato legible (ej: 11 nov. 2026).
 * @param {string|Date} fecha
 * @returns {string}
 */
export function formatearFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''

  return d.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Convierte una fecha a formato YYYY-MM-DD para inputs HTML de tipo date.
 * @param {string|Date} fecha
 * @returns {string}
 */
export function aFechaInput(fecha) {
  if (!fecha) {
    const hoy = new Date()
    return hoy.toISOString().split('T')[0]
  }

  // Si ya viene en formato YYYY-MM-DD
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return fecha
  }

  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().split('T')[0]
  }

  // Obtener año, mes, día locales
  const anio = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

/**
 * Obtiene el formato 'YYYY-MM' de una fecha.
 * @param {string|Date} fecha
 * @returns {string}
 */
export function obtenerClaveMes(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  if (Number.isNaN(d.getTime())) return ''
  const anio = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  return `${anio}-${mes}`
}

/**
 * Formatea una clave YYYY-MM a un texto legible (ej: 'Noviembre 2026').
 * @param {string} claveMes
 * @returns {string}
 */
export function formatearNombreMes(claveMes) {
  if (!claveMes || !claveMes.includes('-')) return claveMes
  const [anio, mes] = claveMes.split('-')
  const fecha = new Date(Number(anio), Number(mes) - 1, 1)
  const nombreMes = fecha.toLocaleDateString('es-CO', { month: 'long' })
  const capitalizado = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)
  return `${capitalizado} ${anio}`
}
