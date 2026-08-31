'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { SeasonSummary, UnlockedAchievement } from '@/types';

type Summary = Extract<SeasonSummary, { pending: true }>;

/**
 * Modales de celebración: resumen de cierre de temporada y logros recién
 * desbloqueados.
 *
 * El "ya lo vi" se guarda en el servidor (no en localStorage), así que el
 * modal no reaparece al entrar desde otro dispositivo ni se pierde al limpiar
 * el navegador. Se marca como visto al cerrar, no al abrir: si el jugador
 * cierra la pestaña a mitad de camino, lo vuelve a ver.
 *
 * Prioridad: primero el resumen de temporada (es el evento grande), después
 * los logros. Nunca los dos a la vez.
 */
export function useCelebrations(hasSession: boolean) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [achievements, setAchievements] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    // Sin sesión no se limpia estado acá: el logout hace una recarga completa
    // (useAuth), así que el componente se desmonta de todas formas.
    if (!hasSession) return;
    let cancelled = false;

    (async () => {
      const [s, a] = await Promise.all([
        api.getSeasonSummary(),
        api.getPendingAchievements(),
      ]);
      if (cancelled) return;
      if (s.pending) setSummary(s);
      setAchievements(a);
    })();

    return () => {
      cancelled = true;
    };
  }, [hasSession]);

  const dismissSummary = useCallback((slug: string) => {
    setSummary(null);
    void api.markSeasonSummarySeen(slug);
  }, []);

  const dismissAchievements = useCallback((ids: string[]) => {
    setAchievements([]);
    void api.markAchievementsSeen(ids);
  }, []);

  return {
    /** Resumen pendiente, o null. Tiene prioridad sobre los logros. */
    seasonSummary: summary,
    /** Logros pendientes; solo se muestran si no hay resumen pendiente. */
    pendingAchievements: summary ? [] : achievements,
    dismissSummary,
    dismissAchievements,
  };
}
