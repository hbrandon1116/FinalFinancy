import { useState, useMemo, useCallback } from 'react'
import { AhorroContext } from './ahorroContextInstance'
import { metasAhorro as mockMetasIniciales } from '../data/mockData'

/**
 * AhorroProvider
 *
 * Administra el estado global en memoria de las metas de ahorro y sus aportes.
 * Permite crear metas, registrar aportes, editar, eliminar y calcular métricas de progreso.
 */
export function AhorroProvider({ children }) {
  const [metas, setMetas] = useState(() => [...mockMetasIniciales])

  /**
   * Crea una nueva meta de ahorro.
   *
   * @param {object} nueva
   * @param {string} nueva.nombre
   * @param {number|string} nueva.objetivo
   * @param {string} nueva.fechaLimite
   * @param {string} [nueva.descripcion]
   * @returns {{ ok: boolean, error?: string, meta?: object }}
   */
  const crearMeta = useCallback(({ nombre, objetivo, fechaLimite, descripcion = '' }) => {
    const nombreNormalizado = (nombre || '').trim()
    const objetivoNumerico = Math.abs(Number(objetivo) || 0)
    const descNormalizada = (descripcion || '').trim()

    if (!nombreNormalizado) {
      return { ok: false, error: 'El nombre de la meta es obligatorio.' }
    }
    if (objetivoNumerico <= 0) {
      return { ok: false, error: 'El monto objetivo debe ser mayor a cero.' }
    }
    if (!fechaLimite) {
      return { ok: false, error: 'La fecha límite es obligatoria.' }
    }

    const item = {
      id: Date.now(),
      nombre: nombreNormalizado,
      descripcion: descNormalizada,
      objetivo: objetivoNumerico,
      ahorrado: 0,
      fechaLimite,
      aportes: [],
    }

    setMetas((prev) => [item, ...prev])
    return { ok: true, meta: item }
  }, [])

  /**
   * Modifica una meta de ahorro existente.
   *
   * @param {number|string} id
   * @param {object} datosActualizados
   * @returns {{ ok: boolean, error?: string }}
   */
  const editarMeta = useCallback((id, { nombre, objetivo, fechaLimite, descripcion = '' }) => {
    const nombreNormalizado = (nombre || '').trim()
    const objetivoNumerico = Math.abs(Number(objetivo) || 0)
    const descNormalizada = (descripcion || '').trim()

    if (!nombreNormalizado) {
      return { ok: false, error: 'El nombre de la meta es obligatorio.' }
    }
    if (objetivoNumerico <= 0) {
      return { ok: false, error: 'El monto objetivo debe ser mayor a cero.' }
    }

    setMetas((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m
        return {
          ...m,
          nombre: nombreNormalizado,
          objetivo: objetivoNumerico,
          fechaLimite: fechaLimite || m.fechaLimite,
          descripcion: descNormalizada,
        }
      }),
    )

    return { ok: true }
  }, [])

  /**
   * Elimina una meta de ahorro por su ID.
   * @param {number|string} id
   */
  const eliminarMeta = useCallback((id) => {
    setMetas((prev) => prev.filter((m) => m.id !== id))
  }, [])

  /**
   * Registra un nuevo aporte a una meta existente.
   *
   * @param {number|string} metaId
   * @param {object} aporte
   * @param {number|string} aporte.valor
   * @param {string} [aporte.fecha]
   * @param {string} [aporte.descripcion]
   * @returns {{ ok: boolean, error?: string, aporte?: object }}
   */
  const registrarAporte = useCallback((metaId, { valor, fecha, descripcion = '' }) => {
    const valorNumerico = Number(valor)
    if (Number.isNaN(valorNumerico) || valorNumerico <= 0) {
      return { ok: false, error: 'El monto del aporte debe ser mayor a cero.' }
    }

    const fechaAporte = fecha || new Date().toISOString()
    const descAporte = (descripcion || '').trim()

    const nuevoAporte = {
      id: Date.now(),
      valor: valorNumerico,
      fecha: fechaAporte,
      descripcion: descAporte,
    }

    setMetas((prev) =>
      prev.map((m) => {
        if (m.id !== metaId) return m
        const aportesActualizados = [nuevoAporte, ...(m.aportes || [])]
        const nuevoAhorrado = (Number(m.ahorrado) || 0) + valorNumerico
        return {
          ...m,
          ahorrado: nuevoAhorrado,
          aportes: aportesActualizados,
        }
      }),
    )

    return { ok: true, aporte: nuevoAporte }
  }, [])

  /**
   * Enriquecimiento de las metas con cálculos de progreso y estado dinámico.
   */
  const metasConProgreso = useMemo(() => {
    const ahora = new Date()
    // Fin del día de hoy para comparar vencimiento
    const hoyFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59)

    return metas.map((meta) => {
      const objetivo = Number(meta.objetivo) || 0
      const ahorrado = Number(meta.ahorrado) || 0
      const restante = Math.max(0, objetivo - ahorrado)
      const porcentaje = objetivo > 0 ? Math.round((ahorrado / objetivo) * 100) : 0

      // Determinar estado: completada, vencida o en-progreso
      let estado = 'en-progreso'
      if (ahorrado >= objetivo) {
        estado = 'completada'
      } else if (meta.fechaLimite) {
        const fechaLimiteObj = new Date(meta.fechaLimite)
        if (!Number.isNaN(fechaLimiteObj.getTime()) && fechaLimiteObj < hoyFin) {
          estado = 'vencida'
        }
      }

      return {
        ...meta,
        objetivo,
        ahorrado,
        restante,
        porcentaje,
        estado,
        aportes: meta.aportes || [],
      }
    })
  }, [metas])

  /**
   * Resumen global de metas de ahorro:
   * Total acumulado, metas activas y metas completadas.
   */
  const resumenMetas = useMemo(() => {
    let totalAcumulado = 0
    let totalObjetivo = 0
    let activas = 0
    let completadas = 0
    let vencidas = 0

    metasConProgreso.forEach((m) => {
      totalAcumulado += m.ahorrado
      totalObjetivo += m.objetivo
      if (m.estado === 'completada') {
        completadas += 1
      } else if (m.estado === 'vencida') {
        vencidas += 1
      } else {
        activas += 1
      }
    })

    return {
      totalAcumulado,
      totalObjetivo,
      metasActivas: activas,
      metasCompletadas: completadas,
      metasVencidas: vencidas,
      totalMetas: metasConProgreso.length,
    }
  }, [metasConProgreso])

  const value = useMemo(
    () => ({
      metas: metasConProgreso,
      resumenMetas,
      crearMeta,
      editarMeta,
      eliminarMeta,
      registrarAporte,
    }),
    [metasConProgreso, resumenMetas, crearMeta, editarMeta, eliminarMeta, registrarAporte],
  )

  return <AhorroContext.Provider value={value}>{children}</AhorroContext.Provider>
}

export default AhorroProvider
