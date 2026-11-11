import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'

import DashboardHeader from '../components/DashboardHeader'
import SummaryCard from '../components/SummaryCard'
import GoalCard from '../components/GoalCard'
import GoalModal from '../components/GoalModal'
import ContributionModal from '../components/ContributionModal'
import GoalDetailsModal from '../components/GoalDetailsModal'
import ConfirmModal from '../components/ConfirmModal'

import { useAhorro } from '../hooks/useAhorro'

/**
 * Ahorro
 *
 * Página de metas de ahorro e inversión personal de FinanzasPro.
 * Permite crear metas, registrar aportes, consultar el progreso en tiempo real
 * y revisar el historial de transacciones de cada objetivo.
 */
function Ahorro() {
  const { toggleSidebar } = useOutletContext()
  const {
    metas,
    resumenMetas,
    crearMeta,
    editarMeta,
    eliminarMeta,
    registrarAporte,
  } = useAhorro()

  // Estados de control de modales
  const [modalNuevaMetaAbierto, setModalNuevaMetaAbierto] = useState(false)
  const [metaAEditar, setMetaAEditar] = useState(null)
  const [metaAEliminar, setMetaAEliminar] = useState(null)
  const [metaParaAporte, setMetaParaAporte] = useState(null)
  const [metaParaDetalles, setMetaParaDetalles] = useState(null)

  // Filtro por estado
  const [filtroEstado, setFiltroEstado] = useState('todas')

  // Metas filtradas por el tab de estado seleccionado
  const metasFiltradas = useMemo(() => {
    if (filtroEstado === 'todas') return metas
    return metas.filter((m) => m.estado === filtroEstado)
  }, [metas, filtroEstado])

  // Mantener sincronizada la meta seleccionada en detalles si cambia
  const metaDetallesActualizada = useMemo(() => {
    if (!metaParaDetalles) return null
    return metas.find((m) => m.id === metaParaDetalles.id) || null
  }, [metas, metaParaDetalles])

  // Manejador para crear meta
  const handleGuardarNueva = (datos) => {
    return crearMeta(datos)
  }

  // Manejador para actualizar meta editada
  const handleActualizarMeta = (datos) => {
    if (metaAEditar) {
      const res = editarMeta(metaAEditar.id, datos)
      if (res.ok) {
        setMetaAEditar(null)
      }
      return res
    }
  }

  // Manejador para registrar aporte
  const handleGuardarAporte = (datos) => {
    if (metaParaAporte) {
      const res = registrarAporte(metaParaAporte.id, datos)
      if (res.ok) {
        setMetaParaAporte(null)
      }
      return res
    }
  }

  // Manejador para confirmar eliminación
  const handleConfirmarEliminar = () => {
    if (metaAEliminar) {
      eliminarMeta(metaAEliminar.id)
      setMetaAEliminar(null)
    }
  }

  return (
    <>
      <DashboardHeader
        titulo="Ahorro"
        onNuevoMovimiento={() => setModalNuevaMetaAbierto(true)}
        onToggleSidebar={toggleSidebar}
      />

      <div className="goals-page">
        {/* Métricas de resumen general */}
        <section
          className="dashboard__summary goals-page__summary"
          aria-label="Resumen general de metas de ahorro"
        >
          <SummaryCard
            titulo="Total acumulado"
            subtitulo="(en todas las metas)"
            monto={resumenMetas.totalAcumulado}
            tendencia="positivo"
          />
          <SummaryCard
            titulo="Metas activas"
            subtitulo={`(${resumenMetas.metasActivas} en progreso)`}
            monto={resumenMetas.metasActivas}
            tendencia="neutro"
          />
          <SummaryCard
            titulo="Metas completadas"
            subtitulo={`(${resumenMetas.metasCompletadas} logradas)`}
            monto={resumenMetas.metasCompletadas}
            tendencia="positivo"
            className="summary-card--balance"
          />
        </section>

        {/* Barra de herramientas y filtros de estado */}
        <section className="goals-toolbar" aria-label="Filtro y acciones de metas">
          <div className="goals-toolbar__tabs" role="tablist" aria-label="Filtrar por estado">
            <button
              type="button"
              role="tab"
              aria-selected={filtroEstado === 'todas'}
              className={`goals-toolbar__tab ${filtroEstado === 'todas' ? 'goals-toolbar__tab--active' : ''}`}
              onClick={() => setFiltroEstado('todas')}
            >
              Todas ({metas.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filtroEstado === 'en-progreso'}
              className={`goals-toolbar__tab ${filtroEstado === 'en-progreso' ? 'goals-toolbar__tab--active' : ''}`}
              onClick={() => setFiltroEstado('en-progreso')}
            >
              En progreso ({resumenMetas.metasActivas})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filtroEstado === 'completada'}
              className={`goals-toolbar__tab ${filtroEstado === 'completada' ? 'goals-toolbar__tab--active' : ''}`}
              onClick={() => setFiltroEstado('completada')}
            >
              Completadas ({resumenMetas.metasCompletadas})
            </button>
            {resumenMetas.metasVencidas > 0 && (
              <button
                type="button"
                role="tab"
                aria-selected={filtroEstado === 'vencida'}
                className={`goals-toolbar__tab goals-toolbar__tab--vencida ${filtroEstado === 'vencida' ? 'goals-toolbar__tab--active' : ''}`}
                onClick={() => setFiltroEstado('vencida')}
              >
                Vencidas ({resumenMetas.metasVencidas})
              </button>
            )}
          </div>

          <button
            type="button"
            className="goals-toolbar__create-btn"
            onClick={() => setModalNuevaMetaAbierto(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Nueva meta</span>
          </button>
        </section>

        {/* Listado de Metas de Ahorro */}
        <section className="goals-list-section" aria-label="Metas de ahorro">
          {metasFiltradas.length > 0 ? (
            <div className="goals-grid">
              {metasFiltradas.map((meta) => (
                <GoalCard
                  key={meta.id}
                  meta={meta}
                  onAportar={(m) => setMetaParaAporte(m)}
                  onVerDetalles={(m) => setMetaParaDetalles(m)}
                  onEditar={(m) => setMetaAEditar(m)}
                  onEliminar={(m) => setMetaAEliminar(m)}
                />
              ))}
            </div>
          ) : (
            <div className="movements-empty">
              <div className="movements-empty__icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="movements-empty__title">
                {filtroEstado === 'todas'
                  ? 'Aún no tienes metas de ahorro registradas'
                  : `No tienes metas en estado "${filtroEstado}"`}
              </h3>
              <p className="movements-empty__text">
                {filtroEstado === 'todas'
                  ? 'Establece objetivos claros con plazos definidos y haz seguimiento continuo a tus aportes.'
                  : 'Prueba cambiando de filtro o crea una nueva meta para este propósito.'}
              </p>
              <button
                type="button"
                className="movements-empty__btn"
                onClick={() => setModalNuevaMetaAbierto(true)}
              >
                Crear primera meta de ahorro
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Modal para Crear Meta */}
      <GoalModal
        isOpen={modalNuevaMetaAbierto}
        onClose={() => setModalNuevaMetaAbierto(false)}
        onSave={handleGuardarNueva}
      />

      {/* Modal para Editar Meta */}
      <GoalModal
        isOpen={Boolean(metaAEditar)}
        onClose={() => setMetaAEditar(null)}
        onSave={handleActualizarMeta}
        metaAEditar={metaAEditar}
      />

      {/* Modal para Registrar Aporte */}
      <ContributionModal
        isOpen={Boolean(metaParaAporte)}
        onClose={() => setMetaParaAporte(null)}
        onSave={handleGuardarAporte}
        meta={metaParaAporte}
      />

      {/* Modal para Consultar Detalles e Historial de Aportes */}
      <GoalDetailsModal
        isOpen={Boolean(metaDetallesActualizada)}
        onClose={() => setMetaParaDetalles(null)}
        meta={metaDetallesActualizada}
        onAportar={() => {
          setMetaParaAporte(metaDetallesActualizada)
        }}
      />

      {/* Modal de Confirmación para Eliminar Meta */}
      <ConfirmModal
        isOpen={Boolean(metaAEliminar)}
        title="¿Eliminar meta de ahorro?"
        message="Esta acción eliminará la meta y su historial completo de aportes. Esta acción no se puede deshacer."
        goal={metaAEliminar}
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setMetaAEliminar(null)}
      />
    </>
  )
}

export default Ahorro
