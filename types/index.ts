export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
}

export interface Player {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string | null;
  position: number;
  wins: number;
  losses: number;
  total_matches: number;
  immune_until: string | null;
  vulnerable_until: string | null;
  created_at: string;
  is_admin?: boolean;
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
  challenger_result?: {
    winnerId: string;
    score: string;
  } | null;
  challenged_result?: {
    winnerId: string;
    score: string;
  } | null;
  results_match?: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  player: Player;
}