import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import DashboardHeader from '../components/DashboardHeader'
import SummaryCard from '../components/SummaryCard'
import RecentMovements from '../components/RecentMovements'
import BudgetRule from '../components/BudgetRule'
import NewMovementModal from '../components/NewMovementModal'

import { resumenMensual, movimientos, regla503020 } from '../data/mockData'

/**
 * Dashboard
 *
 * Página principal de la aplicación: resumen financiero del mes.
 * Organiza los componentes y les pasa los datos mock.
 *
 * Cuando el backend esté disponible, los datos mock se reemplazarán
 * por llamadas a services/api.js (ej: useEffect + fetch).
 */
function Dashboard() {
  const [modalAbierto, setModalAbierto] = useState(false)
  const { toggleSidebar } = useOutletContext()

  const { ingresos, gastos } = resumenMensual
  const balance = ingresos - gastos

  return (
    <>
      <DashboardHeader
        titulo="Dashboard"
        onNuevoMovimiento={() => setModalAbierto(true)}
        onToggleSidebar={toggleSidebar}
      />

      <div className="dashboard">
        {/* Tarjetas de resumen */}
        <section className="dashboard__summary" aria-label="Resumen financiero del mes">
          <SummaryCard
            titulo="Ingresos"
            subtitulo="(del mes)"
            monto={ingresos}
            tendencia="positivo"
          />
          <SummaryCard
            titulo="Gastos"
            subtitulo="(del mes)"
            monto={gastos}
            tendencia="negativo"
          />
          <SummaryCard
            titulo="Balance"
            subtitulo="(del mes)"
            monto={balance}
            tendencia={balance >= 0 ? 'positivo' : 'negativo'}
            className="summary-card--balance"
          />
        </section>

        {/* Contenido inferior: movimientos y regla 50/30/20 */}
        <div className="dashboard__bottom">
          <RecentMovements movimientos={movimientos} />
          <BudgetRule categorias={regla503020} />
        </div>
      </div>

      <NewMovementModal
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />
    </>
  )
}

export default Dashboard
