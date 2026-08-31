/**
 * Geometría de la escalerilla en el frontend. Espejo de `src/common/ladder.ts`
 * del backend: si allá cambian los rangos, acá también.
 *
 * Estaba copiada en seis archivos (page, perfil, ChallengeModal, PlayerModal,
 * Ladder, master), cada uno con su propia versión de los rangos.
 */

export const CATEGORIES = ['A', 'B', 'C'] as const;
export type CatKey = (typeof CATEGORIES)[number];

/** Límite superior de cada categoría. `null` = sin tope (la última). */
const BOUNDS: Array<{ category: CatKey; upTo: number | null }> = [
  { category: 'A', upTo: 14 },
  { category: 'B', upTo: 28 },
  { category: 'C', upTo: null },
];

export function categoryOf(position: number | null | undefined): CatKey | null {
  if (!position || position < 1 || position >= 1000) return null;
  for (const { category, upTo } of BOUNDS) {
    if (upTo === null || position <= upTo) return category;
  }
  return null;
}

export function categoryBounds(category: CatKey): { from: number; to: number | null } {
  const index = BOUNDS.findIndex((b) => b.category === category);
  const from = index === 0 ? 1 : (BOUNDS[index - 1].upTo ?? 0) + 1;
  return { from, to: BOUNDS[index].upTo };
}

export const CAT_META: Record<
  CatKey,
  { label: string; gradient: string; border: string }
> = {
  A: {
    label: 'Élite',
    gradient: 'from-yellow-900/50 to-yellow-950/30',
    border: 'border-yellow-700/20',
  },
  B: {
    label: 'Avanzado',
    gradient: 'from-gray-700/50 to-gray-800/30',
    border: 'border-gray-600/20',
  },
  C: {
    label: 'Intermedio',
    gradient: 'from-orange-900/50 to-orange-950/30',
    border: 'border-orange-700/20',
  },
};

/** "Pos. 1–14" para el encabezado de cada categoría. */
export function categoryRangeLabel(
  category: CatKey,
  ladderSize: number,
): string {
  const { from, to } = categoryBounds(category);
  const last = to ?? ladderSize;
  if (last < from) return `Pos. ${from}+`;
  return `Pos. ${from}–${last}`;
}

/**
 * Las filas que se dibujan en la escalerilla SON los niveles de desafío.
 * Espejo de `src/common/ladder.ts` del backend — si allá cambia, acá también.
 *
 * Antes eran dos cosas distintas (una tabla de niveles fija por un lado y este
 * generador por otro) y no calzaban: la zona de desafío ofrecía rivales que
 * visualmente estaban dos filas más arriba.
 *
 * Anchos crecientes, y lo que sobra al final para no dejar una fila de uno o
 * dos sueltos. Se genera porque la última categoría no tiene tope: la
 * escalerilla puede tener 46 jugadores este semestre y 60 el próximo.
 */
export function pyramidRows(from: number, to: number): number[][] {
  if (to < from) return [];
  const positions: number[] = [];
  for (let p = from; p <= to; p++) positions.push(p);

  const rows: number[][] = [];
  // El #1 de la escalerilla va solo, en la cima.
  let width = from === 1 ? 1 : 3;
  let i = 0;
  while (i < positions.length) {
    const remaining = positions.length - i;
    const size = remaining <= width + 2 ? remaining : width;
    rows.push(positions.slice(i, i + size));
    i += size;
    width = Math.min(width + 1, 5);
  }
  return rows;
}

/** Filas de una categoría, acotadas al final real de la escalerilla. */
export function categoryRows(category: CatKey, ladderSize: number): number[][] {
  const { from, to } = categoryBounds(category);
  return pyramidRows(from, Math.min(to ?? ladderSize, ladderSize));
}

/** Todas las filas de la escalerilla, de la cima al fondo. */
export function ladderRows(ladderSize: number): number[][] {
  return CATEGORIES.flatMap((c) => categoryRows(c, ladderSize));
}

/** Nivel de un puesto: el número de la fila en la que cae (1 = la cima). */
export function getLevel(
  position: number | null | undefined,
  ladderSize: number,
): number {
  if (!position || position < 1) return 0;
  const rows = ladderRows(Math.max(ladderSize, position));
  const index = rows.findIndex((row) => row.includes(position));
  return index === -1 ? 0 : index + 1;
}

/**
 * ¿`target` es un rival válido para quien está en `myPosition`?
 * Misma fila y por delante, o la fila inmediatamente superior.
 */
export function canChallengePosition(
  myPosition: number | null | undefined,
  target: number | null | undefined,
  ladderSize: number,
): boolean {
  if (!myPosition || !target || target >= myPosition) return false;
  const mine = getLevel(myPosition, ladderSize);
  const theirs = getLevel(target, ladderSize);
  if (mine === 0 || theirs === 0) return false;
  return theirs === mine || theirs === mine - 1;
}
