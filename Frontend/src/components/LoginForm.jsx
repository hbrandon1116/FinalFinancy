import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * LoginForm
 *
 * Formulario de inicio de sesión de FinanzasPro.
 * Maneja el estado local de los campos, validaciones en tiempo real
 * y estados de carga y deshabilitado.
 *
 * Por ahora no realiza peticiones HTTP reales al backend de Django;
 * muestra un estado informativo indicando que la integración con la API
 * se realizará en el sprint de backend.
 */
function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitNotice, setSubmitNotice] = useState(null)

  // Validaciones
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const getEmailError = (email) => {
    if (!email.trim()) return 'El correo electrónico es obligatorio.'
    if (!emailRegex.test(email.trim())) return 'Ingresa un correo electrónico válido.'
    return ''
  }

  const getPasswordError = (password) => {
    if (!password) return 'La contraseña es obligatoria.'
    return ''
  }

  const emailError = getEmailError(formData.email)
  const passwordError = getPasswordError(formData.password)
  const isFormValid = !emailError && !passwordError

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (submitNotice) setSubmitNotice(null)
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Marcar todos los campos como interactuados
    setTouched({ email: true, password: true })

    if (!isFormValid || isLoading) return

    setIsLoading(true)
    setSubmitNotice(null)

    // Simulación visual de envío para verificar el estado de carga
    // TODO: Conectar con services/api.js cuando el backend de Django esté disponible:
    // const response = await api.post('/auth/login', { email: formData.email, password: formData.password })
    setTimeout(() => {
      setIsLoading(false)
      setSubmitNotice({
        type: 'info',
        message:
          '¡Validación exitosa! La autenticación todavía no está conectada al backend de Django REST Framework.',
      })
    }, 700)
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {/* Mensaje de estado / notificación */}
      {submitNotice && (
        <div
          className={`login-form__alert login-form__alert--${submitNotice.type}`}
          role="status"
          aria-live="polite"
        >
          <svg
            className="login-form__alert-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{submitNotice.message}</span>
        </div>
      )}

      {/* Campo: Correo electrónico */}
      <div className="login-form__field">
        <label className="login-form__label" htmlFor="login-email">
          Correo electrónico
        </label>
        <div className="login-form__input-wrapper">
          <svg
            className="login-form__field-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            className={`login-form__input ${
              touched.email && emailError ? 'login-form__input--error' : ''
            }`}
            placeholder="Ingresa tu correo electrónico"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            aria-invalid={touched.email && Boolean(emailError)}
            aria-describedby={touched.email && emailError ? 'email-error' : undefined}
            required
          />
        </div>
        {touched.email && emailError && (
          <p className="login-form__error" id="email-error" role="alert">
            {emailError}
          </p>
        )}
      </div>

      {/* Campo: Contraseña */}
      <div className="login-form__field">
        <label className="login-form__label" htmlFor="login-password">
          Contraseña
        </label>
        <div className="login-form__input-wrapper">
          <svg
            className="login-form__field-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`login-form__input login-form__input--with-toggle ${
              touched.password && passwordError ? 'login-form__input--error' : ''
            }`}
            placeholder="Ingresa tu contraseña"
            value={formData.password}
            onChange={handleChange}
            onBlur={() => handleBlur('password')}
            aria-invalid={touched.password && Boolean(passwordError)}
            aria-describedby={
              touched.password && passwordError ? 'password-error' : undefined
            }
            required
          />
          <button
            type="button"
            className="login-form__password-toggle"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {touched.password && passwordError && (
          <p className="login-form__error" id="password-error" role="alert">
            {passwordError}
          </p>
        )}
      </div>

      {/* Opciones adicionales: Recordarme y Olvidé contraseña */}
      <div className="login-form__options">
        <label className="login-form__checkbox-label">
          <input
            type="checkbox"
            name="rememberMe"
            className="login-form__checkbox"
            checked={formData.rememberMe}
            onChange={handleChange}
          />
          <span>Recordarme</span>
        </label>

        <a
          href="#olvide-password"
          className="login-form__link"
          onClick={(e) => {
            e.preventDefault()
            alert('La recuperación de contraseña se implementará en un próximo sprint.')
          }}
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        className="login-form__submit-btn"
        disabled={!isFormValid || isLoading}
      >
        {isLoading ? (
          <span className="login-form__spinner-wrapper">
            <svg
              className="login-form__spinner"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
            </svg>
            <span>Iniciando sesión...</span>
          </span>
        ) : (
          'Iniciar sesión'
        )}
      </button>

      {/* Pie del formulario: Enlace de registro */}
      <div className="login-form__footer">
        <p className="login-form__footer-text">
          ¿No tienes una cuenta?{' '}
          <Link to="/registro" className="login-form__link login-form__link--highlight">
            Regístrate
          </Link>
        </p>
      </div>
    </form>
  )
}

export default LoginForm
