import { NavLink } from 'react-router-dom'

/**
 * Sidebar
 *
 * Barra lateral de navegación principal de la aplicación.
 * Contiene el logo, los enlaces de navegación y el botón de cerrar sesión.
 *
 * En escritorio se muestra fijo a la izquierda.
 * En móvil se convierte en un drawer que se abre con el botón hamburguesa.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Si el sidebar está abierto (móvil).
 * @param {() => void} props.onClose - Cierra el sidebar (móvil).
 */

/** Iconos SVG sencillos para la navegación. */
const icons = {
  inicio: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  movimientos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  reportes: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  ahorro: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  presupuestos: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  cerrarSesion: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
}

const navItems = [
  { to: '/dashboard', label: 'Inicio', icon: icons.inicio },
  { to: '/movimientos', label: 'Movimientos', icon: icons.movimientos },
  { to: '/reportes', label: 'Reportes', icon: icons.reportes },
  { to: '/ahorro', label: 'Ahorro', icon: icons.ahorro },
  { to: '/presupuestos', label: 'Presupuestos', icon: icons.presupuestos },
]

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Overlay para cerrar el sidebar en móvil. */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
        aria-label="Navegación principal"
      >
        {/* Logo */}
        <div className="sidebar__logo">
          <span className="sidebar__logo-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </span>
          <span className="sidebar__logo-text">FinanzasPro</span>
        </div>

        {/* Navegación */}
        <nav className="sidebar__nav">
          <ul className="sidebar__list" role="list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                  }
                  onClick={onClose}
                  aria-label={item.label}
                >
                  <span className="sidebar__link-icon">{item.icon}</span>
                  <span className="sidebar__link-label">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Cerrar sesión */}
        <div className="sidebar__footer">
          <button
            className="sidebar__link sidebar__logout"
            type="button"
            onClick={() => {
              // TODO: implementar cierre de sesión real.
            }}
            aria-label="Cerrar sesión"
          >
            <span className="sidebar__link-icon">{icons.cerrarSesion}</span>
            <span className="sidebar__link-label">Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
