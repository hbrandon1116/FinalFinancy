import { obtenerClaveMes, formatearNombreMes } from './format'

/**
 * Mapeo de categorías conocidas a la regla 50/30/20.
 * Solo se clasifican las categorías explícitamente pertenecientes a una sección;
 * las demás permanecen sin clasificar.
 */
export const MAPEO_REGLA_503020 = {
  alimentación: 'necesidades',
  alimentacion: 'necesidades',
  transporte: 'necesidades',
  vivienda: 'necesidades',
  servicios: 'necesidades',
  salud: 'necesidades',
  educación: 'necesidades',
  educacion: 'necesidades',
  entretenimiento: 'deseos',
  'otros gastos': 'deseos',
}

/**
 * Calcula los límites de fecha (inicio y fin) para un tipo de período seleccionado.
 *
 * @param {string} tipoPeriodo - 'mes-actual' | 'mes-anterior' | 'ultimos-3-meses' | 'ultimos-6-meses' | 'anio-actual' | 'personalizado'
 * @param {string} [fechaInicioCustom] - 'YYYY-MM-DD'
 * @param {string} [fechaFinCustom] - 'YYYY-MM-DD'
 * @returns {{ inicio: Date, fin: Date, etiqueta: string }}
 */
export function calcularRangoFechas(tipoPeriodo, fechaInicioCustom, fechaFinCustom) {
  const ahora = new Date()
  let inicio
  let fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999)
  let etiqueta

  switch (tipoPeriodo) {
    case 'mes-anterior': {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1, 0, 0, 0, 0)
      fin = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59, 999)
      etiqueta = 'Mes anterior'
      break
    }
    case 'ultimos-3-meses': {
      // 3 meses calendario atrás desde el 1 del mes correspondiente
      inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 2, 1, 0, 0, 0, 0)
      etiqueta = 'Últimos 3 meses'
      break
    }
    case 'ultimos-6-meses': {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1, 0, 0, 0, 0)
      etiqueta = 'Últimos 6 meses'
      break
    }
    case 'anio-actual': {
      inicio = new Date(ahora.getFullYear(), 0, 1, 0, 0, 0, 0)
      etiqueta = `Año ${ahora.getFullYear()}`
      break
    }
    case 'personalizado': {
      if (fechaInicioCustom) {
        inicio = new Date(`${fechaInicioCustom}T00:00:00`)
      } else {
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0)
      }
      if (fechaFinCustom) {
        fin = new Date(`${fechaFinCustom}T23:59:59`)
      }
      etiqueta = 'Rango personalizado'
      break
    }
    case 'mes-actual':
    default: {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0)
      etiqueta = 'Mes actual'
      break
    }
  }

  return { inicio, fin, etiqueta }
}

/**
 * Filtra una lista de elementos (movimientos o aportes) dentro de un rango de fechas.
 *
 * @param {Array<object>} items
 * @param {Date} inicio
 * @param {Date} fin
 * @returns {Array<object>}
 */
export function filtrarPorRango(items, inicio, fin) {
  if (!items || !items.length) return []
  const timeInicio = inicio.getTime()
  const timeFin = fin.getTime()

  return items.filter((item) => {
    if (!item.fecha) return false
    const d = new Date(item.fecha)
    const time = d.getTime()
    return !Number.isNaN(time) && time >= timeInicio && time <= timeFin
  })
}

/**
 * Agrupa movimientos por mes para el gráfico comparativo de ingresos vs gastos.
 *
 * @param {Array<object>} movimientos
 * @param {Date} inicio
 * @param {Date} fin
 * @returns {Array<object>}
 */
