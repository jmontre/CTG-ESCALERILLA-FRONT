'use client';

import { Challenge } from '@/types';

interface ChallengesListProps {
  challenges: Challenge[];
  currentPlayerId?: string;
  onAccept: (challenge: Challenge) => void;
  onReject: (challenge: Challenge) => void;
  onSubmitResult?: (challenge: Challenge) => void;
  onScheduleDate?: (challenge: Challenge) => void;
  loading?: boolean;
}

export default function ChallengesList({
  challenges,
  currentPlayerId,
  onAccept,
  onReject,
  onSubmitResult,
  onScheduleDate,
  loading = false,
}: ChallengesListProps) {

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-club-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Cargando desafíos...</p>
      </div>
    );
  }

  const pending  = challenges.filter(c => c.status === 'pending');
  const accepted = challenges.filter(c => c.status === 'accepted');
  const history  = challenges.filter(c =>
    ['completed', 'rejected', 'disputed', 'cancelled',
     'expired_not_accepted', 'expired_not_played'].includes(c.status)
  );

  if (challenges.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No hay desafíos registrados</p>
      </div>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getDeadlineDate = (deadline: string) =>
    new Date(deadline).toLocaleString('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit',
    });

  const hasSubmittedResult = (challenge: Challenge, playerId: string) =>
    (challenge.challenger_id === playerId && !!challenge.challenger_result) ||
    (challenge.challenged_id === playerId && !!challenge.challenged_result);

  const getSubmittedResult = (challenge: Challenge, playerId: string) => {
    if (challenge.challenger_id === playerId && challenge.challenger_result) return challenge.challenger_result;
    if (challenge.challenged_id === playerId && challenge.challenged_result) return challenge.challenged_result;
    return null;
  };

  const bothSubmitted = (challenge: Challenge) =>
    !!challenge.challenger_result && !!challenge.challenged_result;

  const statusLabel = (challenge: Challenge, currentPlayerId: string) => {
    const iWon = challenge.winner_id === currentPlayerId;
    switch (challenge.status) {
      case 'completed':
        return iWon
          ? { text: '🏆 Victoria', color: 'bg-green-100 text-green-800' }
          : { text: '😔 Derrota',  color: 'bg-red-100 text-red-800'   };
      case 'rejected':
        return challenge.challenger_id === currentPlayerId
          ? { text: '✅ Ganado por W.O.', color: 'bg-green-100 text-green-800' }
          : { text: '❌ Rechazado',       color: 'bg-red-100 text-red-800'    };
      case 'disputed':
        return { text: '⚠️ En disputa', color: 'bg-yellow-100 text-yellow-800' };
      case 'cancelled':
        return { text: '🚫 Cancelado', color: 'bg-gray-100 text-gray-600' };
      case 'expired_not_accepted':
        return challenge.challenger_id === currentPlayerId
          ? { text: '✅ Ganado (no respondió)', color: 'bg-green-100 text-green-800' }
          : { text: '⏰ Expirado sin responder', color: 'bg-orange-100 text-orange-800' };
      case 'expired_not_played':
        return { text: '⏰ Expirado sin jugar', color: 'bg-orange-100 text-orange-800' };
      default:
        return { text: challenge.status, color: 'bg-gray-100 text-gray-600' };
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-10">

      {/* ── Pendientes ── */}
      {pending.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-club-primary mb-4 flex items-center gap-2">
            ⏳ Esperando Respuesta ({pending.length})
          </h3>
          <div className="space-y-4">
            {pending.map((challenge) => {
              const isChallenger = challenge.challenger_id === currentPlayerId;
              const isChallenged = challenge.challenged_id === currentPlayerId;
              const timeLeft  = new Date(challenge.accept_deadline).getTime() - Date.now();
              const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
              const isExpiringSoon = hoursLeft < 6;

              return (
                <div
                  key={challenge.id}
                  className="bg-white rounded-lg shadow-md p-5 border-l-4"
                  style={{ borderLeftColor: isExpiringSoon ? '#f87171' : '#4e9f3d' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg">{challenge.challenger?.name}</span>
                        <span className="text-2xl">⚔️</span>
                        <span className="font-bold text-lg">{challenge.challenged?.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Pos #{challenge.challenger?.position} vs Pos #{challenge.challenged?.position}</span>
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
        </section>
      )}

      {/* ── Partidos por Jugar ── */}
      {accepted.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-club-primary mb-4 flex items-center gap-2">
            🎾 Partidos por Jugar ({accepted.length})
          </h3>
          <div className="space-y-4">
            {accepted.map((challenge) => {
              const timeLeft = new Date(challenge.play_deadline).getTime() - Date.now();
              const daysLeft  = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
              const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
              const isUrgent  = daysLeft < 2;

              const iSubmitted = hasSubmittedResult(challenge, currentPlayerId!);
              const myResult   = getSubmittedResult(challenge, currentPlayerId!);
              const bothSent   = bothSubmitted(challenge);
              const hasScheduledDate = !!challenge.scheduled_date;

              return (
                <div
                  key={challenge.id}
                  className="bg-white rounded-lg shadow-md p-6 border-l-4"
                  style={{ borderLeftColor: bothSent ? '#3b82f6' : isUrgent ? '#f59e0b' : '#10b981' }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-bold text-xl">{challenge.challenger?.name}</span>
                        <span className="text-3xl">🎾</span>
                        <span className="font-bold text-xl">{challenge.challenged?.name}</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-semibold">Posiciones:</span>
                          <span>#{challenge.challenger?.position} vs #{challenge.challenged?.position}</span>
                        </div>

                        {/* Fecha acordada */}
                        {hasScheduledDate && (
                          <div className="flex items-center gap-2 text-sm font-semibold text-ctg-dark bg-ctg-light/50 rounded-lg px-3 py-2">
                            <span>📅</span>
                            <span>
                              Partido agendado:{' '}
                              {new Date(challenge.scheduled_date!).toLocaleString('es-CL', {
                                weekday: 'long', day: 'numeric', month: 'long',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}

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

                        {iSubmitted && myResult && (
                          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-1">
                              <span>📋</span>
                              <span>Tu resultado enviado:</span>
                            </div>
                            <div className="text-sm text-blue-700 ml-5">
                              <strong>{myResult.score}</strong><br />
                              Ganador: {myResult.winnerId === challenge.challenger_id
                                ? challenge.challenger?.name
                                : challenge.challenged?.name}
                            </div>
                          </div>
                        )}

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

                    {/* Botones */}
                    <div className="flex flex-col gap-2 ml-4">
                      {onScheduleDate && (
                        <button
                          onClick={() => onScheduleDate(challenge)}
                          className="px-4 py-2 border border-ctg-green text-ctg-green rounded-lg hover:bg-ctg-green hover:text-white transition text-sm font-medium whitespace-nowrap"
                        >
                          {hasScheduledDate ? '📅 Cambiar fecha' : '📅 Fijar fecha'}
                        </button>
                      )}

                      {iSubmitted ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg text-sm font-bold cursor-not-allowed"
                        >
                          ✓ Resultado Enviado
                        </button>
                      ) : (
                        <button
                          onClick={() => onSubmitResult?.(challenge)}
                          className="px-4 py-2 bg-club-primary text-white rounded-lg hover:bg-club-secondary transition font-medium shadow-md text-sm whitespace-nowrap"
                        >
                          Ingresar Resultado
                        </button>
                      )}
                    </div>
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
        </section>
      )}

      {/* ── Historial ── */}
      {history.length > 0 && (
        <section>
          <h3 className="text-xl font-bold text-club-primary mb-4 flex items-center gap-2">
            📋 Historial ({history.length})
          </h3>
          <div className="space-y-3">
            {history.map((challenge) => {
              const label   = statusLabel(challenge, currentPlayerId!);
              const isWinner = challenge.winner_id === currentPlayerId;
              const opponent = challenge.challenger_id === currentPlayerId
                ? challenge.challenged
                : challenge.challenger;
              const resolvedDate = challenge.resolved_at || challenge.played_at;

              return (
                <div
                  key={challenge.id}
                  className="bg-white rounded-lg shadow-sm p-4 border-l-4"
                  style={{
                    borderLeftColor:
                      challenge.status === 'completed'
                        ? (isWinner ? '#22c55e' : '#ef4444')
                        : challenge.status === 'disputed'
                        ? '#f59e0b'
                        : '#9ca3af',
                  }}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-800">
                          vs {opponent?.name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${label.color}`}
                        >
                          {label.text}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {challenge.final_score && (
                          <span>🎾 Score: <strong>{challenge.final_score}</strong></span>
                        )}
                        {resolvedDate && (
                          <span>
                            📅 {new Date(resolvedDate).toLocaleDateString('es-CL', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </span>
                        )}
                        <span>
                          {challenge.challenger_id === currentPlayerId ? '📤 Tú desafiaste' : '📥 Te desafiaron'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}