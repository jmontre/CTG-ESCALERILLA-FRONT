'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import { Challenge } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export default function FixturePublicoPage() {
  const { player } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchPlayer, setSearchPlayer] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'disputed' | 'cancelled'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    loadChallenges();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [challenges, searchPlayer, filterStatus, filterDate, sortBy]);

  const loadChallenges = async () => {
    try {
      const data = await api.getChallenges();
      setChallenges(data);
    } catch (error) {
      console.error('Error al cargar desafíos:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...challenges];

    if (searchPlayer) {
      filtered = filtered.filter((c) => {
        const challengerName = c.challenger?.name?.toLowerCase() || '';
        const challengedName = c.challenged?.name?.toLowerCase() || '';
        const search = searchPlayer.toLowerCase();
        return challengerName.includes(search) || challengedName.includes(search);
      });
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    if (filterDate !== 'all') {
      const now = new Date();
      const filterTime = {
        week:  7   * 24 * 60 * 60 * 1000,
        month: 30  * 24 * 60 * 60 * 1000,
        year:  365 * 24 * 60 * 60 * 1000,
      }[filterDate];

      filtered = filtered.filter((c) => {
        const date = new Date(c.created_at);
        return now.getTime() - date.getTime() <= filterTime;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredChallenges(filtered);
  };

  const formatScheduledDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekday = d.toLocaleDateString('es-CL', { weekday: 'long' });
    const day = d.getDate();
    const month = d.toLocaleDateString('es-CL', { month: 'long' });
    const hour = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: false });
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    return `${cap(weekday)} ${day} ${cap(month)} - ${hour} hrs`;
  };

  const getTimeLeft = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return 'Expirado';

    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h restantes`;
    return `${hours}h restantes`;
  };

  const getStatusDisplay = (challenge: Challenge) => {
    switch (challenge.status) {
      case 'pending':
        return (
          <div className="text-center">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
              ⏳ Esperando respuesta
            </span>
          </div>
        );

      case 'accepted':
        return (
          <div className="text-center space-y-1">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              🎾 Por jugar
            </span>
            {challenge.scheduled_date ? (
              <p className="text-xs font-semibold text-ctg-dark mt-1">
                📅 {formatScheduledDate(challenge.scheduled_date)}
              </p>
            ) : (
              <p className="text-xs text-orange-500 font-medium mt-1">
                ⏰ {getTimeLeft(challenge.play_deadline)}
              </p>
            )}
          </div>
        );

      case 'completed':
        return (
          <div className="text-center">
            <div className="text-2xl font-bold text-ctg-dark mb-1">
              {challenge.final_score}
            </div>
            <div className="text-sm text-green-600 font-medium">
              👑 {challenge.winner_id === challenge.challenger_id
                ? challenge.challenger?.name
                : challenge.challenged?.name}
            </div>
          </div>
        );

      case 'disputed':
        return (
          <div className="text-center">
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              ⚠️ En disputa
            </span>
          </div>
        );

      case 'cancelled':
      case 'rejected':
        return (
          <div className="text-center">
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
              ❌ Cancelado
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="partidos" onLoginClick={() => {}} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ctg-dark mb-2">Ver Partidos</h1>
          <p className="text-gray-600">Todos los desafíos y partidos de la escalerilla</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-card p-4">
            <p className="text-gray-500 text-xs mb-1">Total</p>
            <p className="text-2xl font-bold text-ctg-dark">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-4">
            <p className="text-gray-500 text-xs mb-1">Esperando Respuesta</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-4">
            <p className="text-gray-500 text-xs mb-1">Por Jugar</p>
            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-4">
            <p className="text-gray-500 text-xs mb-1">Completados</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl shadow-card p-4">
            <p className="text-gray-500 text-xs mb-1">En Disputa</p>
            <p className="text-2xl font-bold text-red-600">{stats.disputed}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar jugador</label>
              <input
                type="text"
                value={searchPlayer}
                onChange={(e) => setSearchPlayer(e.target.value)}
                placeholder="Nombre del jugador..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              >
                <option value="all">Todos</option>
                <option value="pending">Esperando Respuesta</option>
                <option value="accepted">Por Jugar</option>
                <option value="completed">Completados</option>
                <option value="disputed">En Disputa</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Período</label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              >
                <option value="all">Todo el tiempo</option>
                <option value="week">Última semana</option>
                <option value="month">Último mes</option>
                <option value="year">Último año</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {filteredChallenges.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No se encontraron partidos con los filtros seleccionados
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredChallenges.map((challenge) => (
                <div key={challenge.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

                    {/* Jugadores */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="text-center">
                          <p className="font-bold text-lg text-ctg-dark">{challenge.challenger?.name}</p>
                          <p className="text-xs text-gray-500">Pos #{challenge.challenger?.position}</p>
                        </div>
                        <span className="text-2xl">⚔️</span>
                        <div className="text-center">
                          <p className="font-bold text-lg text-ctg-dark">{challenge.challenged?.name}</p>
                          <p className="text-xs text-gray-500">Pos #{challenge.challenged?.position}</p>
                        </div>
                      </div>

                      {challenge.status !== 'accepted' && (
                        <p className="text-sm text-gray-500">
                          📅 {new Date(challenge.created_at).toLocaleDateString('es-CL', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>

                    {/* Estado / Resultado */}
                    <div className="flex items-center justify-center md:w-48">
                      {getStatusDisplay(challenge)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}