import { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { MovimientosProvider } from '../context/MovimientosContext'
import { PresupuestosProvider } from '../context/PresupuestosContext'
import { AhorroProvider } from '../context/AhorroContext'

/**
 * MainLayout
 *
 * Layout general de las páginas que requieren sesión iniciada:
 * dashboard, movimientos, reportes, ahorro, presupuestos y ajustes.
 *
 * Renderiza el Sidebar y las páginas hijas a través de <Outlet />.
 * Provee los contextos globales de Movimientos, Presupuestos y Ahorro para mantener
 * coherencia de datos en memoria entre todas las vistas de la app.
 */
function MainLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  const cerrarSidebar = useCallback(() => setSidebarAbierto(false), [])
  const toggleSidebar = useCallback(
    () => setSidebarAbierto((prev) => !prev),
    [],
  )

  return (
    <MovimientosProvider>
      <PresupuestosProvider>
        <AhorroProvider>
          <div className="layout">
            <Sidebar isOpen={sidebarAbierto} onClose={cerrarSidebar} />

            <div className="layout__main">
              <main className="layout__content">
                <Outlet context={{ toggleSidebar }} />
              </main>
            </div>
          </div>
        </AhorroProvider>
      </PresupuestosProvider>
    </MovimientosProvider>
  )
}

export default MainLayout
