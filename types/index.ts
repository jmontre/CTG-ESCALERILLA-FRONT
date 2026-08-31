export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  admin_role: 'escalerilla' | 'reservas' | 'all' | null;
}

export interface Player {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string | null;
  position?: number | null;
  wins: number;
  losses: number;
  total_matches: number;
  immune_until: string | null;
  vulnerable_until: string | null;
  member_type: 'socio' | 'hijo_socio' | 'profe';  // ← agrega 'profe'
  parent_id?: string | null;
  has_debt: boolean;
  extra_high_demand_slots?: number;
  school_names?: string[];                          // ← nuevo
  created_at: string;
  is_admin?: boolean;
  admin_role?: 'escalerilla' | 'reservas' | 'all' | null;
  user?: User;
  challenger_challenge?: Challenge | null;
  challenged_challenge?: Challenge | null;
}

export interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired_not_accepted' | 'expired_not_played' | 'disputed' | 'cancelled';
  accept_deadline: string;
  play_deadline: string;
  scheduled_date?: string | null;
  created_at: string;
  accepted_at: string | null;
  played_at: string | null;
  resolved_at: string | null;
  winner_id: string | null;
  final_score: string | null;
  challenger?: Player;
  challenged?: Player;
  challenger_result?: { winnerId: string; score: string } | null;
  challenged_result?: { winnerId: string; score: string } | null;
  results_match?: boolean;
}

// El token ya no viene en el body: viaja solo en la cookie httpOnly.
export interface AuthResponse {
  user: User;
  player: Player;
}

// Notificación cruda del backend (GET /notifications).
// El shape de UI (con `time` relativo y `action` anidada) vive en hooks/useNotifications.ts
export interface ApiNotification {
  id: string;
  type: string;          // NotifType — el frontend ignora tipos que no estén en NOTIF_META
  read: boolean;
  title: string;
  body: string;
  created_at: string;    // ISO 8601
  action_label?: string | null;
  action_path?: string | null;
}

export interface MasterGroupPlayer {
  id: string;
  group_id: string;
  player_id: string;
  wins: number;
  losses: number;
  sets_won: number;
  sets_lost: number;
  player: Player;
}

export interface MasterMatch {
  id: string;
  group_id: string | null;
  season_id: string;
  // 'playoff' es la ronda previa: los puestos 5-12 se juegan 4 cupos al round robin.
  round: 'playoff' | 'group' | 'semifinal' | 'final';
  player1_id: string;
  player2_id: string;
  winner_id: string | null;
  score: string | null;
  status: 'pending' | 'completed';
  played_at: string | null;
  created_at: string;
  player1: Player;
  player2: Player;
  winner?: Player | null;
}

export interface MasterGroup {
  id: string;
  season_id: string;
  name: string;
  players: MasterGroupPlayer[];
  matches: MasterMatch[];
}

export interface MasterSeason {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'playoffs' | 'active' | 'semifinals' | 'final' | 'completed';
  round_robin_start: string | null;
  round_robin_end: string | null;
  final_date: string | null;
  created_at: string;
  groups: MasterGroup[];
  matches: MasterMatch[];
}

// ── Logros ──────────────────────────────────────────────────────────────────

export type AchievementGroup = 'temporada' | 'escalerilla' | 'partidos' | 'constancia' | 'club';

/** Definición del catálogo (backend: achievements.catalog.ts). */
export interface AchievementDef {
  code: string;
  name: string;
  description: string;
  emoji: string;
  group: AchievementGroup;
  scope: 'season' | 'global';
  family?: string;
  tier?: number;
}

/** Catálogo + estado de desbloqueo del jugador logueado (GET /achievements/me). */
export interface AchievementWithStatus extends AchievementDef {
  unlocked: boolean;
  unlocked_at: string | null;
  season_slug: string | null;
  context: Record<string, unknown> | null;
  /** Veces conseguido: uno por temporada. */
  times: number;
}

export interface MyAchievements {
  total: number;
  unlocked_count: number;
  achievements: AchievementWithStatus[];
}

/** Insignia desbloqueada, para el perfil público y el modal de celebración. */
export interface UnlockedAchievement {
  id?: string;
  code: string;
  name: string;
  emoji: string;
  description: string;
  group: AchievementGroup;
  unlocked_at: string;
  season_slug: string;
  context: Record<string, unknown> | null;
}

// ── Temporadas ──────────────────────────────────────────────────────────────

export interface Season {
  id: string;
  slug: string;
  name: string;
  status: 'active' | 'closed';
  started_at: string;
  closed_at: string | null;
}

/** Resumen de cierre de temporada (GET /seasons/me/summary). */
export type SeasonSummary =
  | { pending: false }
  | {
      pending: true;
      season: { slug: string; name: string };
      next_season: { slug: string; name: string } | null;
      /**
       * Campeón y finalista de cada categoría: lo ve todo el club.
       * Opcional porque el backend y el frontend no despliegan a la vez: si el
       * front llega primero, esta clave todavía no viene.
       */
      podium?: Array<{
        category: string;
        champion: string | null;
        finalist: string | null;
      }>;
      player_name: string;
      start_position: number | null;
      final_position: number | null;
      category: string | null;
      wins: number;
      losses: number;
      total_matches: number;
      master_result: 'champion' | 'finalist' | 'semifinalist' | null;
      /** Puestos ganados en el semestre; null si no se conoce la posición inicial. */
      climbed: number | null;
      new_position: number | null;
      in_new_season: boolean;
      achievements: Array<{
        code: string;
        name: string;
        emoji: string;
        description: string;
        context: Record<string, unknown> | null;
      }>;
    };

// ── Historial por período ───────────────────────────────────────────────────

export interface HistoryPeriod {
  id: string;                       // "all" | "2026" | "2026-1"
  label: string;
  type: 'all' | 'year' | 'season';
  year?: number;
}

export interface HistoryResponse {
  periods: HistoryPeriod[];
  selected: string;
  stats: {
    played: number;
    wins: number;
    losses: number;
    effectiveness: number;
    /** Solo al elegir una temporada: cómo terminó en ella. */
    final_position?: number | null;
    category?: string | null;
    master_result?: 'champion' | 'finalist' | 'semifinalist' | null;
  };
  matches: Challenge[];
}
