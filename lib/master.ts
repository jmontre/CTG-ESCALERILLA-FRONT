import { Player } from '@/types';
import { CatKey, categoryBounds, isInLadder } from '@/lib/ladder';

/**
 * Cómo quedaría el cuadro Master de una categoría al generarlo. Espejo de
 * `MasterService.generateMaster` en el backend: si allá cambia el armado,
 * acá también. Sirve para que el admin vea directos y cruces ANTES de generar
 * (generar manda los WhatsApp a todos).
 */
export const MASTER_SLOTS = 14;
export const DIRECT_QUALIFIERS = 4;
export const PLAYOFF_SLOTS = 8;

export interface MasterDraw {
  /** Jugadores del rango de la categoría, en orden (incluye excluidos). */
  pool: Player[];
  direct: Player[];
  /** Cruces del playoff: 5v12, 6v11, 7v10, 8v9 del cuadro. */
  pairs: [Player, Player][];
  /** Entran al cuadro pero quedan fuera por posición (13° y 14°). */
  out: Player[];
  /** Hay jugadores suficientes para generar. */
  enough: boolean;
}

export function masterDraw(players: Player[], category: CatKey, excluded: Set<string>): MasterDraw {
  const { from, to } = categoryBounds(category);
  const pool = players
    .filter((p) => isInLadder(p.position) && p.position! >= from && (to === null || p.position! <= to))
    .sort((a, b) => a.position! - b.position!);
  const taken = pool.filter((p) => !excluded.has(p.id)).slice(0, MASTER_SLOTS);
  const playoff = taken.slice(DIRECT_QUALIFIERS, DIRECT_QUALIFIERS + PLAYOFF_SLOTS);
  const pairs: [Player, Player][] = [];
  if (playoff.length === PLAYOFF_SLOTS) {
    for (let i = 0; i < PLAYOFF_SLOTS / 2; i++) pairs.push([playoff[i], playoff[PLAYOFF_SLOTS - 1 - i]]);
  }
  return {
    pool,
    direct: taken.slice(0, DIRECT_QUALIFIERS),
    pairs,
    out: taken.slice(DIRECT_QUALIFIERS + PLAYOFF_SLOTS),
    enough: taken.length >= DIRECT_QUALIFIERS + PLAYOFF_SLOTS,
  };
}
