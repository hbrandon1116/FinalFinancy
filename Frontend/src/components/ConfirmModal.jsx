/**
 * ConfirmModal
 *
 * Diálogo accesible de confirmación para acciones destructivas (como eliminar un movimiento).
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {string} props.title
 * @param {string} props.message
 * @param {object} [props.movement] - Movimiento a eliminar para mostrar contexto.
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
import { formatearMoneda, formatearFecha } from '../utils/format'

function ConfirmModal({ isOpen, title = 'Confirmar acción', message, movement, onConfirm, onCancel }) {
  if (!isOpen) return null

  return (
    <div
      className="modal-overlay"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="modal modal--confirm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="confirm-modal__icon-wrapper" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className="modal__title" id="confirm-modal-title">
            {title}
          </h2>
          <button
            className="modal__close"
            type="button"
            onClick={onCancel}
            aria-label="Cerrar ventana de confirmación"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="confirm-modal__body">
          <p className="confirm-modal__message">{message}</p>

          {movement && (
            <div className="confirm-modal__preview">
              <span className={`confirm-modal__preview-badge confirm-modal__preview-badge--${movement.tipo}`}>
                {movement.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
              </span>
              <div className="confirm-modal__preview-info">
                <strong className="confirm-modal__preview-desc">
                  {movement.descripcion || movement.nombre}
                </strong>
                <span className="confirm-modal__preview-meta">
                  {movement.categoria} · {formatearFecha(movement.fecha)}
                </span>
              </div>
              <span className={`confirm-modal__preview-monto confirm-modal__preview-monto--${movement.tipo}`}>
                {movement.tipo === 'ingreso' ? '+' : '-'}
                {formatearMoneda(movement.valor || movement.monto)}
              </span>
            </div>
          )}
        </div>

        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--danger"
            onClick={onConfirm}
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
