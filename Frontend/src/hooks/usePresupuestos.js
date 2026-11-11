import { useContext } from 'react'
import { PresupuestosContext } from '../context/presupuestosContextInstance'

/**
 * usePresupuestos
 *
 * Hook personalizado para acceder a los presupuestos, navegación por períodos y cálculos.
 */
export function usePresupuestos() {
  const context = useContext(PresupuestosContext)
  if (!context) {
    throw new Error('usePresupuestos debe utilizarse dentro de un PresupuestosProvider')
  }
  return context
}

export default usePresupuestos
