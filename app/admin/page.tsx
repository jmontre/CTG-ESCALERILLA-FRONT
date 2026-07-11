'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Player, Challenge, MasterSeason } from '@/types';
import { api } from '@/lib/api';
import { getStatusBadge } from '@/lib/challengeStatus';
import AddPlayerModal from '@/components/admin/AddPlayerModal';
import EditPlayerModal from '@/components/admin/EditPlayerModal';
import ChallengeManagementModal from '@/components/admin/ChallengeManagementModal';

const CATEGORIES = ['A', 'B', 'C', 'D'];
const CATEGORY_NAMES: Record<string, string> = { A: 'Oro', B: 'Plata', C: 'Bronce', D: 'Verde' };
const CATEGORY_RANGES: Record<string, string> = { A: '1-12', B: '13-24', C: '25-36', D: '37-48' };

export default function AdminPage() {
  const router = useRouter();
  const { player, loading } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [masterSeasons, setMasterSeasons] = useState<MasterSeason[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'players' | 'challenges' | 'master'>('dashboard');
  const [loadingData, setLoadingData] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Master
  const [generatingCategory, setGeneratingCategory] = useState<string | null>(null);
  const [deletingSeasonId, setDeletingSeasonId] = useState<string | null>(null);
  const [masterDates, setMasterDates] = useState({
    name: '1er Semestre 2026',
    round_robin_start: '2026-06-22',
    round_robin_end: '2026-07-12',
    final_date: '2026-07-18',
  });

  useEffect(() => {
    if (!loading && (!player || !player.is_admin)) { router.push('/'); return; }
    if (player?.is_admin) fetchData();
  }, [player, loading, router]);

  const fetchData = async () => {
    try {
      const [playersData, challengesData, masterData] = await Promise.all([
        api.getAllPlayersAdmin(),   // endpoint admin: incluye email/phone/has_debt
        api.getChallenges(),
        api.getMaster(),
      ]);
      setPlayers(playersData || []);
      setChallenges(challengesData);
      setMasterSeasons(masterData || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar a ${name}?`)) return;
    try {
      await api.deletePlayer(id);
      await fetchData();
      success(`Jugador ${name} eliminado correctamente.`);
    } catch (err: any) { error(err.message || 'Error al eliminar jugador'); }
  };

  const handleResetImmunity = async (id: string) => {
    try { await api.resetImmunity(id); await fetchData(); success('Inmunidad reseteada.'); }
    catch (err: any) { error(err.message || 'Error'); }
  };

  const handleResetVulnerability = async (id: string) => {
    try { await api.resetVulnerability(id); await fetchData(); success('Vulnerabilidad reseteada.'); }
    catch (err: any) { error(err.message || 'Error'); }
  };

  const handleResolveChallenge = async (challengeId: string, winnerId: string, score: string) => {
    try {
      await api.resolveChallenge(challengeId, winnerId, score);
      await fetchData();
      setShowChallengeModal(false); setSelectedChallenge(null);
      success('Desafío resuelto correctamente.');
    } catch (err: any) { error(err.message || 'Error al resolver desafío'); }
  };

  const handleCancelChallenge = async (challengeId: string, fromModal = false) => {
    const challenge = challenges.find(c => c.id === challengeId);
    const isCompleted = challenge?.status === 'completed';
    const message = isCompleted
      ? '⚠️ Este desafío ya está completado.\n\nSe revertirán las estadísticas (W-L) pero NO los cambios de ranking.\n\n¿Continuar?'
      : '¿Estás seguro de cancelar este desafío?';
    if (!confirm(message)) return;
    setCancellingId(challengeId);
    try {
      await api.cancelChallenge(challengeId);
      await fetchData();
      if (fromModal) { setShowChallengeModal(false); setSelectedChallenge(null); }
      success('Desafío cancelado correctamente.');
    } catch (err: any) { error(err.message || 'Error al cancelar desafío'); }
    finally { setCancellingId(null); }
  };

  const handleForceDelete = async (challengeId: string) => {
    if (!confirm('⚠️ ELIMINAR PERMANENTEMENTE\n\nEsto borrará el desafío de la base de datos sin posibilidad de recuperación.\n\n¿Estás seguro?')) return;
    setDeletingId(challengeId);
    try {
      await api.forceDeleteChallenge(challengeId);
      await fetchData();
      success('Desafío eliminado permanentemente.');
    } catch (err: any) { error(err.message || 'Error al eliminar desafío'); }
    finally { setDeletingId(null); }
  };

  const handleExtendDeadline = async (challengeId: string, hours: number, type: 'accept' | 'play') => {
    try {
      await api.extendDeadline(challengeId, hours, type);
      await fetchData();
      setShowChallengeModal(false); setSelectedChallenge(null);
      success(`Plazo extendido ${hours} horas correctamente.`);
    } catch (err: any) { error(err.message || 'Error al extender plazo'); }
  };

  // ── Master ───────────────────────────────────────────────────────────────────

  const handleGenerateMaster = async (category: string) => {
    if (!confirm(`¿Generar torneo Master para Categoría ${category}?\n\nSe tomarán los 8 primeros jugadores de la categoría y se armarán los grupos con serpenteo.`)) return;
    setGeneratingCategory(category);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/master/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...masterDates, category }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Error al generar torneo');
      }
      await fetchData();
      success(`✅ Torneo Master Categoría ${category} generado correctamente.`);
    } catch (err: any) {
      error(err.message || 'Error al generar torneo');
    } finally {
      setGeneratingCategory(null);
    }
  };

  const handleDeleteSeason = async (seasonId: string, category: string) => {
    if (!confirm(`¿Eliminar el torneo Master de Categoría ${category}?\n\nSe borrarán todos los grupos y partidos.`)) return;
    setDeletingSeasonId(seasonId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/master/${seasonId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      await fetchData();
      success(`Torneo Categoría ${category} eliminado.`);
    } catch (err: any) {
      error(err.message || 'Error al eliminar torneo');
    } finally {
      setDeletingSeasonId(null);
    }
  };

  const canCancel = (status: string) => ['pending', 'accepted', 'disputed', 'completed'].includes(status);

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    );
  }

  if (!player?.is_admin) return null;

  const stats = {
    totalPlayers: players.filter(p => (p.position ?? 0) > 0).length,
    activeChallenges: challenges.filter(c => c.status === 'pending' || c.status === 'accepted').length,
    completedMatches: challenges.filter(c => c.status === 'completed').length,
    disputes: challenges.filter(c => c.status === 'disputed').length,
  };

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => { }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-10">
        <div className="mb-8">
          <div className="text-ctg-green text-xs uppercase tracking-[0.28em] font-bold mb-2">Administración</div>
          <h1 className="font-display font-extrabold text-[#F0F7E8] text-4xl md:text-5xl tracking-tight">Panel <span className="text-ctg-green">Escalerilla</span></h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-[#0f2211] border border-[#1e4020] rounded-2xl p-1.5 overflow-x-auto">
          {(['dashboard', 'players', 'challenges', 'master'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab
                ? 'px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition bg-ctg-green text-[#0a1608]'
                : 'px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition text-[#F0F7E8]/60 hover:text-[#F0F7E8] hover:bg-ctg-green/8'}
            >
              {tab === 'dashboard' ? 'Dashboard'
                : tab === 'players' ? 'Jugadores'
                  : tab === 'challenges' ? 'Desafíos'
                    : 'Master'}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              { label: 'Jugadores',        value: stats.totalPlayers,     color: 'text-[#F0F7E8]' },
              { label: 'Desafíos Activos', value: stats.activeChallenges, color: 'text-amber-400'  },
              { label: 'Partidos Jugados', value: stats.completedMatches, color: 'text-ctg-green'  },
              { label: 'Disputas',         value: stats.disputes,         color: 'text-red-400'    },
            ].map((s) => (
              <div key={s.label} className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5">
                <div className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold">{s.label}</div>
                <div className={`font-display font-black text-3xl mt-1 ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Players */}
        {activeTab === 'players' && (
          <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-bold text-[#F0F7E8] text-xl">Gestión de Jugadores</h2>
              <button onClick={() => setShowAddModal(true)} className="btn-primary">
                + Agregar Jugador
              </button>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-[#1e4020]">
              <table className="w-full">
                <thead className="bg-[#152b18] text-[#F0F7E8]/45 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Pos</th>
                    <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
                    <th className="px-4 py-3 text-left font-semibold">W-L</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e4020]">
                  {players.filter(p => (p.position ?? 0) > 0).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((p) => (
                    <tr key={p.id} className="hover:bg-ctg-green/4 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-bold text-ctg-green">#{p.position ?? '—'}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#F0F7E8]">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-[#F0F7E8]/50">{p.email}</td>
                      <td className="px-4 py-3 text-sm text-[#F0F7E8]/50">{p.phone || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="text-ctg-green font-medium">{p.wins}</span>-
                        <span className="text-red-400 font-medium">{p.losses}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {p.immune_until && new Date(p.immune_until) > new Date() && (
                            <span className="chip chip-info">
                              🛡️ Inmune
                              <button onClick={() => handleResetImmunity(p.id)} className="ml-1 hover:opacity-70">×</button>
                            </span>
                          )}
                          {p.vulnerable_until && new Date(p.vulnerable_until) > new Date() && (
                            <span className="chip chip-warning">
                              ⚠️ Vulnerable
                              <button onClick={() => handleResetVulnerability(p.id)} className="ml-1 hover:opacity-70">×</button>
                            </span>
                          )}
                          {(!p.immune_until || new Date(p.immune_until) <= new Date()) &&
                            (!p.vulnerable_until || new Date(p.vulnerable_until) <= new Date()) && (
                              <span className="chip chip-muted">Normal</span>
                            )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                        <button onClick={() => { setSelectedPlayer(p); setShowEditModal(true); }} className="btn-ghost text-xs px-2.5 py-1.5 mr-2">Editar</button>
                        <button onClick={() => handleDeletePlayer(p.id, p.name)} className="btn-danger text-xs px-2.5 py-1.5">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Challenges */}
        {activeTab === 'challenges' && (
          <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6">
            <h2 className="font-display font-bold text-[#F0F7E8] text-xl mb-6">Gestión de Desafíos</h2>
            <div className="space-y-3">
              {challenges.length === 0 ? (
                <p className="text-[#F0F7E8]/35 text-center py-8">No hay desafíos registrados</p>
              ) : (
                challenges.map((challenge) => (
                  <div key={challenge.id} className="border border-[#1e4020] rounded-xl p-4 hover:border-ctg-green/30 transition-colors bg-[#152b18]/50">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-[#F0F7E8] text-sm">
                            {challenge.challenger?.name} vs {challenge.challenged?.name}
                          </p>
                          {getStatusBadge(challenge.status)}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-[#F0F7E8]/40">
                          <span>{new Date(challenge.created_at).toLocaleDateString('es-CL')}</span>
                          {challenge.final_score && <span className="font-mono">{challenge.final_score}</span>}
                          {challenge.winner_id && (
                            <span>{challenge.winner_id === challenge.challenger_id ? challenge.challenger?.name : challenge.challenged?.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {canCancel(challenge.status) && (
                          <button
                            onClick={() => handleCancelChallenge(challenge.id)}
                            disabled={cancellingId === challenge.id}
                            className="btn-danger text-xs px-2.5 py-1.5 disabled:opacity-50"
                          >
                            {cancellingId === challenge.id ? '...' : 'Cancelar'}
                          </button>
                        )}
                        <button
                          onClick={() => handleForceDelete(challenge.id)}
                          disabled={deletingId === challenge.id}
                          className="btn-danger text-xs px-2.5 py-1.5 disabled:opacity-50"
                          title="Eliminar permanentemente de la DB"
                        >
                          {deletingId === challenge.id ? '...' : '🗑️'}
                        </button>
                        <button
                          onClick={() => { setSelectedChallenge(challenge); setShowChallengeModal(true); }}
                          className={challenge.status === 'disputed'
                            ? 'btn-danger text-xs px-2.5 py-1.5'
                            : 'btn-primary text-xs px-2.5 py-1.5'}
                        >
                          {challenge.status === 'disputed' ? 'Resolver' : 'Gestionar'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Master */}
        {activeTab === 'master' && (
          <div className="space-y-6">
            {/* Config fechas */}
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6">
              <h2 className="font-display font-bold text-[#F0F7E8] text-xl mb-1">Configuración del Master</h2>
              <p className="text-sm text-[#F0F7E8]/40 mb-4">Estas fechas se aplicarán al generar cada categoría.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label block mb-1">Nombre de temporada</label>
                  <input
                    type="text"
                    value={masterDates.name}
                    onChange={(e) => setMasterDates(d => ({ ...d, name: e.target.value }))}
                    className="field w-full"
                  />
                </div>
                <div>
                  <label className="label block mb-1">Inicio Round Robin</label>
                  <input
                    type="date"
                    value={masterDates.round_robin_start}
                    onChange={(e) => setMasterDates(d => ({ ...d, round_robin_start: e.target.value }))}
                    className="field w-full"
                  />
                </div>
                <div>
                  <label className="label block mb-1">Fin Round Robin</label>
                  <input
                    type="date"
                    value={masterDates.round_robin_end}
                    onChange={(e) => setMasterDates(d => ({ ...d, round_robin_end: e.target.value }))}
                    className="field w-full"
                  />
                </div>
                <div>
                  <label className="label block mb-1">Fecha Final</label>
                  <input
                    type="date"
                    value={masterDates.final_date}
                    onChange={(e) => setMasterDates(d => ({ ...d, final_date: e.target.value }))}
                    className="field w-full"
                  />
                </div>
              </div>
            </div>

            {/* Categorías */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CATEGORIES.map(cat => {
                const season = masterSeasons.find(s => s.category === cat);
                const isGenerating = generatingCategory === cat;
                const isDeleting = deletingSeasonId === season?.id;

                return (
                  <div key={cat} className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className={`font-bold text-lg cat-letter-${cat}`}>Categoría {cat} — {CATEGORY_NAMES[cat]}</h3>
                        <p className="text-sm text-[#F0F7E8]/40">Posiciones {CATEGORY_RANGES[cat]}</p>
                      </div>
                      {season ? (
                        <span className="chip chip-success">Activo</span>
                      ) : (
                        <span className="chip chip-muted">Sin generar</span>
                      )}
                    </div>

                    {season ? (
                      <div className="space-y-3">
                        <div className="bg-[#152b18] border border-[#1e4020] rounded-lg p-3 text-sm text-[#F0F7E8]/60 space-y-1">
                          <p>Estado: <strong className="text-[#F0F7E8]">{season.status}</strong></p>
                          <p>Grupos: <strong className="text-[#F0F7E8]">{season.groups.length}</strong></p>
                          <p>Partidos: <strong className="text-[#F0F7E8]">{season.groups.flatMap(g => g.matches).length}</strong></p>
                        </div>
                        <button
                          onClick={() => handleDeleteSeason(season.id, cat)}
                          disabled={isDeleting}
                          className="btn-danger w-full text-sm py-2 disabled:opacity-50"
                        >
                          {isDeleting ? 'Eliminando...' : '🗑️ Eliminar torneo'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleGenerateMaster(cat)}
                        disabled={isGenerating}
                        className="btn-primary w-full py-3 disabled:opacity-50"
                      >
                        {isGenerating ? 'Generando...' : 'Generar Master'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPlayerModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={() => { fetchData(); setShowAddModal(false); }} />
      <EditPlayerModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelectedPlayer(null); }} onSuccess={() => { fetchData(); setShowEditModal(false); setSelectedPlayer(null); }} player={selectedPlayer} allPlayers={players} />
      <ChallengeManagementModal
        isOpen={showChallengeModal}
        onClose={() => { setShowChallengeModal(false); setSelectedChallenge(null); }}
        challenge={selectedChallenge}
        onResolve={handleResolveChallenge}
        onCancel={(id) => handleCancelChallenge(id, true)}
        onExtend={handleExtendDeadline}
      />

      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}