'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SeasonSummary } from '@/types';
import AchievementBadge from './AchievementBadge';

/**
 * Resumen de cierre de temporada. Se muestra una vez por jugador y no vuelve:
 * el "visto" se guarda en el servidor (`players.last_summary_seen`), no en
 * localStorage, para que no reaparezca al entrar desde otro teléfono.
 *
 * El contenido es personalizado. Campeones y finalistas ven una primera
 * pantalla distinta, con trofeo y su propio mensaje.
 */

type Summary = Extract<SeasonSummary, { pending: true }>;

const PODIUM = {
  champion: {
    emoji: '🏆',
    accent: '#e8b923',
    kicker: 'Campeón de categoría',
    title: '¡Felicidades, campeón!',
    body: 'Te llevaste la final de tu categoría. Ganártela es difícil; defender el título lo es más. A seguir así el próximo semestre.',
  },
  finalist: {
    emoji: '🥈',
    accent: '#c8d3dd',
    kicker: 'Finalista',
    title: '¡Gran torneo!',
    body: 'Llegaste hasta la final de tu categoría. Te quedaste a un partido del título — el próximo semestre hay revancha.',
  },
  semifinalist: {
    emoji: '🎖️',
    accent: '#8BC234',
    kicker: 'Semifinalista',
    title: '¡Entre los cuatro mejores!',
    body: 'Clasificaste a semifinales de tu categoría. Estuviste peleando arriba todo el semestre.',
  },
} as const;

function ordinal(n: number | null): string {
  return n == null ? '—' : `#${n}`;
}

interface SeasonSummaryModalProps {
  summary: Summary;
  onClose: (slug: string) => void;
}

