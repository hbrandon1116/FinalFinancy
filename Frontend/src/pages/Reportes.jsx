import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'

import DashboardHeader from '../components/DashboardHeader'
import SummaryCard from '../components/SummaryCard'
import ReportsFilterBar from '../components/reports/ReportsFilterBar'
import IncomeExpenseChart from '../components/reports/IncomeExpenseChart'
import CategoryExpensesChart from '../components/reports/CategoryExpensesChart'
import BalanceEvolutionChart from '../components/reports/BalanceEvolutionChart'
import Rule503020Card from '../components/reports/Rule503020Card'
import MovementModal from '../components/MovementModal'

import { useMovimientos } from '../hooks/useMovimientos'
import { useAhorro } from '../hooks/useAhorro'
import {
  calcularRangoFechas,
  filtrarPorRango,
  agruparPorMes,
  agruparGastosPorCategoria,
  calcularEvolucionBalance,
  analizarRegla503020,
} from '../utils/reports'
import { formatearFecha, aFechaInput } from '../utils/format'

/**
 * Reportes
 *
 * Módulo de inteligencia financiera y visualización analítica de FinanzasPro.
 * Cruza datos en tiempo real de movimientos y metas de ahorro para graficar:
 * - Ingresos vs Gastos mensuales
 * - Gastos por categoría
 * - Evolución acumulada del balance
 * - Análisis y cumplimiento de la regla 50/30/20
 */
