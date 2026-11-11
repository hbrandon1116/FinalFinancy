import { formatearMoneda, formatearFecha } from '../utils/format'

/**
 * GoalCard
 *
 * Muestra el estado de una meta de ahorro con su progreso, métricas,
 * estado visual (en-progreso, completada, vencida) y accesos directos
 * para aportar, ver detalles, editar y eliminar.
 *
 * @param {object} props
 * @param {object} props.meta
 * @param {(m: object) => void} props.onAportar
 * @param {(m: object) => void} props.onVerDetalles
 * @param {(m: object) => void} props.onEditar
 * @param {(m: object) => void} props.onEliminar
 */
function GoalCard({ meta, onAportar, onVerDetalles, onEditar, onEliminar }) {
  const { nombre, objetivo, ahorrado, restante, porcentaje, fechaLimite, estado, aportes = [] } = meta

  const anchoBarra = Math.min(100, Math.max(0, porcentaje))

  const textosEstado = {
    'en-progreso': 'En progreso',
    completada: 'Completada',
    vencida: 'Vencida',
  }

  return (
    <article className={`goal-card goal-card--${estado}`} aria-labelledby={`goal-title-${meta.id}`}>
      {/* Cabecera */}
      <div className="goal-card__header">
        <div className="goal-card__title-group">
          <h3 className="goal-card__title" id={`goal-title-${meta.id}`}>
            {nombre}
          </h3>
          <span className={`goal-card__badge goal-card__badge--${estado}`}>
            {textosEstado[estado] || estado}
          </span>
        </div>

        {/* Acciones de edición y eliminación */}
        <div className="goal-card__actions">
          <button
            type="button"
            className="movements-action-btn movements-action-btn--edit"
            onClick={() => onEditar(meta)}
            aria-label={`Editar meta ${nombre}`}
            title="Editar meta"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            className="movements-action-btn movements-action-btn--delete"
            onClick={() => onEliminar(meta)}
            aria-label={`Eliminar meta ${nombre}`}
            title="Eliminar meta"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Valores: Ahorrado vs Objetivo */}
      <div className="goal-card__stats">
        <div className="goal-card__stat-item">
          <span className="goal-card__stat-label">Ahorrado</span>
          <span className="goal-card__stat-value goal-card__stat-value--saved">
            {formatearMoneda(ahorrado)}
          </span>
        </div>
        <div className="goal-card__stat-item goal-card__stat-item--right">
          <span className="goal-card__stat-label">Objetivo</span>
          <span className="goal-card__stat-value goal-card__stat-value--target">
            {formatearMoneda(objetivo)}
          </span>
        </div>
      </div>

      {/* Barra de progreso visual con porcentaje */}
      <div className="goal-card__progress-container">
        <div className="goal-card__progress-info">
          <span className="goal-card__progress-pct">{porcentaje}% alcanzado</span>
          <span className={`goal-card__progress-diff goal-card__progress-diff--${estado}`}>
            {estado === 'completada'
              ? '¡Completada!'
              : `Faltan ${formatearMoneda(restante)}`}
          </span>
        </div>
        <div
          className="goal-card__progress-bar"
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`Progreso de la meta ${nombre}: ${porcentaje}%`}
        >
          <div
            className={`goal-card__progress-fill goal-card__progress-fill--${estado}`}
            style={{ width: `${anchoBarra}%` }}
          />
        </div>
      </div>

      {/* Meta fecha límite y cantidad de aportes */}
      <div className="goal-card__meta-footer">
        <div className="goal-card__date" title={`Fecha límite: ${formatearFecha(fechaLimite)}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{formatearFecha(fechaLimite)}</span>
        </div>
        <span className="goal-card__aportes-count">
          {aportes.length} {aportes.length === 1 ? 'aporte' : 'aportes'}
        </span>
      </div>

      {/* Botones de acción inferiores */}
      <div className="goal-card__bottom-actions">
        <button
          type="button"
          className="goal-card__btn-details"
          onClick={() => onVerDetalles(meta)}
        >
          Detalles e historial
        </button>
        <button
          type="button"
          className="goal-card__btn-contribute"
          onClick={() => onAportar(meta)}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Aportar</span>
        </button>
      </div>
    </article>
  )
}

export default GoalCard
