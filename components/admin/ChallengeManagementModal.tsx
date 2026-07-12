'use client';

import { useState } from 'react';
import { Challenge } from '@/types';
import { getStatusBadge } from '@/lib/challengeStatus';

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
  const [formError, setFormError] = useState('');

  if (!isOpen || !challenge) return null;

  const handleResolve = () => {
    if (!winnerId || !score) {
      setFormError('Debes seleccionar un ganador e ingresar el marcador.');
      return;
    }
    setFormError('');
    onResolve(challenge.id, winnerId, score);
  };

  const handleCancel = () => {
    const isCompleted = challenge.status === 'completed';
    const message = isCompleted
      ? '⚠️ Este desafío ya está completado.\n\nSe revertirán las estadísticas (W-L) pero NO los cambios de ranking.\n\n¿Continuar?'
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
  const isPending   = challenge.status === 'pending';
  const isAccepted  = challenge.status === 'accepted';

  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days  = Math.floor(hours / 24);
    return days > 0 ? `${days}d ${hours % 24}h restantes` : `${hours}h restantes`;
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl animate-scale-in">
        <div className="bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden max-h-[85vh] overflow-y-auto">
          <div className="bg-[#152b18] border-b border-[#1e4020] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h3 className="font-display text-xl font-bold text-[#F0F7E8]">
              {isDisputed ? '⚠️ Resolver Disputa' : isCompleted ? '✏️ Editar Resultado' : 'Gestionar Desafío'}
            </h3>
            <button onClick={onClose} className="text-[#F0F7E8]/30 hover:text-[#F0F7E8] text-2xl leading-none transition">×</button>
          </div>

          <div className="p-6 space-y-4">
            {/* Info */}
            <div className="bg-[#152b18] border border-[#1e4020] rounded-xl p-4">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-[#F0F7E8]">{challenge.challenger?.name}</p>
                  <p className="text-sm text-[#F0F7E8]/50">Pos #{challenge.challenger?.position}</p>
                </div>
                <span className="text-3xl">⚔️</span>
                <div className="text-center">
                  <p className="text-lg font-bold text-[#F0F7E8]">{challenge.challenged?.name}</p>
                  <p className="text-sm text-[#F0F7E8]/50">Pos #{challenge.challenged?.position}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-[#F0F7E8]/50">Estado:</span>
                  {getStatusBadge(challenge.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-[#F0F7E8]/50">Creado:</span>
                  <span className="text-[#F0F7E8]">{new Date(challenge.created_at).toLocaleDateString()}</span>
                </div>

                {isPending && (
                  <div className="border-t border-[#1e4020] pt-2 mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#F0F7E8]/50">Plazo para aceptar:</span>
                      <span className="font-medium text-amber-400">{getTimeLeft(challenge.accept_deadline)}</span>
                    </div>
                    <div className="flex gap-2">
                      {[12, 24, 48].map(h => (
                        <button key={h} onClick={() => handleExtendAccept(h)}
                          className="flex-1 px-3 py-1 text-xs bg-blue-900/30 border border-blue-500/20 text-blue-300 rounded hover:bg-blue-900/50 transition">+{h}h</button>
                      ))}
                    </div>
                  </div>
                )}

                {(isPending || isAccepted) && (
                  <div className="border-t border-[#1e4020] pt-2 mt-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[#F0F7E8]/50">Plazo para jugar:</span>
                      <span className="font-medium text-ctg-green">{getTimeLeft(challenge.play_deadline)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleExtendPlay(24)}
                        className="flex-1 px-3 py-1 text-xs bg-ctg-green/10 border border-ctg-green/25 text-ctg-green rounded hover:bg-ctg-green/20 transition">+1 día</button>
                      <button onClick={() => handleExtendPlay(72)}
                        className="flex-1 px-3 py-1 text-xs bg-ctg-green/10 border border-ctg-green/25 text-ctg-green rounded hover:bg-ctg-green/20 transition">+3 días</button>
                      <button onClick={() => handleExtendPlay(168)}
                        className="flex-1 px-3 py-1 text-xs bg-ctg-green/10 border border-ctg-green/25 text-ctg-green rounded hover:bg-ctg-green/20 transition">+1 semana</button>
                    </div>
                  </div>
                )}

                {challenge.final_score && (
                  <div className="flex justify-between border-t border-[#1e4020] pt-2">
                    <span className="text-[#F0F7E8]/50">Resultado actual:</span>
                    <span className="font-medium text-[#F0F7E8]">{challenge.final_score}</span>
                  </div>
                )}
                {challenge.winner_id && (
                  <div className="flex justify-between">
                    <span className="text-[#F0F7E8]/50">Ganador actual:</span>
                    <span className="font-medium text-[#F0F7E8]">
                      {challenge.winner_id === challenge.challenger_id ? challenge.challenger?.name : challenge.challenged?.name}
                    </span>
                  </div>
                )}
              </div>

              {isDisputed && (
                <div className="mt-4 space-y-3">
                  {challenge.challenger_result && (
                    <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3">
                      <p className="text-sm font-semibold text-blue-300 mb-1">Resultado de {challenge.challenger?.name}:</p>
                      <p className="text-sm text-blue-300/80">
                        Marcador: {challenge.challenger_result.score}<br />
                        Ganador: {challenge.challenger_result.winnerId === challenge.challenger_id ? challenge.challenger?.name : challenge.challenged?.name}
                      </p>
                    </div>
                  )}
                  {challenge.challenged_result && (
                    <div className="bg-ctg-green/10 border border-ctg-green/25 rounded-lg p-3">
                      <p className="text-sm font-semibold text-ctg-green mb-1">Resultado de {challenge.challenged?.name}:</p>
                      <p className="text-sm text-ctg-green/80">
                        Marcador: {challenge.challenged_result.score}<br />
                        Ganador: {challenge.challenged_result.winnerId === challenge.challenger_id ? challenge.challenger?.name : challenge.challenged?.name}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label className="label block mb-1.5">{isCompleted ? 'Nuevo Ganador' : 'Ganador'} *</label>
                <select
                  value={winnerId}
                  onChange={(e) => { setWinnerId(e.target.value); setFormError(''); }}
                  className="field select"
                >
                  <option value="">Seleccionar ganador...</option>
                  <option value={challenge.challenger_id}>{challenge.challenger?.name} (Pos #{challenge.challenger?.position})</option>
                  <option value={challenge.challenged_id}>{challenge.challenged?.name} (Pos #{challenge.challenged?.position})</option>
                </select>
              </div>

              <div>
                <label className="label block mb-1.5">{isCompleted ? 'Nuevo Marcador' : 'Marcador'} *</label>
                <input
                  type="text"
                  value={score}
                  onChange={(e) => { setScore(e.target.value); setFormError(''); }}
                  className="field"
                  placeholder="6-4, 7-5"
                />
                <p className="text-xs text-[#F0F7E8]/40 mt-1">Formato: 6-4, 7-5 (o con super tiebreak: 6-3, 4-6, 10-8)</p>
              </div>

              {formError && (
                <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
                  {formError}
                </div>
              )}

              {isCompleted && (
                <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-sm text-amber-300/80">
                    ⚠️ <strong className="text-amber-300">Nota:</strong> Al editar un partido completado, se actualizarán las estadísticas y el ranking según el nuevo resultado.
                  </p>
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="btn-ghost flex-1">
                Cerrar
              </button>
              <button onClick={handleCancel} className="btn-danger">
                {isCompleted ? 'Anular Partido' : 'Cancelar Desafío'}
              </button>
              <button onClick={handleResolve} className="btn-primary flex-1">
                {isCompleted ? 'Actualizar Resultado' : 'Resolver'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
