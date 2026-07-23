'use client';

import { useState, useMemo } from 'react';
import { Challenge, Player } from '@/types';

interface ChallengesListProps {
  challenges: Challenge[];
  currentPlayer: Player;
  onAccept: (challenge: Challenge) => void;
  onReject: (challenge: Challenge) => void;
  onSubmitResult?: (challenge: Challenge) => void;
  onScheduleDate?: (challenge: Challenge) => void;
  loading?: boolean;
}

/* ---- Icons ---- */
const I = {
  swords:   'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L21 0M19 5l-5 5',
  calendar: 'M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM8 3v4M16 3v4',
  flame:    'M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4-1 3 2 3 2 5 0-3 2-5 1-11z',
};
const Icon = ({ d, size = 16, strokeWidth = 1.7 }: { d: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

/* ---- Avatar ---- */
function AvatarEl({ player, size = 40, ring = true }: { player: Player; size?: number; ring?: boolean }) {
  const initials = player.name.trim().split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const base = `inline-flex items-center justify-center rounded-full font-display font-bold text-[#0a1608] shrink-0 overflow-hidden ${ring ? 'ring-2 ring-ctg-green/50 ring-offset-1 ring-offset-[#0a1608]' : ''}`;
  const style: React.CSSProperties = {
    width: size, height: size, fontSize: size * 0.36,
    background: 'linear-gradient(135deg, #9ed944, #8BC234 60%, #6ea127)',
  };
  if (player.avatar_url) {
    return <div className={base} style={style}><img src={player.avatar_url} alt="" className="w-full h-full object-cover" /></div>;
  }
  return <div className={base} style={style}>{initials}</div>;
}

/* ---- Formatting helpers ---- */
function daysLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
}
function hoursLeft(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 3600000);
}
function fmtDate(dateStr: string): string {
  return new Date(dateStr + (dateStr.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('es-CL', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

/* ---- Tab types ---- */
type Tab = 'toplay' | 'pending' | 'history';

/* ---- Pending Card ---- */
function PendingCard({ c, direction, me, onAccept, onReject }: {
  c: Challenge; direction: 'received' | 'sent'; me: Player;
  onAccept: (c: Challenge) => void; onReject: (c: Challenge) => void;
}) {
  const other = direction === 'received' ? c.challenger! : c.challenged!;
  const hl = hoursLeft(c.accept_deadline);
  const expiresSoon = hl < 12;
  return (
    <div className="bg-[#152b18] border border-[#1e4020] border-l-4 border-l-amber-500 rounded-xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <AvatarEl player={direction === 'received' ? other : me} size={40} ring={false} />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-[0.22em] text-[#F0F7E8]/40 font-bold">{direction === 'received' ? 'Te desafió' : 'Tú desafiaste'}</div>
          <div className="text-[#F0F7E8] font-bold text-sm truncate">{direction === 'received' ? other.name : me.name}</div>
          <div className="text-[#F0F7E8]/40 text-xs">#{(direction === 'received' ? other : me).position}</div>
        </div>
        <span className="font-display font-black text-ctg-green/30 text-lg">VS</span>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-[0.22em] text-[#F0F7E8]/40 font-bold">{direction === 'received' ? 'A ti' : 'Rival'}</div>
          <div className="text-[#F0F7E8] font-bold text-sm truncate">{direction === 'received' ? me.name : other.name}</div>
          <div className="text-[#F0F7E8]/40 text-xs">#{(direction === 'received' ? me : other).position}</div>
        </div>
        <AvatarEl player={direction === 'received' ? me : other} size={40} ring={false} />
      </div>
      <div className="flex items-center justify-between md:justify-end gap-3 md:min-w-[220px]">
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.22em] text-[#F0F7E8]/35 font-bold">Expira</div>
          <div className={`text-sm font-mono font-bold ${expiresSoon ? 'text-red-400' : 'text-amber-500'}`}>
            {hl > 24 ? `${daysLeft(c.accept_deadline)}d` : `${hl}h`}
          </div>
        </div>
        {direction === 'received' ? (
          <div className="flex gap-1.5">
            <button onClick={() => onAccept(c)} className="bg-ctg-green/20 border border-ctg-green/40 text-ctg-green rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-ctg-green hover:text-[#0a1608] transition">Aceptar</button>
            <button onClick={() => onReject(c)} className="btn-danger text-xs px-3 py-1.5">Rechazar</button>
          </div>
        ) : (
          <span className="chip chip-warning">Pendiente</span>
        )}
      </div>
    </div>
  );
}

/* ---- Play Card ---- */
function PlayCard({ c, me, onResult, onSchedule }: {
  c: Challenge; me: Player;
  onResult?: (c: Challenge) => void; onSchedule?: (c: Challenge) => void;
}) {
  const other = c.challenger_id === me.id ? c.challenged! : c.challenger!;
  const dl = daysLeft(c.play_deadline);
  const isUrgent = dl <= 2;
  const iSubmitted = (c.challenger_id === me.id && !!c.challenger_result) || (c.challenged_id === me.id && !!c.challenged_result);
  const bothSent = !!c.challenger_result && !!c.challenged_result;
  const borderLeft = bothSent ? 'border-l-blue-500' : isUrgent ? 'border-l-red-500' : 'border-l-ctg-green';

  return (
    <div className={'bg-[#152b18] border border-[#1e4020] border-l-4 rounded-xl p-4 md:p-5 ' + borderLeft}>
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <AvatarEl player={me} size={40} />
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.22em] text-[#F0F7E8]/40 font-bold">Tú</div>
            <div className="text-[#F0F7E8] font-bold text-sm truncate">{me.name.split(' ')[0]}</div>
            <div className="text-[#F0F7E8]/40 text-xs">#{me.position}</div>
          </div>
          <span className="font-display font-black text-ctg-green/30 text-lg">VS</span>
          <div className="min-w-0 flex-1">
            <div className="text-[9px] uppercase tracking-[0.22em] text-[#F0F7E8]/40 font-bold">Rival</div>
            <div className="text-[#F0F7E8] font-bold text-sm truncate">{other.name.split(' ')[0]}</div>
            <div className="text-[#F0F7E8]/40 text-xs">#{other.position}</div>
          </div>
          <AvatarEl player={other} size={40} ring={false} />
        </div>

        <div className="flex items-center gap-2 md:min-w-[230px] md:justify-end flex-wrap">
          {!c.scheduled_date ? (
            <>
              <span className={'chip ' + (isUrgent ? 'chip-danger' : 'chip-warning')}>
                {isUrgent ? `Urgente · ${dl}d` : 'Sin fecha'}
              </span>
              {onSchedule && (
                <button onClick={() => onSchedule(c)} className="btn-ghost text-xs px-3 py-1.5">Fijar fecha</button>
              )}
            </>
          ) : (
            <>
              <div className="bg-ctg-green/10 border border-ctg-green/25 rounded-lg px-3 py-1.5 text-ctg-green text-xs font-semibold flex items-center gap-1.5">
                <Icon d={I.calendar} size={12} /> {fmtDate(c.scheduled_date)}
              </div>
              {bothSent ? (
                <span className="chip chip-info">Resultado enviado</span>
              ) : iSubmitted ? (
                <span className="chip chip-success">Tu resultado enviado</span>
              ) : (
                onResult && <button onClick={() => onResult(c)} className="btn-primary text-xs px-3 py-1.5">Ingresar resultado</button>
              )}
            </>
          )}
          {c.scheduled_date && !bothSent && onSchedule && (
            <button onClick={() => onSchedule(c)} className="text-[#F0F7E8]/40 hover:text-ctg-green text-xs transition">Cambiar fecha</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---- History Card ---- */
function HistoryCard({ c, me }: { c: Challenge; me: Player }) {
  const other = c.challenger_id === me.id ? c.challenged! : c.challenger!;
  const won = c.winner_id === me.id;
  const isDispute = c.status === 'disputed';
  const isWO = c.final_score === 'W.O.' || c.status === 'rejected' || c.status === 'expired_not_accepted';
  const cls = isDispute ? 'border-l-amber-500' : won ? 'border-l-ctg-green' : 'border-l-red-500';
  const resolvedDate = c.resolved_at || c.played_at;

  return (
    <div className={'bg-[#152b18] border border-[#1e4020] border-l-4 rounded-xl p-3.5 ' + cls + ' flex items-center gap-3 md:gap-4'}>
      <AvatarEl player={other} size={36} ring={false} />
      <div className="flex-1 min-w-0">
        <div className="text-[#F0F7E8]/40 text-[9px] uppercase tracking-[0.22em] font-bold">vs</div>
        <div className="text-[#F0F7E8] font-semibold text-sm truncate">{other.name}</div>
      </div>
      {resolvedDate && <div className="text-[#F0F7E8]/40 text-xs hidden md:block">{fmtDate(resolvedDate)}</div>}
      {c.final_score && <div className="text-[#F0F7E8]/70 text-xs font-mono hidden sm:block">{c.final_score}</div>}
      <span className={'chip ' + (isDispute ? 'chip-warning' : isWO ? 'chip-muted' : won ? 'chip-success' : 'chip-danger')}>
        {isDispute ? 'Disputa' : isWO ? 'W.O.' : won ? 'Victoria' : 'Derrota'}
      </span>
    </div>
  );
}

/* ---- Action Banner ---- */
function ActionBanner({ received, urgent, onPending, onToplay }: {
  received: number; urgent: number; onPending: () => void; onToplay: () => void;
}) {
  if (received === 0 && urgent === 0) return null;
  return (
    <div className="rounded-2xl p-4 md:p-5 mb-6 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-5 relative overflow-hidden"
         style={{ background: 'linear-gradient(to right, rgba(245,158,11,.12), rgba(139,194,52,.08))', border: '1px solid rgba(245,158,11,.35)' }}>
      <div className="absolute right-0 top-0 bottom-0 w-32 opacity-20 pointer-events-none"
           style={{ background: 'radial-gradient(circle at 80% 50%, rgba(245,158,11,.5), transparent 70%)' }} />
      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center text-amber-500 shrink-0 animate-glow-pulse">
        <Icon d={I.flame} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-500">Acción requerida</div>
        <div className="text-[#F0F7E8] font-semibold mt-0.5">
          {received > 0 && `${received} desafío${received > 1 ? 's' : ''} esperan respuesta`}
          {received > 0 && urgent > 0 && ' · '}
          {urgent > 0 && `${urgent} partido${urgent > 1 ? 's' : ''} sin agendar`}
        </div>
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        {received > 0 && <button onClick={onPending} className="btn-primary text-xs px-3.5 py-2">Responder</button>}
        {urgent > 0 && <button onClick={onToplay} className="btn-ghost text-xs px-3.5 py-2">Agendar</button>}
      </div>
    </div>
  );
}

/* ---- Main Component ---- */
export default function ChallengesList({
  challenges, currentPlayer, onAccept, onReject, onSubmitResult, onScheduleDate,
}: ChallengesListProps) {
  const [tab, setTab] = useState<Tab>('toplay');

  const myId = currentPlayer.id;

  const pending = useMemo(() => challenges.filter(c => c.status === 'pending'), [challenges]);
  const accepted = useMemo(() => challenges.filter(c => c.status === 'accepted'), [challenges]);
  const history = useMemo(() => challenges.filter(c =>
    ['completed', 'rejected', 'disputed', 'cancelled', 'expired_not_accepted', 'expired_not_played'].includes(c.status)
  ), [challenges]);

  const pendingReceived = pending.filter(c => c.challenged_id === myId);
  const urgentToPlay = accepted.filter(c => {
    const dl = daysLeft(c.play_deadline);
    return dl <= 2 && !c.scheduled_date;
  });

  const tabs = [
    { value: 'toplay'  as Tab, label: 'Por jugar',  count: accepted.length },
    { value: 'pending' as Tab, label: 'Pendientes', count: pending.length  },
    { value: 'history' as Tab, label: 'Historial',  count: history.length  },
  ];

  const currentList = tab === 'toplay' ? accepted : tab === 'pending' ? pending : history;

  return (
    <div>
      {/* Action Banner */}
      <ActionBanner
        received={pendingReceived.length}
        urgent={urgentToPlay.length}
        onPending={() => setTab('pending')}
        onToplay={() => setTab('toplay')}
      />

      {/* Tabs */}
      <div className="flex bg-[#152b18] border border-[#1e4020] rounded-xl p-1 gap-1 mb-6 w-fit">
        {tabs.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={'relative px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ' +
              (tab === t.value
                ? 'bg-ctg-green/15 text-ctg-green'
                : 'text-[#F0F7E8]/55 hover:text-[#F0F7E8]')}
          >
            {t.label}
            {t.count > 0 && (
              <span className={'min-w-[20px] h-[20px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ' +
                (tab === t.value ? 'bg-ctg-green text-[#0a1608]' : 'bg-[#1e4020] text-[#F0F7E8]/60')}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {currentList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#152b18] border border-[#1e4020] flex items-center justify-center text-[#F0F7E8]/30 mb-4">
            <Icon d={tab === 'toplay' ? I.swords : tab === 'pending' ? I.flame : I.calendar} size={22} />
          </div>
          <p className="text-[#F0F7E8]/45 text-sm">Sin desafíos en esta vista</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tab === 'pending' && currentList.map(c => (
            <PendingCard
              key={c.id}
              c={c}
              direction={c.challenged_id === myId ? 'received' : 'sent'}
              me={currentPlayer}
              onAccept={onAccept}
              onReject={onReject}
            />
          ))}
          {tab === 'toplay' && currentList.map(c => (
            <PlayCard
              key={c.id}
              c={c}
              me={currentPlayer}
              onResult={onSubmitResult}
              onSchedule={onScheduleDate}
            />
          ))}
          {tab === 'history' && currentList.map(c => (
            <HistoryCard key={c.id} c={c} me={currentPlayer} />
          ))}
        </div>
      )}
    </div>
  );
}
