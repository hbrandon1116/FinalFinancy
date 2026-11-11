import { useState, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'

import DashboardHeader from '../components/DashboardHeader'
import SummaryCard from '../components/SummaryCard'
import MovementModal from '../components/MovementModal'
import ConfirmModal from '../components/ConfirmModal'

import { useMovimientos } from '../hooks/useMovimientos'
import {
  formatearMoneda,
  formatearFecha,
  obtenerClaveMes,
  formatearNombreMes,
} from '../utils/format'

/**
 * Movimientos
 *
 * Página de administración integral de ingresos y gastos de FinalFinancy.
 * Permite listar, registrar, editar, eliminar y filtrar movimientos con datos simulados.
 */
function Movimientos() {
  const { toggleSidebar } = useOutletContext()
  const {
    movimientos,
    agregarMovimiento,
    editarMovimiento,
    eliminarMovimiento,
    categoriasDisponibles,
  } = useMovimientos()

  // Estados de control de modales
  const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false)
  const [movimientoAEditar, setMovimientoAEditar] = useState(null)
  const [movimientoAEliminar, setMovimientoAEliminar] = useState(null)

  // Estados de filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos')

  // Obtener meses únicos presentes en los movimientos ordenados de más reciente a más antiguo
  const mesesDisponibles = useMemo(() => {
    const claves = new Set()
    movimientos.forEach((m) => {
      const clave = obtenerClaveMes(m.fecha)
      if (clave) claves.add(clave)
    })
    return Array.from(claves).sort().reverse()
  }, [movimientos])

  // Identificar las claves del mes actual y mes anterior
  const { claveMesActual, claveMesAnterior } = useMemo(() => {
    const ahora = new Date()
    const claveActual = obtenerClaveMes(ahora)
    const fechaMesAnt = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
    const claveAnterior = obtenerClaveMes(fechaMesAnt)
    return { claveMesActual: claveActual, claveMesAnterior: claveAnterior }
  }, [])

  // Filtrado reactivo combinable
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      // 1. Filtro por búsqueda de texto en descripción / nombre o categoría
      if (busqueda.trim()) {
        const termino = busqueda.toLowerCase().trim()
        const textoDesc = (m.descripcion || m.nombre || '').toLowerCase()
        const textoCat = (m.categoria || '').toLowerCase()
        if (!textoDesc.includes(termino) && !textoCat.includes(termino)) {
          return false
        }
      }

      // 2. Filtro por tipo
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) {
        return false
      }

      // 3. Filtro por categoría
      if (filtroCategoria !== 'todas' && m.categoria !== filtroCategoria) {
        return false
      }

      // 4. Filtro por período / mes
      if (filtroPeriodo !== 'todos') {
        const claveItem = obtenerClaveMes(m.fecha)
        if (filtroPeriodo === 'mes-actual') {
          if (claveItem !== claveMesActual) return false
        } else if (filtroPeriodo === 'mes-anterior') {
          if (claveItem !== claveMesAnterior) return false
        } else {
          // Filtro por un mes específico YYYY-MM
          if (claveItem !== filtroPeriodo) return false
        }
      }

      return true
    })
  }, [
    movimientos,
    busqueda,
    filtroTipo,
    filtroCategoria,
    filtroPeriodo,
    claveMesActual,
    claveMesAnterior,
  ])

  // Totales de la selección filtrada
  const totales = useMemo(() => {
    let ingresos = 0
    let gastos = 0

    movimientosFiltrados.forEach((m) => {
      const valor = Number(m.valor ?? m.monto) || 0
      if (m.tipo === 'ingreso') {
        ingresos += valor
      } else {
        gastos += valor
      }
    })

    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
    }
  }, [movimientosFiltrados])

  const hayFiltrosActivos =
    Boolean(busqueda.trim()) ||
    filtroTipo !== 'todos' ||
    filtroCategoria !== 'todas' ||
    filtroPeriodo !== 'todos'

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroTipo('todos')
    setFiltroCategoria('todas')
    setFiltroPeriodo('todos')
  }

  // Manejador para guardar nuevo movimiento
  const handleGuardarNuevo = (datos) => {
    agregarMovimiento(datos)
  }

  // Manejador para actualizar movimiento editado
  const handleActualizarMovimiento = (datos) => {
    if (movimientoAEditar) {
      editarMovimiento(movimientoAEditar.id, datos)
      setMovimientoAEditar(null)
    }
  }

  // Manejador para eliminar movimiento confirmado
  const handleConfirmarEliminar = () => {
    if (movimientoAEliminar) {
      eliminarMovimiento(movimientoAEliminar.id)
      setMovimientoAEliminar(null)
    }
  }

  return (
    <>
      <DashboardHeader
        titulo="Movimientos"
        onNuevoMovimiento={() => setModalNuevoAbierto(true)}
        onToggleSidebar={toggleSidebar}
      />

      <div className="movements-page">
        {/* Tarjetas de resumen del conjunto filtrado */}
        <section
          className="dashboard__summary movements-page__summary"
          aria-label="Resumen de movimientos filtrados"
        >
          <SummaryCard
            titulo="Ingresos"
            subtitulo={hayFiltrosActivos ? '(filtrados)' : '(totales)'}
            monto={totales.ingresos}
            tendencia="positivo"
          />
          <SummaryCard
            titulo="Gastos"
            subtitulo={hayFiltrosActivos ? '(filtrados)' : '(totales)'}
            monto={totales.gastos}
            tendencia="negativo"
          />
          <SummaryCard
            titulo="Balance"
            subtitulo={hayFiltrosActivos ? '(filtrado)' : '(total)'}
            monto={totales.balance}
            tendencia={totales.balance >= 0 ? 'positivo' : 'negativo'}
            className="summary-card--balance"
          />
        </section>

        {/* Panel de Búsqueda y Filtros */}
        <section className="movements-filters" aria-label="Filtros de movimientos">
          <div className="movements-filters__row">
            {/* Buscador de texto */}
            <div className="movements-filters__search-wrapper">
              <svg
                className="movements-filters__search-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                className="movements-filters__search"
                placeholder="Buscar por descripción o categoría..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar movimientos por descripción o categoría"
              />
              {busqueda && (
                <button
                  type="button"
                  className="movements-filters__clear-search"
                  onClick={() => setBusqueda('')}
                  aria-label="Limpiar campo de búsqueda"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Grupo de controles select */}
            <div className="movements-filters__controls">
              {/* Filtro por Tipo */}
              <div className="movements-filters__control">
                <label htmlFor="filtro-tipo" className="movements-filters__label">
                  Tipo:
                </label>
                <select
                  id="filtro-tipo"
                  className="movements-filters__select"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                >
                  <option value="todos">Todos los tipos</option>
                  <option value="ingreso">Solo Ingresos</option>
                  <option value="gasto">Solo Gastos</option>
                </select>
              </div>

              {/* Filtro por Categoría */}
              <div className="movements-filters__control">
                <label htmlFor="filtro-categoria" className="movements-filters__label">
                  Categoría:
                </label>
                <select
                  id="filtro-categoria"
                  className="movements-filters__select"
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                  <option value="todas">Todas las categorías</option>
                  {categoriasDisponibles.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Período / Mes */}
              <div className="movements-filters__control">
                <label htmlFor="filtro-periodo" className="movements-filters__label">
                  Período:
                </label>
                <select
                  id="filtro-periodo"
                  className="movements-filters__select"
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                >
                  <option value="todos">Todos los períodos</option>
                  <option value="mes-actual">Mes actual</option>
                  <option value="mes-anterior">Mes anterior</option>
                  {mesesDisponibles.map((clave) => (
                    <option key={clave} value={clave}>
                      {formatearNombreMes(clave)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botón Restablecer Filtros */}
              {hayFiltrosActivos && (
                <button
                  type="button"
                  className="movements-filters__reset-btn"
                  onClick={limpiarFiltros}
                  title="Restablecer todos los filtros"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* Barra de metadatos de resultados */}
          <div className="movements-filters__meta">
            <span className="movements-filters__count">
              Mostrando {movimientosFiltrados.length} de {movimientos.length} movimientos
            </span>
          </div>
        </section>

        {/* Listado de Movimientos */}
        <section className="movements-list-section" aria-label="Lista de movimientos">
          {movimientosFiltrados.length > 0 ? (
            <div className="movements-table-wrapper">
              <table className="movements-table">
                <thead>
                  <tr>
                    <th scope="col" className="movements-table__th movements-table__th--tipo">Tipo</th>
                    <th scope="col" className="movements-table__th movements-table__th--desc">Descripción</th>
                    <th scope="col" className="movements-table__th movements-table__th--cat">Categoría</th>
                    <th scope="col" className="movements-table__th movements-table__th--fecha">Fecha</th>
                    <th scope="col" className="movements-table__th movements-table__th--monto">Valor</th>
                    <th scope="col" className="movements-table__th movements-table__th--acciones">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movimientosFiltrados.map((mov) => {
                    const esIngreso = mov.tipo === 'ingreso'
                    const descripcion = mov.descripcion || mov.nombre
                    const monto = mov.valor ?? mov.monto

                    return (
                      <tr key={mov.id} className="movements-table__row">
                        {/* Tipo con indicador visual */}
                        <td className="movements-table__td movements-table__td--tipo">
                          <span
                            className={`movement-item__indicator movement-item__indicator--${mov.tipo}`}
                            title={esIngreso ? 'Ingreso' : 'Gasto'}
                            aria-hidden="true"
                          >
                            {esIngreso ? (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="17 11 12 6 7 11" />
                                <line x1="12" y1="6" x2="12" y2="18" />
                              </svg>
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="7 13 12 18 17 13" />
                                <line x1="12" y1="18" x2="12" y2="6" />
                              </svg>
                            )}
                          </span>
                          <span className={`movements-table__tipo-label movements-table__tipo-label--${mov.tipo}`}>
                            {esIngreso ? 'Ingreso' : 'Gasto'}
                          </span>
                        </td>

                        {/* Descripción */}
                        <td className="movements-table__td movements-table__td--desc">
                          <div className="movements-table__desc-content">
                            <span className="movements-table__desc-text">{descripcion}</span>
                            {/* Meta visible en vistas responsivas móviles */}
                            <span className="movements-table__mobile-meta">
                              {mov.categoria} · {formatearFecha(mov.fecha)}
                            </span>
                          </div>
                        </td>

                        {/* Categoría */}
                        <td className="movements-table__td movements-table__td--cat">
                          <span className="movements-table__badge">{mov.categoria}</span>
                        </td>

                        {/* Fecha */}
                        <td className="movements-table__td movements-table__td--fecha">
                          <time dateTime={mov.fecha}>{formatearFecha(mov.fecha)}</time>
                        </td>

                        {/* Valor */}
                        <td className="movements-table__td movements-table__td--monto">
                          <span className={`movements-table__monto movements-table__monto--${mov.tipo}`}>
                            {esIngreso ? '+' : '-'}{formatearMoneda(monto)}
                          </span>
                        </td>

                        {/* Acciones: Editar y Eliminar */}
                        <td className="movements-table__td movements-table__td--acciones">
                          <div className="movements-table__actions">
                            <button
                              type="button"
                              className="movements-action-btn movements-action-btn--edit"
                              onClick={() => setMovimientoAEditar(mov)}
                              aria-label={`Editar movimiento ${descripcion}`}
                              title="Editar"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              className="movements-action-btn movements-action-btn--delete"
                              onClick={() => setMovimientoAEliminar(mov)}
                              aria-label={`Eliminar movimiento ${descripcion}`}
                              title="Eliminar"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="movements-empty">
              <div className="movements-empty__icon" aria-hidden="true">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="movements-empty__title">
                {hayFiltrosActivos
                  ? 'No se encontraron movimientos'
                  : 'Aún no tienes movimientos registrados'}
              </h3>
              <p className="movements-empty__text">
                {hayFiltrosActivos
                  ? 'Prueba modificando o limpiando los filtros para ver otros resultados.'
                  : 'Comienza agregando tus ingresos y gastos para llevar el control de tus finanzas.'}
              </p>
              {hayFiltrosActivos ? (
                <button
                  type="button"
                  className="movements-empty__btn"
                  onClick={limpiarFiltros}
                >
                  Restablecer filtros
                </button>
              ) : (
                <button
                  type="button"
                  className="movements-empty__btn"
                  onClick={() => setModalNuevoAbierto(true)}
                >
                  Registrar primer movimiento
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modal para Crear Movimiento */}
      <MovementModal
        isOpen={modalNuevoAbierto}
        onClose={() => setModalNuevoAbierto(false)}
        onSave={handleGuardarNuevo}
        movimientoAEditar={null}
      />

      {/* Modal para Editar Movimiento */}
      <MovementModal
        isOpen={Boolean(movimientoAEditar)}
        onClose={() => setMovimientoAEditar(null)}
        onSave={handleActualizarMovimiento}
        movimientoAEditar={movimientoAEditar}
      />

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmModal
        isOpen={Boolean(movimientoAEliminar)}
        title="¿Eliminar este movimiento?"
        message="Esta acción eliminará el movimiento de tu registro y actualizará tus balances inmediatamente."
        movement={movimientoAEliminar}
        onConfirm={handleConfirmarEliminar}
        onCancel={() => setMovimientoAEliminar(null)}
      />
    </>
  )
}

export default Movimientos
