import { formatearMoneda } from '../utils/format'

/**
 * BudgetCard
 *
 * Muestra el estado individual de un presupuesto por categoría para el mes activo:
 * - Nombre de categoría
 * - Límite, gastado, restante o excedido
 * - Porcentaje consumido
 * - Barra de progreso con color según estado (normal, alerta >=80%, superado >100%)
 * - Botones de acción para editar y eliminar
 *
 * @param {object} props
 * @param {object} props.presupuesto
 * @param {(p: object) => void} props.onEditar
 * @param {(p: object) => void} props.onEliminar
 */
function BudgetCard({ presupuesto, onEditar, onEliminar }) {
  const { categoria, limite, gastado, restante, excedidoPor, porcentaje, estado } = presupuesto

  // Ancho visual de la barra (tope 100% para evitar desbordes visuales)
  const anchoBarra = Math.min(100, Math.max(0, porcentaje))

  const textosEstado = {
    normal: 'Dentro del límite',
    alerta: 'Cerca del límite',
    superado: 'Límite superado',
  }

  return (
    <article className={`budget-card budget-card--${estado}`} aria-labelledby={`budget-title-${presupuesto.id}`}>
      {/* Cabecera de la tarjeta */}
      <div className="budget-card__header">
        <div className="budget-card__title-group">
          <h3 className="budget-card__title" id={`budget-title-${presupuesto.id}`}>
            {categoria}
          </h3>
          <span className={`budget-card__badge budget-card__badge--${estado}`}>
            {textosEstado[estado]}
          </span>
        </div>

        {/* Acciones de editar y eliminar */}
        <div className="budget-card__actions">
          <button
            type="button"
            className="movements-action-btn movements-action-btn--edit"
            onClick={() => onEditar(presupuesto)}
            aria-label={`Editar límite del presupuesto para ${categoria}`}
            title="Editar límite"
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
            onClick={() => onEliminar(presupuesto)}
            aria-label={`Eliminar presupuesto para ${categoria}`}
            title="Eliminar presupuesto"
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

      {/* Valores: Gastado vs Límite */}
      <div className="budget-card__stats">
        <div className="budget-card__stat-item">
          <span className="budget-card__stat-label">Gastado</span>
          <span className="budget-card__stat-value budget-card__stat-value--gastado">
            {formatearMoneda(gastado)}
          </span>
        </div>
        <div className="budget-card__stat-item budget-card__stat-item--right">
          <span className="budget-card__stat-label">Límite establecido</span>
          <span className="budget-card__stat-value budget-card__stat-value--limite">
            {formatearMoneda(limite)}
          </span>
        </div>
      </div>

      {/* Barra de progreso visual con porcentaje */}
      <div className="budget-card__progress-container">
        <div className="budget-card__progress-info">
          <span className="budget-card__progress-pct">{porcentaje}% utilizado</span>
          <span className={`budget-card__progress-diff budget-card__progress-diff--${estado}`}>
            {estado === 'superado'
              ? `Excedido por ${formatearMoneda(excedidoPor)}`
              : `Disponible: ${formatearMoneda(restante)}`}
          </span>
        </div>
        <div
          className="budget-card__progress-bar"
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`Progreso del presupuesto de ${categoria}: ${porcentaje}%`}
        >
          <div
            className={`budget-card__progress-fill budget-card__progress-fill--${estado}`}
            style={{ width: `${anchoBarra}%` }}
          />
        </div>
      </div>
    </article>
  )
}

export default BudgetCard
