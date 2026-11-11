import { useState, useMemo } from 'react'
import { usePresupuestos } from '../hooks/usePresupuestos'
import { obtenerClaveMes, formatearNombreMes } from '../utils/format'

/**
 * Formulario interno para crear o editar un presupuesto mensual.
 * Se inicializa sin useEffect usando el patrón de 'key' única en React.
 */
function BudgetFormInner({ presupuestoAEditar, periodoPorDefecto, onSave, onClose }) {
  const { categoriasGastoDisponibles, presupuestos } = usePresupuestos()
  const esEdicion = Boolean(presupuestoAEditar)

  const [categoria, setCategoria] = useState(() => presupuestoAEditar?.categoria || '')
  const [categoriaPersonalizada, setCategoriaPersonalizada] = useState('')
  const [limite, setLimite] = useState(() =>
    presupuestoAEditar ? String(presupuestoAEditar.limite) : '',
  )
  const [mes, setMes] = useState(
    () => presupuestoAEditar?.mes || periodoPorDefecto || obtenerClaveMes(new Date()),
  )

  const [touched, setTouched] = useState({})
  const [submitIntentado, setSubmitIntentado] = useState(false)
  const [errorServidor, setErrorServidor] = useState(null)

  // Validaciones
  const errores = useMemo(() => {
    const errs = {}

    // 1. Categoría
    const catFinal = categoria === '__otra__' ? categoriaPersonalizada.trim() : categoria.trim()
    if (!catFinal) {
      errs.categoria = 'Selecciona o escribe una categoría.'
    }

    // 2. Límite de gasto
    const numLimite = Number(limite)
    if (limite === '' || limite === null || limite === undefined) {
      errs.limite = 'El límite de gasto es obligatorio.'
    } else if (Number.isNaN(numLimite)) {
      errs.limite = 'Ingresa un valor numérico válido.'
    } else if (numLimite <= 0) {
      errs.limite = 'El límite debe ser mayor a cero.'
    }

    // 3. Mes / Período
    if (!mes || !mes.trim() || !/^\d{4}-\d{2}$/.test(mes.trim())) {
      errs.mes = 'Selecciona un mes y año válidos.'
    }

    // 4. Verificación de duplicado en el mismo período
    if (catFinal && mes && /^\d{4}-\d{2}$/.test(mes.trim())) {
      const existeDuplicado = presupuestos.some((p) => {
        if (esEdicion && p.id === presupuestoAEditar.id) return false
        return (
          p.mes === mes.trim() &&
          p.categoria.toLowerCase() === catFinal.toLowerCase()
        )
      })

      if (existeDuplicado) {
        errs.duplicado = `Ya existe un presupuesto para "${catFinal}" en ${formatearNombreMes(mes.trim())}.`
      }
    }

    return errs
  }, [categoria, categoriaPersonalizada, limite, mes, presupuestos, esEdicion, presupuestoAEditar])

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

    const catFinal = categoria === '__otra__' ? categoriaPersonalizada.trim() : categoria.trim()
    const numLimite = Math.abs(Number(limite))

    const resultado = onSave({
      categoria: catFinal,
      limite: numLimite,
      mes: mes.trim(),
    })

    if (resultado && resultado.ok === false) {
      setErrorServidor(resultado.error || 'No se pudo guardar el presupuesto.')
      return
    }

    onClose()
  }

  const mostrarError = (campo) => (touched[campo] || submitIntentado) && errores[campo]

  return (
    <form className="modal__form" onSubmit={handleSubmit} noValidate>
      {/* Mensaje de error general (duplicado o servidor) */}
      {(errores.duplicado && submitIntentado) || errorServidor ? (
        <div className="login-form__alert login-form__alert--error" style={{ color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.15)', padding: '0.75rem', borderRadius: '0.5rem' }}>
          <span>{errorServidor || errores.duplicado}</span>
        </div>
      ) : null}

      {/* Categoría */}
      <div className="modal__field">
        <label className="modal__label" htmlFor="budget-categoria">
          Categoría de gasto <span className="modal__required">*</span>
        </label>
        <select
          id="budget-categoria"
          className={`modal__input modal__select ${mostrarError('categoria') ? 'modal__input--error' : ''}`}
          value={categoria}
          onChange={(e) => {
            setCategoria(e.target.value)
            setErrorServidor(null)
          }}
          onBlur={() => handleBlur('categoria')}
          aria-invalid={Boolean(mostrarError('categoria'))}
          aria-describedby={mostrarError('categoria') ? 'budget-cat-error' : undefined}
        >
          <option value="">Selecciona una categoría</option>
          {categoriasGastoDisponibles.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value="__otra__">+ Otra categoría personalizada</option>
        </select>

        {categoria === '__otra__' && (
          <input
            type="text"
            className={`modal__input modal__input--custom-cat ${mostrarError('categoria') ? 'modal__input--error' : ''}`}
            placeholder="Escribe el nombre de la categoría"
            value={categoriaPersonalizada}
            onChange={(e) => {
              setCategoriaPersonalizada(e.target.value)
              setErrorServidor(null)
            }}
            onBlur={() => handleBlur('categoria')}
            autoFocus
          />
        )}

        {mostrarError('categoria') && (
          <span className="modal__error" id="budget-cat-error">
            {errores.categoria}
          </span>
        )}
      </div>

      {/* Límite de gasto y Período en dos columnas */}
      <div className="modal__row">
        {/* Límite */}
        <div className="modal__field modal__field--half">
          <label className="modal__label" htmlFor="budget-limite">
            Límite ($ COP) <span className="modal__required">*</span>
          </label>
          <input
            id="budget-limite"
            className={`modal__input ${mostrarError('limite') ? 'modal__input--error' : ''}`}
            type="number"
            min="1"
            step="any"
            placeholder="Ej: 300000"
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            onBlur={() => handleBlur('limite')}
            aria-invalid={Boolean(mostrarError('limite'))}
            aria-describedby={mostrarError('limite') ? 'budget-limite-error' : undefined}
            required
          />
          {mostrarError('limite') && (
            <span className="modal__error" id="budget-limite-error">
              {errores.limite}
            </span>
          )}
        </div>

        {/* Mes y Año (Período) */}
        <div className="modal__field modal__field--half">
          <label className="modal__label" htmlFor="budget-mes">
            Período (Mes y año) <span className="modal__required">*</span>
          </label>
          <input
            id="budget-mes"
            className={`modal__input ${mostrarError('mes') ? 'modal__input--error' : ''}`}
            type="month"
            value={mes}
            onChange={(e) => {
              setMes(e.target.value)
              setErrorServidor(null)
            }}
            onBlur={() => handleBlur('mes')}
            aria-invalid={Boolean(mostrarError('mes'))}
            aria-describedby={mostrarError('mes') ? 'budget-mes-error' : undefined}
            required
          />
          {mostrarError('mes') && (
            <span className="modal__error" id="budget-mes-error">
              {errores.mes}
            </span>
          )}
        </div>
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
          {esEdicion ? 'Actualizar presupuesto' : 'Guardar presupuesto'}
        </button>
      </div>
    </form>
  )
}

/**
 * BudgetModal
 *
 * Contenedor modal para crear y editar presupuestos mensuales.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(datos: object) => { ok: boolean, error?: string }} props.onSave
 * @param {object|null} [props.presupuestoAEditar]
 * @param {string} [props.periodoPorDefecto]
 */
function BudgetModal({
  isOpen,
  onClose,
  onSave,
  presupuestoAEditar = null,
  periodoPorDefecto = '',
}) {
  if (!isOpen) return null

  const esEdicion = Boolean(presupuestoAEditar)
  const formKey = presupuestoAEditar
    ? `edit-budget-${presupuestoAEditar.id}`
    : `new-budget-${periodoPorDefecto}`

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="budget-modal-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="modal__header">
          <h2 className="modal__title" id="budget-modal-title">
            {esEdicion ? 'Editar presupuesto' : 'Nuevo presupuesto mensual'}
          </h2>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de presupuesto"
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

        {/* Formulario interno con reinicialización por key */}
        <BudgetFormInner
          key={formKey}
          presupuestoAEditar={presupuestoAEditar}
          periodoPorDefecto={periodoPorDefecto}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  )
}

export default BudgetModal
