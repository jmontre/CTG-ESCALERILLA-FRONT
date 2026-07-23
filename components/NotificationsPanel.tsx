'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Notification, NOTIF_META, NotifColor, NotifIcon, useNotifications } from '@/hooks/useNotifications';

/* ---------- icon paths ---------- */
const ICON_PATHS: Record<NotifIcon | 'bell' | 'close' | 'chevRight', string> = {
  swords:   'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L21 0M19 5l-5 5',
  check:    'M5 12l4 4 10-10',
  close:    'M6 6l12 12M18 6L6 18',
  clock:    'M12 7v5l3 2M12 21a9 9 0 110-18 9 9 0 010 18z',
  flag:     'M5 21V4M5 4h12l-2 4 2 4H5',
  calendar: 'M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM8 3v4M16 3v4',
  flame:    'M12 3c1 4 5 5 5 10a5 5 0 11-10 0c0-2 1-3 2-4-1 3 2 3 2 5 0-3 2-5 1-11z',
  trophy:   'M8 21h8M12 17v4M7 4h10v4a5 5 0 11-10 0V4zM4 5h3v3a3 3 0 01-3-3zM20 5h-3v3a3 3 0 003-3z',
  bell:     'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 01-4 0',
  pencil:   'M3 21l3.75-1L20 6.75 17.25 4 4 17.25 3 21z',
  chevRight:'M9 18l6-6-6-6',
};

const COLOR_CLASSES: Record<NotifColor, { bg: string; border: string; text: string }> = {
  amber: { bg: 'bg-amber-500/15',  border: 'border-amber-500/35', text: 'text-amber-500' },
  green: { bg: 'bg-ctg-green/15',  border: 'border-ctg-green/35', text: 'text-ctg-green' },
  red:   { bg: 'bg-red-500/12',    border: 'border-red-500/30',   text: 'text-red-400'   },
  blue:  { bg: 'bg-blue-500/12',   border: 'border-blue-500/30',  text: 'text-blue-400'  },
  gold:  { bg: 'bg-amber-400/15',  border: 'border-amber-400/40', text: 'text-amber-400' },
  gray:  { bg: 'bg-white/5',       border: 'border-white/10',     text: 'text-[#F0F7E8]/55' },
};

function Svg({ d, size = 18, strokeWidth = 1.7 }: { d: string; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export default function NotificationsPanel({ isOpen, onClose, anchorRef }: Props) {
  const router = useRouter();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onDoc(e: MouseEvent) {
      if (panelRef.current?.contains(e.target as Node)) return;
      if (anchorRef?.current?.contains(e.target as Node)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose, anchorRef]);

  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter(n => !n.read);
    if (filter === 'urgent') return items.filter(n => NOTIF_META[n.type]?.urgentByDefault);
    return items;
  }, [items, filter]);

  const urgentCount = items.filter(n => NOTIF_META[n.type]?.urgentByDefault).length;

  function handleAction(n: Notification) {
    markRead(n.id);
    if (n.action?.path) router.push(n.action.path);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile backdrop */}
      <div className="md:hidden fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />

      <div
        ref={panelRef}
        className="fixed z-[60] animate-scale-in origin-top-right
                   left-2 right-2 top-[72px]
                   md:left-auto md:right-4 lg:right-8 md:w-[420px]
                   max-h-[calc(100vh-90px)] md:max-h-[600px]
                   bg-[#0f2211] border border-[#1e4020] rounded-2xl shadow-2xl shadow-black/60
                   overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 md:px-5 py-3.5 border-b border-[#1e4020] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-[#F0F7E8] text-base">Notificaciones</h3>
            {unreadCount > 0 && (
              <span className="chip chip-success text-[10px]">{unreadCount} nuevas</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-ctg-green/70 hover:text-ctg-green text-xs font-semibold transition px-2 py-1 rounded-lg hover:bg-ctg-green/8"
              >
                Marcar todas
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#F0F7E8]/40 hover:text-[#F0F7E8] hover:bg-[#F0F7E8]/5 transition"
            >
              <Svg d={ICON_PATHS.close} size={16} />
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex px-2 pt-2 pb-1 border-b border-[#1e4020] gap-1">
          {[
            { v: 'all',    l: 'Todas',    count: items.length },
            { v: 'unread', l: 'Sin leer', count: unreadCount },
            { v: 'urgent', l: 'Acción',   count: urgentCount },
          ].map(t => {
            const active = filter === t.v;
            return (
              <button
                key={t.v}
                onClick={() => setFilter(t.v as any)}
                className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ' +
                  (active
                    ? 'bg-ctg-green/15 text-ctg-green font-bold'
                    : 'text-[#F0F7E8]/60 hover:text-[#F0F7E8] hover:bg-[#F0F7E8]/5')}
              >
                {t.l}
                <span className={'font-mono text-[9px] rounded-full px-1.5 ' +
                  (active ? 'bg-ctg-green/25 text-ctg-green' : 'bg-[#152b18] text-[#F0F7E8]/45')}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-full bg-[#152b18] border border-[#1e4020] flex items-center justify-center text-[#F0F7E8]/40 mx-auto mb-3">
                <Svg d={ICON_PATHS.bell} size={20} />
              </div>
              <div className="text-[#F0F7E8]/55 text-sm font-medium">Sin notificaciones</div>
              <div className="text-[#F0F7E8]/30 text-xs mt-1">Te avisaremos cuando pase algo</div>
            </div>
          ) : (
            filtered.map(n => (
              <NotifItem
                key={n.id}
                n={n}
                onAction={() => handleAction(n)}
                onMarkRead={() => markRead(n.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1e4020] flex items-center justify-between text-xs">
          <span className="text-[#F0F7E8]/35">{items.length} en total</span>
          <button onClick={onClose} className="text-ctg-green/75 hover:text-ctg-green font-semibold transition">
            Cerrar
          </button>
        </div>
      </div>
    </>
  );
}

function NotifItem({ n, onAction, onMarkRead }: {
  n: Notification;
  onAction: () => void;
  onMarkRead: () => void;
}) {
  const meta  = NOTIF_META[n.type];
  const color = COLOR_CLASSES[meta.color];

  return (
    <div
      className={'relative group px-4 md:px-5 py-3.5 border-b border-[#1e4020]/55 hover:bg-ctg-green/4 transition cursor-pointer ' +
        (!n.read ? 'bg-ctg-green/3' : '')}
      onClick={onMarkRead}
    >
      {!n.read && (
        <span
          className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-ctg-green"
          style={{ boxShadow: '0 0 8px rgba(139,194,52,.7)' }}
        />
      )}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${color.bg} ${color.border} ${color.text}`}>
          <Svg d={ICON_PATHS[meta.icon]} size={17} />
        </div>
        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className={`font-semibold text-sm truncate ${!n.read ? 'text-[#F0F7E8]' : 'text-[#F0F7E8]/85'}`}>
            {n.title}
          </div>
          <div className="text-[#F0F7E8]/55 text-[12.5px] leading-snug mt-0.5">
            {n.body}
          </div>
          <div className="flex items-center justify-between mt-2 gap-2">
            <span className="text-[#F0F7E8]/35 text-[11px]">{n.time}</span>
            {n.action && (
              <button
                onClick={e => { e.stopPropagation(); onAction(); }}
                className={`text-xs font-bold transition flex items-center gap-1 px-2.5 py-1 rounded-lg hover:scale-[1.02] ${color.bg} ${color.text}`}
              >
                {n.action.label}
                <Svg d={ICON_PATHS.chevRight} size={10} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
