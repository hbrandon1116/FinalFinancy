import { useState, useMemo } from 'react'
import { formatearMoneda } from '../../utils/format'

/**
 * IncomeExpenseChart
 *
 * Gráfico SVG comparativo de Ingresos vs. Gastos mes a mes con visualización
 * de diferencias (superávit / déficit) y análisis del mes con mayor ingreso y gasto.
 *
 * @param {object} props
 * @param {Array<object>} props.datosMensuales - [{ clave, nombreMes, nombreCorto, ingresos, gastos, balance }]
 */
function IncomeExpenseChart({ datosMensuales }) {
  const [mesHover, setMesHover] = useState(null)

  const { maxValor, tieneDatos, mesMayorIngreso, mesMayorGasto } = useMemo(() => {
    let max = 0
    let hayDatos = false
    let mayorIngreso = null
    let mayorGasto = null

    datosMensuales.forEach((d) => {
      if (d.ingresos > 0 || d.gastos > 0) hayDatos = true
      if (d.ingresos > max) max = d.ingresos
      if (d.gastos > max) max = d.gastos

      if (!mayorIngreso || d.ingresos > mayorIngreso.ingresos) {
        if (d.ingresos > 0) mayorIngreso = d
      }
      if (!mayorGasto || d.gastos > mayorGasto.gastos) {
        if (d.gastos > 0) mayorGasto = d
      }
    })

    return {
      maxValor: max > 0 ? max * 1.15 : 1000000,
      tieneDatos: hayDatos,
      mesMayorIngreso: mayorIngreso,
      mesMayorGasto: mayorGasto,
    }
  }, [datosMensuales])

  if (!tieneDatos) {
    return (
      <section className="report-card" aria-labelledby="income-expense-title">
        <div className="report-card__header">
          <h3 className="report-card__title" id="income-expense-title">
            Comparativa Ingresos vs. Gastos
          </h3>
        </div>
        <div className="report-card__empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <p>No se registran movimientos en el período seleccionado.</p>
        </div>
      </section>
    )
  }

  // Dimensiones del SVG
  const svgWidth = 640
  const svgHeight = 240
  const paddingTop = 25
  const paddingBottom = 45
  const paddingLeft = 65
  const paddingRight = 20

  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  const numMeses = datosMensuales.length
  const groupWidth = chartWidth / numMeses
  const barWidth = Math.max(10, Math.min(26, groupWidth * 0.32))

  return (
    <section className="report-card" aria-labelledby="income-expense-title">
      <div className="report-card__header">
        <div className="report-card__title-group">
          <h3 className="report-card__title" id="income-expense-title">
            Ingresos vs. Gastos por mes
          </h3>
          <p className="report-card__subtitle">
            Comparación mensual y cálculo de diferencias netas
          </p>
        </div>

        {/* Leyenda del gráfico */}
        <div className="chart-legend">
          <div className="chart-legend__item">
            <span className="chart-legend__dot chart-legend__dot--income" />
            <span>Ingresos</span>
          </div>
          <div className="chart-legend__item">
            <span className="chart-legend__dot chart-legend__dot--expense" />
            <span>Gastos</span>
          </div>
        </div>
      </div>

      {/* SVG del Gráfico de barras */}
      <div className="chart-wrapper">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="chart-svg"
          role="img"
          aria-label="Gráfico de barras de ingresos contra gastos"
        >
          {/* Líneas de cuadrícula horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = paddingTop + chartHeight * (1 - pct)
            const valorEje = maxValor * pct
            return (
              <g key={pct}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray={pct === 0 ? 'none' : '3 3'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="inherit"
                >
                  {formatearMoneda(valorEje)}
                </text>
              </g>
            )
          })}

          {/* Grupos de barras por cada mes */}
          {datosMensuales.map((mes, idx) => {
            const groupX = paddingLeft + idx * groupWidth + (groupWidth - barWidth * 2 - 4) / 2
            const incomeBarHeight = (mes.ingresos / maxValor) * chartHeight
            const expenseBarHeight = (mes.gastos / maxValor) * chartHeight

            const incomeY = paddingTop + chartHeight - incomeBarHeight
            const expenseY = paddingTop + chartHeight - expenseBarHeight

            const isHovered = mesHover?.clave === mes.clave

            return (
              <g
                key={mes.clave}
                onMouseEnter={() => setMesHover(mes)}
                onMouseLeave={() => setMesHover(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Zona transparente de hover */}
                <rect
                  x={paddingLeft + idx * groupWidth}
                  y={paddingTop}
                  width={groupWidth}
                  height={chartHeight}
                  fill={isHovered ? 'rgba(255, 255, 255, 0.04)' : 'transparent'}
                  rx="4"
                />

                {/* Barra de Ingreso (Verde) */}
                <rect
                  x={groupX}
                  y={incomeY}
                  width={barWidth}
                  height={incomeBarHeight}
                  fill="url(#incomeGrad)"
                  rx="3"
                  opacity={isHovered ? 1 : 0.9}
                />

                {/* Barra de Gasto (Rojo) */}
                <rect
                  x={groupX + barWidth + 4}
                  y={expenseY}
                  width={barWidth}
                  height={expenseBarHeight}
                  fill="url(#expenseGrad)"
                  rx="3"
                  opacity={isHovered ? 1 : 0.9}
                />

                {/* Etiqueta del mes abajo */}
                <text
                  x={paddingLeft + idx * groupWidth + groupWidth / 2}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fill={isHovered ? '#f1f5f9' : '#94a3b8'}
                  fontSize="11"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {mes.nombreCorto}
                </text>
              </g>
            )
          })}

          {/* Gradientes SVG */}
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Tooltip o información activa del mes */}
      {mesHover ? (
        <div className="chart-tooltip-panel">
          <strong className="chart-tooltip-panel__title">{mesHover.nombreMes}</strong>
          <div className="chart-tooltip-panel__stats">
            <span>
              Ingresos: <strong className="color-success">+{formatearMoneda(mesHover.ingresos)}</strong>
            </span>
            <span>
              Gastos: <strong className="color-danger">-{formatearMoneda(mesHover.gastos)}</strong>
            </span>
            <span>
              Diferencia:{' '}
              <strong className={mesHover.balance >= 0 ? 'color-success' : 'color-danger'}>
                {mesHover.balance >= 0 ? '+' : ''}
                {formatearMoneda(mesHover.balance)}
              </strong>
            </span>
          </div>
        </div>
      ) : null}

      {/* Tarjetas de análisis rápido (Highlights) */}
      <div className="report-highlights">
        {mesMayorIngreso && (
          <div className="report-highlight report-highlight--income">
            <span className="report-highlight__label">Mayor ingreso</span>
            <strong className="report-highlight__value">{mesMayorIngreso.nombreMes}</strong>
            <span className="report-highlight__monto color-success">
              +{formatearMoneda(mesMayorIngreso.ingresos)}
            </span>
          </div>
        )}
        {mesMayorGasto && (
          <div className="report-highlight report-highlight--expense">
            <span className="report-highlight__label">Mayor gasto</span>
            <strong className="report-highlight__value">{mesMayorGasto.nombreMes}</strong>
            <span className="report-highlight__monto color-danger">
              -{formatearMoneda(mesMayorGasto.gastos)}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}

export default IncomeExpenseChart
