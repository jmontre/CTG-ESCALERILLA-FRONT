'use client';

import ChallengeModal from '@/components/ChallengeModal';
import Header from '@/components/Header';
import Ladder from '@/components/Ladder';
import LoginModal from '@/components/LoginModal';
import PlayerModal from '@/components/PlayerModal';
import Toast from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';
import { Player } from '@/types';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const { player: currentPlayer } = useAuth();
  const { toasts, removeToast, success, error, warning } = useToast();

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const data = await api.getPlayers();
      setPlayers(data);
    } catch (err) {
      error('Error al cargar jugadores');
      console.error('Error al cargar jugadores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerModalOpen(true);
  };

  const handleChallenge = (player: Player) => {
    if (!currentPlayer) {
      warning('Debes estar registrado en la escalerilla para desafiar');
      return;
    }
    setPlayerModalOpen(false);
    setSelectedPlayer(player);
    setChallengeModalOpen(true);
  };

  const handleConfirmChallenge = async () => {
    if (!currentPlayer || !selectedPlayer) return;

    setChallengeLoading(true);
    try {
      await api.createChallenge(currentPlayer.id, selectedPlayer.id);
      setChallengeModalOpen(false);
      success(`¡Desafío creado! ${selectedPlayer.name} tiene 24 horas para responder.`);
      await loadPlayers();
    } catch (err: any) {
      error(err.message || 'Error al crear desafío');
    } finally {
      setChallengeLoading(false);
    }
  };

  const canChallenge = (player: Player): boolean => {
    if (!currentPlayer) return false;
    if (player.id === currentPlayer.id) return false;
    if (player.immune_until && new Date(player.immune_until) > new Date()) return false;
    if (currentPlayer.vulnerable_until && new Date(currentPlayer.vulnerable_until) > new Date()) return false;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      
      <Header 
        currentPage="escalerilla"
        onLoginClick={() => setLoginModalOpen(true)}
      />

      {/* Main */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Hero section */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold text-ctg-dark mb-3 tracking-tight">
            Escalerilla
          </h1>
          <p className="text-xl text-gray-600 font-medium">Temporada 2026</p>
          
          {currentPlayer && (
            <div className="mt-6 inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-card">
              <div className="w-10 h-10 bg-gradient-to-br from-ctg-green to-ctg-lime rounded-full flex items-center justify-center font-bold text-white">
                #{currentPlayer.position}
              </div>
              <div className="text-left">
                <p className="font-semibold text-ctg-dark">{currentPlayer.name}</p>
                <p className="text-sm text-gray-500">Tu posición actual</p>
              </div>
            </div>
          )}
        </div>

        {/* Banner no logueado */}
        {!currentPlayer && (
          <div className="mb-8 bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 rounded-xl p-6 shadow-card animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎾</div>
              <div className="flex-1">
                <h3 className="font-bold text-amber-900 mb-1">¡Únete a la competencia!</h3>
                <p className="text-amber-800 mb-3">
                  Inicia sesión para participar en la escalerilla y desafiar a otros jugadores
                </p>
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="px-5 py-2 bg-ctg-green text-white rounded-lg font-bold hover:bg-ctg-lime transition-colors shadow-soft"
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Escalerilla */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-card p-16 animate-fade-in">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-ctg-light"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-ctg-green absolute top-0"></div>
              </div>
              <p className="text-gray-500 text-lg font-medium">Cargando escalerilla...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-card p-6 md:p-10 animate-slide-up">
            <Ladder
              players={players}
              currentPlayerId={currentPlayer?.id}
              onPlayerClick={handlePlayerClick}
            />
          </div>
        )}

        {/* Stats rápidas */}
        {currentPlayer && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <div className="text-3xl font-bold text-ctg-green">{currentPlayer.wins}</div>
              <div className="text-sm text-gray-600 mt-1">Victorias</div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{currentPlayer.losses}</div>
              <div className="text-sm text-gray-600 mt-1">Derrotas</div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{currentPlayer.total_matches}</div>
              <div className="text-sm text-gray-600 mt-1">Partidos</div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-4 text-center">
              <div className="text-3xl font-bold text-ctg-dark">
                {currentPlayer.total_matches > 0 
                  ? Math.round((currentPlayer.wins / currentPlayer.total_matches) * 100)
                  : 0}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Efectividad</div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <PlayerModal
        player={selectedPlayer}
        isOpen={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        onChallenge={handleChallenge}
        canChallenge={selectedPlayer ? canChallenge(selectedPlayer) : false}
      />

      {currentPlayer && selectedPlayer && (
        <ChallengeModal
          challenger={currentPlayer}
          challenged={selectedPlayer}
          isOpen={challengeModalOpen}
          onClose={() => setChallengeModalOpen(false)}
          onConfirm={handleConfirmChallenge}
          loading={challengeLoading}
        />
      )}

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />

      {/* Toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
