'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/hooks/useAuth';

export default function HomePage() {
  const { player } = useAuth();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const hasEscalerilla = (player?.position ?? 0) > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage="home" onLoginClick={() => setLoginModalOpen(true)} />

      {/* Hero — imagen de fondo */}
      <div className="relative flex-1 flex items-center justify-center min-h-[calc(100vh-80px)]">
        {/* Imagen */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/cancha-aerea.jpg')" }}
        />
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Contenido */}
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto animate-fade-in">
          <img src="/images/Logo_CTG.png" alt="CTG" className="h-20 mx-auto mb-6 drop-shadow-lg" />

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight drop-shadow-lg">
            Club de Tenis Graneros
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-2 drop-shadow">
            Bienvenido a la nueva plataforma del club
          </p>
          <p className="text-sm text-white/60 mb-10">
            Reserva tu cancha, sigue la escalerilla y gestiona tus partidos
          </p>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/reservar"
              className="px-8 py-4 bg-ctg-green text-white font-bold rounded-xl hover:bg-ctg-lime transition shadow-lg text-lg">
              📅 Reservar cancha
            </Link>

            {hasEscalerilla && (
              <Link href="/escalerilla"
                className="px-8 py-4 bg-white/15 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/25 transition shadow-lg text-lg border border-white/30">
                🎾 Ver escalerilla
              </Link>
            )}

            {!player && (
              <button onClick={() => setLoginModalOpen(true)}
                className="px-8 py-4 bg-white/15 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/25 transition shadow-lg text-lg border border-white/30">
                Iniciar sesión
              </button>
            )}
          </div>

          {player && (
            <p className="mt-8 text-white/70 text-sm">
              Bienvenido, <span className="text-ctg-green font-semibold">{player.name.split(' ')[0]}</span> 👋
            </p>
          )}
        </div>

        {/* Cards flotantes en la parte inferior */}
        <div className="absolute bottom-8 left-0 right-0 px-6">
          <div className={`max-w-2xl mx-auto grid gap-3 ${hasEscalerilla ? 'grid-cols-2' : 'grid-cols-1 max-w-xs'}`}>
            <Link href="/fixture-reservas"
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center text-white hover:bg-white/20 transition">
              <p className="text-xs text-white/60 mb-0.5">Canchas</p>
              <p className="text-sm font-semibold">Ver disponibilidad →</p>
            </Link>
            {hasEscalerilla && (
              <Link href="/master"
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-center text-white hover:bg-white/20 transition">
                <p className="text-xs text-white/60 mb-0.5">Torneo</p>
                <p className="text-sm font-semibold">🏆 Master 2026 →</p>
              </Link>
            )}
          </div>
        </div>
      </div>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} onSuccess={() => window.location.reload()} />
    </div>
  );
}