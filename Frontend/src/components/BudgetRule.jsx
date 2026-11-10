import { formatearMoneda } from '../utils/format'

/**
 * BudgetRule
 *
 * Visualización de la regla financiera 50/30/20.
 * Muestra cada categoría con su porcentaje recomendado, monto actual,
 * límite y barra de progreso.
 *
 * @param {object} props
 * @param {Array<object>} props.categorias - Datos de la regla 50/30/20.
 */
function BudgetRule({ categorias }) {
  return (
    <section className="budget-rule" aria-labelledby="budget-rule-title">
      <div className="budget-rule__header">
        <h2 className="budget-rule__title" id="budget-rule-title">
          Regla 50-30-20
        </h2>
      </div>

      <div className="budget-rule__grid">
        {categorias.map((cat) => {
          const porcentajeUsado = Math.min(
            Math.round((cat.gastado / cat.limite) * 100),
            100,
          )

          return (
            <article key={cat.id} className="budget-rule__item">
              <div className="budget-rule__item-header">
                <h3 className="budget-rule__item-nombre">
                  <span className="budget-rule__item-porcentaje">
                    {cat.porcentaje}%
                  </span>{' '}
                  {cat.nombre}
                </h3>
                <span className="budget-rule__item-pct-usado">
                  {porcentajeUsado}%
                </span>
              </div>

              <div className="budget-rule__item-montos">
                <span>{formatearMoneda(cat.gastado)}</span>
                <span className="budget-rule__item-limite">
                  / {formatearMoneda(cat.limite)}
                </span>
              </div>

              {/* Barra de progreso */}
              <div
                className="budget-rule__progress"
                role="progressbar"
                aria-valuenow={porcentajeUsado}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${cat.nombre}: ${porcentajeUsado}% utilizado`}
              >
                <div
                  className={`budget-rule__progress-fill budget-rule__progress-fill--${cat.id}`}
                  style={{ width: `${porcentajeUsado}%` }}
                />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default BudgetRule
