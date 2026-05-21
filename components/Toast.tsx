'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const DOT_COLORS: Record<ToastType, string> = {
  success: '#8BC234',
  error:   '#f87171',
  info:    '#93c5fd',
  warning: '#fbbf24',
};

const BORDER_CLASSES: Record<ToastType, string> = {
  success: 'border-l-ctg-green',
  error:   'border-l-red-500',
  info:    'border-l-blue-500',
  warning: 'border-l-amber-500',
};

export default function Toast({ message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  const dot = DOT_COLORS[type];

  return (
    <div className="fixed top-4 right-4 z-[9999] w-[320px] max-w-[calc(100vw-2rem)]">
      <div
        className={
          'bg-[#0f2211]/95 backdrop-blur-md border-l-4 ' + BORDER_CLASSES[type] +
          ' border-y border-r border-[#1e4020] rounded-xl shadow-2xl shadow-black/50 px-4 py-3 flex items-center gap-3 animate-slide-up'
        }
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: dot, boxShadow: `0 0 8px ${dot}` }}
        />
        <div className="flex-1 text-sm text-[#F0F7E8]/90">{message}</div>
        <button
          onClick={onClose}
          className="text-[#F0F7E8]/40 hover:text-[#F0F7E8]/90 transition shrink-0"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
