'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

const I = {
  chevDown:  'M6 9l6 6 6-6',
  calendar:  'M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2zM8 3v4M16 3v4',
  trophy:    'M8 21h8M12 17v4M7 4h10v4a5 5 0 11-10 0V4zM4 5h3v3a3 3 0 01-3-3zM20 5h-3v3a3 3 0 003-3z',
  swords:    'M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2M14.5 6.5L21 0M19 5l-5 5',
  home:      'M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7H10v7H6a2 2 0 01-2-2v-9z',
  pyramid:   'M4 7h16M7 12h10M10 17h4',
  bell:      'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M14 21a2 2 0 01-4 0',
  plus:      'M12 5v14M5 12h14',
  user:      'M16 14a4 4 0 10-8 0M20 21a8 8 0 10-16 0',
  flag:      'M5 21V4M5 4h12l-2 4 2 4H5',
  logout:    'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  sun:       'M12 3v2M12 19v2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M3 12h2M19 12h2M5.6 18.4L7 17M17 7l1.4-1.4M12 8a4 4 0 100 8 4 4 0 000-8z',
  moon:      'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
  cog:       'M12 8a4 4 0 100 8 4 4 0 000-8zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z',
};

type IconKey = keyof typeof I;

const Icon = ({ d, size = 18, strokeWidth = 1.7 }: { d: string; size?: number; strokeWidth?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

type NavBase = { id: string; label: string; shortLabel: string; icon: IconKey };
type NavSingle = NavBase & { path: string };
type NavMulti  = NavBase & { paths: readonly string[]; defaultPath: string };
type NavItem   = NavSingle | NavMulti;

const PRIMARY_NAV: NavItem[] = [
  { id: 'inicio',      label: 'Inicio',      shortLabel: 'Inicio',   icon: 'home',     path: '/' },
  { id: 'escalerilla', label: 'Escalerilla', shortLabel: 'Ranking',  icon: 'pyramid',  path: '/escalerilla' },
  { id: 'desafios',    label: 'Desafíos',    shortLabel: 'Desafíos', icon: 'swords',   paths: ['/fixture', '/fixture-publico', '/historial'] as const, defaultPath: '/fixture' },
  { id: 'reservas',    label: 'Reservas',    shortLabel: 'Reservas', icon: 'calendar', paths: ['/reservar', '/mis-reservas', '/fixture-reservas'] as const, defaultPath: '/reservar' },
  { id: 'master',      label: 'Master',      shortLabel: 'Master',   icon: 'trophy',   path: '/master' },
];

const SUBNAVS = {
  desafios: [
    { label: 'Mis desafíos',    path: '/fixture' },
    { label: 'Ver partidos',    path: '/fixture-publico' },
    { label: 'Historial',       path: '/historial' },
  ],
  reservas: [
    { label: 'Nueva reserva',   path: '/reservar' },
    { label: 'Mis reservas',    path: '/mis-reservas' },
    { label: 'Fixture canchas', path: '/fixture-reservas' },
  ],
};

function getActiveSection(pathname: string) {
  for (const item of PRIMARY_NAV) {
    if ('path' in item && item.path === pathname) return item.id;
    if ('paths' in item && item.paths.includes(pathname)) return item.id;
  }
  return null;
}

function getCategoryFromPosition(position: number | null | undefined): string {
  if (!position || position <= 0) return '—';
  if (position <= 12) return 'A';
  if (position <= 24) return 'B';
  if (position <= 36) return 'C';
  return 'D';
}

function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size, filter: 'drop-shadow(0 0 8px rgba(139,194,52,.55))' }}
    >
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <circle cx="20" cy="20" r="18" fill="#8BC234" />
        <path d="M3 20 Q20 6 37 20" stroke="#0a1608" strokeWidth="1.8" fill="none" />
        <path d="M3 20 Q20 34 37 20" stroke="#0a1608" strokeWidth="1.8" fill="none" />
      </svg>
    </div>
  );
}

function AvatarEl({ name, avatarUrl, size = 36 }: { name: string; avatarUrl?: string | null; size?: number }) {
  const initials = name.trim().split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const base = 'inline-flex items-center justify-center rounded-full font-display font-bold text-[#0a1608] ring-2 ring-ctg-green/50 ring-offset-1 ring-offset-[#0a1608] shrink-0 overflow-hidden';
  if (avatarUrl) {
    return (
      <div className={base} style={{ width: size, height: size }}>
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={base}
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background: 'linear-gradient(135deg, #9ed944, #8BC234 60%, #6ea127)',
      }}
    >
      {initials}
    </div>
  );
}

