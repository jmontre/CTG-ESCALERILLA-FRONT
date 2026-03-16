import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Player } from '@/types';

// Cache en memoria para evitar flickering
let authCache: { user: any; player: Player } | null = null;

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Si hay cache, usar inmediatamente
    if (authCache) {
      setUser(authCache.user);
      setPlayer(authCache.player);
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.validateToken(token);
      setUser(data.user);
      setPlayer(data.player);
      
      // Guardar en cache
      authCache = { user: data.user, player: data.player };
    } catch (error) {
      console.error('Error validando token:', error);
      localStorage.removeItem('auth_token');
      authCache = null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const data = await api.login(username, password);
    localStorage.setItem('auth_token', data.token);
    setUser(data.user);
    setPlayer(data.player);
    
    // Guardar en cache
    authCache = { user: data.user, player: data.player };
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    authCache = null;
    setUser(null);
    setPlayer(null);
    router.push('/');
  };

  const refreshAuth = async () => {
    await checkAuth();
  };

  return {
    user,
    player,
    loading,
    login,
    logout,
    refreshAuth,
  };
}
