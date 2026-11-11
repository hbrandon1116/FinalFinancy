import { aFechaInput } from '../../utils/format'

/**
 * ReportsFilterBar
 *
 * Barra de control de períodos para la sección de reportes:
 * - Mes actual, Mes anterior, Últimos 3 meses, Últimos 6 meses, Año actual, Personalizado
 *
 * @param {object} props
 * @param {string} props.periodoSeleccionado
 * @param {(p: string) => void} props.onSelectPeriodo
 * @param {string} props.fechaInicioCustom
 * @param {string} props.fechaFinCustom
 * @param {(inicio: string, fin: string) => void} props.onChangeCustomDates
 * @param {string} props.etiquetaRango
 */
function ReportsFilterBar({
  periodoSeleccionado,
  onSelectPeriodo,
  fechaInicioCustom,
  fechaFinCustom,
  onChangeCustomDates,
  etiquetaRango,
}) {
  const periodos = [
    { id: 'mes-actual', label: 'Mes actual' },
    { id: 'mes-anterior', label: 'Mes anterior' },
    { id: 'ultimos-3-meses', label: 'Últimos 3 meses' },
    { id: 'ultimos-6-meses', label: 'Últimos 6 meses' },
    { id: 'anio-actual', label: 'Año actual' },
    { id: 'personalizado', label: 'Personalizado' },
  ]

  return (
    <section className="reports-filter-bar" aria-label="Filtro de períodos para reportes">
      <div className="reports-filter-bar__top">
        <div className="reports-filter-bar__tabs" role="tablist">
          {periodos.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={periodoSeleccionado === p.id}
              className={`reports-filter-bar__tab ${
                periodoSeleccionado === p.id ? 'reports-filter-bar__tab--active' : ''
              }`}
              onClick={() => onSelectPeriodo(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="reports-filter-bar__badge">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{etiquetaRango}</span>
        </div>
      </div>

      {/* Controles para fecha personalizada */}
      {periodoSeleccionado === 'personalizado' && (
        <div className="reports-filter-bar__custom-row">
          <div className="reports-filter-bar__custom-field">
            <label htmlFor="rep-fecha-inicio" className="reports-filter-bar__custom-label">
              Desde:
            </label>
            <input
              id="rep-fecha-inicio"
              type="date"
              className="reports-filter-bar__custom-input"
              value={fechaInicioCustom || aFechaInput(new Date())}
              onChange={(e) => onChangeCustomDates(e.target.value, fechaFinCustom)}
            />
          </div>
          <div className="reports-filter-bar__custom-field">
            <label htmlFor="rep-fecha-fin" className="reports-filter-bar__custom-label">
              Hasta:
            </label>
            <input
              id="rep-fecha-fin"
              type="date"
              className="reports-filter-bar__custom-input"
              value={fechaFinCustom || aFechaInput(new Date())}
              onChange={(e) => onChangeCustomDates(fechaInicioCustom, e.target.value)}
            />
          </div>
        </div>
      )}
    </section>
  )
}

export default ReportsFilterBar
