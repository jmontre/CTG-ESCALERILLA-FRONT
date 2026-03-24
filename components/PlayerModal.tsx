'use client';

import { Player } from '@/types';
import { formatPlayerName } from '@/lib/formatName';

interface PlayerModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onChallenge: (player: Player) => void;
  canChallenge: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function PlayerModal({ player, isOpen, onClose, onChallenge, canChallenge }: PlayerModalProps) {
  if (!isOpen || !player) return null;

  const getCategory = (position: number) => {
    if (position <= 12) return { name: 'A', bg: 'bg-yellow-100', color: 'text-yellow-700', gradient: 'from-yellow-400 to-yellow-500' };
    if (position <= 24) return { name: 'B', bg: 'bg-gray-100',   color: 'text-gray-700',   gradient: 'from-gray-300 to-gray-400'   };
    if (position <= 36) return { name: 'C', bg: 'bg-orange-100', color: 'text-orange-700', gradient: 'from-orange-400 to-orange-500' };
    return               { name: 'D', bg: 'bg-green-100',  color: 'text-green-700',  gradient: 'from-green-400 to-green-500'   };
  };

  const category    = getCategory(player.position);
  const isImmune    = player.immune_until    && new Date(player.immune_until)    > new Date();
  const isVulnerable = player.vulnerable_until && new Date(player.vulnerable_until) > new Date();
  const initials    = getInitials(player.name);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">

        {/* Header */}
        <div className={`px-6 pt-6 pb-8 text-white bg-gradient-to-r ${category.gradient} relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors"
          >
            ✕
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-white/25 border-2 border-white/50 flex items-center justify-center shrink-0 shadow-md">
              {player.avatar_url ? (
                <img src={player.avatar_url} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-white">{initials}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-xl leading-tight">
                {formatPlayerName(player.name)}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-white font-bold text-lg">#{player.position}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${category.bg} ${category.color}`}>
                  Categoría {category.name}
                </span>
              </div>
            </div>
          </div>

          {(isImmune || isVulnerable) && (
            <div className="flex gap-2 mt-3">
              {isImmune && (
                <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  🛡️ Inmune
                </div>
              )}
              {isVulnerable && (
                <div className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  ⚠️ Vulnerable
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{player.wins}</div>
              <div className="text-xs text-gray-500 mt-1">Victorias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{player.losses}</div>
              <div className="text-xs text-gray-500 mt-1">Derrotas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{player.total_matches}</div>
              <div className="text-xs text-gray-500 mt-1">Partidos</div>
            </div>
          </div>

          {player.total_matches > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Efectividad</span>
                <span className="font-bold">{Math.round((player.wins / player.total_matches) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-ctg-green to-ctg-lime h-2 rounded-full transition-all"
                  style={{ width: `${(player.wins / player.total_matches) * 100}%` }}
                />
              </div>
            </div>
          )}

          {canChallenge ? (
            <button
              onClick={() => onChallenge(player)}
              className="w-full bg-gradient-to-r from-ctg-green to-ctg-lime text-ctg-dark font-bold py-3 rounded-lg hover:shadow-lg transition-all"
            >
              ⚔️ Desafiar
            </button>
          ) : (
            <div className="bg-gray-100 text-gray-500 text-center py-3 rounded-lg text-sm">
              {isImmune      && '🛡️ Este jugador está inmune'}
              {isVulnerable  && '⚠️ No puedes desafiar (estás vulnerable)'}
              {!isImmune && !isVulnerable && 'No puedes desafiar a este jugador'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}