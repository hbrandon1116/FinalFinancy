import LoginForm from '../components/LoginForm'
import BrandMark from '../components/ui/BrandMark'

/**
 * Login
 *
 * Página de inicio de sesión de FinalFinancy.
 * Presenta una interfaz limpia y centrada, con la identidad visual
 * oscura de la aplicación, el logo institucional y el formulario modular.
 */
function Login() {
  return (
    <div className="login-page">
      <main className="login-card" aria-labelledby="login-title">
        {/* Encabezado: Logo e identidad */}
        <header className="login-card__header">
          <div className="login-card__logo-wrapper">
            <span className="login-card__logo-icon" aria-hidden="true">
              <BrandMark size={32} />
            </span>
            <span className="login-card__app-name">FinalFinancy</span>
          </div>

          <h1 className="login-card__title" id="login-title">
            Bienvenido de nuevo
          </h1>
          <p className="login-card__subtitle">
            Inicia sesión para gestionar tus finanzas
          </p>
        </header>

        {/* Formulario de inicio de sesión */}
        <LoginForm />
      </main>
    </div>
  )
}

export default Login
