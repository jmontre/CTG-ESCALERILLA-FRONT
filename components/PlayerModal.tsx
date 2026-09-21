'use client';

import { useEffect, useState } from 'react';
import { Player, UnlockedAchievement, RecentMatch } from '@/types';
import { api } from '@/lib/api';
import AchievementBadge from './AchievementBadge';
import { CatKey, CAT_META, categoryOf, activeRival } from '@/lib/ladder';
import { formatPlayerName, shortPlayerName } from '@/lib/formatName';

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onChallenge: (player: Player) => void;
  canChallenge: boolean;
  /** Total de jugadores en la escalerilla: cambia en cada temporada. */
  ladderSize: number;
}

const SwordsIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L21 0M19 5l-5 5" />
  </svg>
);
const CloseIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

function AvatarEl({ player, size = 72 }: { player: Player; size?: number }) {
  const initials = player.name.trim().split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const style: React.CSSProperties = {
    width: size, height: size, fontSize: size * 0.36,
    background: 'linear-gradient(135deg, #9ed944, #8BC234 60%, #6ea127)',
  };
  if (player.avatar_url) {
    return <div className="rounded-full overflow-hidden shrink-0" style={style}><img src={player.avatar_url} alt="" className="w-full h-full object-cover" /></div>;
  }
  return <div className="inline-flex items-center justify-center rounded-full font-display font-bold text-[#0a1608] shrink-0" style={style}>{initials}</div>;
}

/** "Categoría A · 30 ago 2026" cuando el contexto aporta algo mostrable. */
function badgeContext(b: UnlockedAchievement): string {
  const parts: string[] = [];
  const c = b.context as Record<string, unknown> | null;
  if (c) {
    if (typeof c.categoria === 'string') parts.push(`Categoría ${c.categoria}`);
    else if (typeof c.racha === 'number') parts.push(`${c.racha} al hilo`);
    else if (typeof c.puestos === 'number') parts.push(`+${c.puestos} puestos`);
    else if (typeof c.partidos === 'number') parts.push(`${c.partidos} partidos`);
    else if (typeof c.rivales === 'number') parts.push(`${c.rivales} rivales`);
  }
  parts.push(new Date(b.unlocked_at).toLocaleDateString('es-CL', {
    day: 'numeric', month: 'short', year: 'numeric',
  }));
  return parts.join(' · ');
}

/** "12 sep" — el año solo cuando el partido no es de este año. */
function matchDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === new Date().getFullYear()
      ? { day: 'numeric', month: 'short' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('es-CL', opts);
}

/** Botón "Ver más / Ver menos" de las secciones que se despliegan. */
function VerMas({ expanded, onClick, restantes }: {
  expanded: boolean; onClick: () => void; restantes: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="mt-2 w-full text-[11px] font-semibold text-ctg-green/80 hover:text-ctg-green transition py-1.5 rounded-lg border border-[#1e4020] hover:border-ctg-green/40"
    >
      {expanded ? 'Ver menos' : `Ver ${restantes} más`}
    </button>
  );
}

