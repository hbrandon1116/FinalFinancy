import { useState, useMemo, useCallback } from 'react'
import { MovimientosContext } from './movimientosContextInstance'
import { movimientos as mockMovimientosIniciales, categorias as mockCategorias } from '../data/mockData'
import { obtenerClaveMes } from '../utils/format'

/**
 * MovimientosProvider
 *
 * Administra el estado global en memoria de los movimientos de la aplicación.
 * Permite que tanto el Dashboard como el módulo de Movimientos compartan
 * la misma fuente de verdad sin inconsistencias ni persistencia backend.
 */
export function MovimientosProvider({ children }) {
  const [movimientos, setMovimientos] = useState(() => [...mockMovimientosIniciales])

  /**
   * Agrega un nuevo movimiento al inicio de la lista.
   * @param {object} nuevo
   */
  const agregarMovimiento = useCallback((nuevo) => {
    const valorNumerico = Math.abs(Number(nuevo.valor ?? nuevo.monto) || 0)
    const descripcion = (nuevo.descripcion || nuevo.nombre || '').trim()
    const categoria = (nuevo.categoria || 'Varios').trim()
    const tipo = nuevo.tipo === 'ingreso' ? 'ingreso' : 'gasto'
    const fecha = nuevo.fecha || new Date().toISOString()

    const item = {
      id: Date.now(),
      nombre: descripcion,
      descripcion,
      valor: valorNumerico,
      monto: valorNumerico,
      tipo,
      categoria,
      fecha,
    }

    setMovimientos((prev) => [item, ...prev])
    return item
  }, [])

  /**
   * Modifica un movimiento existente por su ID.
   * @param {number|string} id
   * @param {object} datosActualizados
   */
  const editarMovimiento = useCallback((id, datosActualizados) => {
    setMovimientos((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m

        const valorNumerico = Math.abs(
          Number(datosActualizados.valor ?? datosActualizados.monto ?? m.valor) || 0,
        )
        const descripcion = (
          datosActualizados.descripcion ??
          datosActualizados.nombre ??
          m.descripcion
        ).trim()
        const categoria = (datosActualizados.categoria ?? m.categoria).trim()
        const tipo = datosActualizados.tipo ?? m.tipo
        const fecha = datosActualizados.fecha ?? m.fecha

        return {
          ...m,
          nombre: descripcion,
          descripcion,
          valor: valorNumerico,
          monto: valorNumerico,
          tipo,
          categoria,
          fecha,
        }
      }),
    )
  }, [])

  /**
   * Elimina un movimiento por su ID.
   * @param {number|string} id
   */
  const eliminarMovimiento = useCallback((id) => {
    setMovimientos((prev) => prev.filter((m) => m.id !== id))
  }, [])

  /**
   * Calcula el resumen financiero (ingresos, gastos y balance) del mes actual
   * a partir de la lista activa de movimientos.
   */
  const resumenMensual = useMemo(() => {
    const mesActualClave = obtenerClaveMes(new Date())

    let ingresos = 0
    let gastos = 0

    movimientos.forEach((m) => {
      const mesItem = obtenerClaveMes(m.fecha)
      if (mesItem === mesActualClave) {
        const monto = Number(m.valor ?? m.monto) || 0
        if (m.tipo === 'ingreso') {
          ingresos += monto
        } else {
          gastos += monto
        }
      }
    })

    return {
      ingresos,
      gastos,
      balance: ingresos - gastos,
    }
  }, [movimientos])

  /**
   * Obtiene la lista unificada de categorías disponibles
   * (categorías predeterminadas + creadas en movimientos).
   */
  const categoriasDisponibles = useMemo(() => {
    const nombresCategorias = new Set(mockCategorias.map((c) => c.nombre))
    movimientos.forEach((m) => {
      if (m.categoria) nombresCategorias.add(m.categoria)
    })
    return Array.from(nombresCategorias)
  }, [movimientos])

  const value = useMemo(
    () => ({
      movimientos,
      agregarMovimiento,
      editarMovimiento,
      eliminarMovimiento,
      resumenMensual,
      categoriasDisponibles,
      categoriasBase: mockCategorias,
    }),
    [
      movimientos,
      agregarMovimiento,
      editarMovimiento,
      eliminarMovimiento,
      resumenMensual,
      categoriasDisponibles,
    ],
  )

  return (
    <MovimientosContext.Provider value={value}>
      {children}
    </MovimientosContext.Provider>
  )
}

export default MovimientosProvider
