'use client';

import { useEffect, useState } from 'react';

/** Auto-show en primer login: true si hay sesión y no se ha visto el tour. */
export function useOnboarding(hasSession: boolean) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!hasSession) return;
    const t = setTimeout(() => {
      try {
        if (!localStorage.getItem('ctg_onboarded')) setShow(true);
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, [hasSession]);
  return { showOnboarding: show, closeOnboarding: () => setShow(false) };
}
