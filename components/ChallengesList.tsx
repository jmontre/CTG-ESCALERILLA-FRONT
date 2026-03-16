'use client';

import { Challenge } from '@/types';

interface ChallengesListProps {
  challenges: Challenge[];
  currentPlayerId?: string;
  onAccept: (challenge: Challenge) => void;
  onReject: (challenge: Challenge) => void;
  onSubmitResult?: (challenge: Challenge) => void;
  loading?: boolean;
}

export default function ChallengesList({ 
  challenges, 
  currentPlayerId,
  onAccept, 
  onReject,
  onSubmitResult,
  loading = false 
}: ChallengesListProps) {
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-club-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Cargando desafíos...</p>
      </div>
    );
  }

  const pendingResponse = challenges.filter(c => c.status === 'pending');
  const accepted = challenges.filter(c => c.status === 'accepted');

  const hasAny = pendingResponse.length > 0 || accepted.length > 0;

  if (!hasAny) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hay desafíos activos</p>
      </div>
    );
  }

  const formatTimeLeft = (deadline: string) => {
    const timeLeft = new Date(deadline).getTime() - Date.now();
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (daysLeft > 0) {
      return `${daysLeft}d ${hoursLeft}h`;
    }
    return `${hoursLeft}h`;
  };

  const getDeadlineDate = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleString('es-CL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasSubmittedResult = (challenge: Challenge, playerId: string) => {
    if (challenge.challenger_id === playerId && challenge.challenger_result) {
      return true;
    }
    if (challenge.challenged_id === playerId && challenge.challenged_result) {
      return true;
    }
    return false;
  };

  const getSubmittedResult = (challenge: Challenge, playerId: string) => {
    if (challenge.challenger_id === playerId && challenge.challenger_result) {
      return challenge.challenger_result;
    }
    if (challenge.challenged_id === playerId && challenge.challenged_result) {
      return challenge.challenged_result;
    }
    return null;
  };

  const bothSubmitted = (challenge: Challenge) => {
    return challenge.challenger_result && challenge.challenged_result;
  };

  return (
    <div className="space-y-8">
      {/* Desafíos Pendientes */}
      {pendingResponse.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-club-primary mb-4 flex items-center gap-2">
            ⏳ Esperando Respuesta ({pendingResponse.length})
          </h3>
          <div className="space-y-4">
            {pendingResponse.map((challenge) => {
              const isChallenger = challenge.challenger_id === currentPlayerId;
              const isChallenged = challenge.challenged_id === currentPlayerId;
              
              const timeLeft = new Date(challenge.accept_deadline).getTime() - Date.now();
              const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
              const isExpiringSoon = hoursLeft < 6;

              return (
                <div 
                  key={challenge.id}
                  className="bg-white rounded-lg shadow-md p-5 border-l-4"
                  style={{
                    borderLeftColor: isExpiringSoon ? '#f87171' : '#4e9f3d'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg">
                          {challenge.challenger?.name}
                        </span>
                        <span className="text-2xl">⚔️</span>
                        <span className="font-bold text-lg">
                          {challenge.challenged?.name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Pos #{challenge.challenger?.position} vs Pos #{challenge.challenged?.position}
                        </span>
                        <span className={isExpiringSoon ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                          ⏰ {hoursLeft}h restantes
                        </span>
                      </div>

                      {isChallenger && (
                        <div className="mt-2 text-sm text-blue-600">
                          📤 Desafío enviado - Esperando respuesta
                        </div>
                      )}
                    </div>

                    {isChallenged && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => onAccept(challenge)}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                        >
                          ✓ Aceptar
                        </button>
                        <button
                          onClick={() => onReject(challenge)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                        >
                          ✗ Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Partidos por Jugar */}
      {accepted.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-club-primary mb-4 flex items-center gap-2">
            🎾 Partidos por Jugar ({accepted.length})
          </h3>
          <div className="space-y-4">
            {accepted.map((challenge) => {
              const timeLeft = new Date(challenge.play_deadline).getTime() - Date.now();
              const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
              const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const isUrgent = daysLeft < 2;

              const iSubmitted = hasSubmittedResult(challenge, currentPlayerId!);
              const myResult = getSubmittedResult(challenge, currentPlayerId!);
              const bothSent = bothSubmitted(challenge);

              return (
                <div 
                  key={challenge.id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4"
                  style={{
                    borderLeftColor: bothSent ? '#3b82f6' : isUrgent ? '#f59e0b' : '#10b981'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-bold text-xl">
                          {challenge.challenger?.name}
                        </span>
                        <span className="text-3xl">🎾</span>
                        <span className="font-bold text-xl">
                          {challenge.challenged?.name}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-semibold">Posiciones:</span>
                          <span>#{challenge.challenger?.position} vs #{challenge.challenged?.position}</span>
                        </div>

                        {!bothSent && (
                          <>
                            <div className={`flex items-center gap-2 text-sm font-semibold ${isUrgent ? 'text-orange-600' : 'text-green-600'}`}>
                              <span>⏰</span>
                              <span>
                                {daysLeft > 0 ? `${daysLeft} días y ${hoursLeft} horas` : `${hoursLeft} horas`} para jugar
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>📅</span>
                              <span>Fecha límite: {getDeadlineDate(challenge.play_deadline)}</span>
                            </div>
                          </>
                        )}

                        {challenge.accepted_at && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>✅</span>
                            <span>Aceptado el {new Date(challenge.accepted_at).toLocaleDateString('es-CL')}</span>
                          </div>
                        )}

                        {/* Mostrar resultado enviado */}
                        {iSubmitted && myResult && (
                          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-1">
                              <span>📋</span>
                              <span>Tu resultado enviado:</span>
                            </div>
                            <div className="text-sm text-blue-700 ml-5">
                              <strong>{myResult.score}</strong>
                              <br />
                              Ganador: {myResult.winnerId === challenge.challenger_id ? challenge.challenger?.name : challenge.challenged?.name}
                            </div>
                          </div>
                        )}

                        {/* Ambos enviaron */}
                        {bothSent && !iSubmitted && (
                          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-yellow-800">
                              ⏳ El otro jugador ya envió su resultado. ¡Ingresa el tuyo!
                            </p>
                          </div>
                        )}

                        {bothSent && iSubmitted && (
                          <div className="mt-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-purple-800">
                              ✅ Ambos resultados enviados - Esperando validación
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botón de ingresar resultado */}
                    {iSubmitted ? (
                      <button
                        disabled
                        style={{
                          padding: '12px 20px',
                          backgroundColor: '#d1d5db',
                          color: '#6b7280',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'not-allowed'
                        }}
                      >
                        ✓ Resultado Enviado
                      </button>
                    ) : (
                      <button
                        onClick={() => onSubmitResult?.(challenge)}
                        className="px-5 py-2 bg-club-primary text-white rounded-lg hover:bg-club-secondary transition font-medium shadow-md"
                      >
                        Ingresar Resultado
                      </button>
                    )}
                  </div>

                  {isUrgent && !bothSent && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-orange-800 text-sm font-semibold">
                        ⚠️ ¡Atención! Quedan menos de 2 días para jugar este partido
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
