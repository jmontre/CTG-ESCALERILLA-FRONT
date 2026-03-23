import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Player } from '@/types';

// Cache en memoria para evitar flickering
let authCache: { user: any; player: Player } | null = null;

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    authCache = null;
    setUser(null);
    setPlayer(null);
    clearInactivityTimer();
    // Recarga completa para limpiar todo el estado de la página
    window.location.href = '/';
  }, []);

  // ─── Timer de inactividad ─────────────────────────────────────────────────
  const clearInactivityTimer = () => {
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
      inactivityTimer.current = null;
    }
  };

  const resetInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimer.current = setTimeout(() => {
      // Solo hace logout si hay sesión activa
      if (localStorage.getItem('auth_token')) {
        logout();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  // Registrar eventos de actividad del usuario
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      if (localStorage.getItem('auth_token')) {
        resetInactivityTimer();
      }
    };

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearInactivityTimer();
    };
  }, [resetInactivityTimer]);

  // ─── checkAuth ────────────────────────────────────────────────────────────
  const checkAuth = useCallback(async () => {
    // Si hay cache, usar inmediatamente (evita flickering)
    if (authCache) {
      setUser(authCache.user);
      setPlayer(authCache.player);
      setLoading(false);
      // Pero igual refrescar en background para tener datos actualizados
      refreshFromServer();
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    await refreshFromServer();
  }, []);

  // Llama al backend y actualiza estado + cache
  const refreshFromServer = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const data = await api.validateToken(token);
      setUser(data.user);
      setPlayer(data.player);
      authCache = { user: data.user, player: data.player };
      resetInactivityTimer();
    } catch (error) {
      console.error('Error validando token:', error);
      localStorage.removeItem('auth_token');
      authCache = null;
      setUser(null);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    setPlayer(data.player);
    authCache = { user: data.user, player: data.player };
    resetInactivityTimer();
  };

  // ─── refreshPlayer ────────────────────────────────────────────────────────
  // Llamar después de mutaciones que cambien la posición del jugador
  const refreshPlayer = async () => {
    await refreshFromServer();
  };

  return {
    user,
    player,
    loading,
    login,
    logout,
    refreshPlayer,
    // Retrocompatibilidad
    refreshAuth: refreshFromServer,
  };
}