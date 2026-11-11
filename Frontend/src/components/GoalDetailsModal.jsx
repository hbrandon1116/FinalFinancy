import { formatearMoneda, formatearFecha } from '../utils/format'

/**
 * GoalDetailsModal
 *
 * Muestra el detalle exhaustivo de una meta de ahorro y su historial cronológico de aportes.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {object} props.meta
 * @param {() => void} props.onAportar
 */
function GoalDetailsModal({ isOpen, onClose, meta, onAportar }) {
  if (!isOpen || !meta) return null

  const {
    nombre,
    descripcion,
    objetivo,
    ahorrado,
    restante,
    porcentaje,
    fechaLimite,
    estado,
    aportes = [],
  } = meta

  const textosEstado = {
    'en-progreso': 'En progreso',
    completada: 'Completada',
    vencida: 'Vencida',
  }

  const anchoBarra = Math.min(100, Math.max(0, porcentaje))

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-details-title"
    >
      <div className="modal modal--details" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="modal__header">
          <div className="goal-details__header-info">
            <span className={`goal-card__badge goal-card__badge--${estado}`}>
              {textosEstado[estado] || estado}
            </span>
            <h2 className="modal__title" id="goal-details-title">
              {nombre}
            </h2>
          </div>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalles de la meta"
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

        {/* Cuerpo con descripción y progreso */}
        <div className="goal-details__body">
          {descripcion && (
            <p className="goal-details__description">{descripcion}</p>
          )}

          {/* Tarjeta de métricas */}
          <div className="goal-details__metrics-card">
            <div className="goal-details__metrics-row">
              <div className="goal-details__metric">
                <span className="goal-details__metric-label">Ahorrado</span>
                <span className="goal-details__metric-value goal-details__metric-value--saved">
                  {formatearMoneda(ahorrado)}
                </span>
              </div>
              <div className="goal-details__metric goal-details__metric--right">
                <span className="goal-details__metric-label">Objetivo</span>
                <span className="goal-details__metric-value">
                  {formatearMoneda(objetivo)}
                </span>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="goal-card__progress-container">
              <div className="goal-card__progress-info">
                <span className="goal-card__progress-pct">{porcentaje}% alcanzado</span>
                <span className={`goal-card__progress-diff goal-card__progress-diff--${estado}`}>
                  {estado === 'completada'
                    ? '¡Meta 100% alcanzada!'
                    : `Faltan ${formatearMoneda(restante)}`}
                </span>
              </div>
              <div
                className="goal-card__progress-bar"
                role="progressbar"
                aria-valuenow={porcentaje}
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div
                  className={`goal-card__progress-fill goal-card__progress-fill--${estado}`}
                  style={{ width: `${anchoBarra}%` }}
                />
              </div>
            </div>

            <div className="goal-details__deadline">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Fecha límite: {formatearFecha(fechaLimite)}</span>
            </div>
          </div>

          {/* Sección Historial de Aportes */}
          <div className="goal-details__history-section">
            <div className="goal-details__history-header">
              <h3 className="goal-details__history-title">
                Historial de aportes ({aportes.length})
              </h3>
              <button
                type="button"
                className="goal-details__add-btn"
                onClick={() => {
                  onClose()
                  onAportar()
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Aportar</span>
              </button>
            </div>

            {aportes.length > 0 ? (
              <ul className="goal-details__history-list" role="list">
                {aportes.map((aporte) => (
                  <li key={aporte.id} className="goal-details__history-item">
                    <div className="goal-details__history-left">
                      <span className="goal-details__history-icon" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="17 11 12 6 7 11" />
                          <line x1="12" y1="6" x2="12" y2="18" />
                        </svg>
                      </span>
                      <div className="goal-details__history-info">
                        <span className="goal-details__history-desc">
                          {aporte.descripcion || 'Aporte a la meta'}
                        </span>
                        <span className="goal-details__history-date">
                          {formatearFecha(aporte.fecha)}
                        </span>
                      </div>
                    </div>
                    <span className="goal-details__history-amount">
                      +{formatearMoneda(aporte.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="goal-details__history-empty">
                <p>Aún no has registrado ningún aporte en esta meta.</p>
              </div>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default GoalDetailsModal
