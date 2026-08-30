'use client';

import { useCallback, useEffect, useState } from 'react';
import { UnlockedAchievement } from '@/types';
import AchievementBadge, { GROUP_ACCENT } from './AchievementBadge';

/**
 * Celebración de logros recién desbloqueados. Si hay varios pendientes los
 * muestra de a uno; al cerrar el último se marcan todos como vistos en el
 * servidor y no vuelven a aparecer (tampoco en otro dispositivo).
 */

interface AchievementUnlockedModalProps {
  achievements: UnlockedAchievement[];
  onDismiss: (ids: string[]) => void;
}

export default function AchievementUnlockedModal({
  achievements,
  onDismiss,
}: AchievementUnlockedModalProps) {
  const [index, setIndex] = useState(0);
  const total = achievements.length;
  const current = achievements[index];

  const close = useCallback(() => {
    onDismiss(achievements.map((a) => a.id).filter((id): id is string => !!id));
  }, [achievements, onDismiss]);

  const next = useCallback(() => {
    if (index < total - 1) setIndex((i) => i + 1);
    else close();
  }, [index, total, close]);

  useEffect(() => {
    if (total === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'Enter' || e.key === ' ') next();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [total, close, next]);

  if (total === 0 || !current) return null;

  const accent = GROUP_ACCENT[current.group] ?? '#8BC234';

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={close}
      />

      <div className="relative w-full max-w-sm bg-[#0f2211] border border-ctg-green/20 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-scale-in">
        {/* Cabecera con la insignia grande */}
        <div
          className="relative h-52 flex flex-col items-center justify-center gap-3 overflow-hidden"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${accent}2e, #0f2211 72%)`,
          }}
        >
          {/* Rayos: puro adorno, no transmite información */}
          <div className="absolute inset-0 opacity-40" aria-hidden>
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 origin-bottom"
                style={{
                  width: 2,
                  height: 130,
                  background: `linear-gradient(to top, ${accent}00, ${accent}77)`,
                  transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
                }}
              />
            ))}
          </div>

          <div className="relative animate-scale-in">
            <AchievementBadge
              emoji={current.emoji}
              group={current.group}
              size="lg"
              glow
            />
          </div>
          <div
            className="relative text-[11px] uppercase tracking-[0.2em] font-bold"
            style={{ color: accent }}
          >
            ¡Logro desbloqueado!
          </div>
        </div>

        <div className="p-6 text-center" key={current.code}>
          <h2 className="font-display text-2xl font-black text-[#F0F7E8] animate-slide-up">
            {current.name}
          </h2>
          <p className="text-[#F0F7E8]/60 text-sm leading-relaxed mt-2 animate-slide-up">
            {current.description}
          </p>

          {total > 1 && (
            <div className="flex justify-center gap-1.5 mt-5">
              {achievements.map((_, i) => (
                <span
                  key={i}
                  className={
                    'h-1.5 rounded-full transition-all ' +
                    (i === index
                      ? 'w-6 bg-ctg-green'
                      : 'w-1.5 bg-[#F0F7E8]/20')
                  }
                />
              ))}
            </div>
          )}

          <button onClick={next} className="btn-primary w-full py-3 mt-6">
            {index < total - 1 ? `Siguiente (${index + 1}/${total})` : '¡Genial!'}
          </button>
        </div>
      </div>
    </div>
  );
}
