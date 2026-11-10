import { formatearMoneda } from '../utils/format'
import { fechaRelativa } from '../utils/format'

/**
 * MovementItem
 *
 * Fila individual de un movimiento financiero.
 *
 * @param {object} props
 * @param {object} props.movimiento
 * @param {string} props.movimiento.nombre
 * @param {string} props.movimiento.fecha
 * @param {number} props.movimiento.monto
 * @param {'ingreso'|'gasto'} props.movimiento.tipo
 * @param {string} props.movimiento.categoria
 */
function MovementItem({ movimiento }) {
  const { nombre, fecha, monto, tipo, categoria } = movimiento
  const esIngreso = tipo === 'ingreso'

  return (
    <li className="movement-item">
      <div className="movement-item__left">
        <span
          className={`movement-item__indicator movement-item__indicator--${tipo}`}
          aria-hidden="true"
        >
          {esIngreso ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="17 11 12 6 7 11" />
              <line x1="12" y1="6" x2="12" y2="18" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="7 13 12 18 17 13" />
              <line x1="12" y1="18" x2="12" y2="6" />
            </svg>
          )}
        </span>
        <div className="movement-item__info">
          <span className="movement-item__nombre">{nombre}</span>
          <span className="movement-item__meta">
            {categoria} · {fechaRelativa(fecha)}
          </span>
        </div>
      </div>

      <span className={`movement-item__monto movement-item__monto--${tipo}`}>
        {esIngreso ? '+' : '-'}{formatearMoneda(monto)}
      </span>
    </li>
  )
}

export default MovementItem