function Reportes() {
  const { toggleSidebar } = useOutletContext()
  const { movimientos, agregarMovimiento } = useMovimientos()
  const { metas } = useAhorro()

  const [modalNuevoMovimiento, setModalNuevoMovimiento] = useState(false)

  // Estado de filtros de período
  const [periodoFiltro, setPeriodoFiltro] = useState('mes-actual')
  const [fechaInicioCustom, setFechaInicioCustom] = useState(() => {
    const d = new Date()
    return aFechaInput(new Date(d.getFullYear(), d.getMonth(), 1))
  })
  const [fechaFinCustom, setFechaFinCustom] = useState(() => aFechaInput(new Date()))

  // 1. Calcular el rango activo de fechas
  const { inicio, fin, etiqueta } = useMemo(() => {
    return calcularRangoFechas(periodoFiltro, fechaInicioCustom, fechaFinCustom)
  }, [periodoFiltro, fechaInicioCustom, fechaFinCustom])

  // Etiqueta legible del rango exacto
  const etiquetaRangoCompleto = useMemo(() => {
    return `${formatearFecha(inicio)} – ${formatearFecha(fin)}`
  }, [inicio, fin])

  // 2. Extraer todos los aportes de las metas de ahorro para filtrarlos por fecha
  const todosLosAportes = useMemo(() => {
    const list = []
    metas.forEach((meta) => {
      if (meta.aportes && meta.aportes.length) {
        meta.aportes.forEach((ap) => {
          list.push({ ...ap, metaId: meta.id, metaNombre: meta.nombre })
        })
      }
    })
    return list
  }, [metas])

  // 3. Filtrar movimientos y aportes dentro del rango
  const movimientosPeriodo = useMemo(() => {
    return filtrarPorRango(movimientos, inicio, fin)
  }, [movimientos, inicio, fin])

  const aportesPeriodo = useMemo(() => {
    return filtrarPorRango(todosLosAportes, inicio, fin)
  }, [todosLosAportes, inicio, fin])

  // 4. Calcular métricas consolidadas del período
  const { totalIngresos, totalGastos, balancePeriodo, gastosPeriodo } = useMemo(() => {
    let ingresos = 0
    let gastos = 0
    const listaGastos = []

    movimientosPeriodo.forEach((m) => {
      const valor = Math.abs(Number(m.valor ?? m.monto) || 0)
      if (m.tipo === 'ingreso') {
        ingresos += valor
      } else {
        gastos += valor
        listaGastos.push(m)
      }
    })

    return {
      totalIngresos: ingresos,
      totalGastos: gastos,
      balancePeriodo: ingresos - gastos,
      gastosPeriodo: listaGastos,
    }
  }, [movimientosPeriodo])

  // Total ahorrado en el período (suma de aportes a metas en ese rango)
  const totalAhorradoPeriodo = useMemo(() => {
    return aportesPeriodo.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
  }, [aportesPeriodo])

  // 5. Agrupaciones para los gráficos
  // Gráfico 1: Ingresos vs. Gastos mes a mes
  const datosMensuales = useMemo(() => {
    return agruparPorMes(movimientosPeriodo, inicio, fin)
  }, [movimientosPeriodo, inicio, fin])

  // Gráfico 2: Gastos por categoría
  const { categorias: gastosPorCategoria, totalGastos: totalGastosCategorias } = useMemo(() => {
    return agruparGastosPorCategoria(gastosPeriodo)
  }, [gastosPeriodo])

  // Gráfico 3: Evolución acumulada del balance
  const datosEvolucion = useMemo(() => {
    return calcularEvolucionBalance(datosMensuales)
  }, [datosMensuales])

  // Gráfico 4: Análisis de la regla 50/30/20
  const analisisRegla = useMemo(() => {
    return analizarRegla503020(gastosPeriodo, totalIngresos, totalAhorradoPeriodo)
  }, [gastosPeriodo, totalIngresos, totalAhorradoPeriodo])

  const handleCambioFechasCustom = (nuevaInicio, nuevaFin) => {
    setFechaInicioCustom(nuevaInicio)
    setFechaFinCustom(nuevaFin)
  }

  return (
    <>
      <DashboardHeader
        titulo="Reportes"
        onNuevoMovimiento={() => setModalNuevoMovimiento(true)}
        onToggleSidebar={toggleSidebar}
      />

      <div className="reports-page">
        {/* Barra de Filtros de Período */}
        <ReportsFilterBar
          periodoSeleccionado={periodoFiltro}
          onSelectPeriodo={setPeriodoFiltro}
          fechaInicioCustom={fechaInicioCustom}
          fechaFinCustom={fechaFinCustom}
          onChangeCustomDates={handleCambioFechasCustom}
          etiquetaRango={`${etiqueta} (${etiquetaRangoCompleto})`}
        />

        {/* Resumen Financiero del Período */}
        <section
          className="dashboard__summary reports-page__summary"
          aria-label="Resumen financiero del período"
        >
          <SummaryCard
            titulo="Total ingresos"
            subtitulo={`(${etiqueta})`}
            monto={totalIngresos}
            tendencia="positivo"
          />
          <SummaryCard
            titulo="Total gastos"
            subtitulo={`(${etiqueta})`}
            monto={totalGastos}
            tendencia="negativo"
          />
          <SummaryCard
            titulo="Balance neto"
            subtitulo="(ingresos - gastos)"
            monto={balancePeriodo}
            tendencia={balancePeriodo >= 0 ? 'positivo' : 'negativo'}
          />
          <SummaryCard
            titulo="Total ahorrado"
            subtitulo="(aportes del período)"
            monto={totalAhorradoPeriodo}
            tendencia="positivo"
            className="summary-card--balance"
          />
        </section>

        {/* Cuadrícula de Gráficos Analíticos */}
        <div className="reports-charts-grid">
          {/* Gráfico 1: Ingresos vs Gastos */}
          <IncomeExpenseChart datosMensuales={datosMensuales} />

          {/* Gráfico 2: Gastos por categoría */}
          <CategoryExpensesChart
            categorias={gastosPorCategoria}
            totalGastos={totalGastosCategorias}
          />

          {/* Gráfico 3: Evolución del balance en el tiempo */}
          <BalanceEvolutionChart evolucionDatos={datosEvolucion} />

          {/* Gráfico 4: Análisis de la regla 50/30/20 */}
          <Rule503020Card analisis={analisisRegla} />
        </div>
      </div>

      {/* Modal para crear movimiento si el usuario pulsa "+ Nueva mov." desde el header */}
      <MovementModal
        isOpen={modalNuevoMovimiento}
        onClose={() => setModalNuevoMovimiento(false)}
        onSave={agregarMovimiento}
      />
    </>
  )
}

export default Reportes
