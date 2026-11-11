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

const ahora = Date.now()
const unDia = 24 * 60 * 60 * 1000

/**
 * Movimientos mock iniciales.
 * Cada movimiento cuenta con id, descripcion, nombre, fecha, valor, monto, tipo y categoria.
 */
export const movimientos = [
  {
    id: 1,
    nombre: 'Nómina principal',
    descripcion: 'Nómina principal',
    fecha: new Date(ahora).toISOString(),
    monto: 1200000,
    valor: 1200000,
    tipo: 'ingreso',
    categoria: 'Salario',
  },
  {
    id: 2,
    nombre: 'Supermercado Éxito',
    descripcion: 'Supermercado Éxito',
    fecha: new Date(ahora - 1 * unDia).toISOString(),
    monto: 145000,
    valor: 145000,
    tipo: 'gasto',
    categoria: 'Alimentación',
  },
  {
    id: 3,
    nombre: 'Cafetería Juan Valdez',
    descripcion: 'Cafetería Juan Valdez',
    fecha: new Date(ahora - 2 * unDia).toISOString(),
    monto: 18500,
    valor: 18500,
    tipo: 'gasto',
    categoria: 'Alimentación',
  },
  {
    id: 4,
    nombre: 'Suscripción Netflix y Spotify',
    descripcion: 'Suscripción Netflix y Spotify',
    fecha: new Date(ahora - 3 * unDia).toISOString(),
    monto: 65000,
    valor: 65000,
    tipo: 'gasto',
    categoria: 'Entretenimiento',
  },
  {
    id: 5,
    nombre: 'Proyecto Freelance Frontend',
    descripcion: 'Proyecto Freelance Frontend',
    fecha: new Date(ahora - 4 * unDia).toISOString(),
    monto: 850000,
    valor: 850000,
    tipo: 'ingreso',
    categoria: 'Trabajo independiente',
  },
  {
    id: 6,
    nombre: 'Recarga tarjeta transporte',
    descripcion: 'Recarga tarjeta transporte',
    fecha: new Date(ahora - 5 * unDia).toISOString(),
    monto: 50000,
    valor: 50000,
    tipo: 'gasto',
    categoria: 'Transporte',
  },
  {
    id: 7,
    nombre: 'Servicio de Internet y telefonía',
    descripcion: 'Servicio de Internet y telefonía',
    fecha: new Date(ahora - 8 * unDia).toISOString(),
    monto: 95000,
    valor: 95000,
    tipo: 'gasto',
    categoria: 'Servicios',
  },
  {
    id: 8,
    nombre: 'Clase particular de inglés',
    descripcion: 'Clase particular de inglés',
    fecha: new Date(ahora - 12 * unDia).toISOString(),
    monto: 120000,
    valor: 120000,
    tipo: 'ingreso',
    categoria: 'Trabajo independiente',
  },
  {
    id: 9,
    nombre: 'Farmacia medicamentos',
    descripcion: 'Farmacia medicamentos',
    fecha: new Date(ahora - 15 * unDia).toISOString(),
    monto: 48000,
    valor: 48000,
    tipo: 'gasto',
    categoria: 'Salud',
  },
  // Movimientos de meses anteriores para validar filtros de período
  {
    id: 10,
    nombre: 'Pago de alquiler mes anterior',
    descripcion: 'Pago de alquiler mes anterior',
    fecha: new Date(ahora - 35 * unDia).toISOString(),
    monto: 650000,
    valor: 650000,
    tipo: 'gasto',
    categoria: 'Vivienda',
  },
  {
    id: 11,
    nombre: 'Bono por desempeño trimestral',
    descripcion: 'Bono por desempeño trimestral',
    fecha: new Date(ahora - 38 * unDia).toISOString(),
    monto: 500000,
    valor: 500000,
    tipo: 'ingreso',
    categoria: 'Salario',
  },
  {
    id: 12,
    nombre: 'Cena restaurante aniversario',
    descripcion: 'Cena restaurante aniversario',
    fecha: new Date(ahora - 42 * unDia).toISOString(),
    monto: 110000,
    valor: 110000,
    tipo: 'gasto',
    categoria: 'Alimentación',
  },
  {
    id: 13,
    nombre: 'Rendimientos cuenta de inversión',
    descripcion: 'Rendimientos cuenta de inversión',
    fecha: new Date(ahora - 65 * unDia).toISOString(),
    monto: 75000,
    valor: 75000,
    tipo: 'ingreso',
    categoria: 'Inversiones',
  },
]

/** Resumen financiero del mes actual (base inicial). */
export const resumenMensual = {
  ingresos: 2450000,
  gastos: 1120000,
}

/**
 * Regla 50/30/20 — Presupuesto mensual.
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

/** Categorías sugeridas para ingresos y gastos. */
export const categorias = [
  { id: 'salario', nombre: 'Salario', tipo: 'ingreso' },
  { id: 'freelance', nombre: 'Trabajo independiente', tipo: 'ingreso' },
  { id: 'inversiones', nombre: 'Inversiones', tipo: 'ingreso' },
  { id: 'ventas', nombre: 'Ventas', tipo: 'ingreso' },
  { id: 'otros-ingresos', nombre: 'Otros ingresos', tipo: 'ingreso' },
  { id: 'alimentacion', nombre: 'Alimentación', tipo: 'gasto' },
  { id: 'transporte', nombre: 'Transporte', tipo: 'gasto' },
  { id: 'vivienda', nombre: 'Vivienda', tipo: 'gasto' },
  { id: 'servicios', nombre: 'Servicios', tipo: 'gasto' },
  { id: 'entretenimiento', nombre: 'Entretenimiento', tipo: 'gasto' },
  { id: 'salud', nombre: 'Salud', tipo: 'gasto' },
  { id: 'educacion', nombre: 'Educación', tipo: 'gasto' },
  { id: 'otros-gastos', nombre: 'Otros gastos', tipo: 'gasto' },
]

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
