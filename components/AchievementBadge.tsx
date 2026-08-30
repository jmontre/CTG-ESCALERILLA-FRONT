'use client';

import { AchievementGroup } from '@/types';

/**
 * Insignia de un logro. Se usa en tres lugares con distinto tamaño:
 * la grilla del perfil, el perfil público y el modal de celebración.
 *
 * Las bloqueadas se muestran en gris con su condición visible: dan algo que
 * perseguir, en vez de esconder lo que falta.
 */

const GROUP_ACCENT: Record<AchievementGroup, string> = {
  temporada: '#e8b923', // dorado: campeón, finalista
  escalerilla: '#8BC234',
  partidos: '#f97316',
  constancia: '#38bdf8',
  club: '#a78bfa',
};

export type BadgeSize = 'sm' | 'md' | 'lg';

const SIZES: Record<BadgeSize, { box: number; emoji: string; ring: number }> = {
  sm: { box: 38, emoji: 'text-lg', ring: 2 },
  md: { box: 56, emoji: 'text-2xl', ring: 2 },
  lg: { box: 92, emoji: 'text-5xl', ring: 3 },
};

interface AchievementBadgeProps {
  emoji: string;
  group: AchievementGroup;
  unlocked?: boolean;
  size?: BadgeSize;
  /** Número de veces conseguido; se muestra como ×2, ×3… */
  times?: number;
  title?: string;
  glow?: boolean;
}

export default function AchievementBadge({
  emoji,
  group,
  unlocked = true,
  size = 'md',
  times = 1,
  title,
  glow = false,
}: AchievementBadgeProps) {
  const { box, emoji: emojiClass, ring } = SIZES[size];
  const accent = GROUP_ACCENT[group] ?? '#8BC234';

  return (
    <div
      className="relative inline-flex items-center justify-center rounded-2xl shrink-0 transition"
      title={title}
      style={{
        width: box,
        height: box,
        border: `${ring}px solid ${unlocked ? accent + '99' : '#1e4020'}`,
        background: unlocked
          ? `radial-gradient(circle at 30% 25%, ${accent}33, #152b18 70%)`
          : '#101f12',
        boxShadow: unlocked && glow ? `0 0 26px ${accent}55` : undefined,
      }}
    >
      <span
        className={emojiClass + (unlocked ? '' : ' grayscale opacity-25')}
        aria-hidden
      >
        {emoji}
      </span>

      {unlocked && times > 1 && (
        <span
          className="absolute -bottom-1.5 -right-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-display font-black text-[#0a1608]"
          style={{ background: accent }}
        >
          ×{times}
        </span>
      )}
    </div>
  );
}

export { GROUP_ACCENT };
