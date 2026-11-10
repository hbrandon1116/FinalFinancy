/**
 * DashboardHeader
 *
 * Cabecera del Dashboard con el título de la sección y el botón para
 * crear un nuevo movimiento.
 *
 * @param {object} props
 * @param {string} props.titulo - Título de la sección actual.
 * @param {() => void} props.onNuevoMovimiento - Callback al pulsar "+ Nueva mov."
 * @param {() => void} props.onToggleSidebar - Abre/cierra el sidebar en móvil.
 */
function DashboardHeader({ titulo, onNuevoMovimiento, onToggleSidebar }) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header__left">
        <button
          className="dashboard-header__hamburger"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Abrir menú de navegación"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="dashboard-header__title">{titulo}</h1>
      </div>

      <button
        className="dashboard-header__btn-nuevo"
        type="button"
        onClick={onNuevoMovimiento}
        aria-label="Crear nuevo movimiento"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Nueva mov.</span>
      </button>
    </header>
  )
}

export default DashboardHeader
