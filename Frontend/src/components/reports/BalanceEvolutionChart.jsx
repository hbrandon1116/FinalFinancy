import { useState, useMemo } from 'react'
import { formatearMoneda } from '../../utils/format'

/**
 * BalanceEvolutionChart
 *
 * Gráfico SVG de línea y área sombreada que muestra la evolución
 * acumulada del balance financiero a lo largo del tiempo.
 *
 * @param {object} props
 * @param {Array<object>} props.evolucionDatos - [{ clave, nombreMes, nombreCorto, balanceMes, balanceAcumulado }]
 */
function BalanceEvolutionChart({ evolucionDatos }) {
  const [puntoHover, setPuntoHover] = useState(null)

  const { puntos, minY, maxY, tieneDatos } = useMemo(() => {
    if (!evolucionDatos || !evolucionDatos.length) {
      return { puntos: [], minY: 0, maxY: 0, tieneDatos: false }
    }

    let min = 0
    let max = 0
    let hayMovimiento = false

    evolucionDatos.forEach((d) => {
      if (d.balanceMes !== 0) hayMovimiento = true
      if (d.balanceAcumulado < min) min = d.balanceAcumulado
      if (d.balanceAcumulado > max) max = d.balanceAcumulado
    })

    // Asegurar un rango mínimo para graficar correctamente
    if (min === 0 && max === 0) {
      max = 1000000
    }

    const padding = (max - min) * 0.15 || 100000

    return {
      puntos: evolucionDatos,
      minY: min - padding,
      maxY: max + padding,
      tieneDatos: hayMovimiento,
    }
  }, [evolucionDatos])

  if (!tieneDatos) {
    return (
      <section className="report-card" aria-labelledby="balance-evolution-title">
        <div className="report-card__header">
          <h3 className="report-card__title" id="balance-evolution-title">
            Evolución del balance
          </h3>
        </div>
        <div className="report-card__empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <p>No se registran cambios de balance en el período seleccionado.</p>
        </div>
      </section>
    )
  }

  // Dimensiones del SVG
  const svgWidth = 640
  const svgHeight = 220
  const paddingTop = 20
  const paddingBottom = 40
  const paddingLeft = 65
  const paddingRight = 25

  const chartWidth = svgWidth - paddingLeft - paddingRight
  const chartHeight = svgHeight - paddingTop - paddingBottom

  const rangoY = maxY - minY || 1

  // Calcular coordenadas (x, y) de cada punto
  const coordenadas = puntos.map((p, idx) => {
    const x =
      puntos.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (idx / (puntos.length - 1)) * chartWidth

    const ratioY = (p.balanceAcumulado - minY) / rangoY
    const y = paddingTop + chartHeight * (1 - ratioY)

    return { ...p, x, y }
  })

  // Generar string para el path de la línea
  const pathD = coordenadas.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`
  }, '')

  // Generar path cerrado para el área sombreada
  const primerX = coordenadas[0]?.x || paddingLeft
  const ultimoX = coordenadas[coordenadas.length - 1]?.x || svgWidth - paddingRight
  const baseAreaY = paddingTop + chartHeight
  const areaPathD = `${pathD} L ${ultimoX} ${baseAreaY} L ${primerX} ${baseAreaY} Z`

  // Línea cero (si está en el rango)
  const ratioCero = (0 - minY) / rangoY
  const yCero = paddingTop + chartHeight * (1 - ratioCero)
  const muestraLineaCero = yCero >= paddingTop && yCero <= paddingTop + chartHeight

  return (
    <section className="report-card" aria-labelledby="balance-evolution-title">
      <div className="report-card__header">
        <div className="report-card__title-group">
          <h3 className="report-card__title" id="balance-evolution-title">
            Evolución del balance en el tiempo
          </h3>
          <p className="report-card__subtitle">
            Crecimiento o contracción del patrimonio acumulado
          </p>
        </div>
      </div>

      <div className="chart-wrapper">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="chart-svg"
          role="img"
          aria-label="Gráfico de línea de evolución del balance acumulado"
        >
          {/* Guías de cuadrícula horizontal */}
          {[0, 0.5, 1].map((pct) => {
            const y = paddingTop + chartHeight * (1 - pct)
            const valorEje = minY + rangoY * pct
            return (
              <g key={pct}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {formatearMoneda(valorEje)}
                </text>
              </g>
            )
          })}

          {/* Línea cero destacada */}
          {muestraLineaCero && (
            <line
              x1={paddingLeft}
              y1={yCero}
              x2={svgWidth - paddingRight}
              y2={yCero}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1.5"
            />
          )}

          {/* Área con gradiente */}
          <path d={areaPathD} fill="url(#balanceGrad)" />

          {/* Línea principal */}
          <path
            d={pathD}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos de datos */}
          {coordenadas.map((pt) => {
            const isHovered = puntoHover?.clave === pt.clave
            return (
              <g
                key={pt.clave}
                onMouseEnter={() => setPuntoHover(pt)}
                onMouseLeave={() => setPuntoHover(null)}
                style={{ cursor: 'pointer' }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 7 : 4.5}
                  fill={pt.balanceAcumulado >= 0 ? '#22c55e' : '#ef4444'}
                  stroke="#1e293b"
                  strokeWidth="2"
                />

                {/* Etiqueta del mes abajo */}
                <text
                  x={pt.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fill={isHovered ? '#f1f5f9' : '#94a3b8'}
                  fontSize="11"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {pt.nombreCorto}
                </text>
              </g>
            )
          })}

          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Panel informativo del punto seleccionado */}
      {puntoHover ? (
        <div className="chart-tooltip-panel">
          <strong className="chart-tooltip-panel__title">{puntoHover.nombreMes}</strong>
          <div className="chart-tooltip-panel__stats">
            <span>
              Balance mensual:{' '}
              <strong className={puntoHover.balanceMes >= 0 ? 'color-success' : 'color-danger'}>
                {puntoHover.balanceMes >= 0 ? '+' : ''}
                {formatearMoneda(puntoHover.balanceMes)}
              </strong>
            </span>
            <span>
              Balance acumulado:{' '}
              <strong className={puntoHover.balanceAcumulado >= 0 ? 'color-success' : 'color-danger'}>
                {formatearMoneda(puntoHover.balanceAcumulado)}
              </strong>
            </span>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default BalanceEvolutionChart
