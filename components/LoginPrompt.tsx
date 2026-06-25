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
      <div className="mb-8 bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 rounded-xl p-6 shadow-card animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="text-3xl">{emoji}</div>
          <div className="flex-1">
            <h3 className="font-bold text-amber-900 mb-1">Inicia sesión para continuar</h3>
            <p className="text-amber-800 mb-3">{message}</p>
            <button
              onClick={() => setIsOpen(true)}
              className="px-5 py-2 bg-ctg-green text-white rounded-lg font-bold hover:bg-ctg-lime transition-colors shadow-soft"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
      <LoginModal isOpen={isOpen} onClose={() => setIsOpen(false)} onSuccess={handleSuccess} />
    </>
  );
}