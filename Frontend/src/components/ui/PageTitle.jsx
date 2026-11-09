/**
 * PageTitle
 *
 * Encabezado principal reutilizable de cada página.
 * Evita repetir el marcado del <h1> en todas las páginas de la aplicación.
 *
 * @param {object} props
 * @param {string} props.title  Texto visible del encabezado.
 * @param {string} [props.subtitle] Texto opcional de apoyo.
 * @returns {JSX.Element}
 */
function PageTitle({ title, subtitle }) {
  return (
    <header className="page-title">
      <h1 className="page-title__title">{title}</h1>
      {subtitle ? <p className="page-title__subtitle">{subtitle}</p> : null}
    </header>
  )
}

export default PageTitle