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
 * Filas de la pirámide de una categoría: anchos crecientes, y lo que sobra al
 * final para no dejar una fila de uno o dos sueltos.
 *
 * Se genera en vez de estar escrita a mano porque la categoría C no tiene tope:
 * la escalerilla puede tener 46 jugadores este semestre y 60 el próximo.
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

// ──────────────────────────── Niveles ─────────────────────────────

/**
 * Nivel de desafío de una posición. Espejo de `getLevel` en el backend
 * (`src/common/ladder.ts`): un jugador puede desafiar a su mismo nivel, solo a
 * quien esté adelante, o al nivel inmediatamente superior.
 */
const FIXED_LEVELS = [1, 4, 9, 14, 19, 24, 28];
const OPEN_ZONE_FROM = 29;
const OPEN_ZONE_BLOCK = 5;

export function getLevel(position: number | null | undefined): number {
  if (!position || position < 1) return FIXED_LEVELS.length + 1;
  for (let i = 0; i < FIXED_LEVELS.length; i++) {
    if (position <= FIXED_LEVELS[i]) return i + 1;
  }
  const offset = position - OPEN_ZONE_FROM;
  return FIXED_LEVELS.length + 1 + Math.floor(offset / OPEN_ZONE_BLOCK);
}

/** ¿`target` es un rival válido para quien está en `myPosition`? */
export function canChallengePosition(
  myPosition: number | null | undefined,
  target: number | null | undefined,
): boolean {
  if (!myPosition || !target || target >= myPosition) return false;
  const myLevel = getLevel(myPosition);
  const targetLevel = getLevel(target);
  // Mismo nivel (y adelante, ya verificado) o exactamente un nivel arriba.
  return targetLevel === myLevel || targetLevel === myLevel - 1;
}