export default function SeasonSummaryModal({
  summary,
  onClose,
}: SeasonSummaryModalProps) {
  const podium = summary.master_result ? PODIUM[summary.master_result] : null;

  // Pantallas según lo que este jugador tenga para mostrar.
  const screens = useMemo(() => {
    const list: Array<'podium' | 'balance' | 'achievements' | 'next'> = [];
    if (podium) list.push('podium');
    list.push('balance');
    if (summary.achievements.length > 0) list.push('achievements');
    list.push('next');
    return list;
  }, [podium, summary.achievements.length]);

  const [step, setStep] = useState(0);
  const isLast = step === screens.length - 1;
  const screen = screens[step];

  const finish = useCallback(() => {
    onClose(summary.season.slug);
  }, [onClose, summary.season.slug]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') finish();
    }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [finish]);

  const accent = podium?.accent ?? '#8BC234';

  return (
    <div className="fixed inset-0 z-[92] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={finish}
      />

      <div className="relative w-full max-w-md bg-[#0f2211] border border-ctg-green/20 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-scale-in">
        {/* ── Cabecera ── */}
        <div
          className="relative h-40 flex flex-col items-center justify-center gap-2 overflow-hidden"
          style={{
            background: `radial-gradient(circle at 50% 25%, ${accent}26, #0f2211 75%)`,
          }}
        >
          <button
            onClick={finish}
            className="absolute top-4 right-4 text-[#F0F7E8]/45 hover:text-[#F0F7E8] text-sm font-semibold transition px-3 py-1.5 rounded-lg hover:bg-[#F0F7E8]/5"
          >
            Saltar
          </button>

          {screen === 'podium' && podium ? (
            <>
              <span className="text-6xl animate-scale-in" aria-hidden>
                {podium.emoji}
              </span>
              <span
                className="text-[11px] uppercase tracking-[0.2em] font-bold"
                style={{ color: accent }}
              >
                {podium.kicker}
                {summary.category ? ` ${summary.category}` : ''}
              </span>
            </>
          ) : (
            <>
              <span className="text-5xl" aria-hidden>
                {screen === 'next' ? '🎾' : screen === 'achievements' ? '🎯' : '📋'}
              </span>
              <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-ctg-green">
                {/* La última pantalla ya habla de la temporada que arranca. */}
                {screen === 'next' && summary.next_season
                  ? summary.next_season.name
                  : summary.season.name}
              </span>
            </>
          )}
        </div>

        {/* ── Cuerpo ── */}
        <div className="p-6 md:p-7 text-center" key={screen}>
          {screen === 'podium' && podium && (
            <>
              <h2 className="font-display text-2xl font-black text-[#F0F7E8] animate-slide-up">
                {podium.title}
              </h2>
              <p className="text-[#F0F7E8]/60 text-sm leading-relaxed mt-3 animate-slide-up">
                {podium.body}
              </p>
            </>
          )}

          {screen === 'balance' && (
            <>
              <h2 className="font-display text-2xl font-black text-[#F0F7E8] animate-slide-up">
                Tu semestre
              </h2>
              <p className="text-[#F0F7E8]/55 text-sm mt-2 animate-slide-up">
                Así cerró {summary.season.name.replace('Escalerilla ', '')}.
              </p>

              <div className="grid grid-cols-3 gap-2 mt-5">
                <Stat
                  label="Posición final"
                  value={ordinal(summary.final_position)}
                />
                <Stat label="Victorias" value={String(summary.wins)} accent />
                <Stat label="Derrotas" value={String(summary.losses)} />
              </div>

              {summary.climbed != null && summary.climbed !== 0 && (
                <p className="text-sm mt-4 text-[#F0F7E8]/60">
                  {summary.climbed > 0 ? (
                    <>
                      Subiste{' '}
                      <span className="text-ctg-green font-bold">
                        {summary.climbed} puestos
                      </span>{' '}
                      en el semestre.
                    </>
                  ) : (
                    <>
                      Bajaste {Math.abs(summary.climbed)} puestos. El 2do
                      semestre es la revancha.
                    </>
                  )}
                </p>
              )}

              {summary.total_matches === 0 && (
                <p className="text-sm mt-4 text-[#F0F7E8]/50">
                  No alcanzaste a jugar partidos oficiales este semestre.
                  ¡Ahora es cuando!
                </p>
              )}
            </>
          )}

          {screen === 'achievements' && (
            <>
              <h2 className="font-display text-2xl font-black text-[#F0F7E8] animate-slide-up">
                {summary.achievements.length === 1
                  ? 'Ganaste un logro'
                  : `Ganaste ${summary.achievements.length} logros`}
              </h2>
              <p className="text-[#F0F7E8]/55 text-sm mt-2 animate-slide-up">
                Quedan guardados en tu perfil para siempre.
              </p>

              <div className="flex flex-wrap justify-center gap-3 mt-5">
                {summary.achievements.map((a) => (
                  <div
                    key={a.code}
                    className="flex flex-col items-center gap-1.5 w-20"
                  >
                    <AchievementBadge
                      emoji={a.emoji}
                      group="temporada"
                      size="md"
                      title={a.description}
                    />
                    <span className="text-[10px] text-[#F0F7E8]/55 font-semibold leading-tight text-center">
                      {a.name}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {screen === 'next' && (
            <>
              <h2 className="font-display text-2xl font-black text-[#F0F7E8] animate-slide-up">
                {summary.in_new_season
                  ? '¡Arranca el 2do semestre!'
                  : 'Nos vemos pronto'}
              </h2>

              {summary.in_new_season ? (
                <>
                  <p className="text-[#F0F7E8]/60 text-sm leading-relaxed mt-3 animate-slide-up">
                    La escalerilla se reordenó y tu récord vuelve a cero.
                    Partes en el puesto:
                  </p>
                  <div
                    className="font-display font-black text-6xl mt-4 glow-green"
                    style={{ color: '#8BC234' }}
                  >
                    #{summary.new_position}
                  </div>
                  <p className="text-[#F0F7E8]/55 text-sm mt-4">
                    Desafía a quien tengas arriba y empieza a escalar. Hay
                    logros nuevos esperando.
                  </p>
                </>
              ) : (
                <p className="text-[#F0F7E8]/60 text-sm leading-relaxed mt-3">
                  Este semestre no quedaste inscrito en la escalerilla, pero tu
                  historial y tus logros siguen acá. Si quieres volver, habla
                  con la directiva.
                </p>
              )}
            </>
          )}

          {/* ── Navegación ── */}
          {screens.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {screens.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  aria-label={`Ir a la pantalla ${i + 1}`}
                  className={
                    'h-2 rounded-full transition-all ' +
                    (i === step
                      ? 'w-8 bg-ctg-green'
                      : 'w-2 bg-[#F0F7E8]/20 hover:bg-[#F0F7E8]/40')
                  }
                />
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-ghost flex-1 py-3"
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep(step + 1))}
              className="btn-primary flex-1 py-3 text-base"
            >
              {!isLast
                ? 'Siguiente →'
                : summary.in_new_season
                  ? '¡A jugar!'
                  : 'Entendido'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-[#152b18] border border-[#1e4020] rounded-xl py-3 px-1">
      <div
        className={
          'font-display font-black text-2xl ' +
          (accent ? 'text-ctg-green glow-soft' : 'text-[#F0F7E8]')
        }
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mt-0.5">
        {label}
      </div>
    </div>
  );
}
