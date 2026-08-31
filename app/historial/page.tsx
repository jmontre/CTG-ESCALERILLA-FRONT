'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import LoginPrompt from '@/components/LoginPrompt';
import { Challenge, HistoryResponse } from '@/types';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const PODIO: Record<string, { emoji: string; texto: string }> = {
  champion:     { emoji: '🏆', texto: 'Campeón de categoría' },
  finalist:     { emoji: '🥈', texto: 'Finalista' },
  semifinalist: { emoji: '🎖️', texto: 'Semifinalista' },
};

export default function HistorialPage() {
  const router = useRouter();
  const { player: currentPlayer, loading: authLoading } = useAuth();

  const [data, setData]     = useState<HistoryResponse | null>(null);
  const [period, setPeriod] = useState('all');
  /** Período que corresponde a `data`. Si no coincide con el pedido, se está cargando. */
  const [loadedPeriod, setLoadedPeriod] = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ganados' | 'perdidos'>('todos');

  useEffect(() => {
    if (!currentPlayer || currentPlayer.is_admin) return;
    // `cancelled` evita que una respuesta lenta de un período que ya no está
    // seleccionado pise a la del actual, si se cambia de chip rápido.
    let cancelled = false;
    api.getHistory(period).then(res => {
      if (cancelled) return;
      setData(res);
      setLoadedPeriod(period);
    });
    return () => { cancelled = true; };
  }, [currentPlayer, period]);

  // Buscar por rival y filtrar por resultado se hacen sobre lo ya traído: son
  // del período que el backend acotó, no una segunda fuente de verdad.
  const visibles = useMemo(() => {
    if (!data || !currentPlayer) return [] as Challenge[];
    let list = data.matches;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c => {
        const rival = c.challenger_id === currentPlayer.id ? c.challenged?.name : c.challenger?.name;
        return rival?.toLowerCase().includes(q);
      });
    }
    if (filterStatus !== 'todos') {
      list = list.filter(c =>
        filterStatus === 'ganados' ? c.winner_id === currentPlayer.id : c.winner_id !== currentPlayer.id,
      );
    }
    return list;
  }, [data, currentPlayer, searchTerm, filterStatus]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    );
  }

  // Derivado en vez de un setState dentro del efecto: mientras lo cargado no
  // sea lo pedido, se muestra el spinner.
  const loading = loadedPeriod !== period;
  const stats = data?.stats;
  const periodos = data?.periods ?? [];
  const años = [...new Set(periodos.filter(p => p.type !== 'all').map(p => p.year!))];
  const podio = stats?.master_result ? PODIO[stats.master_result] : null;
  const etiquetaPeriodo = periodos.find(p => p.id === period)?.label ?? '';

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => {}} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24 md:pb-10">
        {!currentPlayer ? (
          <LoginPrompt emoji="📊" message="Inicia sesión para ver tu historial de partidos." />
        ) : currentPlayer.is_admin ? (
          <div className="max-w-md mx-auto mt-16 bg-[#0f2211] border border-[#1e4020] rounded-2xl p-8 text-center">
            <p className="text-[#F0F7E8]/50">Los admins no tienen historial personal.</p>
            <button onClick={() => router.push('/admin')} className="btn-primary w-full py-3 mt-6">
              Ir al panel de admin →
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-ctg-green/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Escalerilla</p>
              <h1 className="font-display text-3xl font-extrabold text-[#F0F7E8]">Mi Historial</h1>
            </div>

            {/* Selector de período: año completo o un semestre */}
            <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-4 mb-6">
              <div className="label mb-2.5">Ver</div>
              <div className="flex flex-wrap gap-2">
                {periodos.filter(p => p.type === 'all').map(p => (
                  <PeriodChip key={p.id} activo={period === p.id} onClick={() => setPeriod(p.id)}>
                    {p.label}
                  </PeriodChip>
                ))}
                {años.map(year => (
                  <div key={year} className="flex items-center gap-2 pl-2 ml-1 border-l border-[#1e4020]">
                    {periodos
                      .filter(p => p.year === year)
                      .map(p => (
                        <PeriodChip
                          key={p.id}
                          activo={period === p.id}
                          destacado={p.type === 'year'}
                          onClick={() => setPeriod(p.id)}
                        >
                          {p.label}
                        </PeriodChip>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
              </div>
            ) : !stats ? (
              <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-12 text-center text-[#F0F7E8]/40 text-sm">
                No se pudo cargar el historial. Reintenta en un momento.
              </div>
            ) : (
              <>
                {/* Cómo terminó esa temporada */}
                {stats.final_position != null && (
                  <div className="bg-[#0f2211] border border-ctg-green/25 rounded-xl px-5 py-4 mb-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold">
                        Cómo terminaste {etiquetaPeriodo}
                      </div>
                      <div className="font-display font-black text-2xl text-[#F0F7E8] mt-0.5">
                        #{stats.final_position}
                        {stats.category && (
                          <span className="text-[#F0F7E8]/45 text-base font-bold ml-2">
                            Categoría {stats.category}
                          </span>
                        )}
                      </div>
                    </div>
                    {podio && (
                      <div className="text-right shrink-0">
                        <div className="text-3xl leading-none">{podio.emoji}</div>
                        <div className="text-[11px] text-ctg-green font-semibold mt-1">{podio.texto}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Stats del período seleccionado */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Partidos', value: stats.played,  color: 'text-[#F0F7E8]' },
                    { label: 'Ganados',  value: stats.wins,    color: 'text-ctg-green'  },
                    { label: 'Perdidos', value: stats.losses,  color: 'text-red-400'    },
                  ].map(s => (
                    <div key={s.label} className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-4 text-center">
                      <div className={`font-display font-black text-3xl ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mt-0.5">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {stats.played > 0 && (
                  <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="label">Efectividad</span>
                      <span className="font-mono text-ctg-green font-bold text-sm">{stats.effectiveness}%</span>
                    </div>
                    <div className="h-1.5 bg-[#0a1608] rounded-full overflow-hidden">
                      <div className="h-full bg-ctg-green rounded-full"
                        style={{ width: `${stats.effectiveness}%`, boxShadow: '0 0 8px rgba(139,194,52,.5)' }} />
                    </div>
                  </div>
                )}

                {/* Filtros dentro del período */}
                <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl p-5 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label block mb-1.5">Buscar rival</label>
                      <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Nombre del rival..." className="field w-full" />
                    </div>
                    <div>
                      <label className="label block mb-1.5">Resultado</label>
                      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
                        className="select w-full">
                        <option value="todos">Todos</option>
                        <option value="ganados">Ganados</option>
                        <option value="perdidos">Perdidos</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Partidos */}
                <div className="bg-[#0f2211] border border-[#1e4020] rounded-xl overflow-hidden">
                  {visibles.length === 0 ? (
                    <div className="p-12 text-center text-[#F0F7E8]/35 text-sm">
                      {stats.played === 0
                        ? `No jugaste partidos en ${etiquetaPeriodo.toLowerCase()}.`
                        : 'No se encontraron partidos con esos filtros.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1e4020]">
                      {visibles.map(c => {
                        const isWinner = c.winner_id === currentPlayer.id;
                        const rival = c.challenger_id === currentPlayer.id ? c.challenged : c.challenger;
                        const date = new Date(c.played_at || c.resolved_at || c.created_at);
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PeriodChip({ activo, destacado, onClick, children }: {
  activo: boolean; destacado?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors border ' +
        (activo
          ? 'bg-ctg-green text-[#0a1608] border-ctg-green'
          : destacado
            ? 'bg-[#152b18] border-[#1e4020] text-[#F0F7E8]/80 hover:border-ctg-green/40'
            : 'bg-transparent border-[#1e4020] text-[#F0F7E8]/55 hover:text-[#F0F7E8] hover:border-ctg-green/40')
      }
    >
      {children}
    </button>
  );
}
