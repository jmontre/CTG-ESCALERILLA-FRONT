'use client';

import { useState } from 'react';
import LoginModal from './LoginModal';
import { useAuth } from '@/hooks/useAuth';

interface LoginPromptProps {
  message?: string;
  emoji?: string;
  onSuccess?: () => void;
}

export default function LoginPrompt({
  message = 'Necesitas iniciar sesión para acceder a esta sección.',
  emoji = '🔒',
  onSuccess,
}: LoginPromptProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { refreshPlayer } = useAuth();

  const handleSuccess = () => {
    setIsOpen(false);
    refreshPlayer();
    onSuccess?.();
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-16 bg-[#0f2211] border border-[#1e4020] rounded-2xl p-8 text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-ctg-green/15 border border-ctg-green/30 flex items-center justify-center mx-auto mb-5 text-3xl">
          {emoji}
        </div>
        <h2 className="font-display text-2xl font-bold text-[#F0F7E8]">Inicia sesión para continuar</h2>
        <p className="text-[#F0F7E8]/50 text-sm mt-2">{message}</p>
        <button
          onClick={() => setIsOpen(true)}
          className="btn-primary w-full py-3 mt-6"
        >
          Iniciar sesión
        </button>
      </div>
      <LoginModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={handleSuccess} />
    </>
  );
}