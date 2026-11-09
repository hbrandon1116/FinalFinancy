/**
 * data/mockData.js
 *
 * Datos simulados que se usarán durante el desarrollo mientras el backend
 * de Django REST Framework no esté disponible. Las páginas y componentes
 * consumirán estas colecciones en lugar de llamar a la API.
 *
 * Estructura vacía a propósito: se completa por sprint a medida que se
 * implementen movimientos, categorías, presupuestos y metas de ahorro.
 */
export const mockData = {
  /** @type {Array<object>} Categorías de ingreso y gasto. */
  categorias: [],

  /** @type {Array<object>} Movimientos (ingresos y gastos). */
  movimientos: [],

  /** @type {Array<object>} Presupuestos por categoría. */
  presupuestos: [],

  /** @type {Array<object>} Metas de ahorro. */
  metasAhorro: [],
}

export default mockData