import { useState, useMemo } from 'react'
import { aFechaInput } from '../utils/format'

/**
 * Formulario interno para crear o editar una meta de ahorro.
 * Inicializado limpiamente mediante 'key' en React sin provocar cascada de renders.
 */
function GoalFormInner({ metaAEditar, onSave, onClose }) {
  const esEdicion = Boolean(metaAEditar)

  const [nombre, setNombre] = useState(() => metaAEditar?.nombre || '')
  const [objetivo, setObjetivo] = useState(() =>
    metaAEditar ? String(metaAEditar.objetivo) : '',
  )
  const [fechaLimite, setFechaLimite] = useState(() =>
    metaAEditar
      ? aFechaInput(metaAEditar.fechaLimite)
      : aFechaInput(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)),
  )
  const [descripcion, setDescripcion] = useState(() => metaAEditar?.descripcion || '')

  const [touched, setTouched] = useState({})
  const [submitIntentado, setSubmitIntentado] = useState(false)
  const [errorServidor, setErrorServidor] = useState(null)

  // Validaciones
  const errores = useMemo(() => {
    const errs = {}

    // 1. Nombre de la meta
    if (!nombre.trim()) {
      errs.nombre = 'El nombre de la meta es obligatorio.'
    } else if (nombre.trim().length < 2) {
      errs.nombre = 'El nombre debe tener al menos 2 caracteres.'
    }

    // 2. Monto objetivo
    const numObj = Number(objetivo)
    if (objetivo === '' || objetivo === null || objetivo === undefined) {
      errs.objetivo = 'El monto objetivo es obligatorio.'
    } else if (Number.isNaN(numObj)) {
      errs.objetivo = 'Ingresa un valor numérico válido.'
    } else if (numObj <= 0) {
      errs.objetivo = 'El monto objetivo debe ser mayor a cero.'
    }

    // 3. Fecha límite
    if (!fechaLimite || !fechaLimite.trim()) {
      errs.fechaLimite = 'La fecha límite es obligatoria.'
    } else {
      const fechaObj = new Date(`${fechaLimite}T23:59:59`)
      if (Number.isNaN(fechaObj.getTime())) {
        errs.fechaLimite = 'Ingresa una fecha válida.'
      }
    }

    return errs
  }, [nombre, objetivo, fechaLimite])

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

    const numObj = Math.abs(Number(objetivo))
    const fechaISO = new Date(`${fechaLimite}T23:59:59`).toISOString()

    const resultado = onSave({
      nombre: nombre.trim(),
      objetivo: numObj,
      fechaLimite: fechaISO,
      descripcion: descripcion.trim(),
    })

    if (resultado && resultado.ok === false) {
      setErrorServidor(resultado.error || 'No se pudo guardar la meta de ahorro.')
      return
    }

    onClose()
  }

  const mostrarError = (campo) => (touched[campo] || submitIntentado) && errores[campo]

  return (
    <form className="modal__form" onSubmit={handleSubmit} noValidate>
      {errorServidor && (
        <div className="login-form__alert login-form__alert--error" style={{ color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
          <span>{errorServidor}</span>
        </div>
      )}

      {/* Nombre */}
      <div className="modal__field">
        <label className="modal__label" htmlFor="goal-nombre">
          Nombre de la meta <span className="modal__required">*</span>
        </label>
        <input
          id="goal-nombre"
          className={`modal__input ${mostrarError('nombre') ? 'modal__input--error' : ''}`}
          type="text"
          placeholder="Ej: Fondo de emergencia, Viaje a Europa..."
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value)
            setErrorServidor(null)
          }}
          onBlur={() => handleBlur('nombre')}
          aria-invalid={Boolean(mostrarError('nombre'))}
          aria-describedby={mostrarError('nombre') ? 'goal-nombre-error' : undefined}
          required
        />
        {mostrarError('nombre') && (
          <span className="modal__error" id="goal-nombre-error">
            {errores.nombre}
          </span>
        )}
      </div>

      {/* Monto objetivo y Fecha límite en dos columnas */}
      <div className="modal__row">
        {/* Monto objetivo */}
        <div className="modal__field modal__field--half">
          <label className="modal__label" htmlFor="goal-objetivo">
            Monto objetivo ($ COP) <span className="modal__required">*</span>
          </label>
          <input
            id="goal-objetivo"
            className={`modal__input ${mostrarError('objetivo') ? 'modal__input--error' : ''}`}
            type="number"
            min="1"
            step="any"
            placeholder="Ej: 2000000"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            onBlur={() => handleBlur('objetivo')}
            aria-invalid={Boolean(mostrarError('objetivo'))}
            aria-describedby={mostrarError('objetivo') ? 'goal-objetivo-error' : undefined}
            required
          />
          {mostrarError('objetivo') && (
            <span className="modal__error" id="goal-objetivo-error">
              {errores.objetivo}
            </span>
          )}
        </div>

        {/* Fecha límite */}
        <div className="modal__field modal__field--half">
          <label className="modal__label" htmlFor="goal-fecha">
            Fecha límite <span className="modal__required">*</span>
          </label>
          <input
            id="goal-fecha"
            className={`modal__input ${mostrarError('fechaLimite') ? 'modal__input--error' : ''}`}
            type="date"
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            onBlur={() => handleBlur('fechaLimite')}
            aria-invalid={Boolean(mostrarError('fechaLimite'))}
            aria-describedby={mostrarError('fechaLimite') ? 'goal-fecha-error' : undefined}
            required
          />
          {mostrarError('fechaLimite') && (
            <span className="modal__error" id="goal-fecha-error">
              {errores.fechaLimite}
            </span>
          )}
        </div>
      </div>

      {/* Descripción opcional */}
      <div className="modal__field">
        <label className="modal__label" htmlFor="goal-desc">
          Descripción <span className="modal__optional">(opcional)</span>
        </label>
        <textarea
          id="goal-desc"
          className="modal__input modal__textarea"
          rows="3"
          placeholder="¿Por qué es importante esta meta o cómo planeas alcanzarla?"
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
          {esEdicion ? 'Actualizar meta' : 'Crear meta'}
        </button>
      </div>
    </form>
  )
}

/**
 * GoalModal
 *
 * Contenedor modal para crear y editar metas de ahorro.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(datos: object) => { ok: boolean, error?: string }} props.onSave
 * @param {object|null} [props.metaAEditar]
 */
function GoalModal({ isOpen, onClose, onSave, metaAEditar = null }) {
  if (!isOpen) return null

  const esEdicion = Boolean(metaAEditar)
  const formKey = metaAEditar ? `edit-goal-${metaAEditar.id}` : 'new-goal'

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="modal__header">
          <h2 className="modal__title" id="goal-modal-title">
            {esEdicion ? 'Editar meta de ahorro' : 'Nueva meta de ahorro'}
          </h2>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de meta"
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

        {/* Formulario */}
        <GoalFormInner
          key={formKey}
          metaAEditar={metaAEditar}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  )
}

export default GoalModal
