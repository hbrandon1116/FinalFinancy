import { Outlet } from 'react-router-dom'

/**
 * MainLayout
 *
 * Layout general de las páginas queikmati sesión iniciada:
 * dashboard, movimientos, reportes, ahorro, presupuestos y ajustes.
 *
 * Renderiza los elementos comunes de la aplicación (sidebar, navegación y
 * barra superior) y las páginas hijas a través de <Outlet />.
 *
 * Estructura de la aplicación:
 *
 *   <MainLayout>
 *     <Outlet />  -> página actual
 *   </MainLayout>
 *
 * Todavía NO se implementa autenticación ni protección de rutas.
 */
function MainLayout() {
  return (
    <div className="layout">
      {/* Barra lateral: aquí irá el logo, la navegación y el cierre de sesión. */}
      <aside className="layout__sidebar" />

      <div className="layout__main">
        {/* Barra superior: aquí irá el usuario actual y acciones rápidas. */}
        <header className="layout__header" />

        {/* Contenido principal: se inyecta la página de la ruta activa. */}
        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout