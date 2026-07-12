'use client';

import { useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  explanation: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const CheckIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-10" /></svg>
);
const TrashIcon = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" /></svg>
);

export default function ConfirmModal({
  isOpen, title, explanation,
  confirmLabel = 'Confirmar', cancelLabel = 'No, volver',
  danger = false, loading = false, onConfirm, onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !loading) onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl shadow-black/60 p-6 md:p-7 text-center">
          <div className={'w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center border ' +
            (danger ? 'bg-red-500/12 border-red-500/35 text-red-400' : 'bg-ctg-green/12 border-ctg-green/35 text-ctg-green')}>
            {danger ? <TrashIcon /> : <CheckIcon />}
          </div>
          <h3 className="font-display text-xl font-bold text-[#F0F7E8]">{title}</h3>
          <p className="text-[#F0F7E8]/60 text-base leading-relaxed mt-2.5">{explanation}</p>
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 mt-6">
            <button onClick={onClose} disabled={loading} className="btn-ghost flex-1 py-3">{cancelLabel}</button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={'flex-1 py-3 rounded-xl font-bold text-base transition disabled:opacity-50 ' +
                (danger
                  ? 'bg-red-500 text-white hover:bg-red-400 shadow-[0_0_18px_rgba(239,68,68,.3)]'
                  : 'bg-ctg-green text-[#0a1608] hover:bg-ctg-lime shadow-[0_0_18px_rgba(139,194,52,.3)]')}
            >
              {loading ? 'Enviando…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
