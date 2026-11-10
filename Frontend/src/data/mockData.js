/**
 * data/mockData.js
 *
 * Datos simulados que se usarán durante el desarrollo mientras el backend
 * de Django REST Framework no esté disponible. Las páginas y componentes
 * consumirán estas colecciones en lugar de llamar a la API.
 *
 * Cuando el backend esté listo, estos datos se reemplazarán por llamadas
 * a services/api.js sin necesidad de modificar los componentes.
 */

/** Resumen financiero del mes actual. */
export const resumenMensual = {
  ingresos: 2450000,
  gastos: 1120000,
}

/**
 * Movimientos recientes.
 * Cada movimiento tiene un id, nombre, fecha, monto y tipo (ingreso/gasto).
 */
export const movimientos = [
  {
    id: 1,
    nombre: 'Nómina',
    fecha: new Date().toISOString(),
    monto: 1200000,
    tipo: 'ingreso',
    categoria: 'Salario',
  },
  {
    id: 2,
    nombre: 'Supermercado',
    fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    monto: 45000,
    tipo: 'gasto',
    categoria: 'Alimentación',
  },
  {
    id: 3,
    nombre: 'Cafetería',
    fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    monto: 4500,
    tipo: 'gasto',
    categoria: 'Alimentación',
  },
  {
    id: 4,
    nombre: 'Suscripciones',
    fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    monto: 15000,
    tipo: 'gasto',
    categoria: 'Entretenimiento',
  },
  {
    id: 5,
    nombre: 'Freelance',
    fecha: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    monto: 800000,
    tipo: 'ingreso',
    categoria: 'Trabajo independiente',
  },
  {
    id: 6,
    nombre: 'Transporte',
    fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    monto: 25000,
    tipo: 'gasto',
    categoria: 'Transporte',
  },
]

/**
 * Regla 50/30/20 — Presupuesto mensual.
 * Cada categoría indica:
 *  - nombre: etiqueta visible.
 *  - porcentaje: % recomendado del ingreso.
 *  - gastado: monto utilizado/ahorrado actualmente.
 *  - limite: monto objetivo según el porcentaje.
 */
export const regla503020 = [
  {
    id: 'necesidades',
    nombre: 'Necesidades',
    porcentaje: 50,
    gastado: 650000,
    limite: 1000000,
  },
  {
    id: 'deseos',
    nombre: 'Deseos',
    porcentaje: 30,
    gastado: 250000,
    limite: 600000,
  },
  {
    id: 'ahorro',
    nombre: 'Ahorro',
    porcentaje: 20,
    gastado: 300000,
    limite: 400000,
  },
]

/** @type {Array<object>} Categorías de ingreso y gasto. */
export const categorias = []

/** @type {Array<object>} Presupuestos por categoría. */
export const presupuestos = []

/** @type {Array<object>} Metas de ahorro. */
export const metasAhorro = []

export const mockData = {
  resumenMensual,
  movimientos,
  regla503020,
  categorias,
  presupuestos,
  metasAhorro,
}

export default mockData
