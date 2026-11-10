import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

/**
 * MainLayout
 *
 * Layout general de las páginas que requieren sesión iniciada:
 * dashboard, movimientos, reportes, ahorro, presupuestos y ajustes.
 *
 * Renderiza el Sidebar y las páginas hijas a través de <Outlet />.
 * El estado del sidebar (abierto/cerrado en móvil) se gestiona aquí
 * y se propaga al Sidebar y a las páginas hijas mediante context del Outlet.
 *
 * Todavía NO se implementa autenticación ni protección de rutas.
 */
function MainLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  const cerrarSidebar = useCallback(() => setSidebarAbierto(false), [])
  const toggleSidebar = useCallback(
    () => setSidebarAbierto((prev) => !prev),
    [],
  )

  return (
    <div className="layout">
      <Sidebar isOpen={sidebarAbierto} onClose={cerrarSidebar} />

      <div className="layout__main">
        <main className="layout__content">
          <Outlet context={{ toggleSidebar }} />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
