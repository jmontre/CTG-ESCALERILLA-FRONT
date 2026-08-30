'use client';

import { useEffect, useState } from 'react';
import { Player, UnlockedAchievement } from '@/types';
import { api } from '@/lib/api';
import AchievementBadge from './AchievementBadge';
import { CatKey, CAT_META, categoryOf } from '@/lib/ladder';
import { formatPlayerName } from '@/lib/formatName';

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

  useEffect(() => {
    if (!isOpen || !player) return;
    let cancelled = false;
    const playerId = player.id;
    api.getPlayerAchievements(playerId).then(items => {
      if (!cancelled) setBadges({ playerId, items });
    });
    return () => { cancelled = true; };
  }, [isOpen, player]);

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

  const effectiveness = player.total_matches > 0
    ? Math.round((player.wins / player.total_matches) * 100)
    : 0;

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
      <div className="relative w-full max-w-md animate-scale-in">
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

            {shownBadges.length > 0 && (
              <div className="mb-5">
                <div className="label mb-2">Logros</div>
                <div className="flex flex-wrap gap-2">
                  {shownBadges.slice(0, 12).map(b => (
                    <AchievementBadge
                      key={b.code}
                      emoji={b.emoji}
                      group={b.group}
                      size="sm"
                      title={`${b.name} — ${b.description}`}
                    />
                  ))}
                  {shownBadges.length > 12 && (
                    <span className="self-center text-xs text-[#F0F7E8]/40 font-semibold">
                      +{shownBadges.length - 12}
                    </span>
                  )}
                </div>
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
