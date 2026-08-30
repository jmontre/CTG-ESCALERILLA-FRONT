'use client';

import { useState } from 'react';
import { AchievementGroup, AchievementWithStatus } from '@/types';
import AchievementBadge, { GROUP_ACCENT } from './AchievementBadge';

/**
 * Grilla "Mis logros" del perfil: las conseguidas a color con su fecha, las
 * pendientes en gris con la condición para conseguirlas.
 */

const GROUP_ORDER: AchievementGroup[] = [
  'temporada',
  'escalerilla',
  'partidos',
  'constancia',
  'club',
];

const GROUP_LABEL: Record<AchievementGroup, string> = {
  temporada: 'Temporada',
  escalerilla: 'Escalerilla',
  partidos: 'Partidos',
  constancia: 'Constancia',
  club: 'Club',
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "Campeón · Categoría A" cuando el contexto aporta algo mostrable. */
function contextLabel(a: AchievementWithStatus): string | null {
  const c = a.context;
  if (!c) return null;
  if (typeof c.categoria === 'string') return `Categoría ${c.categoria}`;
  if (typeof c.racha === 'number') return `${c.racha} al hilo`;
  if (typeof c.puestos === 'number') return `+${c.puestos} puestos`;
  if (typeof c.partidos === 'number') return `${c.partidos} partidos`;
  if (typeof c.rivales === 'number') return `${c.rivales} rivales`;
  if (typeof c.visitas === 'number') return `${c.visitas} visitas`;
  if (typeof c.desde === 'string' && typeof c.hasta === 'string')
    return `${c.desde} → ${c.hasta}`;
  return null;
}

interface AchievementsGridProps {
  achievements: AchievementWithStatus[];
  unlockedCount: number;
  total: number;
}

export default function AchievementsGrid({
  achievements,
  unlockedCount,
  total,
}: AchievementsGridProps) {
  const [onlyUnlocked, setOnlyUnlocked] = useState(false);

  if (achievements.length === 0) {
    return (
      <p className="text-[#F0F7E8]/45 text-sm">
        Todavía no hay logros que mostrar. Juega tu primer partido del semestre
        y aparecerá el primero.
      </p>
    );
  }

  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;
  const visible = onlyUnlocked
    ? achievements.filter((a) => a.unlocked)
    : achievements;

  return (
    <div>
      {/* Progreso */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-sm text-[#F0F7E8]/60">
              <span className="font-display font-black text-ctg-green text-lg">
                {unlockedCount}
              </span>
              <span className="text-[#F0F7E8]/40"> / {total} logros</span>
            </span>
            <span className="text-xs text-[#F0F7E8]/40 font-mono">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-[#101f12] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-ctg-green/70 to-ctg-lime transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <button
          onClick={() => setOnlyUnlocked((v) => !v)}
          className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#1e4020] text-[#F0F7E8]/55 hover:text-[#F0F7E8] hover:border-ctg-green/40 transition shrink-0"
        >
          {onlyUnlocked ? 'Ver todos' : 'Solo los míos'}
        </button>
      </div>

      {GROUP_ORDER.map((group) => {
        const items = visible.filter((a) => a.group === group);
        if (items.length === 0) return null;

        return (
          <div key={group} className="mb-6 last:mb-0">
            <h4
              className="text-[11px] uppercase tracking-wider font-bold mb-2.5"
              style={{ color: GROUP_ACCENT[group] }}
            >
              {GROUP_LABEL[group]}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {items.map((a) => {
                const ctx = contextLabel(a);
                return (
                  <div
                    key={a.code}
                    className={
                      'flex items-center gap-3 rounded-xl border p-3 transition ' +
                      (a.unlocked
                        ? 'bg-[#152b18] border-[#1e4020]'
                        : 'bg-[#101f12]/60 border-[#1e4020]/50')
                    }
                  >
                    <AchievementBadge
                      emoji={a.emoji}
                      group={a.group}
                      unlocked={a.unlocked}
                      size="md"
                      times={a.times}
                    />
                    <div className="min-w-0">
                      <div
                        className={
                          'font-display font-bold text-sm truncate ' +
                          (a.unlocked
                            ? 'text-[#F0F7E8]'
                            : 'text-[#F0F7E8]/35')
                        }
                      >
                        {a.name}
                      </div>
                      <div
                        className={
                          'text-xs leading-snug mt-0.5 ' +
                          (a.unlocked
                            ? 'text-[#F0F7E8]/50'
                            : 'text-[#F0F7E8]/28')
                        }
                      >
                        {a.description}
                      </div>
                      {a.unlocked && (
                        <div className="text-[10px] text-ctg-green/70 mt-1 font-semibold">
                          {ctx ? `${ctx} · ` : ''}
                          {formatDate(a.unlocked_at)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
