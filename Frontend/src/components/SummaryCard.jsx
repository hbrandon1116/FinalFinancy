import { formatearMoneda } from '../utils/format'

/**
 * SummaryCard
 *
 * Tarjeta de resumen financiero reutilizable.
 * Muestra un indicador con título, subtítulo, monto y tendencia visual.
 *
 * @param {object} props
 * @param {string} props.titulo - Ej: "Ingresos", "Gastos", "Balance".
 * @param {string} props.subtitulo - Ej: "(del mes)".
 * @param {number} props.monto - Valor numérico a mostrar.
 * @param {'positivo'|'negativo'|'neutro'} props.tendencia - Indicador visual.
 * @param {string} [props.className] - Clase CSS adicional.
 */
function SummaryCard({ titulo, subtitulo, monto, tendencia, className = '' }) {
  const tendenciaIcon = {
    positivo: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
    negativo: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        <polyline points="17 18 23 18 23 12" />
      </svg>
    ),
    neutro: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
      </svg>
    ),
  }

  return (
    <article className={`summary-card summary-card--${tendencia} ${className}`}>
      <div className="summary-card__header">
        <div>
          <h3 className="summary-card__titulo">{titulo}</h3>
          <span className="summary-card__subtitulo">{subtitulo}</span>
        </div>
        <span className={`summary-card__icon summary-card__icon--${tendencia}`}>
          {tendenciaIcon[tendencia]}
        </span>
      </div>
      <p className="summary-card__monto">
        {tendencia === 'negativo' && '-'}
        {formatearMoneda(monto)}
      </p>
    </article>
  )
}

export default SummaryCard