function ThemeToggleRow() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.body.classList.contains('dark')); }, []);
  function apply(d: boolean) {
    setDark(d);
    document.body.classList.toggle('dark', d);
    try { localStorage.setItem('ctg_theme', d ? 'dark' : 'light'); } catch (_) {}
  }
  return (
    <div className="px-3 py-2 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5 text-[#F0F7E8]/80 text-sm">
        <Icon d={dark ? I.moon : I.sun} size={14} />
        <span>Modo {dark ? 'oscuro' : 'claro'}</span>
      </div>
      <div className="flex bg-[#152b18] border border-[#1e4020] rounded-full p-0.5">
        <button
          onClick={() => apply(false)}
          className={'px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ' +
            (!dark ? 'bg-ctg-green text-[#0a1608]' : 'text-[#F0F7E8]/55 hover:text-[#F0F7E8]')}
        >
          <Icon d={I.sun} size={11} strokeWidth={2.2} /> Claro
        </button>
        <button
          onClick={() => apply(true)}
          className={'px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ' +
            (dark ? 'bg-ctg-green text-[#0a1608]' : 'text-[#F0F7E8]/55 hover:text-[#F0F7E8]')}
        >
          <Icon d={I.moon} size={11} strokeWidth={2.2} /> Oscuro
        </button>
      </div>
    </div>
  );
}

function AccountItem({ label, icon, onClick, danger, adminBadge }: {
  label: string; icon: string; onClick: () => void; danger?: boolean; adminBadge?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ' +
        (danger      ? 'text-red-400 hover:bg-red-500/10' :
         adminBadge  ? 'text-amber-400 hover:bg-amber-500/10 font-semibold' :
                       'text-[#F0F7E8]/80 hover:bg-[#8BC234]/8 hover:text-[#F0F7E8]')}
    >
      <Icon d={icon} size={14} />
      <span className="flex-1 text-left">{label}</span>
      {adminBadge && <span className="text-[9px] uppercase tracking-widest font-black text-amber-400/85">ADMIN</span>}
    </button>
  );
}

type Page = 'home' | 'escalerilla' | 'fixture' | 'historial' | 'partidos' | 'admin' | 'perfil' | 'master' | 'reservar' | 'mis-reservas' | 'fixture-reservas' | 'admin-reservas';

interface HeaderProps {
  currentPage?: Page;
  onLoginClick: () => void;
}

