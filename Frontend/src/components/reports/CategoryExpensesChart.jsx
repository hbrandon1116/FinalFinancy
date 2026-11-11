import { formatearMoneda } from '../../utils/format'

/** Paleta de colores temáticos para las categorías */
const COLORES_CATEGORIAS = [
  '#3b82f6', // Azul
  '#f59e0b', // Naranja/Ámbar
  '#10b981', // Esmeralda
  '#8b5cf6', // Violeta
  '#ec4899', // Rosa
  '#06b6d4', // Cian
  '#f97316', // Naranja intenso
  '#6366f1', // Índigo
  '#14b8a6', // Teal
  '#a855f7', // Púrpura
]

/**
 * CategoryExpensesChart
 *
 * Gráfico de distribución porcentual y desglose de gastos por categoría,
 * ordenado de mayor a menor para identificar el destino prioritario del dinero.
 *
 * @param {object} props
 * @param {Array<object>} props.categorias - [{ nombre, valor, porcentaje }]
 * @param {number} props.totalGastos
 */
function CategoryExpensesChart({ categorias, totalGastos }) {
  if (!categorias || !categorias.length || totalGastos === 0) {
    return (
      <section className="report-card" aria-labelledby="cat-expenses-title">
        <div className="report-card__header">
          <h3 className="report-card__title" id="cat-expenses-title">
            Gastos por categoría
          </h3>
        </div>
        <div className="report-card__empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          <p>No se registran gastos en el período seleccionado.</p>
        </div>
      </section>
    )
  }

  // Valor de la categoría con mayor gasto para escala visual relativa
  const maxValor = categorias[0]?.valor || 1

  return (
    <section className="report-card" aria-labelledby="cat-expenses-title">
      <div className="report-card__header">
        <div className="report-card__title-group">
          <h3 className="report-card__title" id="cat-expenses-title">
            Gastos por categoría
          </h3>
          <p className="report-card__subtitle">
            Distribución proporcional sobre un total de {formatearMoneda(totalGastos)}
          </p>
        </div>
      </div>

      {/* Barra de distribución compuesta superior */}
      <div className="category-distribution-bar" title="Distribución de gastos">
        {categorias.map((cat, idx) => {
          const color = COLORES_CATEGORIAS[idx % COLORES_CATEGORIAS.length]
          return (
            <div
              key={cat.nombre}
              className="category-distribution-bar__segment"
              style={{
                width: `${cat.porcentaje}%`,
                backgroundColor: color,
              }}
              title={`${cat.nombre}: ${cat.porcentaje}% (${formatearMoneda(cat.valor)})`}
            />
          )
        })}
      </div>

      {/* Lista detallada de categorías ordenada por mayor gasto */}
      <div className="category-expenses-list">
        {categorias.map((cat, idx) => {
          const color = COLORES_CATEGORIAS[idx % COLORES_CATEGORIAS.length]
          const anchoRelativo = Math.round((cat.valor / maxValor) * 100)

          return (
            <div key={cat.nombre} className="category-expense-item">
              <div className="category-expense-item__header">
                <div className="category-expense-item__name-group">
                  <span
                    className="category-expense-item__indicator"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                  <span className="category-expense-item__name">{cat.nombre}</span>
                </div>
                <div className="category-expense-item__values">
                  <span className="category-expense-item__monto">
                    {formatearMoneda(cat.valor)}
                  </span>
                  <span className="category-expense-item__pct">
                    {cat.porcentaje}%
                  </span>
                </div>
              </div>

              {/* Barra de progreso de la categoría */}
              <div
                className="category-expense-item__bar-wrapper"
                role="progressbar"
                aria-valuenow={cat.porcentaje}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`${cat.nombre}: ${cat.porcentaje}% del total de gastos`}
              >
                <div
                  className="category-expense-item__bar-fill"
                  style={{
                    width: `${anchoRelativo}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default CategoryExpensesChart
