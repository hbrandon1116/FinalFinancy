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

import { obtenerClaveMes } from '../utils/format'

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

const claveMesActual = obtenerClaveMes(new Date(ahora))
const claveMesAnterior = obtenerClaveMes(new Date(ahora - 30 * unDia))

/**
 * Presupuestos mensuales iniciales por categoría.
 * Permiten evaluar los estados: normal (<80%), alerta (>=80%) y superado (>100%).
 */
export const presupuestos = [
  {
    id: 1,
    categoria: 'Alimentación',
    limite: 300000,
    mes: claveMesActual,
  },
  {
    id: 2,
    categoria: 'Transporte',
    limite: 60000,
    mes: claveMesActual,
  },
  {
    id: 3,
    categoria: 'Entretenimiento',
    limite: 50000,
    mes: claveMesActual,
  },
  {
    id: 4,
    categoria: 'Servicios',
    limite: 120000,
    mes: claveMesActual,
  },
  {
    id: 5,
    categoria: 'Salud',
    limite: 100000,
    mes: claveMesActual,
  },
  // Presupuestos del mes anterior
  {
    id: 6,
    categoria: 'Vivienda',
    limite: 700000,
    mes: claveMesAnterior,
  },
  {
    id: 7,
    categoria: 'Alimentación',
    limite: 200000,
    mes: claveMesAnterior,
  },
]

/**
 * Metas de ahorro iniciales con historial de aportes.
 * Ilustran los tres estados posibles: en-progreso, completada y vencida.
 */
export const metasAhorro = [
  {
    id: 1,
    nombre: 'Fondo de Emergencia',
    descripcion: 'Ahorro para cubrir 3 meses de gastos esenciales ante imprevistos.',
    objetivo: 3000000,
    ahorrado: 1800000,
    fechaLimite: new Date(ahora + 90 * unDia).toISOString(),
    aportes: [
      {
        id: 101,
        valor: 1000000,
        fecha: new Date(ahora - 30 * unDia).toISOString(),
        descripcion: 'Aporte inicial apertura de fondo',
      },
      {
        id: 102,
        valor: 800000,
        fecha: new Date(ahora - 10 * unDia).toISOString(),
        descripcion: 'Ahorro segunda quincena',
      },
    ],
  },
  {
    id: 2,
    nombre: 'Nuevo Computador Portátil',
    descripcion: 'Equipo de trabajo para desarrollo de software y diseño.',
    objetivo: 2500000,
    ahorrado: 2500000,
    fechaLimite: new Date(ahora + 30 * unDia).toISOString(),
    aportes: [
      {
        id: 201,
        valor: 1500000,
        fecha: new Date(ahora - 45 * unDia).toISOString(),
        descripcion: 'Aporte quincenal programado',
      },
      {
        id: 202,
        valor: 1000000,
        fecha: new Date(ahora - 5 * unDia).toISOString(),
        descripcion: 'Bono extraordinario de fin de proyecto',
      },
    ],
  },
  {
    id: 3,
    nombre: 'Curso Especialización Cloud',
    descripcion: 'Certificación profesional en infraestructura y arquitectura.',
    objetivo: 1200000,
    ahorrado: 600000,
    fechaLimite: new Date(ahora - 15 * unDia).toISOString(),
    aportes: [
      {
        id: 301,
        valor: 600000,
        fecha: new Date(ahora - 40 * unDia).toISOString(),
        descripcion: 'Primer abono para la meta',
      },
    ],
  },
]

export const mockData = {
  resumenMensual,
  movimientos,
  regla503020,
  categorias,
  presupuestos,
  metasAhorro,
}

export default mockData
