'use client';

import { useEffect, useState } from 'react';

const SCREENS = [
  {
    title: 'Así funciona la escalerilla',
    body: 'Todos los socios están ordenados en una pirámide de 4 categorías. Puedes desafiar a jugadores en posiciones superiores a la tuya. Si ganas, ¡intercambian posiciones!',
    visual: 'ladder' as const,
  },
  {
    title: 'Reservar una cancha es fácil',
    body: 'Elige cancha, día, hora y con quién juegas — paso a paso. Tu reserva queda confirmada al instante y puedes verla o cambiarla en "Mis reservas".',
    visual: 'court' as const,
  },
  {
    title: 'Tus partidos, en un solo lugar',
    body: 'En "Desafíos" ves todo: quién te retó, tus próximos partidos y tu historial. La campana 🔔 te avisa cuando algo necesita tu respuesta.',
    visual: 'matches' as const,
  },
];

function Visual({ kind }: { kind: 'ladder' | 'court' | 'matches' }) {
  if (kind === 'ladder') {
    return (
      <div className="flex flex-col items-center gap-1.5">
        {[1, 3, 4].map((n, ri) => (
          <div key={ri} className="flex gap-1.5">
            {Array.from({ length: n }).map((_, i) => (
              <div key={i} className={'rounded-md border ' + (ri === 0 ? 'w-12 h-9 bg-ctg-green/30 border-ctg-green/60' : 'w-10 h-8 bg-[#152b18] border-ctg-green/25')}
                   style={ri === 0 ? { boxShadow: '0 0 14px rgba(139,194,52,.3)' } : {}} />
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'court') {
    return (
      <svg width="200" height="120" viewBox="0 0 200 120">
        <rect x="20" y="15" width="160" height="90" rx="4" fill="none" stroke="#8BC234" strokeWidth="2" opacity=".7" />
        <rect x="45" y="28" width="110" height="64" fill="none" stroke="#8BC234" strokeWidth="1.5" opacity=".5" />
        <line x1="100" y1="15" x2="100" y2="105" stroke="#F0F7E8" strokeWidth="1.5" opacity=".4" />
        <circle cx="130" cy="50" r="6" fill="#8BC234" />
      </svg>
    );
  }
  return (
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-ctg-green/25 border-2 border-ctg-green/50 flex items-center justify-center font-display font-black text-ctg-green text-lg">TÚ</div>
      <div className="font-display font-black text-ctg-green/40 text-2xl">VS</div>
      <div className="w-14 h-14 rounded-full bg-[#152b18] border-2 border-ctg-green/25 flex items-center justify-center font-display font-black text-[#F0F7E8]/60 text-lg">FC</div>
    </div>
  );
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [screen, setScreen] = useState(0);
  const isLast = screen === SCREENS.length - 1;
  const s = SCREENS[screen];

  const finish = () => {
    try { localStorage.setItem('ctg_onboarded', '1'); } catch {}
    setScreen(0);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') finish(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={finish} />
      <div className="relative w-full max-w-md bg-[#0f2211] border border-ctg-green/20 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-scale-in">
        <div className="relative h-44 bg-gradient-to-br from-ctg-green/15 via-[#152b18] to-[#0f2211] flex items-center justify-center overflow-hidden">
          <Visual kind={s.visual} />
          <button onClick={finish} className="absolute top-4 right-4 text-[#F0F7E8]/45 hover:text-[#F0F7E8] text-sm font-semibold transition px-3 py-1.5 rounded-lg hover:bg-[#F0F7E8]/5">
            Saltar
          </button>
        </div>

        <div className="p-6 md:p-8 text-center" key={screen}>
          <h2 className="font-display text-2xl font-bold text-[#F0F7E8] animate-slide-up">{s.title}</h2>
          <p className="text-[#F0F7E8]/60 text-base leading-relaxed mt-3 animate-slide-up">{s.body}</p>

          <div className="flex justify-center gap-2 mt-6">
            {SCREENS.map((_, i) => (
              <button key={i} onClick={() => setScreen(i)}
                className={'h-2 rounded-full transition-all ' + (i === screen ? 'w-8 bg-ctg-green' : 'w-2 bg-[#F0F7E8]/20 hover:bg-[#F0F7E8]/40')} />
            ))}
          </div>

          <div className="flex gap-3 mt-7">
            {screen > 0 && (
              <button onClick={() => setScreen(screen - 1)} className="btn-ghost flex-1 py-3">← Anterior</button>
            )}
            <button onClick={() => isLast ? finish() : setScreen(screen + 1)} className="btn-primary flex-1 py-3 text-base">
              {isLast ? '¡Entendido, a jugar!' : 'Siguiente →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Auto-show en primer login: true si hay sesión y no se ha visto el tour. */
export function useOnboarding(hasSession: boolean) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!hasSession) return;
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem('ctg_onboarded')) setShow(true);
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [hasSession]);
  return { showOnboarding: show, closeOnboarding: () => setShow(false) };
}
