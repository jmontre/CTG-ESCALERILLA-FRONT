'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Challenge } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function HistorialPage() {
  const router = useRouter();
  const { player: currentPlayer, loading: authLoading } = useAuth();

  const [challenges, setChallenges]   = useState<Challenge[]>([]);
  const [filtered, setFiltered]       = useState<Challenge[]>([]);
  const [loading, setLoading]         = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ganados' | 'perdidos'>('todos');
  const [filterDate, setFilterDate]   = useState<string>('all');

  useEffect(() => {
    if (!authLoading) {
      if (!currentPlayer) { router.push('/'); return; }
      if (currentPlayer.is_admin) { router.push('/admin'); return; }
    }
    if (currentPlayer && !currentPlayer.is_admin) loadHistory(currentPlayer.id);
  }, [currentPlayer, authLoading, router]);

  useEffect(() => { applyFilters(); }, [challenges, searchTerm, filterStatus, filterDate]);

  const loadHistory = async (playerId: string) => {
    try {
      const all = await api.getChallenges();
      const mine = all
        .filter(c => (c.challenger_id === playerId || c.challenged_id === playerId) && c.status === 'completed')
        .sort((a, b) => {
          const da = new Date(a.played_at || a.resolved_at || a.created_at).getTime();
          const db = new Date(b.played_at || b.resolved_at || b.created_at).getTime();
          return db - da;
        });
      setChallenges(mine);
    } finally { setLoading(false); }
  };

  const applyFilters = () => {
    if (!currentPlayer) return;
    let list = [...challenges];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c => {
        const rival = c.challenger_id === currentPlayer.id ? c.challenged?.name : c.challenger?.name;
        return rival?.toLowerCase().includes(q);
      });
    }
    if (filterStatus !== 'todos') {
      list = list.filter(c => {
        const won = c.winner_id === currentPlayer.id;
        return filterStatus === 'ganados' ? won : !won;
      });
    }
    if (filterDate !== 'all') {
      const ms = { week: 7, month: 30, year: 365 }[filterDate as 'week'|'month'|'year'] * 86400000;
      list = list.filter(c => Date.now() - new Date(c.played_at || c.resolved_at || c.created_at).getTime() <= ms);
    }
    setFiltered(list);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    );
  }

  if (!currentPlayer || currentPlayer.is_admin) return null;

  const wins   = challenges.filter(c => c.winner_id === currentPlayer.id).length;
  const losses = challenges.length - wins;
  const eff    = challenges.length > 0 ? Math.round((wins / challenges.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => {}} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-10">
        <div className="mb-8">
          <p className="text-ctg-green/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Escalerilla</p>
          <h1 className="font-display text-3xl font-extrabold text-[#F0F7E8]">Mi Historial</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Partidos', value: challenges.length, color: 'text-[#F0F7E8]' },
            { label: 'Ganados',  value: wins,              color: 'text-ctg-green'  },
            { label: 'Perdidos', value: losses,            color: 'text-red-400'    },
          ].map(s => (
            <div key={s.label} className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-4 text-center">
              <div className={`font-display font-black text-3xl ${s.color}`}>{s.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Effectiveness bar */}
        {challenges.length > 0 && (
          <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="label">Efectividad</span>
              <span className="font-mono text-ctg-green font-bold text-sm">{eff}%</span>
            </div>
            <div className="h-1.5 bg-[#0a1608] rounded-full overflow-hidden">
              <div className="h-full bg-ctg-green rounded-full" style={{ width: `${eff}%`, boxShadow: '0 0 8px rgba(139,194,52,.5)' }} />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label block mb-1.5">Buscar rival</label>
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Nombre del rival..." className="field w-full" />
            </div>
            <div>
              <label className="label block mb-1.5">Resultado</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="select w-full">
                <option value="todos">Todos</option>
                <option value="ganados">Ganados</option>
                <option value="perdidos">Perdidos</option>
              </select>
            </div>
            <div>
              <label className="label block mb-1.5">Período</label>
              <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="select w-full">
                <option value="all">Todo el tiempo</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
            </div>
          </div>
        </div>

        {/* Match list */}
        <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-[#F0F7E8]/35 text-sm">No se encontraron partidos</div>
          ) : (
            <div className="divide-y divide-[#1e4020]">
              {filtered.map(c => {
                const isWinner = c.winner_id === currentPlayer.id;
                const rival    = c.challenger_id === currentPlayer.id ? c.challenged : c.challenger;
                const date     = new Date(c.played_at || c.resolved_at || c.created_at);
                return (
                  <div key={c.id}
                    className={'flex items-center justify-between px-5 py-4 transition-colors ' +
                      (isWinner ? 'hover:bg-ctg-green/5' : 'hover:bg-red-900/5')}>
                    <div className="flex items-center gap-3">
                      <div className={'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ' +
                        (isWinner ? 'bg-ctg-green/15 text-ctg-green' : 'bg-red-900/20 text-red-400')}>
                        {isWinner ? 'W' : 'L'}
                      </div>
                      <div>
                        <p className="font-semibold text-[#F0F7E8] text-sm">vs {rival?.name}</p>
                        <p className="text-xs text-[#F0F7E8]/40">
                          {date.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-[#F0F7E8] text-sm">{c.final_score || '—'}</p>
                      <p className={'text-xs font-medium ' + (isWinner ? 'text-ctg-green' : 'text-red-400')}>
                        {isWinner ? 'Victoria' : 'Derrota'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
