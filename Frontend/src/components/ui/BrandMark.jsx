/**
 * BrandMark
 *
 * Isotipo de FinalFinancy basado en el símbolo de dólar ($).
 * Se dibuja con SVG inline para no añadir dependencias al proyecto.
 *
 * @param {object} props
 * @param {number} props.size - Tamaño del isotipo en píxeles.
 * @param {string} props.className - Clase opcional para el SVG.
 */
function BrandMark({ size = 28, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <line x1="12" y1="2" x2="12" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export default BrandMark
