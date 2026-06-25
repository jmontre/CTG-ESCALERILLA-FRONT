import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { Player } from '@/types';

// Cache en memoria para evitar flickering
let authCache: { user: any; player: Player } | null = null;

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Flag en memoria para el timer de inactividad (no lee localStorage)
  const hasSession = useRef(false);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await api.logout(); // limpia la cookie httpOnly en el servidor (.clubdetenisgraneros.cl)
    authCache = null;
    hasSession.current = false;
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
      if (hasSession.current) {
        logout();
      }
    }, INACTIVITY_TIMEOUT_MS);
  }, [logout]);

  // Registrar eventos de actividad del usuario
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    const handleActivity = () => {
      if (hasSession.current) {
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

    await refreshFromServer();
  }, []);

  // Llama al backend y actualiza estado + cache
  const refreshFromServer = async () => {
    try {
      // La cookie httpOnly se envía automáticamente vía credentials: 'include'.
      // Si no hay sesión, el backend responde 401 y caemos en el catch.
      const data = await api.validateToken();
      setUser(data.user);
      setPlayer(data.player);
      authCache = { user: data.user, player: data.player };
      hasSession.current = true;
      resetInactivityTimer();
    } catch {
      authCache = null;
      hasSession.current = false;
      setUser(null);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Sincronizar estado cuando otra instancia de useAuth hace login
  useEffect(() => {
    const handleAuthLogin = () => { checkAuth(); };
    window.addEventListener('auth:login', handleAuthLogin);
    return () => window.removeEventListener('auth:login', handleAuthLogin);
  }, [checkAuth]);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (username: string, password: string) => {
    // El backend setea la cookie httpOnly en /auth/login (domain: .clubdetenisgraneros.cl).
    // El middleware de Next.js la lee directamente con request.cookies.get('auth_token')
    // porque reservas.clubdetenisgraneros.cl comparte el dominio padre. JS no puede leerla.
    const result = await api.login(username, password);
    void result; // token en body mantenido por backward compat; la cookie es la fuente de verdad
    const data = await api.validateToken();
    setUser(data.user);
    setPlayer(data.player);
    authCache = { user: data.user, player: data.player };
    hasSession.current = true;
    resetInactivityTimer();
    // Notificar a todas las instancias de useAuth (ej: Header) que la sesión cambió
    window.dispatchEvent(new Event('auth:login'));
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
