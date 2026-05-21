'use client';

import { Player } from '@/types';
import { formatPlayerName } from '@/lib/formatName';

/* ---- Types ---- */
interface LadderProps {
  players: Player[];
  currentPlayerId?: string;
  onPlayerClick: (player: Player) => void;
}

/* ---- Category metadata ---- */
type CatKey = 'A' | 'B' | 'C' | 'D';
const CAT_META: Record<CatKey, { label: string; gradient: string; border: string; sub: string }> = {
  A: { label: 'Élite',      gradient: 'from-yellow-900/50 to-yellow-950/30', border: 'border-yellow-700/20', sub: 'Pos. 1–12' },
  B: { label: 'Avanzado',   gradient: 'from-gray-700/50 to-gray-800/30',     border: 'border-gray-600/20',  sub: 'Pos. 13–24' },
  C: { label: 'Intermedio', gradient: 'from-orange-900/50 to-orange-950/30', border: 'border-orange-700/20', sub: 'Pos. 25–36' },
  D: { label: 'Desarrollo', gradient: 'from-green-900/50 to-green-950/30',   border: 'border-green-700/20', sub: 'Pos. 37–48' },
};

const PYRAMID_ROWS: Record<CatKey, number[][]> = {
  A: [[1], [2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]],
  B: [[13, 14, 15], [16, 17, 18, 19], [20, 21, 22, 23, 24]],
  C: [[25, 26, 27], [28, 29, 30, 31], [32, 33, 34, 35, 36]],
  D: [[37, 38, 39], [40, 41, 42, 43], [44, 45, 46, 47, 48]],
};

/* ---- Icon ---- */
const Icon = ({ d, size = 16, strokeWidth = 1.7 }: { d: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const I_SWORDS = 'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L21 0M19 5l-5 5';

/* ---- Avatar ---- */
function PlayerAvatar({ player, size = 36, ring = true }: { player: Player; size?: number; ring?: boolean }) {
  const initials = player.name.trim().split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const style: React.CSSProperties = {
    width: size, height: size, fontSize: size * 0.36,
    background: 'linear-gradient(135deg, #9ed944, #8BC234 60%, #6ea127)',
  };
  const cls = `inline-flex items-center justify-center rounded-full font-display font-bold text-[#0a1608] shrink-0 overflow-hidden ${ring ? 'ring-2 ring-ctg-green/50 ring-offset-1 ring-offset-[#0a1608]' : ''}`;
  if (player.avatar_url) {
    return <div className={cls} style={style}><img src={player.avatar_url} alt="" className="w-full h-full object-cover" /></div>;
  }
  return <div className={cls} style={style}>{initials}</div>;
}

/* ---- Player state derivation ---- */
type PlayerState = 'inmune' | 'vulnerable' | 'esperando' | 'por_jugar' | 'enviado';
function getPlayerStates(player: Player): PlayerState[] {
  const states: PlayerState[] = [];
  const now = new Date();
  if (player.immune_until && new Date(player.immune_until) > now) states.push('inmune');
  if (player.vulnerable_until && new Date(player.vulnerable_until) > now) states.push('vulnerable');
  if (player.challenged_challenge?.status === 'pending') states.push('esperando');
  if (player.challenger_challenge?.status === 'accepted' || player.challenged_challenge?.status === 'accepted') states.push('por_jugar');
  if (player.challenger_challenge?.status === 'pending') states.push('enviado');
  return states;
}

const STATE_CHIP: Record<PlayerState, { label: string; cls: string }> = {
  inmune:    { label: 'Inmune',    cls: 'chip-info' },
  vulnerable:{ label: 'Vulnerable',cls: 'chip-warning' },
  esperando: { label: 'Esperando', cls: 'chip-warning' },
  por_jugar: { label: 'Por jugar', cls: 'chip-success' },
  enviado:   { label: 'Enviado',   cls: 'chip-info' },
};

/* ---- Effectiveness ---- */
function eff(player: Player) {
  if (!player.total_matches) return 0;
  return Math.round((player.wins / player.total_matches) * 100);
}

/* ---- Mobile player card ---- */
function PlayerCardMobile({ player, tier, cat, isMe, onClick }: {
  player: Player; tier: 'xl' | 'lg' | 'md' | 'sm'; cat: CatKey; isMe: boolean; onClick: () => void;
}) {
  const conf = {
    xl: { pad: 'p-4',   num: 'text-[60px]', avatar: 52, name: 'text-base' },
    lg: { pad: 'p-3',   num: 'text-[44px]', avatar: 38, name: 'text-sm' },
    md: { pad: 'p-2.5', num: 'text-[36px]', avatar: 30, name: 'text-xs' },
    sm: { pad: 'p-2',   num: 'text-[30px]', avatar: 24, name: 'text-[11px]' },
  }[tier];
  const states = getPlayerStates(player);
  const firstName = tier === 'sm'
    ? (player.name.split(' ')[1] || player.name.split(' ')[0])
    : player.name.split(' ')[0];

  return (
    <button
      onClick={onClick}
      className={'relative flex flex-col items-center gap-1 rounded-xl min-w-0 transition-all ' + conf.pad + ' ' +
        (isMe
          ? 'bg-ctg-green/15 border-2 border-ctg-green/65 shadow-[0_0_18px_rgba(139,194,52,0.18)]'
          : 'bg-[#152b18] border border-[#1e4020]')}
    >
      <div className={'font-display font-black leading-none tabular-nums cat-num-' + cat + ' ' + conf.num} style={{ letterSpacing: '-0.05em' }}>
        {player.position}
      </div>
      <div className="flex items-center gap-1 mt-1 min-w-0 w-full justify-center">
        <PlayerAvatar player={player} size={conf.avatar} ring={false} />
        <div className={'font-semibold text-[#F0F7E8] truncate ' + conf.name}>{firstName}</div>
      </div>
      {tier !== 'sm' && (
        <div className="font-mono text-[10px] flex items-center gap-1 mt-0.5">
          <span className="text-ctg-green/85">{player.wins}V</span>
          <span className="text-[#F0F7E8]/20">·</span>
          <span className="text-red-400/70">{player.losses}D</span>
        </div>
      )}
      {states.length > 0 && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{
          background: states[0] === 'inmune' || states[0] === 'enviado' ? '#60a5fa' :
                      states[0] === 'por_jugar' ? '#8BC234' : '#fbbf24',
        }} />
      )}
      {isMe && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-ctg-green text-[#0a1608] text-[8px] font-black px-1.5 py-0.5 rounded-full tracking-widest">TÚ</div>
      )}
    </button>
  );
}

