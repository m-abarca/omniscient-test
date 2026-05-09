import type { ProductionOrder, RescheduleResult } from '@omniscient/types';

/**
 * Regla de re-scheduling (textual del enunciado):
 *   "Si 2 o más órdenes en estado 'planned' comparten cualquier rango de
 *    fechas solapado, re-ordenarlas secuencialmente (una tras otra),
 *    priorizando por createdAt ascendente y conservando la duración original."
 *
 * Semántica elegida aquí (documentada en el README):
 *  - Solo participan las órdenes con `status === 'planned'`. Los demás
 *    estados son invisibles al algoritmo — una orden planned NO cede ante
 *    una in_progress. (Filtro defensivo; el caller ya filtra también.)
 *  - Intervalos semi-abiertos `[start, end)`. Dos órdenes que se tocan en
 *    el borde (`A.endDate === B.startDate`) NO se consideran solapadas.
 *  - Desempate cuando `createdAt` es idéntico: `id` lexicográfico ascendente.
 *    Determinista entre ejecuciones.
 *  - La duración original se conserva tal cual, incluyendo 0.
 *  - Devuelve solo las órdenes cuyas fechas cambiaron (mínima superficie de
 *    patch para el caller). Los objetos de salida son copias nuevas — la
 *    entrada nunca se muta.
 *  - Idempotente: aplicar el resultado y volver a correr no produce más
 *    cambios.
 */
export function reschedulePlanned(
  orders: readonly ProductionOrder[],
): RescheduleResult {
  const planned = orders.filter((o) => o.status === 'planned');

  const sorted = [...planned].sort((a, b) => {
    const byCreated = a.createdAt.localeCompare(b.createdAt);
    return byCreated !== 0 ? byCreated : a.id.localeCompare(b.id);
  });

  const updated: ProductionOrder[] = [];
  let cursor = -Infinity;

  for (const order of sorted) {
    const startMs = Date.parse(order.startDate);
    const endMs = Date.parse(order.endDate);
    const duration = endMs - startMs;

    if (startMs < cursor) {
      const newStart = cursor;
      const newEnd = cursor + duration;
      updated.push({
        ...order,
        startDate: new Date(newStart).toISOString(),
        endDate: new Date(newEnd).toISOString(),
      });
      cursor = newEnd;
    } else {
      cursor = Math.max(cursor, endMs);
    }
  }

  return { updated, total: planned.length };
}
