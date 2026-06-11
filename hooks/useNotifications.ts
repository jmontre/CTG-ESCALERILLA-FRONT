'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/lib/api';
import type { ApiNotification } from '@/types';

export type NotifType =
  | 'challenge_received' | 'challenge_accepted' | 'challenge_rejected' | 'challenge_expiring'
  | 'result_submitted' | 'result_confirmed'
  | 'reservation_done' | 'reservation_cancelled' | 'reservation_modified'
  | 'position_up' | 'position_down' | 'category_promoted'
  | 'streak' | 'achievement' | 'personal_record'
  | 'challenge_suggestion' | 'match_reminder' | 'court_available' | 'master_news' | 'rival_played'
  | 'season_ending' | 'season_winner' | 'master_qualifying' | 'master_not_qualifying' | 'master_close_to_qualifying';

export type NotifColor = 'amber' | 'green' | 'red' | 'blue' | 'gold' | 'gray';
export type NotifIcon = 'swords' | 'check' | 'close' | 'clock' | 'flag' | 'calendar' | 'flame' | 'trophy' | 'bell' | 'pencil';

export interface NotifMeta { icon: NotifIcon; color: NotifColor; urgentByDefault?: boolean; confetti?: boolean; }

export const NOTIF_META: Record<NotifType, NotifMeta> = {
  challenge_received:          { icon: 'swords',   color: 'amber', urgentByDefault: true },
  challenge_accepted:          { icon: 'check',    color: 'green' },
  challenge_rejected:          { icon: 'close',    color: 'red' },
  challenge_expiring:          { icon: 'clock',    color: 'amber', urgentByDefault: true },
  result_submitted:            { icon: 'flag',     color: 'blue',  urgentByDefault: true },
  result_confirmed:            { icon: 'check',    color: 'green' },
  reservation_done:            { icon: 'calendar', color: 'green' },
  reservation_cancelled:       { icon: 'close',    color: 'red' },
  reservation_modified:        { icon: 'pencil',   color: 'blue' },
  position_up:                 { icon: 'flame',    color: 'green', confetti: true },
  position_down:               { icon: 'flag',     color: 'red' },
  category_promoted:           { icon: 'trophy',   color: 'gold',  confetti: true },
  streak:                      { icon: 'flame',    color: 'amber' },
  achievement:                 { icon: 'trophy',   color: 'gold' },
  personal_record:             { icon: 'trophy',   color: 'gold' },
  challenge_suggestion:        { icon: 'swords',   color: 'green' },
  match_reminder:              { icon: 'clock',    color: 'blue' },
  court_available:             { icon: 'calendar', color: 'green' },
  master_news:                 { icon: 'trophy',   color: 'gold' },
  rival_played:                { icon: 'flag',     color: 'gray' },
  season_ending:               { icon: 'clock',    color: 'amber' },
  season_winner:               { icon: 'trophy',   color: 'gold',  confetti: true },
  master_qualifying:           { icon: 'trophy',   color: 'green' },
  master_not_qualifying:       { icon: 'flag',     color: 'amber', urgentByDefault: true },
  master_close_to_qualifying:  { icon: 'flame',    color: 'amber' },
};

export interface Notification {
  id: string;
  type: NotifType;
  read: boolean;
  title: string;
  body: string;
  time: string;          // texto relativo ("hace 2 horas"), derivado de created_at
  action?: { label: string; path: string };
}

const POLL_INTERVAL_MS = 60_000;

// ── Store compartido entre instancias (Header, panel) — mismo patrón que authCache ──
let store: Notification[] = [];
let loaded = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(items: Notification[]) => void>();

function emit() {
  const snapshot = [...store];
  listeners.forEach(l => l(snapshot));
}

function timeAgo(iso: string): string {
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (diffMin < 1) return 'ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `hace ${h} ${h === 1 ? 'hora' : 'horas'}`;
  const d = Math.floor(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

function fromApi(n: ApiNotification): Notification | null {
  // Tipos que el frontend no conoce se ignoran (permite agregar tipos en backend sin romper UI)
  if (!NOTIF_META[n.type as NotifType]) return null;
  return {
    id: n.id,
    type: n.type as NotifType,
    read: n.read,
    title: n.title,
    body: n.body,
    time: timeAgo(n.created_at),
    action: n.action_label && n.action_path
      ? { label: n.action_label, path: n.action_path }
      : undefined,
  };
}

async function fetchAll() {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('auth_token')) {
    store = [];
    loaded = true;
    emit();
    return;
  }
  const data = await api.getNotifications();
  store = data.map(fromApi).filter((n): n is Notification => n !== null);
  loaded = true;
  emit();
}

function ensurePolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (localStorage.getItem('auth_token')) fetchAll();
  }, POLL_INTERVAL_MS);
}

function stopPollingIfIdle() {
  if (listeners.size === 0 && pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function useNotifications() {
  const [items, setItems] = useState<Notification[]>(store);

  useEffect(() => {
    const listener = (next: Notification[]) => setItems(next);
    listeners.add(listener);
    ensurePolling();
    if (!loaded) fetchAll();
    else setItems([...store]);

    const onLogin = () => fetchAll();
    window.addEventListener('auth:login', onLogin);

    return () => {
      listeners.delete(listener);
      window.removeEventListener('auth:login', onLogin);
      stopPollingIfIdle();
    };
  }, []);

  const unreadCount = useMemo(() => items.filter(n => !n.read).length, [items]);

  // Optimista: actualiza la UI al instante; si el endpoint aún no existe, se ignora el error
  const markRead = useCallback((id: string) => {
    store = store.map(n => n.id === id ? { ...n, read: true } : n);
    emit();
    api.markNotificationRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    store = store.map(n => ({ ...n, read: true }));
    emit();
    api.markAllNotificationsRead().catch(() => {});
  }, []);

  return { items, unreadCount, markRead, markAllRead };
}
