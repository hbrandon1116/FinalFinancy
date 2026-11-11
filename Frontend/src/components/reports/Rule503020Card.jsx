import { formatearMoneda } from '../../utils/format'

/**
 * Rule503020Card
 *
 * Muestra el análisis comparativo de la regla financiera 50/30/20
 * contrastando la recomendación ideal contra los gastos y ahorros reales del período.
 *
 * @param {object} props
 * @param {object} props.analisis - { baseCalculo, secciones, noClasificado }
 */
function Rule503020Card({ analisis }) {
  const { secciones, baseCalculo, noClasificado } = analisis

  return (
    <section className="report-card" aria-labelledby="rule-503020-title">
      <div className="report-card__header">
        <div className="report-card__title-group">
          <h3 className="report-card__title" id="rule-503020-title">
            Análisis de la Regla 50 / 30 / 20
          </h3>
          <p className="report-card__subtitle">
            Distribución ideal vs. comportamiento real del período (Base: {formatearMoneda(baseCalculo)})
          </p>
        </div>
      </div>

      <div className="rule-503020-grid">
        {secciones.map((sec) => {
          const esAhorro = sec.id === 'ahorro'
          // Para ahorro, tener más es positivo. Para necesidades/deseos, tener más es excederse.
          const esPositivo = esAhorro ? sec.diferenciaPct >= 0 : sec.diferenciaPct <= 0

          return (
            <article key={sec.id} className={`rule-card rule-card--${sec.id}`}>
              <div className="rule-card__header">
                <div className="rule-card__title-group">
                  <h4 className="rule-card__title">{sec.nombre}</h4>
                  <span className="rule-card__pct-ideal">Recomendado: {sec.pctRecomendado}%</span>
                </div>
                <div className="rule-card__pct-real-wrapper">
                  <span className="rule-card__pct-real">{sec.pctReal}%</span>
                  <span
                    className={`rule-card__diff-badge ${
                      esPositivo ? 'rule-card__diff-badge--good' : 'rule-card__diff-badge--alert'
                    }`}
                  >
                    {sec.diferenciaPct > 0 ? `+${sec.diferenciaPct}%` : `${sec.diferenciaPct}%`}
                  </span>
                </div>
              </div>

              {/* Valores monetarios */}
              <div className="rule-card__values">
                <div className="rule-card__val-item">
                  <span className="rule-card__val-label">Monto real</span>
                  <span className="rule-card__val-amount">{formatearMoneda(sec.valorReal)}</span>
                </div>
                <div className="rule-card__val-item rule-card__val-item--right">
                  <span className="rule-card__val-label">Objetivo ideal</span>
                  <span className="rule-card__val-amount rule-card__val-amount--target">
                    {formatearMoneda(sec.valorRecomendado)}
                  </span>
                </div>
              </div>

              {/* Barras de comparación */}
              <div className="rule-card__bars">
                {/* Barra real */}
                <div className="rule-card__bar-row">
                  <span className="rule-card__bar-label">Real</span>
                  <div className="rule-card__bar-track">
                    <div
                      className={`rule-card__bar-fill rule-card__bar-fill--${sec.id}`}
                      style={{ width: `${Math.min(100, sec.pctReal)}%` }}
                    />
                  </div>
                </div>
                {/* Barra recomendada */}
                <div className="rule-card__bar-row">
                  <span className="rule-card__bar-label">Meta</span>
                  <div className="rule-card__bar-track">
                    <div
                      className="rule-card__bar-fill rule-card__bar-fill--target"
                      style={{ width: `${sec.pctRecomendado}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="rule-card__description">{sec.descripcion}</p>
            </article>
          )
        })}
      </div>

      {/* Nota sobre categorías sin clasificación específica */}
      {noClasificado > 0 && (
        <div className="rule-503020-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>
            Existen gastos por un total de <strong>{formatearMoneda(noClasificado)}</strong> en categorías no asignadas formalmente a necesidades o deseos.
          </span>
        </div>
      )}
    </section>
  )
}

export default Rule503020Card
