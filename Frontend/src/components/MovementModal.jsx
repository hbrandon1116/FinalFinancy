import { useState, useMemo } from 'react'
import { aFechaInput } from '../utils/format'
import { useMovimientos } from '../hooks/useMovimientos'

/**
 * Formulario interno para crear o editar un movimiento.
 * Al montarse con una 'key' única se inicializa de forma limpia y directa
 * sin requerir useEffect ni provocar renders cascada.
 */
function MovementFormInner({ movimientoAEditar, onSave, onClose }) {
  const { categoriasBase, categoriasDisponibles } = useMovimientos()
  const esEdicion = Boolean(movimientoAEditar)

  const [tipo, setTipo] = useState(() => movimientoAEditar?.tipo || 'gasto')
  const [descripcion, setDescripcion] = useState(
    () => movimientoAEditar?.descripcion || movimientoAEditar?.nombre || '',
  )
  const [valor, setValor] = useState(() =>
    movimientoAEditar ? String(movimientoAEditar.valor ?? movimientoAEditar.monto ?? '') : '',
  )
  const [fecha, setFecha] = useState(() =>
    movimientoAEditar ? aFechaInput(movimientoAEditar.fecha) : aFechaInput(new Date()),
  )
  const [categoria, setCategoria] = useState(() => movimientoAEditar?.categoria || '')
  const [categoriaPersonalizada, setCategoriaPersonalizada] = useState('')

  const [touched, setTouched] = useState({})
  const [submitIntentado, setSubmitIntentado] = useState(false)

  // Obtener sugerencias de categorías según el tipo seleccionado
  const categoriasSugeridas = useMemo(() => {
    const filtradas = categoriasBase.filter((c) => c.tipo === tipo).map((c) => c.nombre)
    const combinadas = new Set(filtradas)
    categoriasDisponibles.forEach((cat) => combinadas.add(cat))
    return Array.from(combinadas)
  }, [tipo, categoriasBase, categoriasDisponibles])

  // Validaciones
  const errores = useMemo(() => {
    const errs = {}

    // 1. Descripción
    if (!descripcion.trim()) {
      errs.descripcion = 'La descripción es obligatoria.'
    } else if (descripcion.trim().length < 2) {
      errs.descripcion = 'La descripción debe tener al menos 2 caracteres.'
    }

    // 2. Valor
    const numValor = Number(valor)
    if (valor === '' || valor === null || valor === undefined) {
      errs.valor = 'El valor es obligatorio.'
    } else if (Number.isNaN(numValor)) {
      errs.valor = 'Ingresa un número válido.'
    } else if (numValor <= 0) {
      errs.valor = 'El valor debe ser mayor a cero.'
    }

    // 3. Fecha
    if (!fecha || !fecha.trim()) {
      errs.fecha = 'La fecha es obligatoria.'
    } else {
      const fechaObj = new Date(`${fecha}T12:00:00`)
      if (Number.isNaN(fechaObj.getTime())) {
        errs.fecha = 'Ingresa una fecha válida.'
      }
    }

    // 4. Categoría
    const catFinal = categoria === '__otra__' ? categoriaPersonalizada.trim() : categoria.trim()
    if (!catFinal) {
      errs.categoria = 'Selecciona o escribe una categoría.'
    }

    return errs
  }, [descripcion, valor, fecha, categoria, categoriaPersonalizada])

  const tieneErrores = Object.keys(errores).length > 0

  const handleBlur = (campo) => {
    setTouched((prev) => ({ ...prev, [campo]: true }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitIntentado(true)

    if (tieneErrores) {
      return
    }

    const catFinal = categoria === '__otra__' ? categoriaPersonalizada.trim() : categoria.trim()
    const numValor = Math.abs(Number(valor))
    const fechaISO = new Date(`${fecha}T12:00:00`).toISOString()

    const datosGuardar = {
      tipo,
      descripcion: descripcion.trim(),
      nombre: descripcion.trim(),
      valor: numValor,
      monto: numValor,
      categoria: catFinal,
      fecha: fechaISO,
    }

    if (onSave) {
      onSave(datosGuardar)
    }

    onClose()
  }

  const mostrarError = (campo) => (touched[campo] || submitIntentado) && errores[campo]

  return (
    <form className="modal__form" onSubmit={handleSubmit} noValidate>
      {/* Tipo de movimiento */}
      <div className="modal__field">
        <label className="modal__label">Tipo de movimiento</label>
        <div className="modal__toggle-group" role="radiogroup" aria-label="Tipo de movimiento">
          <button
            type="button"
            role="radio"
            aria-checked={tipo === 'gasto'}
            className={`modal__toggle ${tipo === 'gasto' ? 'modal__toggle--active modal__toggle--gasto' : ''}`}
            onClick={() => setTipo('gasto')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="7 13 12 18 17 13" />
              <line x1="12" y1="18" x2="12" y2="6" />
            </svg>
            <span>Gasto</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={tipo === 'ingreso'}
            className={`modal__toggle ${tipo === 'ingreso' ? 'modal__toggle--active modal__toggle--ingreso' : ''}`}
            onClick={() => setTipo('ingreso')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="17 11 12 6 7 11" />
              <line x1="12" y1="6" x2="12" y2="18" />
            </svg>
            <span>Ingreso</span>
          </button>
        </div>
      </div>

      {/* Descripción */}
      <div className="modal__field">
        <label className="modal__label" htmlFor="mov-descripcion">
          Descripción <span className="modal__required">*</span>
        </label>
        <input
          id="mov-descripcion"
          className={`modal__input ${mostrarError('descripcion') ? 'modal__input--error' : ''}`}
          type="text"
          placeholder="Ej: Supermercado, Nómina, Alquiler..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          onBlur={() => handleBlur('descripcion')}
          aria-invalid={Boolean(mostrarError('descripcion'))}
          aria-describedby={mostrarError('descripcion') ? 'mov-descripcion-error' : undefined}
          required
        />
        {mostrarError('descripcion') && (
          <span className="modal__error" id="mov-descripcion-error">
            {errores.descripcion}
          </span>
        )}
      </div>

      {/* Valor y Fecha en dos columnas */}
      <div className="modal__row">
        {/* Valor */}
        <div className="modal__field modal__field--half">
          <label className="modal__label" htmlFor="mov-valor">
            Valor ($ COP) <span className="modal__required">*</span>
          </label>
          <input
            id="mov-valor"
            className={`modal__input ${mostrarError('valor') ? 'modal__input--error' : ''}`}
            type="number"
            min="1"
            step="any"
            placeholder="0"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            onBlur={() => handleBlur('valor')}
            aria-invalid={Boolean(mostrarError('valor'))}
            aria-describedby={mostrarError('valor') ? 'mov-valor-error' : undefined}
            required
          />
          {mostrarError('valor') && (
            <span className="modal__error" id="mov-valor-error">
              {errores.valor}
            </span>
          )}
        </div>

        {/* Fecha */}
        <div className="modal__field modal__field--half">
          <label className="modal__label" htmlFor="mov-fecha">
            Fecha <span className="modal__required">*</span>
          </label>
          <input
            id="mov-fecha"
            className={`modal__input ${mostrarError('fecha') ? 'modal__input--error' : ''}`}
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            onBlur={() => handleBlur('fecha')}
            aria-invalid={Boolean(mostrarError('fecha'))}
            aria-describedby={mostrarError('fecha') ? 'mov-fecha-error' : undefined}
            required
          />
          {mostrarError('fecha') && (
            <span className="modal__error" id="mov-fecha-error">
              {errores.fecha}
            </span>
          )}
        </div>
      </div>

      {/* Categoría */}
      <div className="modal__field">
        <label className="modal__label" htmlFor="mov-categoria">
          Categoría <span className="modal__required">*</span>
        </label>
        <select
          id="mov-categoria"
          className={`modal__input modal__select ${mostrarError('categoria') ? 'modal__input--error' : ''}`}
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          onBlur={() => handleBlur('categoria')}
          aria-invalid={Boolean(mostrarError('categoria'))}
          aria-describedby={mostrarError('categoria') ? 'mov-categoria-error' : undefined}
        >
          <option value="">Selecciona una categoría</option>
          {categoriasSugeridas.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
          <option value="__otra__">+ Otra (personalizada)</option>
        </select>

        {categoria === '__otra__' && (
          <input
            type="text"
            className={`modal__input modal__input--custom-cat ${mostrarError('categoria') ? 'modal__input--error' : ''}`}
            placeholder="Escribe el nombre de la categoría"
            value={categoriaPersonalizada}
            onChange={(e) => setCategoriaPersonalizada(e.target.value)}
            onBlur={() => handleBlur('categoria')}
            autoFocus
          />
        )}

        {mostrarError('categoria') && (
          <span className="modal__error" id="mov-categoria-error">
            {errores.categoria}
          </span>
        )}
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
          {esEdicion ? 'Actualizar movimiento' : 'Guardar movimiento'}
        </button>
      </div>
    </form>
  )
}

/**
 * MovementModal
 *
 * Contenedor de diálogo para registrar y editar movimientos.
 */
function MovementModal({ isOpen, onClose, onSave, movimientoAEditar = null }) {
  if (!isOpen) return null

  const esEdicion = Boolean(movimientoAEditar)
  const formKey = movimientoAEditar ? `edit-${movimientoAEditar.id}` : 'nuevo-movimiento'

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="movement-modal-title"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del modal */}
        <div className="modal__header">
          <h2 className="modal__title" id="movement-modal-title">
            {esEdicion ? 'Editar movimiento' : 'Nuevo movimiento'}
          </h2>
          <button
            className="modal__close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
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

        {/* Formulario con key para reinicialización limpia de estado */}
        <MovementFormInner
          key={formKey}
          movimientoAEditar={movimientoAEditar}
          onSave={onSave}
          onClose={onClose}
        />
      </div>
    </div>
  )
}

export default MovementModal