export default function Header({ onLoginClick }: HeaderProps) {
  const { player, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [showAccount, setShowAccount] = useState(false);
  const acctRef = useRef<HTMLDivElement>(null);

  const activeSection = getActiveSection(pathname);
  const subnav = activeSection && activeSection in SUBNAVS
    ? SUBNAVS[activeSection as keyof typeof SUBNAVS]
    : null;

  const adminRole = player?.admin_role;
  const isSuperAdmin = adminRole === 'all';

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (acctRef.current && !acctRef.current.contains(e.target as Node)) setShowAccount(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function go(path: string) { router.push(path); }

  function handleNavClick(item: NavItem) {
    if ('path' in item) {
      go(item.path);
    } else {
      if (item.paths.includes(pathname)) return;
      go(item.defaultPath);
    }
  }

  const cat = getCategoryFromPosition(player?.position);

  return (
    <>
      {/* TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#0a1608]/88 backdrop-blur-md border-b border-ctg-green/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-8 h-[64px] md:h-[72px] flex items-center gap-3 md:gap-5">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 select-none shrink-0" style={{ filter: 'brightness(1.1)' }}>
            <LogoMark size={30} />
            <div className="leading-none">
              <div className="font-display font-extrabold tracking-tight text-[#F0F7E8] text-[15px]">CTG</div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-ctg-green/70 font-semibold mt-0.5">Tenis Graneros</div>
            </div>
          </Link>

          {/* Desktop primary nav — no dropdowns */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {PRIMARY_NAV.map(item => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={'relative px-3.5 py-2 rounded-full text-sm flex items-center gap-2 transition ' +
                    (active
                      ? 'bg-ctg-green/15 text-ctg-green font-bold'
                      : 'text-[#F0F7E8]/65 hover:text-[#F0F7E8] hover:bg-ctg-green/5')}
                >
                  <Icon d={I[item.icon]} size={15} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex-1" />

          {/* Right cluster */}
          {player ? (
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                onClick={() => go('/reservar')}
                className="hidden lg:inline-flex btn-primary px-3.5 py-2 text-sm"
              >
                <Icon d={I.plus} size={14} strokeWidth={2.5} /> Reservar
              </button>

              {/* Bell (placeholder — NotificationsPanel added in Task 9) */}
              <button
                className="relative w-10 h-10 rounded-xl flex items-center justify-center transition hover:bg-ctg-green/10 text-[#F0F7E8]/70 hover:text-ctg-green"
                title="Notificaciones"
              >
                <Icon d={I.bell} size={19} />
              </button>

              {/* Avatar dropdown */}
              <div className="relative" ref={acctRef}>
                <button
                  onClick={() => setShowAccount(o => !o)}
                  className="flex items-center gap-2 pl-1 pr-1.5 md:pr-2 py-1 rounded-xl hover:bg-ctg-green/8 transition"
                >
                  <AvatarEl name={player.name} avatarUrl={player.avatar_url} size={36} />
                  <div className="hidden lg:block text-left leading-tight">
                    <div className="text-xs text-[#F0F7E8]/90 font-semibold">{player.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-[#F0F7E8]/45">
                      {(player.position ?? 0) > 0 ? `#${player.position} · ` : ''}Cat {cat}
                    </div>
                  </div>
                  <Icon d={I.chevDown} size={11} strokeWidth={2.5} />
                </button>

                {showAccount && (
                  <div className="absolute top-full right-0 mt-2 w-60 bg-[#0f2211] border border-[#1e4020] rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-scale-in origin-top-right z-50">
                    <div className="px-4 pt-4 pb-3 border-b border-[#1e4020]">
                      <div className="flex items-center gap-3">
                        <AvatarEl name={player.name} avatarUrl={player.avatar_url} size={40} />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#F0F7E8] truncate">{player.name}</div>
                          <div className="text-[11px] text-[#F0F7E8]/55 truncate">{player.email}</div>
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <div className="mt-2 inline-flex items-center gap-1.5 chip chip-warning">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Super Admin
                        </div>
                      )}
                    </div>
                    <div className="p-1">
                      <AccountItem label="Mi perfil" icon={I.user} onClick={() => { setShowAccount(false); go('/perfil'); }} />
                      <AccountItem label="Mis reservas" icon={I.calendar} onClick={() => { setShowAccount(false); go('/mis-reservas'); }} />
                      <AccountItem label="Historial" icon={I.flag} onClick={() => { setShowAccount(false); go('/historial'); }} />
                      {isSuperAdmin && (
                        <>
                          <div className="h-px bg-[#1e4020] my-1" />
                          <AccountItem label="Panel Escalerilla" icon={I.trophy} onClick={() => { setShowAccount(false); go('/admin'); }} adminBadge />
                          <AccountItem label="Panel Reservas" icon={I.calendar} onClick={() => { setShowAccount(false); go('/admin-reservas'); }} adminBadge />
                        </>
                      )}
                      {adminRole === 'escalerilla' && (
                        <>
                          <div className="h-px bg-[#1e4020] my-1" />
                          <AccountItem label="Panel Escalerilla" icon={I.trophy} onClick={() => { setShowAccount(false); go('/admin'); }} adminBadge />
                        </>
                      )}
                      {adminRole === 'reservas' && (
                        <>
                          <div className="h-px bg-[#1e4020] my-1" />
                          <AccountItem label="Panel Reservas" icon={I.calendar} onClick={() => { setShowAccount(false); go('/admin-reservas'); }} adminBadge />
                        </>
                      )}
                      <div className="h-px bg-[#1e4020] my-1" />
                      <ThemeToggleRow />
                      <div className="h-px bg-[#1e4020] my-1" />
                      <AccountItem label="Cerrar sesión" icon={I.logout} onClick={() => { setShowAccount(false); logout(); }} danger />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <button onClick={onLoginClick} className="btn-primary px-4 py-2 text-sm">
              Iniciar sesión
            </button>
          )}
        </div>

        {/* CONTEXTUAL SUB-NAV */}
        {subnav && (
          <div className="border-t border-ctg-green/8 bg-[#0a1608]/55 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-8 flex items-center gap-1 overflow-x-auto scrollbar-hide h-[42px]">
              {subnav.map(item => {
                const isActive = pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => go(item.path)}
                    className={'relative px-3 md:px-4 h-full text-sm whitespace-nowrap font-medium transition ' +
                      (isActive ? 'text-ctg-green' : 'text-[#F0F7E8]/60 hover:text-[#F0F7E8]')}
                  >
                    {item.label}
                    {isActive && (
                      <span
                        className="absolute left-3 right-3 bottom-0 h-[2px] bg-ctg-green rounded-t-full"
                        style={{ boxShadow: '0 0 8px rgba(139,194,52,.7)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a1608]/96 backdrop-blur-xl border-t border-ctg-green/15"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        <div className="flex items-stretch justify-around max-w-md mx-auto px-1 pt-1.5">
          {PRIMARY_NAV.map(item => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="flex flex-col items-center justify-center min-w-[58px] py-1 px-1 gap-0.5 transition group select-none"
              >
                <div className={'relative flex items-center justify-center w-11 h-7 rounded-2xl transition-all ' +
                  (active
                    ? 'bg-ctg-green text-[#0a1608] shadow-[0_0_18px_rgba(139,194,52,.5)]'
                    : 'text-[#F0F7E8]/55 group-active:bg-ctg-green/15')}>
                  <Icon d={I[item.icon]} size={17} strokeWidth={active ? 2.4 : 1.9} />
                </div>
                <span className={'text-[10px] font-semibold transition leading-tight tracking-tight ' +
                  (active ? 'text-ctg-green' : 'text-[#F0F7E8]/60')}>
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
