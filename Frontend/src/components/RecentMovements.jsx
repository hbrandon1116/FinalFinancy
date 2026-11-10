import { useState, useMemo } from 'react'
import MovementItem from './MovementItem'

/**
 * RecentMovements
 *
 * Sección de movimientos recientes con buscador y botón de filtro.
 *
 * @param {object} props
 * @param {Array<object>} props.movimientos - Lista de movimientos.
 */
function RecentMovements({ movimientos }) {
  const [busqueda, setBusqueda] = useState('')

  /** Filtra los movimientos por nombre o categoría. */
  const movimientosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return movimientos

    const termino = busqueda.toLowerCase().trim()
    return movimientos.filter(
      (m) =>
        m.nombre.toLowerCase().includes(termino) ||
        m.categoria.toLowerCase().includes(termino),
    )
  }, [movimientos, busqueda])

  return (
    <section className="recent-movements" aria-labelledby="recent-movements-title">
      <div className="recent-movements__header">
        <h2 className="recent-movements__title" id="recent-movements-title">
          Movimientos recientes
        </h2>
      </div>

      <div className="recent-movements__toolbar">
        <div className="recent-movements__search-wrapper">
          <svg
            className="recent-movements__search-icon"
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
            className="recent-movements__search"
            placeholder="Buscar movimiento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar movimiento"
          />
        </div>

        <button
          className="recent-movements__filter-btn"
          type="button"
          aria-label="Filtrar movimientos"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Filtrar</span>
        </button>
      </div>

      {movimientosFiltrados.length > 0 ? (
        <ul className="recent-movements__list" role="list">
          {movimientosFiltrados.map((mov) => (
            <MovementItem key={mov.id} movimiento={mov} />
          ))}
        </ul>
      ) : (
        <p className="recent-movements__empty">
          No se encontraron movimientos.
        </p>
      )}
    </section>
  )
}

export default RecentMovements
