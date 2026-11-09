import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Dashboard from './pages/Dashboard'
import Movimientos from './pages/Movimientos'
import Reportes from './pages/Reportes'
import Ahorro from './pages/Ahorro'
import Presupuestos from './pages/Presupuestos'
import Ajustes from './pages/Ajustes'

/**
 * App
 *
 * Responsable únicamente de la configuración del enrutado.
 * No contiene lógica de negocio ni interfaz: cada vista vive en su página y
 * la estructura común en layouts/MainLayout.jsx.
 *
 * Nota: la protección de rutas se añadirá cuando exista el contexto de
 * autenticación.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Raíz: aún no hay sesión, se redirige al acceso. */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas públicas. */}
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />

        {/* Rutas de la aplicación, comparten MainLayout. */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/movimientos" element={<Movimientos />} />
          <Route path="/reportes" element={<Reportes />} />
          <Route path="/ahorro" element={<Ahorro />} />
          <Route path="/presupuestos" element={<Presupuestos />} />
          <Route path="/ajustes" element={<Ajustes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App