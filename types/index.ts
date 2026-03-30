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
  member_type: 'socio' | 'hijo_socio';
  parent_id?: string | null;
  has_debt: boolean;
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

export interface AuthResponse {
  token: string;
  user: User;
  player: Player;
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
  round: 'group' | 'semifinal' | 'final';
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
  status: 'pending' | 'active' | 'semifinals' | 'final' | 'completed';
  round_robin_start: string | null;
  round_robin_end: string | null;
  final_date: string | null;
  created_at: string;
  groups: MasterGroup[];
}