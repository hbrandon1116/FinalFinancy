import { useContext } from 'react'
import { MovimientosContext } from '../context/movimientosContextInstance'

/**
 * useMovimientos
 *
 * Hook personalizado para acceder al estado y acciones de movimientos.
 */
export function useMovimientos() {
  const context = useContext(MovimientosContext)
  if (!context) {
    throw new Error('useMovimientos debe utilizarse dentro de un MovimientosProvider')
  }
  return context
}

export default useMovimientos
