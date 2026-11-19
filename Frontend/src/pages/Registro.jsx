import RegisterForm from '../components/RegisterForm'
import BrandMark from '../components/ui/BrandMark'

/**
 * Registro
 *
 * Página de creación de cuenta de FinalFinancy.
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
              <BrandMark size={32} />
            </span>
            <span className="login-card__app-name">FinalFinancy</span>
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
