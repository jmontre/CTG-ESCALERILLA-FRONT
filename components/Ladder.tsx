'use client';

import { Player } from '@/types';
import { formatPlayerName } from '@/lib/formatName';

interface LadderProps {
  players: Player[];
  currentPlayerId?: string;
  onPlayerClick: (player: Player) => void;
}

export default function Ladder({ players, currentPlayerId, onPlayerClick }: LadderProps) {
  // Filtrar jugadores activos (position > 0) y ordenar
  const activePlayers = players
    .filter(p => (p.position ?? 0) > 0)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // Definir la estructura de niveles según la nueva distribución (4 categorías)
  const levels = [
    {
      category: 'A', rows: [
        [1],
        [2, 3, 4],
        [5, 6, 7, 8],
        [9, 10, 11, 12],
      ]
    },
    {
      category: 'B', rows: [
        [13, 14, 15],
        [16, 17, 18, 19],
        [20, 21, 22, 23, 24],
      ]
    },
    {
      category: 'C', rows: [
        [25, 26, 27],
        [28, 29, 30, 31],
        [32, 33, 34, 35, 36],
      ]
    },
    {
      category: 'D', rows: [
        [37, 38, 39],
        [40, 41, 42, 43],
        [44, 45, 46, 47, 48],
      ]
    },
  ];

  const getPlayerByPosition = (pos: number) => {
    return activePlayers.find(p => p.position === pos);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'A': return 'bg-gradient-to-r from-yellow-400 to-yellow-500';
      case 'B': return 'bg-gradient-to-r from-gray-300 to-gray-400';
      case 'C': return 'bg-gradient-to-r from-orange-400 to-orange-500';
      case 'D': return 'bg-gradient-to-r from-green-400 to-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getRowBackground = (category: string, rowIdx: number) => {
    switch (category) {
      case 'A':
        if (rowIdx === 0) return 'bg-yellow-50';
        if (rowIdx === 1) return 'bg-yellow-100';
        if (rowIdx === 2) return 'bg-yellow-200';
        return 'bg-yellow-300';
      case 'B':
        if (rowIdx === 0) return 'bg-gray-50';
        if (rowIdx === 1) return 'bg-gray-100';
        return 'bg-gray-200';
      case 'C':
        if (rowIdx === 0) return 'bg-orange-50';
        if (rowIdx === 1) return 'bg-orange-100';
        return 'bg-orange-200';
      case 'D':
        if (rowIdx === 0) return 'bg-green-50';
        if (rowIdx === 1) return 'bg-green-100';
        return 'bg-green-200';
      default:
        return 'bg-white';
    }
  };

  // Función para obtener emoji de estado del desafío
  const getChallengeEmoji = (player: Player): string | null => {
    // Si le desafiaron y está pendiente de responder
    if (player.challenged_challenge?.status === 'pending') {
      return '⏰';
    }
    // Si tiene un partido aceptado por jugar
    if (player.challenger_challenge?.status === 'accepted' || player.challenged_challenge?.status === 'accepted') {
      return '🎾';
    }
    // Si él desafió y está esperando respuesta
    if (player.challenger_challenge?.status === 'pending') {
      return '📤';
    }
    return null;
  };

  // Función para obtener tooltip del emoji
  const getChallengeTooltip = (player: Player): string => {
    if (player.challenged_challenge?.status === 'pending') {
      return 'Desafío recibido (pendiente de respuesta)';
    }
    if (player.challenger_challenge?.status === 'accepted' || player.challenged_challenge?.status === 'accepted') {
      return 'Tiene partido por jugar';
    }
    if (player.challenger_challenge?.status === 'pending') {
      return 'Desafío enviado (esperando respuesta)';
    }
    return '';
  };

  return (
    <div className="space-y-8">
      {levels.map((level, levelIdx) => (
        <div key={levelIdx}>
          {/* Category Header */}
          <div className={`${getCategoryColor(level.category)} text-white font-bold text-xl py-3 px-6 rounded-t-xl flex items-center justify-between shadow-md`}>
            <span>Categoría {level.category}</span>
            <span className="text-sm opacity-90">
              {level.category === 'A'}
              {level.category === 'B'}
              {level.category === 'C'}
              {level.category === 'D'}
            </span>
          </div>

          {/* Rows */}
          <div className="bg-white rounded-b-xl shadow-card overflow-hidden">
            {level.rows.map((row, rowIdx) => {
              // Solo mostrar la fila si tiene al menos un jugador
              const hasPlayers = row.some(pos => getPlayerByPosition(pos));
              if (!hasPlayers) return null;

              return (
                <div
                  key={rowIdx}
                  className={`p-4 ${getRowBackground(level.category, rowIdx)}`}
                >
                  <div className="flex flex-wrap justify-center gap-3">
                    {row.map((pos) => {
                      const player = getPlayerByPosition(pos);
                      if (!player) return null;

                      const isCurrentPlayer = player.id === currentPlayerId;
                      const isImmune = player.immune_until && new Date(player.immune_until) > new Date();
                      const isVulnerable = player.vulnerable_until && new Date(player.vulnerable_until) > new Date();
                      const challengeEmoji = getChallengeEmoji(player);
                      const challengeTooltip = getChallengeTooltip(player);

                      return (
                        <button
                          key={pos}
                          onClick={() => onPlayerClick(player)}
                          className={`
                            group relative
                            min-w-[140px] sm:min-w-[160px]
                            px-4 py-3
                            rounded-xl
                            border-2
                            transition-all duration-200
                            hover:scale-105 hover:shadow-lg
                            ${isCurrentPlayer
                              ? 'bg-gradient-to-br from-ctg-green to-ctg-lime border-ctg-dark shadow-lg'
                              : 'bg-white border-gray-200 hover:border-ctg-green'
                            }
                          `}
                        >
                          {/* Position Badge */}
                          <div className={`
                            absolute -top-3 -left-3
                            w-8 h-8 rounded-full
                            flex items-center justify-center
                            font-bold text-sm text-white
                            shadow-md
                            ${getCategoryColor(level.category)}
                          `}>
                            {pos}
                          </div>

                          {/* Status Indicators - Agrupados en la esquina superior derecha */}
                          <div className="absolute -top-2 -right-2 flex gap-1">
                            {isImmune && (
                              <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-md" title="Inmune (no puede ser desafiado)">
                                <span className="text-sm">🛡️</span>
                              </div>
                            )}
                            {isVulnerable && (
                              <div className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center shadow-md" title="Vulnerable (no puede desafiar)">
                                <span className="text-sm">⚠️</span>
                              </div>
                            )}
                            {challengeEmoji && (
                              <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-md" title={challengeTooltip}>
                                <span className="text-sm">{challengeEmoji}</span>
                              </div>
                            )}
                          </div>

                          {/* Player Info */}
                          <div className="text-left pl-2">
                            <p className={`font-bold text-sm sm:text-base truncate ${isCurrentPlayer ? 'text-ctg-dark' : 'text-gray-800'}`}>
                              {formatPlayerName(player.name)}
                            </p>
                          </div>

                          {/* Current Player Badge */}
                          {isCurrentPlayer && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-ctg-dark text-white text-xs font-bold rounded-full">
                              TÚ
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-card p-6">
        <h3 className="font-bold text-gray-700 mb-3">Leyenda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛡️</span>
            <span className="text-gray-600">Inmune (no puede ser desafiado)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-gray-600">Vulnerable (no puede desafiar)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <span className="text-gray-600">Desafío recibido (pendiente de respuesta)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎾</span>
            <span className="text-gray-600">Tiene partido por jugar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📤</span>
            <span className="text-gray-600">Desafío enviado (esperando respuesta)</span>
          </div>
        </div>

        {/* Explicación de niveles */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-2 font-semibold">Niveles de desafío:</p>
          <p className="text-xs text-gray-500">
            Cada nivel tiene un fondo de color más oscuro. Puedes desafiar a cualquier jugador en tu mismo nivel o el nivel inmediatamente superior.
          </p>
        </div>
      </div>
    </div>
  );
}
