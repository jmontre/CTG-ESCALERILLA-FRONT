import { Player } from '@/types';

interface PlayerCardProps {
  player: Player;
  isCurrentUser?: boolean;
  canChallenge?: boolean;
  onClick?: () => void;
}

export default function PlayerCard({ player, isCurrentUser, canChallenge = false, onClick }: PlayerCardProps) {
  const isImmune = player.immune_until && new Date(player.immune_until) > new Date();
  const isVulnerable = player.vulnerable_until && new Date(player.vulnerable_until) > new Date();

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-md transition-all cursor-pointer
        min-w-[130px] max-w-[130px] h-[60px]
        flex items-center justify-center
        border-2
        ${isCurrentUser 
          ? 'bg-club-secondary text-white border-club-primary shadow-lg scale-110 ring-2 ring-club-accent' 
          : canChallenge 
            ? 'bg-club-accent text-white border-club-secondary hover:shadow-lg hover:scale-105' 
            : 'bg-gray-100 text-gray-600 border-gray-300 opacity-75'
        }
      `}
    >
      {/* Número de posición */}
      <span className={`
        absolute top-1 left-2 text-xs font-bold
        ${isCurrentUser ? 'text-white' : canChallenge ? 'text-white' : 'text-gray-500'}
      `}>
        {player.position}
      </span>

      {/* Nombre */}
      <span className="text-sm font-medium text-center px-2">
        {player.name}
      </span>

      {/* Iconos de estado */}
      {(isImmune || isVulnerable) && (
        <div className="absolute top-1 right-2 flex gap-1">
          {isImmune && <span className="text-xs">🛡️</span>}
          {isVulnerable && <span className="text-xs">⚠️</span>}
        </div>
      )}
    </div>
  );
}
