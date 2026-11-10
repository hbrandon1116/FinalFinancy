import RegisterForm from '../components/RegisterForm'

/**
 * Registro
 *
 * Página de creación de cuenta de FinanzasPro.
 * Presenta una interfaz limpia y centrada, con la identidad visual
 * oscura de la aplicación, el logo institucional y el formulario modular de registro.
 */
function Registro() {
  return (
    <div className="login-page">
      <main className="login-card login-card--register" aria-labelledby="register-title">
        {/* Encabezado: Logo e identidad */}
        <header className="login-card__header">
          <div className="login-card__logo-wrapper">
            <span className="login-card__logo-icon" aria-hidden="true">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </span>
            <span className="login-card__app-name">FinanzasPro</span>
          </div>

          <h1 className="login-card__title" id="register-title">
            Crea tu cuenta
          </h1>
          <p className="login-card__subtitle">
            Comienza a gestionar tus finanzas personales
          </p>
        </header>

        {/* Formulario de registro */}
        <RegisterForm />
      </main>
    </div>
  )
}

export default Registro
