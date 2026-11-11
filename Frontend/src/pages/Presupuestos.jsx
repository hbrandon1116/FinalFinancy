import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'

import DashboardHeader from '../components/DashboardHeader'
import SummaryCard from '../components/SummaryCard'
import BudgetCard from '../components/BudgetCard'
import BudgetModal from '../components/BudgetModal'
import ConfirmModal from '../components/ConfirmModal'

import { usePresupuestos } from '../hooks/usePresupuestos'
import {
  formatearNombreMes,
  obtenerMesAnterior,
  obtenerMesSiguiente,
  obtenerClaveMes,
} from '../utils/format'

/**
 * Presupuestos
 *
 * Página para administrar los presupuestos mensuales por categoría.
 * Calcula el gasto real cruzando con los movimientos en tiempo real
 * y muestra alertas según el porcentaje de consumo.
 */
function Presupuestos() {
  const { toggleSidebar } = useOutletContext()
  const {
    presupuestosDelPeriodo,
    resumenPeriodo,
    periodoActivo,
    setPeriodoActivo,
    agregarPresupuesto,
    editarPresupuesto,
    eliminarPresupuesto,
  } = usePresupuestos()

  // Estados para modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [presupuestoAEditar, setPresupuestoAEditar] = useState(null)
  const [presupuestoAEliminar, setPresupuestoAEliminar] = useState(null)

  // Mes actual de referencia
  const mesActualReal = obtenerClaveMes(new Date())
  const esMesActual = periodoActivo === mesActualReal

  // Navegación de períodos
  const irAlMesAnterior = () => {
    setPeriodoActivo(obtenerMesAnterior(periodoActivo))
  }

  const irAlMesSiguiente = () => {
    setPeriodoActivo(obtenerMesSiguiente(periodoActivo))
  }

  const irAlMesActual = () => {
    setPeriodoActivo(mesActualReal)
  }

  // Guardar nuevo presupuesto
  const handleGuardarNuevo = (datos) => {
    return agregarPresupuesto(datos)
  }

  // Guardar edición de presupuesto
  const handleActualizarPresupuesto = (datos) => {
    if (presupuestoAEditar) {
      const res = editarPresupuesto(presupuestoAEditar.id, datos)
      if (res.ok) {
        setPresupuestoAEditar(null)
      }
      return res
    }
  }

  // Confirmar eliminación
  const handleConfirmarEliminar = () => {
    if (presupuestoAEliminar) {
      eliminarPresupuesto(presupuestoAEliminar.id)
      setPresupuestoAEliminar(null)
    }
  }

  return (
    <>
      <DashboardHeader
        titulo="Presupuestos"
        onNuevoMovimiento={() => setModalNuevoAbierto(true)}
        onToggleSidebar={toggleSidebar}
      />

      <div className="budgets-page">
        {/* Barra de Navegación por Período */}
        <section className="budgets-period-nav" aria-label="Navegación de períodos de presupuesto">
          <div className="budgets-period-nav__controls">
            <button
              type="button"
              className="budgets-period-nav__arrow"
              onClick={irAlMesAnterior}
              aria-label="Ir al mes anterior"
              title="Mes anterior"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="budgets-period-nav__current">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="budgets-period-nav__calendar-icon"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="budgets-period-nav__label">
                {formatearNombreMes(periodoActivo)}
              </span>
            </div>

            <button
              type="button"
              className="budgets-period-nav__arrow"
              onClick={irAlMesSiguiente}
              aria-label="Ir al mes siguiente"
              title="Mes siguiente"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="budgets-period-nav__actions">
            {!esMesActual && (
              <button
                type="button"
                className="budgets-period-nav__today-btn"
                onClick={irAlMesActual}
              >
                Volver al mes actual
              </button>
            )}

            <button
              type="button"
              className="budgets-period-nav__new-btn"
              onClick={() => setModalNuevoAbierto(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Crear presupuesto</span>
            </button>
          </div>
        </section>

        {/* Resumen General del Mes */}
        <section
          className="dashboard__summary budgets-page__summary"
          aria-label="Resumen de presupuestos del mes"
        >
          <SummaryCard
            titulo="Total presupuestado"
            subtitulo={`(${formatearNombreMes(periodoActivo)})`}
            monto={resumenPeriodo.totalPresupuestado}
            tendencia="neutro"
          />
          <SummaryCard
            titulo="Total gastado"
            subtitulo={`(${resumenPeriodo.porcentajeGlobal}% consumido)`}
            monto={resumenPeriodo.totalGastado}
            tendencia={resumenPeriodo.totalDisponible >= 0 ? 'negativo' : 'negativo'}
          />
          <SummaryCard
            titulo={resumenPeriodo.totalDisponible >= 0 ? 'Dinero disponible' : 'Presupuesto excedido'}
            subtitulo="(del presupuesto)"
            monto={Math.abs(resumenPeriodo.totalDisponible)}
            tendencia={resumenPeriodo.totalDisponible >= 0 ? 'positivo' : 'negativo'}
            className="summary-card--balance"
          />
        </section>

        {/* Listado de Presupuestos por Categoría */}
        <section className="budgets-list-section" aria-label="Presupuestos por categoría">
          <div className="budgets-list-section__header">
            <h2 className="budgets-list-section__title">
              Presupuestos por categoría
            </h2>
            <span className="budgets-list-section__count">
              {presupuestosDelPeriodo.length} {presupuestosDelPeriodo.length === 1 ? 'presupuesto activo' : 'presupuestos activos'}
            </span>
          </div>

          {presupuestosDelPeriodo.length > 0 ? (
            <div className="budgets-grid">
              {presupuestosDelPeriodo.map((p) => (
                <BudgetCard
                  key={p.id}
                  presupuesto={p}
                  onEditar={(item) => setPresupuestoAEditar(item)}
                  onEliminar={(item) => setPresupuestoAEliminar(item)}
                />
              ))}
            </div>
          ) : (
            <div className="movements-empty">
              <div className="movements-empty__icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <h3 className="movements-empty__title">
                No tienes presupuestos establecidos para {formatearNombreMes(periodoActivo)}
              </h3>
              <p className="movements-empty__text">
                Fijar límites de gasto para tus categorías te ayuda a mantener tus finanzas bajo control y cumplir tus metas de ahorro.
              </p>
              <button
                type="button"
                className="movements-empty__btn"
                onClick={() => setModalNuevoAbierto(true)}
              >
                Crear presupuesto para {formatearNombreMes(periodoActivo)}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modal para Crear Presupuesto */}
      <BudgetModal
        isOpen={modalNuevoAbierto}
        onClose={() => setModalNuevoAbierto(false)}
        onSave={handleGuardarNuevo}
        periodoPorDefecto={periodoActivo}
      />

      {/* Modal para Editar Presupuesto */}
      <BudgetModal
        isOpen={Boolean(presupuestoAEditar)}
        onClose={() => setPresupuestoAEditar(null)}
        onSave={handleActualizarPresupuesto}
        presupuestoAEditar={presupuestoAEditar}
        periodoPorDefecto={periodoActivo}
      />

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmModal
        isOpen={Boolean(presupuestoAEliminar)}
        title="¿Eliminar presupuesto?"
        message="Esta acción eliminará el límite establecido para esta categoría en este mes. Tus registros de movimientos no se verán afectados."
        budget={presupuestoAEliminar}
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setPresupuestoAEliminar(null)}
      />
    </>
  )
}

export default Presupuestos
