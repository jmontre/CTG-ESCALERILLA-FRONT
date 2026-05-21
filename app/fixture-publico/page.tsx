'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import LoginModal from '@/components/LoginModal';
import { Challenge } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

function getStatusChip(challenge: Challenge) {
  const formatScheduled = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekday = d.toLocaleDateString('es-CL', { weekday: 'short' });
    const day = d.getDate();
    const month = d.toLocaleDateString('es-CL', { month: 'short' });
    const hour = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${weekday} ${day} ${month} — ${hour} hrs`;
  };
  const getTimeLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const days  = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
  };

  switch (challenge.status) {
    case 'pending':
      return <span className="chip chip-warning">Esperando respuesta</span>;
    case 'accepted':
      return (
        <div className="flex flex-col items-end gap-1">
          <span className="chip chip-info">Por jugar</span>
          {challenge.scheduled_date
            ? <span className="text-xs text-[#F0F7E8]/50">{formatScheduled(challenge.scheduled_date)}</span>
            : <span className="text-xs text-amber-400/70">{getTimeLeft(challenge.play_deadline)} restantes</span>}
        </div>
      );
    case 'completed':
      return (
        <div className="text-right">
          <div className="font-mono font-bold text-[#F0F7E8] text-sm">{challenge.final_score}</div>
          <div className="text-xs text-ctg-green mt-0.5">
            {challenge.winner_id === challenge.challenger_id ? challenge.challenger?.name : challenge.challenged?.name}
          </div>
        </div>
      );
    case 'disputed':   return <span className="chip chip-danger">En disputa</span>;
    case 'rejected':
    case 'expired_not_accepted':
      return <span className="chip chip-success">W.O. — {challenge.challenger?.name}</span>;
    case 'expired_not_played': return <span className="chip chip-warning">No se jugó</span>;
    case 'cancelled':  return <span className="chip bg-[#1e4020] text-[#F0F7E8]/45 border border-[#1e4020]">Cancelado</span>;
    default: return null;
  }
}

export default function FixturePublicoPage() {
  const { refreshPlayer } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filtered, setFiltered]     = useState<Challenge[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showLogin, setShowLogin]   = useState(false);

  const [search,     setSearch]     = useState('');
  const [statusF,    setStatusF]    = useState<string>('all');
  const [dateF,      setDateF]      = useState<string>('all');
  const [sortBy,     setSortBy]     = useState<string>('newest');

  useEffect(() => { loadChallenges(); }, []);

  useEffect(() => {
    let list = [...challenges];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.challenger?.name?.toLowerCase().includes(q)) ||
        (c.challenged?.name?.toLowerCase().includes(q))
      );
    }
    if (statusF !== 'all') list = list.filter(c => c.status === statusF);
    if (dateF !== 'all') {
      const ms = { week: 7, month: 30, year: 365 }[dateF as 'week'|'month'|'year'] * 86400000;
      list = list.filter(c => Date.now() - new Date(c.created_at).getTime() <= ms);
    }
    list.sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortBy === 'newest' ? -diff : diff;
    });
    setFiltered(list);
  }, [challenges, search, statusF, dateF, sortBy]);

  const loadChallenges = async () => {
    try { setChallenges(await api.getChallenges()); }
    catch { /* silent */ }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    );
  }

  const stats = {
    total:     challenges.length,
    pending:   challenges.filter(c => c.status === 'pending').length,
    active:    challenges.filter(c => c.status === 'accepted').length,
    completed: challenges.filter(c => c.status === 'completed').length,
    disputed:  challenges.filter(c => c.status === 'disputed').length,
  };

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => setShowLogin(true)} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-10">
        <div className="mb-8">
          <p className="text-ctg-green/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Escalerilla</p>
          <h1 className="font-display text-3xl font-extrabold text-[#F0F7E8]">Ver Partidos</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total',            value: stats.total,     color: 'text-[#F0F7E8]'  },
            { label: 'Sin respuesta',    value: stats.pending,   color: 'text-amber-400'  },
            { label: 'Por jugar',        value: stats.active,    color: 'text-blue-400'   },
            { label: 'Completados',      value: stats.completed, color: 'text-ctg-green'  },
            { label: 'En disputa',       value: stats.disputed,  color: 'text-red-400'    },
          ].map(s => (
            <div key={s.label} className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-4">
              <p className="text-[#F0F7E8]/40 text-xs mb-1">{s.label}</p>
              <p className={`font-display text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label block mb-1.5">Buscar jugador</label>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nombre del jugador..." className="field w-full" />
            </div>
            <div>
              <label className="label block mb-1.5">Estado</label>
              <select value={statusF} onChange={e => setStatusF(e.target.value)} className="select w-full">
                <option value="all">Todos</option>
                <option value="pending">Esperando respuesta</option>
                <option value="accepted">Por jugar</option>
                <option value="completed">Completados</option>
                <option value="disputed">En disputa</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
            <div>
              <label className="label block mb-1.5">Período</label>
              <select value={dateF} onChange={e => setDateF(e.target.value)} className="select w-full">
                <option value="all">Todo el tiempo</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
            </div>
            <div>
              <label className="label block mb-1.5">Ordenar</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="select w-full">
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-[#F0F7E8]/35 text-sm">
              No se encontraron partidos con los filtros seleccionados
            </div>
          ) : (
            <div className="divide-y divide-[#1e4020]">
              {filtered.map(c => (
                <div key={c.id} className="px-5 py-4 hover:bg-[#152b18]/60 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-0">
                          <p className="font-semibold text-[#F0F7E8] text-sm truncate">{c.challenger?.name}</p>
                          <p className="text-xs text-[#F0F7E8]/40">#{c.challenger?.position}</p>
                        </div>
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#8BC234" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L21 0M19 5l-5 5" />
                        </svg>
                        <div className="text-center min-w-0">
                          <p className="font-semibold text-[#F0F7E8] text-sm truncate">{c.challenged?.name}</p>
                          <p className="text-xs text-[#F0F7E8]/40">#{c.challenged?.position}</p>
                        </div>
                      </div>
                      {c.status !== 'accepted' && (
                        <p className="text-xs text-[#F0F7E8]/35 mt-1.5">
                          {new Date(c.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center">
                      {getStatusChip(c)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)}
        onSuccess={() => { setShowLogin(false); refreshPlayer(); }} />
    </div>
  );
}
