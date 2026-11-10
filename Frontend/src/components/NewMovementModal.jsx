import { useState } from 'react'

/**
 * NewMovementModal
 *
 * Modal sencillo para crear un nuevo movimiento.
 * Por ahora NO guarda datos reales; solo muestra la interfaz temporal.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Si el modal está abierto.
 * @param {() => void} props.onClose - Cierra el modal.
 */
function NewMovementModal({ isOpen, onClose }) {
  const [tipo, setTipo] = useState('gasto')

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Nuevo movimiento">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Nuevo movimiento</h2>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form
          className="modal__form"
          onSubmit={(e) => {
            e.preventDefault()
            // TODO: conectar con la API cuando el backend esté listo.
            onClose()
          }}
        >
          {/* Tipo */}
          <div className="modal__field">
            <label className="modal__label">Tipo</label>
            <div className="modal__toggle-group">
              <button
                type="button"
                className={`modal__toggle ${tipo === 'gasto' ? 'modal__toggle--active modal__toggle--gasto' : ''}`}
                onClick={() => setTipo('gasto')}
              >
                Gasto
              </button>
              <button
                type="button"
                className={`modal__toggle ${tipo === 'ingreso' ? 'modal__toggle--active modal__toggle--ingreso' : ''}`}
                onClick={() => setTipo('ingreso')}
              >
                Ingreso
              </button>
            </div>
          </div>

          {/* Nombre */}
          <div className="modal__field">
            <label className="modal__label" htmlFor="mov-nombre">Nombre</label>
            <input
              id="mov-nombre"
              className="modal__input"
              type="text"
              placeholder="Ej: Supermercado"
              required
            />
          </div>

          {/* Monto */}
          <div className="modal__field">
            <label className="modal__label" htmlFor="mov-monto">Monto</label>
            <input
              id="mov-monto"
              className="modal__input"
              type="number"
              placeholder="0"
              min="1"
              required
            />
          </div>

          {/* Categoría */}
          <div className="modal__field">
            <label className="modal__label" htmlFor="mov-categoria">Categoría</label>
            <input
              id="mov-categoria"
              className="modal__input"
              type="text"
              placeholder="Ej: Alimentación"
            />
          </div>

          <button className="modal__submit" type="submit">
            Guardar movimiento
          </button>
        </form>

        <p className="modal__note">
          Los datos no se guardan todavía. Esta es una vista temporal.
        </p>
      </div>
    </div>
  )
}

export default NewMovementModal