/* ---- Desktop player card ---- */
function PlayerCardDesktop({ player, tier, cat, isMe, onClick }: {
  player: Player; tier: 'xl' | 'lg' | 'md'; cat: CatKey; isMe: boolean; onClick: () => void;
}) {
  const conf = {
    xl: { pad: 'p-5',   num: 60, avatar: 48, name: 'text-base',   showDivider: true,  showPct: true,  shortName: false },
    lg: { pad: 'p-4',   num: 46, avatar: 38, name: 'text-sm',     showDivider: true,  showPct: true,  shortName: false },
    md: { pad: 'p-2.5', num: 32, avatar: 30, name: 'text-[13px]', showDivider: false, showPct: false, shortName: true  },
  }[tier];
  const states = getPlayerStates(player);
  const parts = player.name.split(' ');
  const displayName = conf.shortName ? `${parts[0]} ${parts[1]?.[0] ?? ''}.` : formatPlayerName(player.name);

  return (
    <button
      onClick={onClick}
      className={'relative flex items-stretch gap-2.5 rounded-xl transition-all text-left min-w-0 overflow-hidden ' + conf.pad + ' ' +
        (isMe
          ? 'bg-ctg-green/15 border-2 border-ctg-green/65 shadow-[0_0_25px_rgba(139,194,52,0.18)]'
          : 'bg-[#152b18] border border-[#1e4020] hover:border-ctg-green/45 hover:shadow-[0_0_18px_rgba(139,194,52,0.08)]')}
    >
      <div className="flex flex-col items-center justify-center shrink-0" style={{ minWidth: conf.num * 0.95 }}>
        <div className={'font-display font-black leading-none tabular-nums cat-num-' + cat}
             style={{ fontSize: conf.num, letterSpacing: '-0.04em' }}>
          {player.position}
        </div>
        <div className="text-[8px] uppercase tracking-[0.2em] font-bold text-[#F0F7E8]/35 mt-1">POS</div>
      </div>

      {conf.showDivider && <div className={'w-px self-stretch shrink-0 cat-divider-' + cat} />}

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <PlayerAvatar player={player} size={conf.avatar} ring={!isMe} />
        <div className="min-w-0 flex-1">
          <div className={'font-semibold text-[#F0F7E8] truncate ' + conf.name}>{displayName}</div>
          <div className="flex items-center gap-1 mt-0.5 font-mono text-[11px]">
            <span className="text-ctg-green/85 whitespace-nowrap">{player.wins}V</span>
            <span className="text-[#F0F7E8]/20">·</span>
            <span className="text-red-400/70 whitespace-nowrap">{player.losses}D</span>
            {conf.showPct && (
              <>
                <span className="text-[#F0F7E8]/20">·</span>
                <span className="text-[#F0F7E8]/60 whitespace-nowrap">{eff(player)}%</span>
              </>
            )}
          </div>
          {states.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {states.slice(0, tier === 'md' ? 1 : 2).map(s => (
                <span key={s} className={'chip text-[9px] px-1.5 py-0 ' + STATE_CHIP[s].cls}>
                  {STATE_CHIP[s].label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {isMe && (
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-ctg-green text-[#0a1608] text-[9px] font-black px-2 py-0.5 rounded-full tracking-widest whitespace-nowrap" style={{ boxShadow: '0 0 12px rgba(139,194,52,.7)' }}>
          TÚ
        </div>
      )}
    </button>
  );
}

/* ---- Pyramid Row ---- */
function PyramidRow({ row, ri, cat, onPlayerClick, currentPlayerId }: {
  row: Player[]; ri: number; cat: CatKey; onPlayerClick: (p: Player) => void; currentPlayerId?: string;
}) {
  const cols = row.length;
  const desktopTier: 'xl' | 'lg' | 'md' = ri === 0 ? 'xl' : ri === 1 ? 'lg' : 'md';
  const mobileTier: 'xl' | 'lg' | 'md' | 'sm' = cols === 1 ? 'xl' : cols <= 3 ? 'lg' : cols === 4 ? 'md' : 'sm';

  return (
    <>
      {/* Mobile */}
      <div className="md:hidden mx-auto" style={{ maxWidth: 520 }}>
        <div className="text-center mb-1.5">
          <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#F0F7E8]/35">
            Fila {ri + 1} · {row.length} {row.length === 1 ? 'jugador' : 'jugadores'}
          </span>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {row.map(p => (
            <PlayerCardMobile
              key={p.id} player={p} tier={mobileTier} cat={cat}
              isMe={p.id === currentPlayerId} onClick={() => onPlayerClick(p)}
            />
          ))}
        </div>
      </div>
      {/* Desktop */}
      <div className="hidden md:block mx-auto" style={{ maxWidth: Math.min(1100, 260 + cols * 230) }}>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {row.map(p => (
            <PlayerCardDesktop
              key={p.id} player={p} tier={desktopTier} cat={cat}
              isMe={p.id === currentPlayerId} onClick={() => onPlayerClick(p)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/* ---- Category Block ---- */
function CategoryBlock({ cat, players, currentPlayerId, onPlayerClick }: {
  cat: CatKey; players: Player[]; currentPlayerId?: string; onPlayerClick: (p: Player) => void;
}) {
  const meta = CAT_META[cat];
  const byPos = Object.fromEntries(players.map(p => [p.position!, p]));
  const rows = PYRAMID_ROWS[cat].map(positions =>
    positions.map(pos => byPos[pos]).filter((p): p is Player => !!p)
  ).filter(row => row.length > 0);

  return (
    <div className="relative bg-[#0f2211] border border-[#1e4020] rounded-3xl overflow-hidden">
      {/* Header */}
      <div className={'relative bg-gradient-to-r ' + meta.gradient + ' border-b ' + meta.border + ' px-5 md:px-8 py-5 overflow-hidden'}>
        <div className={'font-display font-black select-none pointer-events-none absolute -right-2 -top-6 leading-none cat-watermark-' + cat} style={{ fontSize: 180 }}>{cat}</div>
        <div className="relative flex items-center gap-4">
          <div className={'font-display font-black leading-none cat-letter-' + cat} style={{ fontSize: 56 }}>{cat}</div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#F0F7E8]/55">Categoría</div>
            <div className="font-display font-bold text-[#F0F7E8] text-xl mt-0.5">{meta.label}</div>
          </div>
        </div>
      </div>

      {/* Pyramid rows */}
      <div className="px-3 md:px-6 py-6 md:py-8 space-y-3 md:space-y-5">
        {rows.map((row, ri) => (
          <PyramidRow
            key={ri} row={row} ri={ri} cat={cat}
            onPlayerClick={onPlayerClick} currentPlayerId={currentPlayerId}
          />
        ))}
      </div>
    </div>
  );
}

/* ---- Challenge Zone ---- */
function ChallengeZone({ currentPlayer, allPlayers, onPlayerClick }: {
  currentPlayer: Player; allPlayers: Player[]; onPlayerClick: (p: Player) => void;
}) {
  const myPos = currentPlayer.position ?? 0;
  if (myPos <= 0) return null;
  const targets = allPlayers
    .filter(p => (p.position ?? 0) > 0 && p.position! < myPos && p.position! >= myPos - 5)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  if (targets.length === 0) return null;

  const getCat = (pos: number): CatKey => pos <= 12 ? 'A' : pos <= 24 ? 'B' : pos <= 36 ? 'C' : 'D';

  return (
    <div className="mb-10 bg-[#0f2211] border border-ctg-green/25 rounded-2xl p-5 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-20 pointer-events-none"
           style={{ background: 'radial-gradient(circle, rgba(139,194,52,.4), transparent 70%)' }} />
      <div className="flex items-baseline justify-between mb-3 relative">
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-ctg-green">Tu zona de desafío</div>
          <div className="text-[#F0F7E8]/55 text-sm mt-0.5">Puedes retar hasta 5 posiciones arriba</div>
        </div>
        <span className="text-[#F0F7E8]/30 text-xs font-mono">{targets.length} disponibles</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 relative">
        {targets.map(p => (
          <button
            key={p.id}
            onClick={() => onPlayerClick(p)}
            className="bg-[#152b18] border border-[#1e4020] hover:border-ctg-green/45 hover:bg-ctg-green/5 rounded-xl p-3 transition text-left flex items-center gap-2.5 group"
          >
            <div className={'font-display font-black text-xl tabular-nums cat-num-' + getCat(p.position!)} style={{ letterSpacing: '-0.04em' }}>
              #{p.position}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[#F0F7E8] text-xs font-semibold truncate">{formatPlayerName(p.name)}</div>
              <div className="text-ctg-green/75 text-[10px] font-semibold flex items-center gap-1 mt-0.5">
                Retar <Icon d={I_SWORDS} size={10} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---- Main Ladder component ---- */
export default function Ladder({ players, currentPlayerId, onPlayerClick }: LadderProps) {
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const activePlayers = players.filter(p => (p.position ?? 0) > 0);

  const byCategory: Record<CatKey, Player[]> = { A: [], B: [], C: [], D: [] };
  for (const p of activePlayers) {
    const pos = p.position!;
    const cat: CatKey = pos <= 12 ? 'A' : pos <= 24 ? 'B' : pos <= 36 ? 'C' : 'D';
    byCategory[cat].push(p);
  }

  return (
    <div className="space-y-8">
      {/* Challenge zone */}
      {currentPlayer && (currentPlayer.position ?? 0) > 0 && (
        <ChallengeZone currentPlayer={currentPlayer} allPlayers={activePlayers} onPlayerClick={onPlayerClick} />
      )}

      {/* Category blocks */}
      {(['A', 'B', 'C', 'D'] as CatKey[]).map(cat => (
        <CategoryBlock
          key={cat} cat={cat} players={byCategory[cat]}
          currentPlayerId={currentPlayerId} onPlayerClick={onPlayerClick}
        />
      ))}

      {/* Legend */}
      <div className="card mt-12 p-6">
        <h3 className="font-display font-bold text-[#F0F7E8] mb-4">Leyenda</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {([
            ['chip-info',    'Inmune (3 días post-victoria)'],
            ['chip-warning', 'Vulnerable a desafíos'],
            ['chip-warning', 'Esperando respuesta'],
            ['chip-success', 'Partido por jugar'],
            ['chip-info',    'Desafío enviado'],
            ['chip-muted',   'Sin actividad'],
          ] as [string, string][]).map(([cls, text]) => (
            <div key={text} className="flex items-center gap-2.5">
              <span className={'chip ' + cls + ' p-0 rounded-full'} style={{ width: 8, height: 8, minWidth: 8 }} />
              <span className="text-[#F0F7E8]/60">{text}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 pt-5 border-t border-[#1e4020] grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {(['A', 'B', 'C', 'D'] as CatKey[]).map(c => (
            <div key={c} className="flex items-center gap-2 text-[#F0F7E8]/65">
              <span className={'font-display font-black text-base cat-letter-' + c}>{c}</span>
              <span>{CAT_META[c].sub} · {CAT_META[c].label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
