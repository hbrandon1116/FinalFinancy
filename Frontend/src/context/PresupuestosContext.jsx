import { useState, useMemo, useCallback } from 'react'
import { PresupuestosContext } from './presupuestosContextInstance'
import { presupuestos as mockPresupuestosIniciales } from '../data/mockData'
import { useMovimientos } from '../hooks/useMovimientos'
import { obtenerClaveMes } from '../utils/format'

/**
 * PresupuestosProvider
 *
 * Administra el estado global en memoria de los presupuestos mensuales.
 * Se integra directamente con los movimientos para calcular gastos y porcentajes
 * sin redundancia ni inconsistencias de datos.
 */
export function PresupuestosProvider({ children }) {
  const { movimientos, categoriasBase, categoriasDisponibles } = useMovimientos()

  const [presupuestos, setPresupuestos] = useState(() => [...mockPresupuestosIniciales])
  const [periodoActivo, setPeriodoActivo] = useState(() => obtenerClaveMes(new Date()))

  /**
   * Agrega un nuevo presupuesto mensual.
   * Valida que no exista ya un presupuesto para la misma categoría y período.
   *
   * @param {object} nuevoPresupuesto
   * @param {string} nuevoPresupuesto.categoria
   * @param {number|string} nuevoPresupuesto.limite
   * @param {string} nuevoPresupuesto.mes - Formato 'YYYY-MM'
   * @returns {{ ok: boolean, error?: string, presupuesto?: object }}
   */
  const agregarPresupuesto = useCallback(
    ({ categoria, limite, mes }) => {
      const catNormalizada = categoria.trim()
      const mesNormalizado = mes.trim()
      const limiteNumerico = Math.abs(Number(limite) || 0)

      // Comprobar duplicados
      const existe = presupuestos.some(
        (p) =>
          p.mes === mesNormalizado &&
          p.categoria.toLowerCase() === catNormalizada.toLowerCase(),
      )

      if (existe) {
        return {
          ok: false,
          error: `Ya existe un presupuesto para la categoría "${catNormalizada}" en este período.`,
        }
      }

      const item = {
        id: Date.now(),
        categoria: catNormalizada,
        limite: limiteNumerico,
        mes: mesNormalizado,
      }

      setPresupuestos((prev) => [item, ...prev])
      return { ok: true, presupuesto: item }
    },
    [presupuestos],
  )

  /**
   * Modifica el límite o categoría de un presupuesto existente.
   *
   * @param {number|string} id
   * @param {object} datosActualizados
   * @returns {{ ok: boolean, error?: string }}
   */
  const editarPresupuesto = useCallback(
    (id, { limite, categoria, mes }) => {
      const limiteNumerico = Math.abs(Number(limite) || 0)
      const catNormalizada = categoria ? categoria.trim() : null
      const mesNormalizado = mes ? mes.trim() : null

      // Validar duplicados si se modifica categoría o mes
      if (catNormalizada || mesNormalizado) {
        const presActual = presupuestos.find((p) => p.id === id)
        const catFinal = catNormalizada || presActual?.categoria || ''
        const mesFinal = mesNormalizado || presActual?.mes || ''

        const existeDuplicado = presupuestos.some(
          (p) =>
            p.id !== id &&
            p.mes === mesFinal &&
            p.categoria.toLowerCase() === catFinal.toLowerCase(),
        )

        if (existeDuplicado) {
          return {
            ok: false,
            error: `Ya existe otro presupuesto para "${catFinal}" en el período seleccionado.`,
          }
        }
      }

      setPresupuestos((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          return {
            ...p,
            limite: limiteNumerico > 0 ? limiteNumerico : p.limite,
            categoria: catNormalizada || p.categoria,
            mes: mesNormalizado || p.mes,
          }
        }),
      )

      return { ok: true }
    },
    [presupuestos],
  )

  /**
   * Elimina un presupuesto por su ID.
   * @param {number|string} id
   */
  const eliminarPresupuesto = useCallback((id) => {
    setPresupuestos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  /**
   * Enriquecimiento dinámico de los presupuestos del período activo con:
   * - Dinero gastado (sumado desde los movimientos de gasto del mismo mes y categoría)
   * - Dinero restante
   * - Porcentaje de consumo
   * - Estado visual: 'normal' (<80%), 'alerta' (80%-100%), 'superado' (>100%)
   */
  const presupuestosDelPeriodo = useMemo(() => {
    // Filtrar presupuestos del mes activo
    const listaMes = presupuestos.filter((p) => p.mes === periodoActivo)

    // Filtrar movimientos del mes activo que sean gastos
    const gastosMes = movimientos.filter((m) => {
      if (m.tipo !== 'gasto') return false
      const claveMes = obtenerClaveMes(m.fecha)
      return claveMes === periodoActivo
    })

    // Calcular el acumulado por categoría de los gastos del mes
    const gastosPorCategoria = new Map()
    gastosMes.forEach((m) => {
      const catKey = (m.categoria || '').toLowerCase().trim()
      const monto = Number(m.valor ?? m.monto) || 0
      gastosPorCategoria.set(catKey, (gastosPorCategoria.get(catKey) || 0) + monto)
    })

    return listaMes.map((p) => {
      const catKey = (p.categoria || '').toLowerCase().trim()
      const gastado = gastosPorCategoria.get(catKey) || 0
      const limite = Number(p.limite) || 0
      const restante = Math.max(0, limite - gastado)
      const excedidoPor = Math.max(0, gastado - limite)
      const porcentaje = limite > 0 ? Math.round((gastado / limite) * 100) : 0

      let estado = 'normal'
      if (porcentaje > 100) {
        estado = 'superado'
      } else if (porcentaje >= 80) {
        estado = 'alerta'
      }

      return {
        ...p,
        gastado,
        restante,
        excedidoPor,
        porcentaje,
        estado,
      }
    })
  }, [presupuestos, periodoActivo, movimientos])

  /**
   * Resumen general del período seleccionado:
   * Total presupuestado, total gastado y dinero disponible.
   */
  const resumenPeriodo = useMemo(() => {
    let totalPresupuestado = 0
    let totalGastado = 0

    presupuestosDelPeriodo.forEach((p) => {
      totalPresupuestado += p.limite
      totalGastado += p.gastado
    })

    const disponible = totalPresupuestado - totalGastado
    const porcentajeGlobal =
      totalPresupuestado > 0 ? Math.round((totalGastado / totalPresupuestado) * 100) : 0

    return {
      totalPresupuestado,
      totalGastado,
      totalDisponible: disponible,
      porcentajeGlobal,
    }
  }, [presupuestosDelPeriodo])

  /**
   * Lista de categorías de gasto sugeridas (de las bases y de movimientos).
   */
  const categoriasGastoDisponibles = useMemo(() => {
    const nombres = new Set()
    categoriasBase
      .filter((c) => c.tipo === 'gasto')
      .forEach((c) => nombres.add(c.nombre))

    categoriasDisponibles.forEach((cat) => {
      nombres.add(cat)
    })

    return Array.from(nombres)
  }, [categoriasBase, categoriasDisponibles])

  const value = useMemo(
    () => ({
      presupuestos,
      presupuestosDelPeriodo,
      resumenPeriodo,
      periodoActivo,
      setPeriodoActivo,
      agregarPresupuesto,
      editarPresupuesto,
      eliminarPresupuesto,
      categoriasGastoDisponibles,
    }),
    [
      presupuestos,
      presupuestosDelPeriodo,
      resumenPeriodo,
      periodoActivo,
      agregarPresupuesto,
      editarPresupuesto,
      eliminarPresupuesto,
      categoriasGastoDisponibles,
    ],
  )

  return (
    <PresupuestosContext.Provider value={value}>
      {children}
    </PresupuestosContext.Provider>
  )
}

export default PresupuestosProvider
