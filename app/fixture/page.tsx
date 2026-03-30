'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChallengesList from '@/components/ChallengesList';
import ResultModal from '@/components/ResultModal';
import ScheduleDateModal from '@/components/ScheduleDateModal';
import Toast from '@/components/Toast';
import { Challenge } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';

export default function FixturePage() {
  const router = useRouter();
  const { player: currentPlayer, loading: authLoading } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [scheduleDateModalOpen, setScheduleDateModalOpen] = useState(false);
  const [scheduleChallenge, setScheduleChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!currentPlayer) { router.push('/'); return; }
      if (currentPlayer.is_admin) { router.push('/admin'); return; }
    }
    if (currentPlayer && !currentPlayer.is_admin) fetchChallenges();
  }, [currentPlayer, authLoading, router]);

  const fetchChallenges = async () => {
    if (!currentPlayer) return;
    try {
      const allChallenges = await api.getChallenges();
      setChallenges(allChallenges.filter(
        (c) => c.challenger_id === currentPlayer.id || c.challenged_id === currentPlayer.id
      ));
    } catch (err) {
      console.error('Error al cargar desafíos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (challenge: Challenge) => {
    if (!currentPlayer) return;
    try {
      await api.acceptChallenge(challenge.id, currentPlayer.id);
      await fetchChallenges();
      success('¡Desafío aceptado! Tienen 5 días para jugar.');
    } catch (err: any) {
      error(err.message || 'Error al aceptar desafío');
    }
  };

  const handleReject = async (challenge: Challenge) => {
    if (!currentPlayer) return;
    if (!confirm('¿Estás seguro de rechazar este desafío?')) return;
    try {
      await api.rejectChallenge(challenge.id, currentPlayer.id);
      await fetchChallenges();
      success('Desafío rechazado.');
    } catch (err: any) {
      error(err.message || 'Error al rechazar desafío');
    }
  };

  const handleReportResult = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setResultModalOpen(true);
  };

  const handleSubmitResult = async (winnerId: string, score: string) => {
    if (!currentPlayer || !selectedChallenge) return;
    try {
      await api.submitResult(selectedChallenge.id, currentPlayer.id, winnerId, score);
      await fetchChallenges();
      setResultModalOpen(false);
      setSelectedChallenge(null);
      success('Resultado enviado correctamente.');
    } catch (err: any) {
      error(err.message || 'Error al enviar resultado');
    }
  };

  const handleOpenScheduleDate = (challenge: Challenge) => {
    setScheduleChallenge(challenge);
    setScheduleDateModalOpen(true);
  };

  // Línea ~87 — cambia la firma:
  const handleSubmitScheduleDate = async (scheduledDate: string, courtId: string) => {
    if (!currentPlayer || !scheduleChallenge) return;
    try {
      await api.scheduleMatch(scheduleChallenge.id, currentPlayer.id, scheduledDate, courtId);
      await fetchChallenges();
      success('Fecha del partido fijada correctamente.');
    } catch (err: any) {
      error(err.message || 'Error al fijar fecha');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
      </div>
    );
  }

  if (!currentPlayer || currentPlayer.is_admin) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="fixture" onLoginClick={() => { }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ctg-dark mb-2">Mis Desafíos</h1>
          <p className="text-gray-600">Historial completo de tus desafíos</p>
        </div>

        <ChallengesList
          challenges={challenges}
          currentPlayerId={currentPlayer.id}
          onAccept={handleAccept}
          onReject={handleReject}
          onSubmitResult={handleReportResult}
          onScheduleDate={handleOpenScheduleDate}
        />

        <ResultModal
          isOpen={resultModalOpen}
          onClose={() => { setResultModalOpen(false); setSelectedChallenge(null); }}
          challenge={selectedChallenge}
          currentPlayer={currentPlayer}
          onSubmit={handleSubmitResult}
        />

        <ScheduleDateModal
          isOpen={scheduleDateModalOpen}
          onClose={() => { setScheduleDateModalOpen(false); setScheduleChallenge(null); }}
          challenge={scheduleChallenge}
          currentPlayerId={currentPlayer.id}
          onSubmit={handleSubmitScheduleDate}
        />
      </div>

      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}