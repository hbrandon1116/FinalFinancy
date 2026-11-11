import { useState, useMemo } from 'react'
import { aFechaInput, formatearMoneda } from '../utils/format'

/**
 * Formulario interno para registrar un aporte a una meta.
 */
function ContributionFormInner({ meta, onSave, onClose }) {
  const [valor, setValor] = useState('')
  const [fecha, setFecha] = useState(() => aFechaInput(new Date()))
  const [descripcion, setDescripcion] = useState('')

  const [touched, setTouched] = useState({})
  const [submitIntentado, setSubmitIntentado] = useState(false)
  const [errorServidor, setErrorServidor] = useState(null)

  const restante = Math.max(0, (meta?.objetivo || 0) - (meta?.ahorrado || 0))

  // Validaciones
  const errores = useMemo(() => {
    const errs = {}

    // 1. Valor del aporte
    const numValor = Number(valor)
    if (valor === '' || valor === null || valor === undefined) {
      errs.valor = 'El monto del aporte es obligatorio.'
    } else if (Number.isNaN(numValor)) {
      errs.valor = 'Ingresa un número válido.'
    } else if (numValor <= 0) {
      errs.valor = 'El monto debe ser mayor a cero.'
    }

    // 2. Fecha del aporte
    if (!fecha || !fecha.trim()) {
      errs.fecha = 'La fecha es obligatoria.'
    } else {
      const fechaObj = new Date(`${fecha}T12:00:00`)
      if (Number.isNaN(fechaObj.getTime())) {
        errs.fecha = 'Ingresa una fecha válida.'
      }
    }

    return errs
  }, [valor, fecha])

  const tieneErrores = Object.keys(errores).length > 0

  const handleBlur = (campo) => {
    setTouched((prev) => ({ ...prev, [campo]: true }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitIntentado(true)
    setErrorServidor(null)

    if (tieneErrores) {
      return
    }

    const numValor = Math.abs(Number(valor))
    const fechaISO = new Date(`${fecha}T12:00:00`).toISOString()

    const resultado = onSave({
      valor: numValor,
      fecha: fechaISO,
      descripcion: descripcion.trim(),
    })

    if (resultado && resultado.ok === false) {
      setErrorServidor(resultado.error || 'No se pudo registrar el aporte.')
      return
    }

    onClose()
  }

  const mostrarError = (campo) => (touched[campo] || submitIntentado) && errores[campo]

  return (
    <form className="modal__form" onSubmit={handleSubmit} noValidate>
      {/* Vista previa de la meta */}
      <div className="contribution-modal__target-preview">
        <div className="contribution-modal__target-info">
          <span className="contribution-modal__target-label">Meta de ahorro</span>
          <strong className="contribution-modal__target-title">{meta.nombre}</strong>
        </div>
        <div className="contribution-modal__target-numbers">
          <span className="contribution-modal__target-progress">
            {formatearMoneda(meta.ahorrado)} / {formatearMoneda(meta.objetivo)}
          </span>
          <span className="contribution-modal__target-remaining">
            {restante > 0 ? `Faltan ${formatearMoneda(restante)}` : '¡Objetivo alcanzado!'}
          </span>
        </div>
      </div>

      {errorServidor && (
        <div className="login-form__alert login-form__alert--error" style={{ color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
          <span>{errorServidor}</span>
        </div>
      )}

      {/* Valor y Fecha */}
      <div className="modal__row">
        {/* Valor */}
        <div className="modal__field modal__field--half">
          <label className="modal__label" htmlFor="contrib-valor">
            Monto a aportar ($ COP) <span className="modal__required">*</span>
          </label>
          <input
            id="contrib-valor"
            className={`modal__input ${mostrarError('valor') ? 'modal__input--error' : ''}`}
            type="number"
            min="1"
            step="any"
            placeholder="0"
            value={valor}
            onChange={(e) => {
              setValor(e.target.value)
              setErrorServidor(null)
            }}
            onBlur={() => handleBlur('valor')}
            aria-invalid={Boolean(mostrarError('valor'))}
            aria-describedby={mostrarError('valor') ? 'contrib-valor-error' : undefined}
            autoFocus
            required
          />
          {mostrarError('valor') && (
            <span className="modal__error" id="contrib-valor-error">
              {errores.valor}
            </span>
          )}
        </div>

        {/* Fecha */}
        <div className="modal__field modal__field--half">
          <label className="modal__label" htmlFor="contrib-fecha">
            Fecha del aporte <span className="modal__required">*</span>
          </label>
          <input
            id="contrib-fecha"
            className={`modal__input ${mostrarError('fecha') ? 'modal__input--error' : ''}`}
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value)
              setErrorServidor(null)
            }}
            onBlur={() => handleBlur('fecha')}
            aria-invalid={Boolean(mostrarError('fecha'))}
            aria-describedby={mostrarError('fecha') ? 'contrib-fecha-error' : undefined}
            required
          />
          {mostrarError('fecha') && (
            <span className="modal__error" id="contrib-fecha-error">
              {errores.fecha}
            </span>
          )}
        </div>
      </div>

      {/* Descripción opcional */}
      <div className="modal__field">
        <label className="modal__label" htmlFor="contrib-desc">
          Nota o concepto <span className="modal__optional">(opcional)</span>
        </label>
        <input
          id="contrib-desc"
          className="modal__input"
          type="text"
          placeholder="Ej: Aporte quincenal, Ahorro extra, Bono..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      {/* Acciones */}
      <div className="modal__actions">
        <button
          type="button"
          className="modal__btn modal__btn--secondary"
          onClick={onClose}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="modal__btn modal__btn--primary"
        >
          Confirmar aporte
        </button>
      </div>
    </form>
  )
}

/**
 * ContributionModal
 *
 * Diálogo modal para registrar aportes a una meta de ahorro específica.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(datos: object) => { ok: boolean, error?: string }} props.onSave
 * @param {object} props.meta
 */
function ContributionModal({ isOpen, onClose, onSave, meta }) {
  if (!isOpen || !meta) return null

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contribution-modal-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="modal__header">
          <h2 className="modal__title" id="contribution-modal-title">
            Registrar aporte
          </h2>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de aporte"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Formulario con key para reinicio */}
        <ContributionFormInner
          key={`contrib-${meta.id}-${meta.ahorrado}`}
          meta={meta}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  )
}

export default ContributionModal
