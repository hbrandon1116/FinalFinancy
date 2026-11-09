/**
 * services/api.js
 *
 * Punto único de comunicación con la API de Django REST Framework.
 *
 * En esta etapa NO hay backend conectado ni endpoints definidos: las funciones
 * de petición están preparadas pero deliberadamente inactivas. Cuando exista el
 * backend se implementa `request` una sola vez y el resto de la aplicación
 * sigue hablando únicamente con este módulo.
 */

/** URL base de la API. Se toma del archivo .env (ver .env.example). */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

/**
 * Devuelve la cabecera de autorización con el token del usuario.
 * Placeholder: hoy siempre devuelve un objeto vacío porque no hay sesión.
 *
 * @returns {Record<string, string>}
 */
export function getCredentials() {
  // TODO: leer el token desde el contexto de autenticación.
  return {}
}

/**
 * Petición HTTP genérica hacia la API.
 *
 * @param {string} path    Ruta relativa, por ejemplo '/movimientos'.
 * @param {object} [options] Opciones de fetch (method, body, headers, signal).
 * @returns {Promise<unknown>}
 * @throws {Error} Siempre, hasta que se conecte el backend.
 */
async function request(path, options = {}) {
  // TODO: implementar con fetch(`${API_BASE_URL}${path}`, ...).
  throw new Error(
    `API no conectada todavía (${options.method ?? 'GET'} ${path}). ` +
      'Se habilitará en el sprint de integración con Django.',
  )
}

/** @param {string} path @returns {Promise<unknown>} */
export const get = (path, options) => request(path, { ...options, method: 'GET' })

/** @param {string} path @param {unknown} body @returns {Promise<unknown>} */
export const post = (path, body, options) =>
  request(path, { ...options, method: 'POST', body })

/** @param {string} path @param {unknown} body @returns {Promise<unknown>} */
export const put = (path, body, options) =>
  request(path, { ...options, method: 'PUT', body })

/** @param {string} path @param {unknown} body @returns {Promise<unknown>} */
export const patch = (path, body, options) =>
  request(path, { ...options, method: 'PATCH', body })

/** @param {string} path @returns {Promise<unknown>} */
export const remove = (path, options) =>
  request(path, { ...options, method: 'DELETE' })

export default { API_BASE_URL, getCredentials, get, post, put, patch, remove }