import { useContext } from 'react'
import { AhorroContext } from '../context/ahorroContextInstance'

/**
 * useAhorro
 *
 * Hook personalizado para acceder al estado de metas de ahorro, aportes y métricas.
 */
export function useAhorro() {
  const context = useContext(AhorroContext)
  if (!context) {
    throw new Error('useAhorro debe utilizarse dentro de un AhorroProvider')
  }
  return context
}

export default useAhorro
