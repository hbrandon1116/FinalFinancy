import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * RegisterForm
 *
 * Formulario de registro de nuevos usuarios en FinanzasPro.
 * Gestiona el estado de los campos, validación reactiva de nombre, correo,
 * contraseña (mínimo 8 caracteres), confirmación y aceptación de términos.
 *
 * Por ahora no realiza peticiones HTTP reales al backend de Django;
 * muestra un estado informativo indicando que la integración con la API
 * se realizará en el sprint de backend.
 */
function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  })

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    acceptTerms: false,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [submitNotice, setSubmitNotice] = useState(null)

  // Expresión regular para validar correos
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Funciones de validación
  const getNameError = (name) => {
    const trimmed = name.trim()
    if (!trimmed) return 'El nombre completo es obligatorio.'
    if (trimmed.length < 2) return 'El nombre debe tener al menos 2 caracteres.'
    return ''
  }

  const getEmailError = (email) => {
    const trimmed = email.trim()
    if (!trimmed) return 'El correo electrónico es obligatorio.'
    if (!emailRegex.test(trimmed)) return 'Ingresa un correo electrónico válido.'
    return ''
  }

  const getPasswordError = (password) => {
    if (!password) return 'La contraseña es obligatoria.'
    if (password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
    return ''
  }

  const getConfirmPasswordError = (confirmPassword, password) => {
    if (!confirmPassword) return 'La confirmación de contraseña es obligatoria.'
    if (confirmPassword !== password) return 'Las contraseñas no coinciden.'
    return ''
  }

  const getTermsError = (acceptTerms) => {
    if (!acceptTerms) return 'Debes aceptar los términos y condiciones.'
    return ''
  }

  const nameError = getNameError(formData.name)
  const emailError = getEmailError(formData.email)
  const passwordError = getPasswordError(formData.password)
  const confirmPasswordError = getConfirmPasswordError(
    formData.confirmPassword,
    formData.password,
  )
  const termsError = getTermsError(formData.acceptTerms)

  const isFormValid =
    !nameError &&
    !emailError &&
    !passwordError &&
    !confirmPasswordError &&
    !termsError

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
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      acceptTerms: true,
    })

    if (!isFormValid || isLoading) return

    setIsLoading(true)
    setSubmitNotice(null)

    // Simulación visual de envío para verificar el estado de carga y prevenir duplicados
    // TODO: Conectar con services/api.js cuando el backend de Django esté disponible:
    // const response = await api.post('/auth/register', {
    //   name: formData.name.trim(),
    //   email: formData.email.trim(),
    //   password: formData.password
    // })
    setTimeout(() => {
      setIsLoading(false)
      setSubmitNotice({
        type: 'info',
        message:
          '¡Validación exitosa! El registro todavía no está conectado al backend de Django REST Framework.',
      })
    }, 700)
  }

  const hasMinLength = formData.password.length >= 8

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

      {/* Campo: Nombre completo */}
      <div className="login-form__field">
        <label className="login-form__label" htmlFor="register-name">
          Nombre completo
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <input
            id="register-name"
            name="name"
            type="text"
            autoComplete="name"
            className={`login-form__input ${
              touched.name && nameError ? 'login-form__input--error' : ''
            }`}
            placeholder="Ej: Laura Gómez"
            value={formData.name}
            onChange={handleChange}
            onBlur={() => handleBlur('name')}
            aria-invalid={touched.name && Boolean(nameError)}
            aria-describedby={touched.name && nameError ? 'name-error' : undefined}
            required
          />
        </div>
        {touched.name && nameError && (
          <p className="login-form__error" id="name-error" role="alert">
            {nameError}
          </p>
        )}
      </div>

      {/* Campo: Correo electrónico */}
      <div className="login-form__field">
        <label className="login-form__label" htmlFor="register-email">
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
            id="register-email"
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
        <label className="login-form__label" htmlFor="register-password">
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
            id="register-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`login-form__input login-form__input--with-toggle ${
              touched.password && passwordError ? 'login-form__input--error' : ''
            }`}
            placeholder="Crea una contraseña segura"
            value={formData.password}
            onChange={handleChange}
            onBlur={() => handleBlur('password')}
            aria-invalid={touched.password && Boolean(passwordError)}
            aria-describedby="password-requirements password-error"
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

        {/* Requisitos de contraseña */}
        <div
          className={`register-form__requirement ${
            hasMinLength ? 'register-form__requirement--met' : ''
          }`}
          id="password-requirements"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {hasMinLength ? (
              <polyline points="20 6 9 17 4 12" />
            ) : (
              <circle cx="12" cy="12" r="10" />
            )}
          </svg>
          <span>Mínimo 8 caracteres</span>
        </div>

        {touched.password && passwordError && (
          <p className="login-form__error" id="password-error" role="alert">
            {passwordError}
          </p>
        )}
      </div>

      {/* Campo: Confirmar contraseña */}
      <div className="login-form__field">
        <label className="login-form__label" htmlFor="register-confirm-password">
          Confirmar contraseña
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
            id="register-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className={`login-form__input login-form__input--with-toggle ${
              touched.confirmPassword && confirmPasswordError
                ? 'login-form__input--error'
                : ''
            }`}
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={() => handleBlur('confirmPassword')}
            aria-invalid={
              touched.confirmPassword && Boolean(confirmPasswordError)
            }
            aria-describedby={
              touched.confirmPassword && confirmPasswordError
                ? 'confirm-password-error'
                : undefined
            }
            required
          />
          <button
            type="button"
            className="login-form__password-toggle"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={
              showConfirmPassword
                ? 'Ocultar confirmación de contraseña'
                : 'Mostrar confirmación de contraseña'
            }
          >
            {showConfirmPassword ? (
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
        {touched.confirmPassword && confirmPasswordError && (
          <p className="login-form__error" id="confirm-password-error" role="alert">
            {confirmPasswordError}
          </p>
        )}
      </div>

      {/* Términos y condiciones */}
      <div className="login-form__field">
        <label className="login-form__checkbox-label">
          <input
            type="checkbox"
            name="acceptTerms"
            className="login-form__checkbox"
            checked={formData.acceptTerms}
            onChange={handleChange}
            onBlur={() => handleBlur('acceptTerms')}
            aria-invalid={touched.acceptTerms && Boolean(termsError)}
            aria-describedby={
              touched.acceptTerms && termsError ? 'terms-error' : undefined
            }
          />
          <span className="register-form__terms-text">
            Acepto los{' '}
            <a
              href="#terminos"
              className="login-form__link login-form__link--highlight"
              onClick={(e) => {
                e.preventDefault()
                alert('Términos y condiciones del servicio FinanzasPro.')
              }}
            >
              términos y condiciones
            </a>{' '}
            y la política de privacidad.
          </span>
        </label>
        {touched.acceptTerms && termsError && (
          <p className="login-form__error" id="terms-error" role="alert">
            {termsError}
          </p>
        )}
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
            <span>Creando cuenta...</span>
          </span>
        ) : (
          'Crear cuenta'
        )}
      </button>

      {/* Pie del formulario: Enlace a Login */}
      <div className="login-form__footer">
        <p className="login-form__footer-text">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="login-form__link login-form__link--highlight">
            Inicia sesión
          </Link>
        </p>
      </div>
    </form>
  )
}

export default RegisterForm
