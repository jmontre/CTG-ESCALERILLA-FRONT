'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  player: any | null;
  allPlayers?: any[];
}

export default function EditUserModal({ isOpen, onClose, onSuccess, player, allPlayers = [] }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name:                    '',
    email:                   '',
    phone:                   '',
    member_type:             'socio',
    parent_id:               '',
    has_debt:                false,
    extra_high_demand_slots: 0,
    admin_role:              '',
    school_names:            [] as string[],
  });

  const [newSchoolName, setNewSchoolName] = useState('');

  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState('');
  const [playerReservations, setPlayerReservations] = useState<any[]>([]);
  const [weekUsage, setWeekUsage]                   = useState<any>(null);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [cancellingId, setCancellingId]             = useState<string | null>(null);

  useEffect(() => {
    if (player) {
      setFormData({
        name:                    player.name,
        email:                   player.email,
        phone:                   player.phone || '',
        member_type:             player.member_type  || 'socio',
        parent_id:               player.parent_id    || '',
        has_debt:                player.has_debt     || false,
        extra_high_demand_slots: player.extra_high_demand_slots ?? 0,
        admin_role:              player.admin_role   || '',
        school_names:            player.school_names || [],
      });
      loadPlayerReservations(player.id);
    }
  }, [player]);

  const loadPlayerReservations = async (playerId: string) => {
    setLoadingReservations(true);
    try {
      const data = await api.getPlayerReservations(playerId);
      setPlayerReservations(data.reservations || []);
      setWeekUsage(data.weekUsage || null);
    } catch {
      setPlayerReservations([]);
    } finally {
      setLoadingReservations(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm('¿Cancelar esta reserva?')) return;
    setCancellingId(reservationId);
    try {
      await api.adminCancelReservation(reservationId, 'Cancelada por administrador');
      if (player) await loadPlayerReservations(player.id);
    } catch (err: any) {
      setError(err.message || 'Error al cancelar reserva');
    } finally {
      setCancellingId(null);
    }
  };

  if (!isOpen || !player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.updatePlayer(player.id, {
        name:                    formData.name,
        email:                   formData.email,
        phone:                   formData.phone || null,
        member_type:             formData.member_type,
        parent_id:               formData.parent_id || null,
        has_debt:                formData.has_debt,
        extra_high_demand_slots: formData.extra_high_demand_slots,
        admin_role:              formData.admin_role || null,
        school_names:            formData.school_names,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  const availableParents = allPlayers.filter(p =>
    p.id !== player.id && p.member_type !== 'hijo_socio' && !p.admin_role
  );
  const activeReservations = playerReservations.filter(r => r.status === 'active');
  const pastReservations   = playerReservations.filter(r => r.status !== 'active').slice(0, 5);

  const inputClass   = 'field text-sm';
  const labelClass   = 'label block mb-1.5';
  const sectionClass = 'bg-[#152b18] border border-[#1e4020] rounded-xl p-4';
  const sectionTitle = 'font-display text-base font-bold text-[#F0F7E8] mb-3 flex items-center gap-2';

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative w-full max-w-2xl animate-scale-in">
        <div className="bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden max-h-[85vh] overflow-y-auto">
          <div className="bg-[#152b18] border-b border-[#1e4020] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <div>
              <h3 className="font-display text-xl font-bold text-[#F0F7E8]">Editar Usuario</h3>
              <p className="text-sm text-[#F0F7E8]/45">
                {player.position ? `#${player.position} en escalerilla` : 'Solo reservas'}
              </p>
            </div>
            <button onClick={onClose} className="text-[#F0F7E8]/30 hover:text-[#F0F7E8] text-2xl leading-none transition">×</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* ── 1. Información Básica ── */}
            <div className={sectionClass}>
              <h3 className={sectionTitle}>👤 Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombre</label>
                  <input type="text" value={formData.name} required
                    onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={formData.email} required
                    onChange={e => setFormData({...formData, email: e.target.value})} className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Teléfono</label>
                  <input type="tel" value={formData.phone} placeholder="+56912345678"
                    onChange={e => setFormData({...formData, phone: e.target.value})} className={inputClass} />
                </div>
              </div>
            </div>

            {/* ── 2. Reservas ── */}
            <div className={sectionClass}>
              <h3 className={sectionTitle}>📅 Reservas</h3>

              {/* Cupos semanales */}
              {weekUsage && (
                <div className="bg-[#0f2211] border border-[#1e4020] rounded-lg p-3 mb-4">
                  <p className="text-xs font-semibold text-[#F0F7E8]/45 mb-2 uppercase tracking-wide">Cupos alta demanda — semana actual</p>
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-ctg-green">{weekUsage.remaining}</p>
                      <p className="text-xs text-[#F0F7E8]/40">Restantes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-400">{weekUsage.used}</p>
                      <p className="text-xs text-[#F0F7E8]/40">Usados</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#F0F7E8]">{weekUsage.total_limit}</p>
                      <p className="text-xs text-[#F0F7E8]/40">Total ({weekUsage.base_limit} base + {weekUsage.extra_slots} extra)</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Tipo de socio */}
                <div>
                  <label className={labelClass}>Tipo de socio</label>
                  <select value={formData.member_type}
                    onChange={e => setFormData({...formData, member_type: e.target.value, parent_id: '', school_names: []})}
                    className={`${inputClass} select`}>
                    <option value="socio">Socio</option>
                    <option value="hijo_socio">Hijo de socio</option>
                    <option value="profe">Profe / Escuela</option>
                  </select>
                  <p className="text-xs text-[#F0F7E8]/40 mt-1">
                    {formData.member_type === 'socio'      && '2 turnos alta demanda/semana base'}
                    {formData.member_type === 'hijo_socio' && '1 turno alta demanda/semana'}
                    {formData.member_type === 'profe'      && 'Sin límite de reservas ni alta demanda'}
                  </p>
                </div>

                {/* Socio padre — solo si es hijo */}
                {formData.member_type === 'hijo_socio' && (
                  <div>
                    <label className={labelClass}>Socio padre</label>
                    <select value={formData.parent_id}
                      onChange={e => setFormData({...formData, parent_id: e.target.value})}
                      className={`${inputClass} select`}>
                      <option value="">— Sin asignar —</option>
                      {availableParents.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Nombres de escuela — solo si es profe */}
                {formData.member_type === 'profe' && (
                  <div className="md:col-span-2">
                    <label className={labelClass}>Nombres de la escuela</label>
                    <p className="text-xs text-[#F0F7E8]/40 mb-2">Ej: Nano, Mondaca, Isma — aparecerán como &quot;Escuela Nano&quot;</p>
                    <div className="flex gap-2 mb-2">
                      <input type="text" value={newSchoolName}
                        onChange={e => setNewSchoolName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const name = newSchoolName.trim();
                            if (name && !formData.school_names.includes(name)) {
                              setFormData({...formData, school_names: [...formData.school_names, name]});
                              setNewSchoolName('');
                            }
                          }
                        }}
                        placeholder="Nombre y Enter para agregar"
                        className={inputClass} />
                      <button type="button"
                        onClick={() => {
                          const name = newSchoolName.trim();
                          if (name && !formData.school_names.includes(name)) {
                            setFormData({...formData, school_names: [...formData.school_names, name]});
                            setNewSchoolName('');
                          }
                        }}
                        className="px-4 py-2 bg-ctg-green text-[#0a1608] rounded-lg text-sm font-bold hover:bg-ctg-lime transition">
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.school_names.map(name => (
                        <div key={name} className="flex items-center gap-1 bg-ctg-green/15 border border-ctg-green/30 text-ctg-green px-3 py-1 rounded-full text-sm font-medium">
                          <span>Escuela {name}</span>
                          <button type="button"
                            onClick={() => setFormData({...formData, school_names: formData.school_names.filter(n => n !== name)})}
                            className="text-[#F0F7E8]/40 hover:text-red-400 ml-1 font-bold transition">×</button>
                        </div>
                      ))}
                      {formData.school_names.length === 0 && (
                        <p className="text-xs text-[#F0F7E8]/40">Sin nombres configurados</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Cupos extra — solo si es socio */}
                {formData.member_type === 'socio' && (
                  <div>
                    <label className={labelClass}>Cupos extra alta demanda</label>
                    <div className="flex items-center gap-2">
                      <button type="button"
                        onClick={() => setFormData({...formData, extra_high_demand_slots: Math.max(0, formData.extra_high_demand_slots - 1)})}
                        className="w-9 h-9 rounded-lg bg-[#1e4020] hover:bg-[#26502a] text-[#F0F7E8]/70 font-bold text-lg flex items-center justify-center transition">−</button>
                      <input type="number" min="0" max="10" value={formData.extra_high_demand_slots}
                        onChange={e => setFormData({...formData, extra_high_demand_slots: parseInt(e.target.value)||0})}
                        className="w-16 text-center px-2 py-2 bg-[#0f2211] border border-[#1e4020] rounded-lg text-sm font-bold text-[#F0F7E8] focus:outline-none focus:border-ctg-green/60 focus:ring-2 focus:ring-ctg-green/20 transition" />
                      <button type="button"
                        onClick={() => setFormData({...formData, extra_high_demand_slots: formData.extra_high_demand_slots + 1})}
                        className="w-9 h-9 rounded-lg bg-ctg-green/10 hover:bg-ctg-green/20 text-ctg-green font-bold text-lg flex items-center justify-center transition">+</button>
                    </div>
                    <p className="text-xs text-[#F0F7E8]/40 mt-1">
                      Total esta semana: {2 + formData.extra_high_demand_slots} turnos
                    </p>
                  </div>
                )}

                {/* Deuda */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#1e4020] hover:bg-[#0f2211] transition">
                    <input type="checkbox" checked={formData.has_debt}
                      onChange={e => setFormData({...formData, has_debt: e.target.checked})}
                      className="w-4 h-4 accent-red-500" />
                    <div>
                      <span className="text-sm font-medium text-[#F0F7E8]/80">⚠️ Tiene deuda pendiente</span>
                      <p className="text-xs text-[#F0F7E8]/40">No podrá hacer nuevas reservas hasta que sea desactivado</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Reservas activas */}
              {loadingReservations ? (
                <div className="text-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-ctg-green mx-auto"></div></div>
              ) : (
                <>
                  <p className="text-xs font-semibold text-[#F0F7E8]/45 uppercase tracking-wide mb-2">
                    Reservas activas ({activeReservations.length})
                  </p>
                  {activeReservations.length === 0 ? (
                    <p className="text-xs text-[#F0F7E8]/40 mb-3">Sin reservas activas.</p>
                  ) : (
                    <div className="space-y-2 mb-3">
                      {activeReservations.map(r => (
                        <div key={r.id} className="flex items-center justify-between bg-ctg-green/10 border border-ctg-green/25 rounded-lg px-3 py-2">
                          <div>
                            <span className="text-sm font-medium text-[#F0F7E8]">{r.court?.name}</span>
                            <span className="text-xs text-[#F0F7E8]/45 ml-2">{formatDate(r.date)} · {r.time_slot} hrs</span>
                            {r.is_high_demand && <span className="ml-2 text-xs text-orange-400">🔥</span>}
                            {r.is_challenge && <span className="ml-2 text-xs text-blue-300">⚔️</span>}
                          </div>
                          <button type="button" onClick={() => handleCancelReservation(r.id)}
                            disabled={cancellingId === r.id}
                            className="text-xs px-2 py-1 bg-red-900/30 border border-red-500/25 text-red-400 rounded hover:bg-red-900/50 transition disabled:opacity-50">
                            {cancellingId === r.id ? '...' : 'Cancelar'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {pastReservations.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-[#F0F7E8]/35 uppercase tracking-wide mb-2">Últimas canceladas</p>
                      <div className="space-y-1">
                        {pastReservations.map(r => (
                          <div key={r.id} className="flex items-center justify-between bg-[#0f2211] border border-[#1e4020] rounded-lg px-3 py-2 opacity-60">
                            <span className="text-xs text-[#F0F7E8]/50">{r.court?.name} · {formatDate(r.date)} · {r.time_slot}</span>
                            <span className="text-xs text-[#F0F7E8]/30">🚫</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {/* ── 3. Acceso Admin ── */}
            <div className={sectionClass}>
              <h3 className={sectionTitle}>🔐 Acceso Administrador</h3>
              <select value={formData.admin_role}
                onChange={e => setFormData({...formData, admin_role: e.target.value})}
                className={`${inputClass} select`}>
                <option value="">Sin acceso admin</option>
                <option value="escalerilla">Admin Escalerilla</option>
                <option value="reservas">Admin Reservas</option>
                <option value="all">Super Admin (ambos)</option>
              </select>
              <p className="text-xs text-[#F0F7E8]/40 mt-1">
                {!formData.admin_role                && 'Usuario normal, sin acceso a paneles admin'}
                {formData.admin_role === 'escalerilla' && 'Puede gestionar escalerilla y desafíos'}
                {formData.admin_role === 'reservas'    && 'Puede gestionar reservas y temporada'}
                {formData.admin_role === 'all'         && 'Acceso completo a ambos paneles'}
              </p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">{error}</div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
