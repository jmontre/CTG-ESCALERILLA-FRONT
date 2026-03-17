import { Player, Challenge, AuthResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = {
  // Auth
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al iniciar sesión');
    }

    return res.json();
  },

  register: async (data: {
    username: string;
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Promise<AuthResponse> => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al registrar usuario');
    }

    return res.json();
  },

  validateToken: async (token: string): Promise<{ user: any; player: Player }> => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error('Token inválido');

    return res.json();
  },

  // Players
  getPlayers: async (): Promise<Player[]> => {
    const res = await fetch(`${API_URL}/players`);
    return res.json();
  },

  getPlayerByUserId: async (userId: string): Promise<Player> => {
    const res = await fetch(`${API_URL}/players/user/${userId}`);
    return res.json();
  },

  getPlayer: async (id: string): Promise<Player> => {
    const res = await fetch(`${API_URL}/players/${id}`);
    return res.json();
  },

  // Challenges
  getChallenges: async (): Promise<Challenge[]> => {
    const res = await fetch(`${API_URL}/challenges`);
    return res.json();
  },

  createChallenge: async (challengerId: string, challengedId: string): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/challenges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challenger_id: challengerId,
        challenged_id: challengedId,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al crear desafío');
    }

    return res.json();
  },

  acceptChallenge: async (challengeId: string, playerId: string): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/challenges/${challengeId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al aceptar desafío');
    }

    return res.json();
  },

  rejectChallenge: async (challengeId: string, playerId: string): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/challenges/${challengeId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: playerId }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al rechazar desafío');
    }

    return res.json();
  },

  submitResult: async (
    challengeId: string,
    playerId: string,
    winnerId: string,
    score: string
  ): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/challenges/${challengeId}/result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        winner_id: winnerId,
        score,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al enviar resultado');
    }

    return res.json();
  },

  // Admin - Players
  createPlayer: async (data: {
    username: string;
    email: string;
    password: string;
    name: string;
    phone?: string;
    position?: number;
  }): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al crear jugador');
    }
    
    return res.json();
  },

  updatePlayer: async (id: string, data: any): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al actualizar jugador');
    }

    return res.json();
  },

  deletePlayer: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/admin/players/${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al eliminar jugador');
    }
  },

  movePlayer: async (id: string, newPosition: number): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players/${id}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPosition }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al mover jugador');
    }

    return res.json();
  },

  resetImmunity: async (id: string): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players/${id}/reset-immunity`, {
      method: 'POST',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al resetear inmunidad');
    }

    return res.json();
  },

  resetVulnerability: async (id: string): Promise<Player> => {
    const res = await fetch(`${API_URL}/admin/players/${id}/reset-vulnerability`, {
      method: 'POST',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al resetear vulnerabilidad');
    }

    return res.json();
  },

  // Admin - Challenges
  resolveChallenge: async (challengeId: string, winnerId: string, score: string): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/admin/challenges/${challengeId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerId, score }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al resolver desafío');
    }

    return res.json();
  },

  cancelChallenge: async (challengeId: string): Promise<void> => {
    const res = await fetch(`${API_URL}/admin/challenges/${challengeId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al cancelar desafío');
    }
  },

  extendDeadline: async (challengeId: string, hours: number, type: 'accept' | 'play'): Promise<Challenge> => {
    const res = await fetch(`${API_URL}/admin/challenges/${challengeId}/extend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours, type }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Error al extender deadline');
    }

    const data = await res.json();
    return data.challenge;
  },
};
