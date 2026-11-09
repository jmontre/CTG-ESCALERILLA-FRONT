'use client';
import { MasterDraw } from '@/lib/master';

/**
 * Antes de generar una categoría: el admin marca a quienes no juegan y ve
 * cómo quedan los directos y los cruces del playoff.
 */
export default function MasterGeneratePanel({
  draw,
  excluded,
  onToggle,
}: {
  draw: MasterDraw;
  excluded: Set<string>;
  onToggle: (playerId: string) => void;
}) {
  // Se listan los del rango hasta cubrir el cuadro y un poco más, para poder
  // ver quién entra si alguien se baja.
  const visible = draw.pool.slice(0, 14 + excluded.size + 4);

  return (
    <div className="space-y-4">
      <details className="group">
        <summary className="cursor-pointer text-sm font-semibold text-amber-300 hover:text-amber-200 select-none">
          ¿Quién no juega? {excluded.size > 0 && <span className="text-[#F0F7E8]/50">({excluded.size} marcados)</span>}
        </summary>
        <p className="text-xs text-[#F0F7E8]/40 mt-2 mb-2">
          Marca a quienes avisaron que no juegan: el cuadro se arma con los siguientes en orden.
        </p>
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {visible.map((p) => (
            <label
              key={p.id}
              className={
                'flex items-center gap-2 text-sm px-2 py-1 rounded cursor-pointer ' +
                (excluded.has(p.id) ? 'bg-red-900/20 text-[#F0F7E8]/40 line-through' : 'text-[#F0F7E8]/80 hover:bg-[#152b18]')
              }
            >
              <input type="checkbox" checked={excluded.has(p.id)} onChange={() => onToggle(p.id)} />
              <span className="w-8 text-right text-[#F0F7E8]/40">#{p.position}</span>
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      </details>

      <div className="bg-[#152b18] border border-[#1e4020] rounded-lg p-3 text-sm space-y-3">
        <p className="text-xs font-semibold text-[#F0F7E8]/40 uppercase tracking-wider">Vista previa</p>
        {!draw.enough ? (
          <p className="text-red-400">No hay jugadores suficientes (se necesitan 12).</p>
        ) : (
          <>
            <div>
              <p className="text-[#F0F7E8]/50 text-xs mb-1">Clasificados directos</p>
              <p className="text-[#F0F7E8]">{draw.direct.map((p) => `${p.name} (#${p.position})`).join(', ')}</p>
            </div>
            <div>
              <p className="text-[#F0F7E8]/50 text-xs mb-1">Playoff</p>
              <ol className="space-y-0.5 text-[#F0F7E8]" data-testid="preview-pairs">
                {draw.pairs.map(([a, b], i) => (
                  <li key={a.id}>
                    <span className="text-[#F0F7E8]/40">Partido {i + 1}:</span> {a.name} vs {b.name}
                  </li>
                ))}
              </ol>
            </div>
            {draw.out.length > 0 && (
              <p className="text-xs text-[#F0F7E8]/40">
                Quedan fuera por posición: {draw.out.map((p) => p.name).join(', ')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
