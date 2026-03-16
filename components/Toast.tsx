'use client';

import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: 'bg-ctg-green border-ctg-dark',
    error: 'bg-red-500 border-red-700',
    warning: 'bg-amber-500 border-amber-700',
    info: 'bg-blue-500 border-blue-700',
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-[9999]
        ${colors[type]}
        text-white px-6 py-4 rounded-xl shadow-hover
        border-l-4 min-w-[320px] max-w-md
        animate-slide-up
        backdrop-blur-sm bg-opacity-95
      `}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[type]}</span>
        <div className="flex-1">
          <p className="font-semibold text-sm leading-relaxed">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}