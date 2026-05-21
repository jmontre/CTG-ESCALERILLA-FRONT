'use client';

import { useEffect } from 'react';
import { Player } from '@/types';

interface ChallengeModalProps {
  challenger: Player;
  challenged: Player;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

const SwordsIcon = () => (
  <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#8BC234" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L21 0M19 5l-5 5" />
  </svg>
);

function AvatarEl({ player, size = 56 }: { player: Player; size?: number }) {
  const initials = player.name.trim().split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const style: React.CSSProperties = {
    width: size, height: size, fontSize: size * 0.36,
    background: 'linear-gradient(135deg, #9ed944, #8BC234 60%, #6ea127)',
  };
  if (player.avatar_url) {
    return <div className="rounded-full overflow-hidden ring-2 ring-ctg-green/50 ring-offset-1 ring-offset-[#0a1608] shrink-0" style={style}><img src={player.avatar_url} alt="" className="w-full h-full object-cover" /></div>;
  }
  return <div className="inline-flex items-center justify-center rounded-full font-display font-bold text-[#0a1608] ring-2 ring-ctg-green/50 ring-offset-1 ring-offset-[#0a1608] shrink-0" style={style}>{initials}</div>;
}

function getCat(position: number | null | undefined): string {
  const pos = position ?? 0;
  if (pos <= 12) return 'A';
  if (pos <= 24) return 'B';
  if (pos <= 36) return 'C';
  return 'D';
}

export default function ChallengeModal({ challenger, challenged, isOpen, onClose, onConfirm, loading = false }: ChallengeModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !loading) onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="bg-[#152b18] border-b border-[#1e4020] px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-[#F0F7E8]">Confirmar Desafío</h3>
              <p className="text-[#F0F7E8]/45 text-sm mt-0.5">El desafío se enviará inmediatamente</p>
            </div>
            <button
              onClick={loading ? undefined : onClose}
              disabled={loading}
              className="text-[#F0F7E8]/30 hover:text-[#F0F7E8] text-2xl leading-none transition"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* VS layout */}
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="text-center flex-1">
                <AvatarEl player={challenger} size={56} />
                <div className="text-[10px] uppercase tracking-widest text-ctg-green/70 font-bold mt-2">Desafiante</div>
                <div className="font-semibold text-[#F0F7E8] text-sm mt-0.5">{challenger.name.split(' ')[0]}</div>
                <div className="text-[#F0F7E8]/40 text-xs">#{challenger.position} · Cat {getCat(challenger.position)}</div>
              </div>
              <div className="flex flex-col items-center">
                <SwordsIcon />
                <div className="font-display font-black text-ctg-green/70 text-xl mt-1">VS</div>
              </div>
              <div className="text-center flex-1">
                <AvatarEl player={challenged} size={56} />
                <div className="text-[10px] uppercase tracking-widest text-amber-400/80 font-bold mt-2">Desafiado</div>
                <div className="font-semibold text-[#F0F7E8] text-sm mt-0.5">{challenged.name.split(' ')[0]}</div>
                <div className="text-[#F0F7E8]/40 text-xs">#{challenged.position} · Cat {getCat(challenged.position)}</div>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3 text-amber-300/80 text-xs mb-5 leading-relaxed">
              <strong className="text-amber-300">Reglas:</strong> El desafiado tiene <strong>72 horas</strong> para responder.
              Si acepta, deben fijar fecha en los siguientes <strong>10 días</strong>. Si ganas, intercambian posiciones.
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={loading ? undefined : onClose} disabled={loading} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button onClick={onConfirm} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creando…' : (
                  <>
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L21 0M19 5l-5 5" />
                    </svg>
                    Confirmar Desafío
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
