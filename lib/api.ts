import { Player, Challenge, AuthResponse, MasterSeason } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Todas las llamadas autenticadas usan credentials: 'include' para enviar la cookie httpOnly.
// No se usa localStorage ni Authorization header; el token vive solo en la cookie del backend.
const withAuth: RequestInit = { credentials: 'include' };

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify({ username, password }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al iniciar sesión'); }
    return res.json();
  },

  register: async (data: { username: string; email: string; password: string; name: string; phone?: string }): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'include', body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al registrar usuario'); }
    return res.json();
  },

  validateToken: async (): Promise<{ user: any; player: Player }> => {
    const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    if (!res.ok) throw new Error('Sin sesión activa');
    return res.json();
  },

  logout: async (): Promise<void> => {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
  },

  forgotPassword: async (username: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al procesar la solicitud'); }
    return res.json();
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al restablecer la contraseña'); }
    return res.json();
  },

  // Players
  getPlayers: async (): Promise<Player[]> => {
    const res = await fetch(`${API_URL}/players`);
    return res.json();
  },

  getPlayerByUserId: async (userId: string): Promise<Player> => {
    const res = await fetch(`${API_URL}/players/user/${userId}`, { ...withAuth });
    return res.json();
  },

  getPlayer: async (id: string): Promise<Player> => {
    const res = await fetch(`${API_URL}/players/${id}`, { ...withAuth });
    return res.json();
  },

  // Challenges
  getChallenges: async (): Promise<Challenge[]> => {
    const res = await fetch(`${API_URL}/challenges`);
    return res.json();
  },

  createChallenge: async (challengerId: string, challengedId: string): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/challenges`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth,
      body: JSON.stringify({ challenger_id: challengerId, challenged_id: challengedId }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al crear desafío'); }
    return res.json();
  },

  acceptChallenge: async (challengeId: string, playerId: string): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/challenges/${challengeId}/accept`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth,
      body: JSON.stringify({ player_id: playerId }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al aceptar desafío'); }
    return res.json();
  },

  rejectChallenge: async (challengeId: string, playerId: string): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/challenges/${challengeId}/reject`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth,
      body: JSON.stringify({ player_id: playerId }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al rechazar desafío'); }
    return res.json();
  },

  submitResult: async (challengeId: string, playerId: string, winnerId: string, score: string): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/challenges/${challengeId}/result`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth,
      body: JSON.stringify({ player_id: playerId, winner_id: winnerId, score }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al enviar resultado'); }
    return res.json();
  },

  scheduleMatch: async (challengeId: string, playerId: string, scheduledDate: string, courtId: string): Promise<{ message: string; challenge: Challenge }> => {
    const res = await fetch(`${API_URL}/challenges/${challengeId}/schedule`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth,
      body: JSON.stringify({ player_id: playerId, scheduled_date: scheduledDate, court_id: courtId }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al fijar la fecha del partido'); }
    return res.json();
  },

  // Admin - Players
  createPlayer: async (data: any): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al crear jugador'); }
    return res.json();
  },

  updatePlayer: async (id: string, data: any): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al actualizar jugador'); }
    return res.json();
  },

  deletePlayer: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/admin/players/${id}`, { method: 'DELETE', ...withAuth });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al eliminar jugador'); }
  },

  movePlayer: async (id: string, newPosition: number): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players/${id}/move`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify({ newPosition }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al mover jugador'); }
    return res.json();
  },

  resetImmunity: async (id: string): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players/${id}/reset-immunity`, { method: 'POST', ...withAuth });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error'); }
    return res.json();
  },

  resetVulnerability: async (id: string): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players/${id}/reset-vulnerability`, { method: 'POST', ...withAuth });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error'); }
    return res.json();
  },

  // Admin - Challenges
  resolveChallenge: async (challengeId: string, winnerId: string, score: string): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/admin/challenges/${challengeId}/resolve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify({ winnerId, score }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al resolver desafío'); }
    return res.json();
  },

  cancelChallenge: async (challengeId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/admin/challenges/${challengeId}`, { method: 'DELETE', ...withAuth });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al cancelar desafío'); }
  },

  forceDeleteChallenge: async (challengeId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/admin/challenges/${challengeId}/force`, { method: 'DELETE', ...withAuth });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al eliminar desafío'); }
  },

  extendDeadline: async (challengeId: string, hours: number, type: 'accept' | 'play'): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/admin/challenges/${challengeId}/extend`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify({ hours, type }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al extender deadline'); }
    const data = await res.json();
    return data.challenge;
  },

  // Profile
  updateProfile: async (data: { name?: string; phone?: string; current_password?: string; new_password?: string }): Promise<{ message: string; player: any }> => {
    const res = await fetch(`${API_URL}/players/me`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al actualizar perfil'); }
    return res.json();
  },

  uploadAvatar: async (base64Image: string): Promise<{ message: string; avatar_url: string }> => {
    const res = await fetch(`${API_URL}/players/me/avatar`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify({ image: base64Image }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al subir avatar'); }
    return res.json();
  },

  deleteAvatar: async (): Promise<{ message: string }> => {
    const res = await fetch(`${API_URL}/players/me/avatar`, { method: 'DELETE', ...withAuth });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al eliminar foto'); }
    return res.json();
  },

  // Master
  getMaster: async (): Promise<MasterSeason[]> => {
    const res = await fetch(`${API_URL}/master`);
    if (!res.ok) return [];
    return res.json();
  },

  getMasterCategory: async (category: string): Promise<MasterSeason | null> => {
    const res = await fetch(`${API_URL}/master/${category}`);
    if (!res.ok) return null;
    return res.json();
  },

  // ── Reservas ──────────────────────────────────────────────────────────────

  getCourts: async () => {
    const res = await fetch(`${API_URL}/reservations/courts`, { ...withAuth });
    if (!res.ok) return [];
    return res.json();
  },

  getSeason: async (): Promise<{ season: string }> => {
    const res = await fetch(`${API_URL}/reservations/season`, { ...withAuth });
    if (!res.ok) return { season: 'verano' };
    return res.json();
  },

  getAvailability: async (date: string) => {
    const res = await fetch(`${API_URL}/reservations/availability?date=${date}`);
    if (!res.ok) return null;
    return res.json();
  },

  getMyReservations: async () => {
    const res = await fetch(`${API_URL}/reservations/my`, { ...withAuth });
    if (!res.ok) return [];
    return res.json();
  },

  getPlayerReservations: async (playerId: string) => {
    const res = await fetch(`${API_URL}/reservations/player/${playerId}`, { ...withAuth });
    if (!res.ok) return { reservations: [], weekUsage: null };
    return res.json();
  },

  getAllReservations: async (date?: string) => {
    const url = date ? `${API_URL}/reservations?date=${date}` : `${API_URL}/reservations`;
    const res = await fetch(url, { ...withAuth });
    if (!res.ok) return [];
    return res.json();
  },

  createReservation: async (data: {
    court_id: string; date: string; time_slot: string; has_guest?: boolean; guest_name?: string; partner_name?: string; school_name?: string;
  }) => {
    const res = await fetch(`${API_URL}/reservations`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al crear reserva'); }
    return res.json();
  },

  cancelReservation: async (id: string) => {
    const res = await fetch(`${API_URL}/reservations/${id}`, { method: 'DELETE', ...withAuth });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al cancelar reserva'); }
    return res.json();
  },

  modifyReservation: async (id: string, data: {
    court_id: string; date: string; time_slot: string; has_guest?: boolean; guest_name?: string; partner_name?: string;
  }) => {
    const res = await fetch(`${API_URL}/reservations/${id}/modify`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al modificar reserva'); }
    return res.json();
  },

  adminCancelReservation: async (id: string, reason?: string) => {
    const res = await fetch(`${API_URL}/reservations/${id}/admin`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify({ reason }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al cancelar reserva'); }
    return res.json();
  },

  adminSetSeason: async (season: string) => {
    const res = await fetch(`${API_URL}/reservations/season`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify({ season }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al actualizar temporada'); }
    return res.json();
  },

  getStats: async (month?: string) => {
    const url = month ? `${API_URL}/reservations/stats?month=${month}` : `${API_URL}/reservations/stats`;
    const res = await fetch(url, { ...withAuth });
    if (!res.ok) throw new Error('Error al obtener estadísticas');
    return res.json();
  },

  // ── Bloqueos ──────────────────────────────────────────────────────────────

  getBlocks: async (date: string) => {
    const res = await fetch(`${API_URL}/reservations/blocks?date=${date}`, { ...withAuth });
    if (!res.ok) return [];
    return res.json();
  },

  saveBlocks: async (data: { court_id: string; date: string; slots: string[]; reason?: string }) => {
    const res = await fetch(`${API_URL}/reservations/blocks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al guardar bloqueos'); }
    return res.json();
  },

  // ── Cobro de luz ──────────────────────────────────────────────────────────

  getLightConfig: async (date: string) => {
    const res = await fetch(`${API_URL}/reservations/light-config?date=${date}`, { ...withAuth });
    if (!res.ok) return null;
    return res.json();
  },

  saveLightConfig: async (data: { date: string; time_slots: string[]; amount_per_slot: number }) => {
    const res = await fetch(`${API_URL}/reservations/light-config`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, ...withAuth, body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || 'Error al guardar cobro de luz'); }
    return res.json();
  },

  getLightSummary: async (month: string) => {
    const res = await fetch(`${API_URL}/reservations/light-summary?month=${month}`, { ...withAuth });
    if (!res.ok) return null;
    return res.json();
  },

  getReservationsByMonth: async (month: string) => {
    const res = await fetch(`${API_URL}/reservations?month=${month}`, { ...withAuth });
    if (!res.ok) throw new Error('Error al obtener reservas del mes');
    return res.json();
  },

  // ── Admin Players (extended) ──────────────────────────────────────────────

  getAllPlayersAdmin: async () => {
    const res = await fetch(`${API_URL}/admin/players/all`, { ...withAuth });
    if (!res.ok) return null;
    return res.json();
  },
};
