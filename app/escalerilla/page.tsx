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
import { useEffect, useState } from 'react';

function Avatar({ player, size = 42 }: { player: Player; size?: number }) {
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

function StatCard({ label, value, colorClass, glow }: { label: string; value: string | number; colorClass: string; glow?: boolean }) {
  return (
    <div className="bg-[#152b18] border border-[#1e4020] rounded-xl p-4 relative overflow-hidden">
      <div className={'font-display font-black text-4xl leading-none ' + colorClass + (glow ? ' glow-soft' : '')}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/45 font-semibold mt-2">{label}</div>
    </div>
  );
}

export default function EscalerillaPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [challengeModalOpen, setChallengeModalOpen] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const { player: currentPlayer, refreshPlayer } = useAuth();
  const { toasts, removeToast, success, error, warning } = useToast();

  useEffect(() => { loadPlayers(); }, []);

  const loadPlayers = async () => {
    try {
      const data = await api.getPlayers();
      setPlayers(data);
    } catch {
      error('Error al cargar jugadores');
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([loadPlayers(), refreshPlayer()]);
  };

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setPlayerModalOpen(true);
  };

  const handleChallenge = (player: Player) => {
    if (!currentPlayer) { warning('Debes estar registrado en la escalerilla para desafiar'); return; }
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
      await refreshAll();
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

  const hasPosition = (currentPlayer?.position ?? 0) > 0;
  const totalMatches = currentPlayer?.total_matches ?? 0;
  const effectiveness = totalMatches > 0 ? Math.round(((currentPlayer?.wins ?? 0) / totalMatches) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header onLoginClick={() => setLoginModalOpen(true)} />

      <main className="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 py-10 pb-24 md:pb-10 flex-1 w-full">
        {/* Page title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-ctg-green text-xs uppercase tracking-[0.28em] font-bold mb-2">Temporada 2026 · Pirámide</div>
            <h1 className="font-display font-extrabold text-[#F0F7E8] text-4xl md:text-5xl tracking-tight leading-[1.02]">Escalerilla</h1>
            <p className="text-[#F0F7E8]/45 text-sm mt-2">48 jugadores · 4 categorías · ranking en vivo</p>
          </div>
          {currentPlayer && hasPosition && (
            <div className="flex items-center gap-3 bg-[#152b18] border border-[#1e4020] rounded-2xl pl-4 pr-2 py-2">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-widest text-[#F0F7E8]/40 font-semibold">Tu posición</div>
                <div className="font-display font-black text-ctg-green text-2xl glow-soft leading-none mt-0.5">#{currentPlayer.position}</div>
              </div>
              <Avatar player={currentPlayer} size={42} />
            </div>
          )}
        </div>

        {/* Stats — logged in with position */}
        {currentPlayer && hasPosition && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <StatCard label="Victorias"    value={currentPlayer.wins}    colorClass="text-ctg-green" glow />
            <StatCard label="Derrotas"     value={currentPlayer.losses}  colorClass="text-red-400" />
            <StatCard label="Partidos"     value={currentPlayer.total_matches} colorClass="text-[#F0F7E8]" />
            <StatCard label="Efectividad"  value={effectiveness + '%'}   colorClass="text-ctg-green" />
          </div>
        )}

        {/* Join CTA — not logged in */}
        {!currentPlayer && (
          <div className="bg-ctg-green/8 border border-ctg-green/25 rounded-2xl p-5 mb-10 flex items-center gap-4">
            <span className="w-2.5 h-2.5 rounded-full bg-ctg-green animate-pulse shrink-0" style={{ boxShadow: '0 0 12px #8BC234' }} />
            <div className="flex-1">
              <div className="text-[#F0F7E8] font-semibold">Únete a la escalerilla</div>
              <div className="text-[#F0F7E8]/55 text-sm">Inicia sesión para desafiar jugadores y subir posiciones</div>
            </div>
            <button onClick={() => setLoginModalOpen(true)} className="btn-primary text-sm px-4 py-2 shrink-0">
              Iniciar sesión
            </button>
          </div>
        )}

        {/* Ladder */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-ctg-green/20" />
              <div className="w-12 h-12 rounded-full border-t-2 border-ctg-green animate-spin absolute inset-0" />
            </div>
            <p className="text-[#F0F7E8]/50 text-sm">Cargando escalerilla…</p>
          </div>
        ) : (
          <Ladder players={players} currentPlayerId={currentPlayer?.id} onPlayerClick={handlePlayerClick} />
        )}
      </main>

      <PlayerModal
        player={selectedPlayer} isOpen={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        onChallenge={handleChallenge}
        canChallenge={selectedPlayer ? canChallenge(selectedPlayer) : false}
      />

      {currentPlayer && selectedPlayer && (
        <ChallengeModal
          challenger={currentPlayer} challenged={selectedPlayer}
          isOpen={challengeModalOpen}
          onClose={() => setChallengeModalOpen(false)}
          onConfirm={handleConfirmChallenge}
          loading={challengeLoading}
        />
      )}

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => { setLoginModalOpen(false); refreshPlayer(); }}
      />

      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