/** Una fila del historial: ganó/perdió, contra quién y con qué marcador. */
function MatchRow({ match }: { match: RecentMatch }) {
  return (
    <div className="flex items-center gap-2 bg-[#152b18] border border-[#1e4020] rounded-xl px-2.5 py-2">
      <span
        className={
          'w-6 h-6 shrink-0 rounded-full grid place-items-center font-display font-black text-[11px] ' +
          (match.won
            ? 'bg-ctg-green/20 text-ctg-green border border-ctg-green/40'
            : 'bg-red-500/15 text-red-400 border border-red-500/30')
        }
        title={match.won ? 'Victoria' : 'Derrota'}
      >
        {match.won ? 'V' : 'D'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-[#F0F7E8] truncate">
          vs {shortPlayerName(match.rival.name)}
          {match.rival.position ? (
            <span className="text-[#F0F7E8]/35 font-normal"> #{match.rival.position}</span>
          ) : null}
        </div>
        <div className="text-[10px] text-[#F0F7E8]/40 truncate">
          {match.played_at ? matchDate(match.played_at) : 'sin fecha'}
          {match.type === 'entry' ? ' · ingreso' : ''}
        </div>
      </div>
      <div className="font-mono text-[11px] text-[#F0F7E8]/70 shrink-0 text-right">
        {match.score || '—'}
      </div>
    </div>
  );
}

function StatBox({ label, value, colorClass }: { label: string; value: number; colorClass: string }) {
  return (
    <div className="text-center bg-[#152b18] border border-[#1e4020] rounded-xl py-3">
      <div className={'font-display font-black text-3xl ' + colorClass + (colorClass === 'text-ctg-green' ? ' glow-soft' : '')}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mt-0.5">{label}</div>
    </div>
  );
}

export default function PlayerModal({ player, isOpen, onClose, onChallenge, canChallenge, ladderSize }: PlayerModalProps) {
  // Insignias del jugador. Se piden al abrir; si falla, la ficha se muestra igual.
  // Se guarda junto al id para no pintar los logros del jugador anterior
  // mientras llega la respuesta del nuevo.
  const [badges, setBadges] = useState<{ playerId: string; items: UnlockedAchievement[] } | null>(null);

  // Insignia desplegada, para mostrar de qué se trata. Guarda también de quién
  // es: así al abrir la ficha de otro jugador no queda desplegada la insignia
  // del anterior, sin necesidad de resetear el estado dentro de un efecto.
  const [openBadge, setOpenBadge] = useState<{ playerId: string; code: string } | null>(null);

  // Últimos partidos, con el mismo resguardo de id que las insignias.
  const [matches, setMatches] = useState<{ playerId: string; items: RecentMatch[] } | null>(null);

  // Las dos secciones nacen plegadas: la ficha tiene que caber en un teléfono
  // sin empujar el botón de desafiar fuera de la pantalla.
  const [verLogros, setVerLogros] = useState(false);
  const [verPartidos, setVerPartidos] = useState(false);

  useEffect(() => {
    if (!isOpen || !player) return;
    let cancelled = false;
    const playerId = player.id;
    api.getPlayerAchievements(playerId).then(items => {
      if (!cancelled) setBadges({ playerId, items });
    });
    api.getPlayerRecentMatches(playerId).then(items => {
      if (!cancelled) setMatches({ playerId, items });
    });
    return () => { cancelled = true; };
  }, [isOpen, player]);

  // Al cambiar de jugador las secciones vuelven a plegarse.
  useEffect(() => {
    setVerLogros(false);
    setVerPartidos(false);
  }, [player?.id]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen || !player) return null;

  const pos = player.position ?? 0;
  const cat: CatKey = categoryOf(pos) ?? 'C';
  const meta = CAT_META[cat];
  const now = new Date();
  const isImmune = !!(player.immune_until && new Date(player.immune_until) > now);
  const isVulnerable = !!(player.vulnerable_until && new Date(player.vulnerable_until) > now);
  const hasPending = player.challenged_challenge?.status === 'pending';
  const hasAccepted = player.challenger_challenge?.status === 'accepted' || player.challenged_challenge?.status === 'accepted';
  const hasSent = player.challenger_challenge?.status === 'pending';

  const shownBadges = badges?.playerId === player.id ? badges.items : [];
  const shownMatches = matches?.playerId === player.id ? matches.items : [];

  // Plegadas se ven 2 partidos y 4 insignias: lo justo para saber si vale la
  // pena abrir, sin que la ficha se vuelva una lista larga.
  const MATCHES_PLEGADOS = 2;
  const BADGES_PLEGADOS = 4;
  const visibleMatches = verPartidos ? shownMatches : shownMatches.slice(0, MATCHES_PLEGADOS);
  const visibleBadges = verLogros ? shownBadges : shownBadges.slice(0, BADGES_PLEGADOS);
  const openDetail =
    openBadge?.playerId === player.id
      ? (visibleBadges.find(b => b.code === openBadge.code) ?? null)
      : null;

  const effectiveness = player.total_matches > 0
    ? Math.round((player.wins / player.total_matches) * 100)
    : 0;

  // Con quién tiene el desafío abierto: el chip solo dice que lo tiene.
  const rival = activeRival(player);

  const chips: { label: string; cls: string }[] = [];
  if (isImmune)    chips.push({ label: 'Inmune',             cls: 'chip-info' });
  if (isVulnerable)chips.push({ label: 'Vulnerable',         cls: 'chip-warning' });
  if (hasPending)  chips.push({ label: 'Esperando respuesta',cls: 'chip-warning' });
  if (hasAccepted) chips.push({ label: 'Por jugar',          cls: 'chip-success' });
  if (hasSent)     chips.push({ label: 'Desafío enviado',    cls: 'chip-info' });

  const challengeReason = isImmune
    ? 'Este jugador está inmune'
    : isVulnerable
    ? 'No puedes desafiar (estás vulnerable)'
    : 'No puedes desafiar a este jugador';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      {/* La ficha crece con el historial y los logros: si no cabe, se desplaza
          dentro del recuadro en vez de salirse de la pantalla. */}
      <div className="relative w-full max-w-md animate-scale-in max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header — category gradient */}
          <div className={'relative p-6 bg-gradient-to-br ' + meta.gradient + ' overflow-hidden'}>
            <div className={'absolute -right-6 -top-10 font-display font-black select-none pointer-events-none cat-watermark-' + cat}
                 style={{ fontSize: 180, lineHeight: 1 }}>{cat}</div>
            <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white transition">
              <CloseIcon />
            </button>
            <div className="relative flex items-center gap-4">
              <AvatarEl player={player} size={72} />
              <div className="min-w-0">
                <div className={'text-[10px] uppercase tracking-[0.25em] font-bold cat-letter-' + cat}>{meta.label}</div>
                <div className="font-display font-bold text-white text-2xl truncate">{formatPlayerName(player.name)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-display font-black text-white" style={{ fontSize: 28, lineHeight: 1 }}>#{pos}</span>
                  <span className="text-white/60 text-xs">de {ladderSize}</span>
                </div>
              </div>
            </div>
            {chips.length > 0 && (
              <div className="relative mt-4 flex flex-wrap gap-1.5">
                {chips.map(c => (
                  <span key={c.label} className={'chip ' + c.cls}>{c.label}</span>
                ))}
              </div>
            )}
            {rival && (
              <div className="relative mt-2 text-xs font-semibold text-white/85">
                Desafío con {formatPlayerName(rival.name)}
                {rival.position ? <span className="text-white/50"> · #{rival.position}</span> : null}
              </div>
            )}
          </div>

          {/* Body */}
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatBox label="Victorias" value={player.wins}         colorClass="text-ctg-green" />
              <StatBox label="Derrotas"  value={player.losses}       colorClass="text-red-400" />
              <StatBox label="Partidos"  value={player.total_matches} colorClass="text-[#F0F7E8]" />
            </div>

            {player.total_matches > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="label">Efectividad</span>
                  <span className="font-mono text-ctg-green font-bold text-sm">{effectiveness}%</span>
                </div>
                <div className="h-1.5 bg-[#0a1608] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ctg-green rounded-full transition-all"
                    style={{ width: effectiveness + '%', boxShadow: '0 0 8px rgba(139,194,52,.5)' }}
                  />
                </div>
              </div>
            )}

            {shownMatches.length > 0 && (
              <div className="mb-5">
                {/* Sin contador: las estadísticas de arriba son de la temporada
                    y el historial viene de siempre; dos números distintos al
                    lado del otro se leen como un error. */}
                <div className="label mb-2">Últimos partidos</div>

                <div className="flex flex-col gap-1.5">
                  {visibleMatches.map(m => <MatchRow key={m.id} match={m} />)}
                </div>

                {shownMatches.length > MATCHES_PLEGADOS && (
                  <VerMas
                    expanded={verPartidos}
                    onClick={() => setVerPartidos(v => !v)}
                    restantes={shownMatches.length - MATCHES_PLEGADOS}
                  />
                )}
              </div>
            )}

            {shownBadges.length > 0 && (
              <div className="mb-5">
                <div className="label mb-2">
                  Logros <span className="text-[#F0F7E8]/30">· {shownBadges.length}</span>
                </div>

                {/* Con el nombre al lado: una insignia suelta no dice nada.
                    Al tocar una se despliega qué hay que hacer para ganarla. */}
                <div className="flex flex-wrap gap-1.5">
                  {visibleBadges.map(b => {
                    const isOpen = openDetail?.code === b.code;
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() =>
                          setOpenBadge(isOpen ? null : { playerId: player.id, code: b.code })
                        }
                        aria-expanded={isOpen}
                        className={
                          'flex items-center gap-1.5 rounded-full border pl-1 pr-2.5 py-1 transition ' +
                          (isOpen
                            ? 'bg-ctg-green/15 border-ctg-green/50'
                            : 'bg-[#152b18] border-[#1e4020] hover:border-ctg-green/40')
                        }
                      >
                        <AchievementBadge emoji={b.emoji} group={b.group} size="sm" />
                        <span className="text-xs font-semibold text-[#F0F7E8]/80 whitespace-nowrap">
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {openDetail && (
                  <div className="mt-2 bg-[#0a1608]/50 border border-[#1e4020] rounded-xl px-3 py-2.5 animate-slide-up">
                    <div className="text-xs text-[#F0F7E8]/60 leading-snug">
                      {openDetail.description}
                    </div>
                    <div className="text-[10px] text-ctg-green/70 font-semibold mt-1">
                      {badgeContext(openDetail)}
                    </div>
                  </div>
                )}

                {shownBadges.length > BADGES_PLEGADOS && (
                  <VerMas
                    expanded={verLogros}
                    onClick={() => setVerLogros(v => !v)}
                    restantes={shownBadges.length - BADGES_PLEGADOS}
                  />
                )}
              </div>
            )}

            {canChallenge ? (
              <button onClick={() => onChallenge(player)} className="btn-primary w-full py-3">
                <SwordsIcon />
                Desafiar a {player.name.split(' ')[0]}
              </button>
            ) : (
              <div className="bg-[#0a1608]/40 text-[#F0F7E8]/45 rounded-xl py-3 text-sm text-center border border-[#1e4020]">
                {challengeReason}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