export function agruparPorMes(movimientos, inicio, fin) {
  // Generar todos los meses en el rango
  const mesesMap = new Map()

  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), 1)
  const finMes = new Date(fin.getFullYear(), fin.getMonth(), 1)

  while (cursor <= finMes) {
    const clave = obtenerClaveMes(cursor)
    mesesMap.set(clave, {
      clave,
      nombreMes: formatearNombreMes(clave),
      nombreCorto: cursor.toLocaleDateString('es-CO', { month: 'short' }),
      anio: cursor.getFullYear(),
      ingresos: 0,
      gastos: 0,
      balance: 0,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  // Sumar movimientos a cada mes correspondiente
  movimientos.forEach((m) => {
    const clave = obtenerClaveMes(m.fecha)
    if (mesesMap.has(clave)) {
      const registro = mesesMap.get(clave)
      const valor = Math.abs(Number(m.valor ?? m.monto) || 0)
      if (m.tipo === 'ingreso') {
        registro.ingresos += valor
      } else {
        registro.gastos += valor
      }
      registro.balance = registro.ingresos - registro.gastos
    }
  })

  return Array.from(mesesMap.values())
}

/**
 * Agrupa gastos por categoría y calcula porcentajes relativos.
 *
 * @param {Array<object>} gastos
 * @returns {{ categorias: Array<object>, totalGastos: number }}
 */
export function agruparGastosPorCategoria(gastos) {
  const catMap = new Map()
  let totalGastos = 0

  gastos.forEach((g) => {
    const nombre = g.categoria || 'Sin categoría'
    const valor = Math.abs(Number(g.valor ?? g.monto) || 0)
    totalGastos += valor
    catMap.set(nombre, (catMap.get(nombre) || 0) + valor)
  })

  const categorias = Array.from(catMap.entries())
    .map(([nombre, valor]) => {
      const porcentaje = totalGastos > 0 ? Math.round((valor / totalGastos) * 100) : 0
      return {
        nombre,
        valor,
        porcentaje,
      }
    })
    .sort((a, b) => b.valor - a.valor) // Ordenar de mayor a menor gasto

  return { categorias, totalGastos }
}

/**
 * Calcula la evolución del balance en el tiempo.
 *
 * @param {Array<object>} movimientos
 * @param {Array<object>} datosMensuales
 * @returns {Array<object>}
 */
export function calcularEvolucionBalance(datosMensuales) {
  let acumulado = 0
  return datosMensuales.map((d) => {
    acumulado += d.balance
    return {
      ...d,
      balanceMes: d.balance,
      balanceAcumulado: acumulado,
    }
  })
}

/**
 * Analiza la regla 50/30/20 contra los ingresos, gastos y aportes reales del período.
 *
 * @param {Array<object>} gastos
 * @param {number} totalIngresos
 * @param {number} totalAhorrado
 * @returns {object}
 */
export function analizarRegla503020(gastos, totalIngresos, totalAhorrado) {
  let gastoNecesidades = 0
  let gastoDeseos = 0
  let noClasificado = 0

  gastos.forEach((g) => {
    const cat = (g.categoria || '').toLowerCase().trim()
    const valor = Math.abs(Number(g.valor ?? g.monto) || 0)
    const seccion = MAPEO_REGLA_503020[cat]

    if (seccion === 'necesidades') {
      gastoNecesidades += valor
    } else if (seccion === 'deseos') {
      gastoDeseos += valor
    } else {
      noClasificado += valor
    }
  })

  // La base de distribución es el total de ingresos.
  // Si los ingresos son 0, se usa la suma total de gastos + ahorro.
  const baseCalculo = totalIngresos > 0 ? totalIngresos : gastoNecesidades + gastoDeseos + totalAhorrado

  const pctNecesidades = baseCalculo > 0 ? Math.round((gastoNecesidades / baseCalculo) * 100) : 0
  const pctDeseos = baseCalculo > 0 ? Math.round((gastoDeseos / baseCalculo) * 100) : 0
  const pctAhorro = baseCalculo > 0 ? Math.round((totalAhorrado / baseCalculo) * 100) : 0

  const recomendadoNecesidades = Math.round(baseCalculo * 0.5)
  const recomendadoDeseos = Math.round(baseCalculo * 0.3)
  const recomendadoAhorro = Math.round(baseCalculo * 0.2)

  return {
    baseCalculo,
    noClasificado,
    secciones: [
      {
        id: 'necesidades',
        nombre: 'Necesidades',
        pctRecomendado: 50,
        pctReal: pctNecesidades,
        valorReal: gastoNecesidades,
        valorRecomendado: recomendadoNecesidades,
        diferenciaPct: pctNecesidades - 50,
        diferenciaValor: gastoNecesidades - recomendadoNecesidades,
        descripcion: 'Vivienda, alimentación, servicios, transporte, salud y educación',
      },
      {
        id: 'deseos',
        nombre: 'Deseos',
        pctRecomendado: 30,
        pctReal: pctDeseos,
        valorReal: gastoDeseos,
        valorRecomendado: recomendadoDeseos,
        diferenciaPct: pctDeseos - 30,
        diferenciaValor: gastoDeseos - recomendadoDeseos,
        descripcion: 'Entretenimiento, ocio y compras no esenciales',
      },
      {
        id: 'ahorro',
        nombre: 'Ahorro',
        pctRecomendado: 20,
        pctReal: pctAhorro,
        valorReal: totalAhorrado,
        valorRecomendado: recomendadoAhorro,
        diferenciaPct: pctAhorro - 20,
        diferenciaValor: totalAhorrado - recomendadoAhorro,
        descripcion: 'Aportes a metas de ahorro e inversiones',
      },
    ],
  }
}
