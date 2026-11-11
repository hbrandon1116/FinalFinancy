import { createContext } from 'react'

/**
 * Contexto de React para los presupuestos de FinalFinancy.
 * Separado en su propio módulo para garantizar compatibilidad con React Fast Refresh.
 */
export const PresupuestosContext = createContext(null)

export default PresupuestosContext
