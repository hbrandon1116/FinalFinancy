import MovementModal from './MovementModal'
import { useMovimientos } from '../hooks/useMovimientos'

/**
 * NewMovementModal
 *
 * Componente modal para crear nuevos movimientos.
 * Mantiene compatibilidad con el DashboardHeader y Dashboard, integrando
 * automáticamente el contexto de movimientos para evitar inconsistencias.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Si el modal está abierto.
 * @param {() => void} props.onClose - Cierra el modal.
 * @param {(datos: object) => void} [props.onSave] - Callback opcional al guardar.
 * @param {object|null} [props.movimientoAEditar] - Movimiento en modo edición opcional.
 */
function NewMovementModal({ isOpen, onClose, onSave, movimientoAEditar = null }) {
  const { agregarMovimiento } = useMovimientos()

  const handleSave = (datos) => {
    if (onSave) {
      onSave(datos)
    } else {
      agregarMovimiento(datos)
    }
  }

  return (
    <MovementModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      movimientoAEditar={movimientoAEditar}
    />
  )
}

export default NewMovementModal
