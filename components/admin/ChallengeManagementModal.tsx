'use client';

import { useState } from 'react';
import { Challenge } from '@/types';

interface ChallengeManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: Challenge | null;
  onResolve: (challengeId: string, winnerId: string, score: string) => void;
  onCancel: (challengeId: string) => void;
  onExtend: (challengeId: string, hours: number, type: 'accept' | 'play') => void;
}

export default function ChallengeManagementModal({
  isOpen,
  onClose,
  challenge,
  onResolve,
  onCancel,
  onExtend,
}: ChallengeManagementModalProps) {
  const [winnerId, setWinnerId] = useState('');
  const [score, setScore] = useState('');

  if (!isOpen || !challenge) return null;

  const handleResolve = () => {
    if (!winnerId || !score) {
      alert('Debes seleccionar un ganador e ingresar el marcador');
      return;
    }
    onResolve(challenge.id, winnerId, score);
  };

  const handleCancel = () => {
    const isCompleted = challenge.status === 'completed';
    const message = isCompleted
      ? '⚠️ Este desafío ya está completado.\n\nAl cancelarlo se revertirán las estadísticas (W-L) pero NO se revertirán los cambios de ranking automáticamente.\n\n¿Estás seguro de continuar?'
      : '¿Estás seguro de cancelar este desafío?\n\nEsto no afectará estadísticas ni ranking.';
    
    if (!confirm(message)) return;
    onCancel(challenge.id);
  };

  const handleExtendAccept = (hours: number) => {
    if (!confirm(`¿Extender el plazo para aceptar ${hours} horas?`)) return;
    onExtend(challenge.id, hours, 'accept');
  };

  const handleExtendPlay = (hours: number) => {
    if (!confirm(`¿Extender el plazo para jugar ${hours} horas?`)) return;
    onExtend(challenge.id, hours, 'play');
  };

  const isDisputed = challenge.status === 'disputed';
  const isCompleted = challenge.status === 'completed';
  const isPending = challenge.status === 'pending';
  const isAccepted = challenge.status === 'accepted';

  const getTimeLeft = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expirado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h restantes`;
    }
    return `${hours}h restantes`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-ctg-dark">
            {isDisputed ? '⚠️ Resolver Disputa' : isCompleted ? '✏️ Editar Resultado' : 'Gestionar Desafío'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Info del desafío */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold text-ctg-dark">{challenge.challenger?.name}</p>
              <p className="text-sm text-gray-600">Pos #{challenge.challenger?.position}</p>
            </div>
            <span className="text-3xl">⚔️</span>
            <div className="text-center">
              <p className="text-lg font-bold text-ctg-dark">{challenge.challenged?.name}</p>
              <p className="text-sm text-gray-600">Pos #{challenge.challenged?.position}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="font-medium">{challenge.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Creado:</span>
              <span>{new Date(challenge.created_at).toLocaleDateString()}</span>
            </div>
            
            {/* Plazos con botones de extensión */}
            {isPending && (
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Plazo para aceptar:</span>
                  <span className="font-medium text-orange-600">
                    {getTimeLeft(challenge.accept_deadline)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExtendAccept(12)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    +12h
                  </button>
                  <button
                    onClick={() => handleExtendAccept(24)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    +24h
                  </button>
                  <button
                    onClick={() => handleExtendAccept(48)}
                    className="flex-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  >
                    +48h
                  </button>
                </div>
              </div>
            )}

            {(isPending || isAccepted) && (
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Plazo para jugar:</span>
                  <span className="font-medium text-green-600">
                    {getTimeLeft(challenge.play_deadline)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExtendPlay(24)}
                    className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    +1 día
                  </button>
                  <button
                    onClick={() => handleExtendPlay(72)}
                    className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    +3 días
                  </button>
                  <button
                    onClick={() => handleExtendPlay(168)}
                    className="flex-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    +1 semana
                  </button>
                </div>
              </div>
            )}

            {challenge.final_score && (
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Resultado actual:</span>
                <span className="font-medium">{challenge.final_score}</span>
              </div>
            )}
            {challenge.winner_id && (
              <div className="flex justify-between">
                <span className="text-gray-600">Ganador actual:</span>
                <span className="font-medium">
                  {challenge.winner_id === challenge.challenger_id 
                    ? challenge.challenger?.name 
                    : challenge.challenged?.name}
                </span>
              </div>
            )}
          </div>

          {/* Mostrar resultados enviados si hay disputa */}
          {isDisputed && (
            <div className="mt-4 space-y-3">
              {challenge.challenger_result && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-semibold text-blue-800 mb-1">
                    Resultado de {challenge.challenger?.name}:
                  </p>
                  <p className="text-sm text-blue-700">
                    Marcador: {challenge.challenger_result.score}
                    <br />
                    Ganador: {challenge.challenger_result.winnerId === challenge.challenger_id ? challenge.challenger?.name : challenge.challenged?.name}
                  </p>
                </div>
              )}
              {challenge.challenged_result && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    Resultado de {challenge.challenged?.name}:
                  </p>
                  <p className="text-sm text-green-700">
                    Marcador: {challenge.challenged_result.score}
                    <br />
                    Ganador: {challenge.challenged_result.winnerId === challenge.challenger_id ? challenge.challenger?.name : challenge.challenged?.name}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Formulario de resolución */}
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {isCompleted ? 'Nuevo Ganador' : 'Ganador'} *
            </label>
            <select
              value={winnerId}
              onChange={(e) => setWinnerId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
            >
              <option value="">Seleccionar ganador...</option>
              <option value={challenge.challenger_id}>
                {challenge.challenger?.name} (Pos #{challenge.challenger?.position})
              </option>
              <option value={challenge.challenged_id}>
                {challenge.challenged?.name} (Pos #{challenge.challenged?.position})
              </option>
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              {isCompleted ? 'Nuevo Marcador' : 'Marcador'} *
            </label>
            <input
              type="text"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              placeholder="6-4, 7-5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Formato: 6-4, 7-5 (o con super tiebreak: 6-3, 4-6, 10-8)
            </p>
          </div>

          {isCompleted && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Nota:</strong> Al editar un partido completado, se actualizarán las estadísticas y el ranking según el nuevo resultado.
              </p>
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {isCompleted ? 'Anular Partido' : 'Cancelar Desafío'}
          </button>
          <button
            onClick={handleResolve}
            className="flex-1 bg-ctg-green text-white font-bold py-2 rounded-lg hover:bg-ctg-lime transition-colors"
          >
            {isCompleted ? 'Actualizar Resultado' : 'Resolver'}
          </button>
        </div>
      </div>
    </div>
  );
}
