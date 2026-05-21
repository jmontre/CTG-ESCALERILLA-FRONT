'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import type { Challenge } from '@/types';

/* ---- Icon helper ---- */
const I = {
  calendar:  'M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM8 3v4M16 3v4',
  swords:    'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L21 0M19 5l-5 5',
  flame:     'M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4-1 3 2 3 2 5 0-3 2-5 1-11z',
  check:     'M5 12l4 4 10-10',
  chevRight: 'M9 18l6-6-6-6',
  pyramid:   'M4 7h16M7 12h10M10 17h4',
};
const Icon = ({ d, size = 16, strokeWidth = 1.7 }: { d: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const CAT_COLORS = { A: '#FCD34D', B: '#D1D5DB', C: '#FBA76F', D: '#8BC234' };
function getCategoryFromPosition(pos: number | null | undefined): 'A' | 'B' | 'C' | 'D' | null {
  if (!pos || pos <= 0) return null;
  if (pos <= 12) return 'A';
  if (pos <= 24) return 'B';
  if (pos <= 36) return 'C';
  return 'D';
}
function CatDot({ cat }: { cat: 'A' | 'B' | 'C' | 'D' }) {
  const color = CAT_COLORS[cat];
  return (
    <span className="inline-block rounded-full" style={{ width: 8, height: 8, background: color, boxShadow: `0 0 6px ${color}55` }} />
  );
}

/* ---- QuickChip ---- */
function QuickChip({ label, sub, dot, onClick }: { label: string; sub: string; dot?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group bg-[#0a1608]/80 backdrop-blur-md border border-ctg-green/20 hover:border-ctg-green/55 rounded-full pl-3 pr-5 py-2.5 flex items-center gap-3 transition text-left"
    >
      <span
        className={'w-2 h-2 rounded-full ' + (dot ? 'bg-ctg-green animate-pulse' : 'bg-ctg-green/40')}
        style={{ boxShadow: dot ? '0 0 10px #8BC234' : 'none' }}
      />
      <div className="leading-tight">
        <div className="text-[#F0F7E8]/85 group-hover:text-ctg-green transition text-sm font-semibold">{label}</div>
        <div className="text-[#F0F7E8]/40 text-[10px] uppercase tracking-widest">{sub}</div>
      </div>
    </button>
  );
}

/* ---- NextUpWidget ---- */
interface NextUpItem {
  kind: 'pending' | 'urgent' | 'next' | 'idle';
  title: string;
  sub: string;
  action: string;
  route: string;
  urgent: boolean;
}
function NextUpWidget({ challenges }: { challenges: Challenge[] }) {
  const router = useRouter();
  const items: NextUpItem[] = [];

  const pending = challenges.filter(c => c.status === 'pending' && !c.challenger_result && !c.challenged_result);
  const accepted = challenges.filter(c => c.status === 'accepted');
  const urgentMatch = accepted.find(c => {
    if (!c.play_deadline) return false;
    const days = (new Date(c.play_deadline).getTime() - Date.now()) / 86400000;
    return days <= 3 && !c.scheduled_date;
  });
  const nextPlay = accepted.find(c => c.scheduled_date);

  if (pending.length) {
    items.push({
      kind: 'pending',
      title: `${pending.length} desafío${pending.length > 1 ? 's' : ''} esperan tu respuesta`,
      sub: 'Acepta o rechaza · 72h máximo',
      action: 'Ir a desafíos', route: '/fixture', urgent: true,
    });
  }
  if (urgentMatch) {
    const other = urgentMatch.challenger?.name ?? urgentMatch.challenged?.name ?? 'rival';
    const days = Math.max(1, Math.ceil((new Date(urgentMatch.play_deadline).getTime() - Date.now()) / 86400000));
    items.push({
      kind: 'urgent',
      title: `Agenda partido vs ${other}`,
      sub: `Quedan ${days} día${days !== 1 ? 's' : ''} · sin fecha`,
      action: 'Fijar fecha', route: '/fixture', urgent: true,
    });
  }
  if (nextPlay) {
    const other = nextPlay.challenger?.name ?? nextPlay.challenged?.name ?? 'rival';
    items.push({
      kind: 'next',
      title: `Próximo partido vs ${other}`,
      sub: nextPlay.scheduled_date ? new Date(nextPlay.scheduled_date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }) : '',
      action: 'Ver detalle', route: '/fixture', urgent: false,
    });
  }
  if (items.length === 0) {
    items.push({
      kind: 'idle',
      title: 'Todo al día',
      sub: 'No tienes acciones pendientes',
      action: 'Ver escalerilla', route: '/escalerilla', urgent: false,
    });
  }

  const iconMap = { pending: I.swords, urgent: I.flame, next: I.calendar, idle: I.check };

  return (
    <aside className="hidden lg:flex absolute right-8 top-24 flex-col gap-2 max-w-[320px] w-[320px]">
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#F0F7E8]/45 font-bold flex items-center gap-2 mb-1">
        <span className="w-1 h-1 rounded-full bg-ctg-green" /> Lo siguiente para ti
      </div>
      {items.slice(0, 3).map((it, i) => (
        <button
          key={i}
          onClick={() => router.push(it.route)}
          className={'w-full text-left rounded-xl p-4 transition group backdrop-blur-md ' +
            (it.urgent
              ? 'bg-ctg-green/10 border border-ctg-green/35 hover:border-ctg-green/60 hover:bg-ctg-green/15'
              : 'bg-[#0f2211]/85 border border-[#1e4020] hover:border-ctg-green/35')}
        >
          <div className="flex items-start gap-3">
            <div className={'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' +
              (it.urgent ? 'bg-ctg-green/20 text-ctg-green' : 'bg-[#152b18] text-[#F0F7E8]/60')}>
              <Icon d={iconMap[it.kind]} size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-[#F0F7E8] leading-tight">{it.title}</div>
              <div className="text-[#F0F7E8]/50 text-[11px] mt-0.5">{it.sub}</div>
              <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-ctg-green group-hover:gap-2 transition-all">
                {it.action} <Icon d={I.chevRight} size={11} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </button>
      ))}
    </aside>
  );
}

/* ---- Page ---- */
export default function HomePage() {
  const { player, refreshPlayer } = useAuth();
  const router = useRouter();
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  const cat = getCategoryFromPosition(player?.position);

  useEffect(() => {
    if (!player) return;
    api.getChallenges().then(data => setChallenges(data)).catch(() => {});
  }, [player]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setLoginModalOpen(true)} />

      <main className="relative flex-1 overflow-hidden min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-72px)]">
        {/* Background */}
        <div className="absolute inset-0 landing-bg" />

        {/* Tennis court SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-25"
          preserveAspectRatio="xMidYMid slice"
          viewBox="0 0 1200 700"
        >
          <g stroke="#8BC234" strokeWidth="1.4" fill="none" opacity="0.7">
            <rect x="220" y="180" width="760" height="340" rx="2" />
            <rect x="320" y="220" width="560" height="260" />
            <line x1="320" y1="350" x2="880" y2="350" />
            <line x1="600" y1="180" x2="600" y2="520" />
            <line x1="320" y1="265" x2="880" y2="265" strokeDasharray="6 6" opacity="0.5" />
            <line x1="320" y1="435" x2="880" y2="435" strokeDasharray="6 6" opacity="0.5" />
            <line x1="220" y1="350" x2="980" y2="350" stroke="#1a2410" opacity="0.4" />
          </g>
          <circle cx="710" cy="320" r="9" fill="#8BC234" opacity="0.85" />
          <circle cx="710" cy="320" r="9" fill="none" stroke="#0a1608" strokeWidth="1" />
        </svg>

        {/* Vignette */}
        <div className="absolute inset-0 landing-vignette-1" />
        <div className="absolute inset-0 landing-vignette-2" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-5 lg:px-8 pt-16 md:pt-28 pb-40">
          <div className="max-w-xl">
            <div className="w-16 h-0.5 bg-ctg-green mb-6 glow-soft" />
            <p className="text-ctg-green font-bold text-xs uppercase tracking-[0.3em] mb-4">
              Temporada 2026 · En curso
            </p>
            <h1 className="font-display font-extrabold text-[#F0F7E8] leading-[0.95] tracking-tight" style={{ fontSize: 'clamp(2.5rem,7vw,5.5rem)' }}>
              Club de Tenis<br />
              <span className="text-ctg-green" style={{ textShadow: '0 0 30px rgba(139,194,52,.45)' }}>Graneros</span>
            </h1>
            <p className="text-[#F0F7E8]/60 text-lg mt-6 max-w-md leading-relaxed">
              Escalerilla piramidal, reservas de cancha y el Torneo Master. Todo el club, en un solo lugar.
            </p>

            <div className="flex flex-wrap gap-3 mt-8">
              <button onClick={() => router.push('/reservar')} className="btn-primary px-6 py-3 text-base">
                <Icon d={I.calendar} size={16} /> Reservar cancha
              </button>
              <button onClick={() => router.push('/escalerilla')} className="btn-ghost px-6 py-3 text-base">
                <Icon d={I.pyramid} size={16} /> Ver escalerilla
              </button>
              {!player && (
                <button onClick={() => setLoginModalOpen(true)} className="text-[#F0F7E8]/60 hover:text-[#F0F7E8] text-sm px-3 py-3 transition">
                  Iniciar sesión
                </button>
              )}
            </div>

            {player && cat && (
              <div className="text-[#F0F7E8]/55 text-sm mt-8 flex items-center gap-2 flex-wrap">
                <CatDot cat={cat} />
                Bienvenido de vuelta, <span className="text-ctg-green font-semibold">{player.name.split(' ')[0]}</span>
                <span className="text-[#F0F7E8]/30">·</span>
                <span>Posición #{player.position} · Categoría {cat}</span>
              </div>
            )}
            {player && !cat && (
              <div className="text-[#F0F7E8]/55 text-sm mt-8">
                Bienvenido, <span className="text-ctg-green font-semibold">{player.name.split(' ')[0]}</span>
              </div>
            )}
          </div>

          {player && <NextUpWidget challenges={challenges} />}
        </div>

        {/* Quick chips — bottom anchored */}
        <div className="absolute bottom-8 left-0 right-0 px-5 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-3 pb-16 md:pb-0">
            <QuickChip label="Reservar cancha" sub="Canchas disponibles" dot onClick={() => router.push('/reservar')} />
            <QuickChip label="Escalerilla" sub="Ver posiciones" onClick={() => router.push('/escalerilla')} />
            <QuickChip label="Master 2026" sub="Cat A · En curso" onClick={() => router.push('/master')} />
            <div className="flex-1" />
            <div className="hidden md:flex items-center gap-3 text-[#F0F7E8]/30 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-ctg-green animate-pulse" />
              Club de Tenis Graneros · 2026
            </div>
          </div>
        </div>
      </main>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => { setLoginModalOpen(false); refreshPlayer(); }}
      />
    </div>
  );
}
