'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Player } from '@/types';
import { CAT_META, categoryOf } from '@/lib/ladder';

/**
 * Editor de la escalerilla por arrastrar y soltar.
 *
 * Los puestos se renumeran en vivo mientras se arrastra, pero **no se guarda
 * nada hasta apretar "Guardar cambios"**: mover a alguien del 30 al 3 corre a
 * 27 personas, y hacerlo de a un request por cada paso del arrastre dejaría la
 * escalerilla a medio ordenar si algo falla en el camino.
 *
 * El backend recibe el orden completo y valida que la lista siga siendo
 * exactamente la escalerilla de hoy: si otro admin movió a alguien o se
 * resolvió un desafío mientras editabas, el guardado se rechaza en vez de
 * pisar ese cambio.
 */
export default function LadderEditor({
  players,
  saving,
  onSave,
}: {
  players: Player[];
  saving: boolean;
  onSave: (playerIds: string[]) => Promise<void>;
}) {
  /** Orden original, tal como está guardado hoy. */
  const original = useMemo(
    () =>
      [...players]
        .filter((p) => (p.position ?? 0) > 0 && !p.is_admin)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [players],
  );

  const [orden, setOrden] = useState<Player[]>(original);
  const arrastrado = useRef<number | null>(null);
  const [arrastrandoId, setArrastrandoId] = useState<string | null>(null);

  // Si el panel recarga los jugadores (por ejemplo tras guardar), se parte de
  // cero. La comparación por ids evita pisar una edición en curso cuando el
  // refresco trae exactamente lo mismo.
  const firmaOriginal = original.map((p) => p.id).join();
  useEffect(() => {
    setOrden(original);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firmaOriginal]);

  const puestoOriginal = useMemo(() => {
    const map = new Map<string, number>();
    original.forEach((p, i) => map.set(p.id, i + 1));
    return map;
  }, [original]);

  const cambios = orden.filter((p, i) => puestoOriginal.get(p.id) !== i + 1);
  const hayCambios = cambios.length > 0;

  const mover = (desde: number, hasta: number) => {
    if (hasta < 0 || hasta >= orden.length || desde === hasta) return;
    setOrden((prev) => {
      const copia = [...prev];
      const [item] = copia.splice(desde, 1);
      copia.splice(hasta, 0, item);
      return copia;
    });
  };

  const guardar = async () => {
    await onSave(orden.map((p) => p.id));
  };

  return (
    <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <h2 className="font-display font-bold text-[#F0F7E8] text-xl">Ordenar la escalerilla</h2>
        <span className="text-xs text-[#F0F7E8]/35">{orden.length} jugadores</span>
      </div>
      <p className="text-[#F0F7E8]/45 text-sm mb-5">
        Arrastra a un jugador al puesto que quieras — los números se actualizan
        solos mientras lo mueves. Nada se guarda hasta que aprietes{' '}
        <strong className="text-[#F0F7E8]/70">Guardar cambios</strong>.
      </p>

      <div className="border border-[#1e4020] rounded-xl divide-y divide-[#1e4020] max-h-[32rem] overflow-y-auto">
        {orden.map((p, i) => {
          const puesto = i + 1;
          const antes = puestoOriginal.get(p.id);
          const delta = antes ? antes - puesto : 0;
          const cat = categoryOf(puesto);
          const abreCategoria = categoryOf(puesto - 1) !== cat;

          return (
            <div key={p.id}>
              {abreCategoria && cat && (
                <div className="px-4 py-1.5 bg-[#152b18] text-[10px] uppercase tracking-widest font-bold text-[#F0F7E8]/40">
                  Categoría {cat} · {CAT_META[cat].label}
                </div>
              )}
              <div
                draggable
                onDragStart={() => {
                  arrastrado.current = i;
                  setArrastrandoId(p.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  const desde = arrastrado.current;
                  if (desde === null || desde === i) return;
                  mover(desde, i);
                  arrastrado.current = i;
                }}
                onDragEnd={() => {
                  arrastrado.current = null;
                  setArrastrandoId(null);
                }}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors
                  ${arrastrandoId === p.id ? 'bg-ctg-green/15 ring-1 ring-ctg-green/40' : 'hover:bg-ctg-green/5'}`}
              >
                <span className="text-[#F0F7E8]/25 select-none" aria-hidden>⠿</span>
                <span className="font-mono text-xs font-bold text-ctg-green w-9 shrink-0">
                  #{puesto}
                </span>
                <span className="text-sm text-[#F0F7E8] flex-1 truncate">{p.name}</span>

                {delta !== 0 && (
                  <span
                    className={`text-[11px] font-semibold tabular-nums shrink-0 ${
                      delta > 0 ? 'text-ctg-green' : 'text-orange-400'
                    }`}
                    title={`Antes estaba #${antes}`}
                  >
                    {delta > 0 ? `▲ ${delta}` : `▼ ${Math.abs(delta)}`}
                  </span>
                )}

                {/* Alternativa al arrastre: preciso, y funciona en pantallas táctiles */}
                <span className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => mover(i, i - 1)} disabled={i === 0}
                    aria-label={`Subir a ${p.name}`}
                    className="w-7 h-7 rounded-lg border border-[#1e4020] text-[#F0F7E8]/50 text-xs
                               hover:text-[#F0F7E8] hover:border-ctg-green/40 disabled:opacity-25 disabled:hover:border-[#1e4020]">
                    ↑
                  </button>
                  <button type="button" onClick={() => mover(i, i + 1)} disabled={i === orden.length - 1}
                    aria-label={`Bajar a ${p.name}`}
                    className="w-7 h-7 rounded-lg border border-[#1e4020] text-[#F0F7E8]/50 text-xs
                               hover:text-[#F0F7E8] hover:border-ctg-green/40 disabled:opacity-25 disabled:hover:border-[#1e4020]">
                    ↓
                  </button>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-4 mt-5 flex-wrap">
        <p className="text-sm text-[#F0F7E8]/45">
          {hayCambios
            ? <>Vas a mover a <strong className="text-ctg-green">{cambios.length}</strong> jugador{cambios.length === 1 ? '' : 'es'} de puesto.</>
            : 'Sin cambios por ahora.'}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => setOrden(original)}
            disabled={!hayCambios || saving} className="btn-ghost disabled:opacity-40">
            Descartar
          </button>
          <button type="button" onClick={guardar}
            disabled={!hayCambios || saving} className="btn-primary disabled:opacity-40">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
