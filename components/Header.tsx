'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

type Page = 'home' | 'escalerilla' | 'fixture' | 'historial' | 'partidos' | 'admin' | 'perfil' | 'master' | 'reservar' | 'mis-reservas' | 'fixture-reservas' | 'admin-reservas';

interface HeaderProps {
  currentPage: Page;
  onLoginClick: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function DropdownMenu({ label, items, activePages, currentPage, isOpen, onToggle }: {
  label: string;
  items: { label: string; path: string; page: Page }[];
  activePages: Page[];
  currentPage: Page;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isActive = activePages.includes(currentPage);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={onToggle}
        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive ? 'bg-ctg-green text-white shadow-md' : 'text-ctg-dark hover:bg-ctg-green/10'
        }`}>
        {label}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-1 min-w-[180px] z-50 animate-scale-in">
          {items.map(item => (
            <Link key={item.page} href={item.path}
              className={`flex items-center px-4 py-2.5 text-sm transition-colors hover:bg-ctg-light/50 ${
                currentPage === item.page ? 'text-ctg-green font-semibold' : 'text-gray-700'
              }`}
              onClick={onToggle}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ currentPage, onLoginClick }: HeaderProps) {
  const { player, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen]         = useState(false);
  const [openDropdown, setOpenDropdown]     = useState<string | null>(null);

  const adminRole      = player?.admin_role;
  const canEscalerilla = adminRole === 'escalerilla' || adminRole === 'all';
  const canReservas    = adminRole === 'reservas'    || adminRole === 'all';
  const hasPosition    = (player?.position ?? 0) > 0;

  const toggleDropdown = (name: string) =>
    setOpenDropdown(prev => prev === name ? null : name);

  // Submenú escalerilla
  const escallerillaItems: { label: string; path: string; page: Page }[] = [
    { label: '🏆 Escalerilla',  page: 'escalerilla', path: '/escalerilla' },
    { label: '📋 Ver Partidos', page: 'partidos',    path: '/fixture-publico' },
    { label: '🥇 Master',       page: 'master',      path: '/master' },
    ...(player && hasPosition ? [
      { label: '🎾 Mis Desafíos', page: 'fixture' as Page,   path: '/fixture' },
      { label: '📊 Historial',    page: 'historial' as Page, path: '/historial' },
    ] : []),
  ];

  // Submenú reservas
  const reservasItems: { label: string; path: string; page: Page }[] = [
    { label: '+ Reservar',       page: 'reservar',        path: '/reservar' },
    { label: '📅 Fixture',       page: 'fixture-reservas', path: '/fixture-reservas' },
    ...(player ? [{ label: '📋 Mis Reservas', page: 'mis-reservas' as Page, path: '/mis-reservas' }] : []),
  ];

  const escalerillaPages: Page[] = ['escalerilla','partidos','master','fixture','historial'];
  const reservasPages:    Page[] = ['reservar','fixture-reservas','mis-reservas'];

  const AvatarCircle = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
    const dim = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
    return (
      <div className={`${dim} rounded-full overflow-hidden bg-gradient-to-br from-ctg-green to-ctg-lime flex items-center justify-center font-bold text-white shadow-sm shrink-0`}>
        {player?.avatar_url
          ? <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          : <span>{player ? getInitials(player.name) : ''}</span>}
      </div>
    );
  };

  return (
    <header className="bg-[#f5f5f5] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={() => setOpenDropdown(null)}>
            <img src="/images/Logo_CTG_horizontal.png" alt="Club de Tenis Graneros" className="h-16 hidden md:block" />
            <img src="/images/Logo_CTG.png" alt="CTG" className="h-16 md:hidden" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {/* Escalerilla dropdown */}
            <DropdownMenu
              label="Escalerilla"
              items={escallerillaItems}
              activePages={escalerillaPages}
              currentPage={currentPage}
              isOpen={openDropdown === 'escalerilla'}
              onToggle={() => toggleDropdown('escalerilla')}
            />

            {/* Reservas dropdown */}
            <DropdownMenu
              label="Reservas"
              items={reservasItems}
              activePages={reservasPages}
              currentPage={currentPage}
              isOpen={openDropdown === 'reservas'}
              onToggle={() => toggleDropdown('reservas')}
            />

            {/* Admin links */}
            {canEscalerilla && (
              <Link href="/admin"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'admin' ? 'bg-ctg-green text-white shadow-md' : 'text-ctg-dark hover:bg-ctg-green/10'
                }`}>
                ⚙️ Admin
              </Link>
            )}
            {canReservas && (
              <Link href="/admin-reservas"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentPage === 'admin-reservas' ? 'bg-ctg-green text-white shadow-md' : 'text-ctg-dark hover:bg-ctg-green/10'
                }`}>
                📋 Admin Reservas
              </Link>
            )}

            {/* User */}
            {player ? (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/perfil"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    currentPage === 'perfil' ? 'bg-ctg-green/10' : 'hover:bg-ctg-green/10'
                  }`}
                  onClick={() => setOpenDropdown(null)}>
                  <AvatarCircle />
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-ctg-dark font-medium leading-tight">{player.name.split(' ')[0]}</span>
                    {adminRole && (
                      <span className="text-xs text-ctg-green leading-tight">
                        {adminRole === 'all' ? 'Super Admin' : adminRole === 'escalerilla' ? 'Admin Esc.' : 'Admin Res.'}
                      </span>
                    )}
                  </div>
                </Link>
                <button onClick={logout} className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md text-sm">
                  Salir
                </button>
              </div>
            ) : (
              <button onClick={onLoginClick} className="ml-2 px-4 py-2 bg-ctg-green text-white rounded-lg hover:bg-ctg-green/90 transition-colors font-medium shadow-md text-sm">
                Iniciar Sesión
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-ctg-green/10 text-ctg-dark">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile nav */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            {/* Escalerilla section */}
            <p className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Escalerilla</p>
            {escallerillaItems.map(item => (
              <Link key={item.page} href={item.path}
                className={`block px-4 py-2 rounded-lg mb-1 ${
                  currentPage === item.page ? 'bg-ctg-green text-white font-medium' : 'text-ctg-dark hover:bg-ctg-green/10'
                }`}
                onClick={() => setIsMenuOpen(false)}>
                {item.label}
              </Link>
            ))}

            {/* Reservas section */}
            <p className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mt-3">Reservas</p>
            {reservasItems.map(item => (
              <Link key={item.page} href={item.path}
                className={`block px-4 py-2 rounded-lg mb-1 ${
                  currentPage === item.page ? 'bg-ctg-green text-white font-medium' : 'text-ctg-dark hover:bg-ctg-green/10'
                }`}
                onClick={() => setIsMenuOpen(false)}>
                {item.label}
              </Link>
            ))}

            {/* Admin links mobile */}
            {(canEscalerilla || canReservas) && (
              <p className="px-4 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mt-3">Admin</p>
            )}
            {canEscalerilla && (
              <Link href="/admin" className={`block px-4 py-2 rounded-lg mb-1 ${currentPage === 'admin' ? 'bg-ctg-green text-white' : 'text-ctg-dark hover:bg-ctg-green/10'}`}
                onClick={() => setIsMenuOpen(false)}>⚙️ Admin Escalerilla</Link>
            )}
            {canReservas && (
              <Link href="/admin-reservas" className={`block px-4 py-2 rounded-lg mb-1 ${currentPage === 'admin-reservas' ? 'bg-ctg-green text-white' : 'text-ctg-dark hover:bg-ctg-green/10'}`}
                onClick={() => setIsMenuOpen(false)}>📋 Admin Reservas</Link>
            )}

            {/* User */}
            {player ? (
              <>
                <Link href="/perfil" onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 border-t border-ctg-dark/20 mt-3 pt-3 hover:bg-ctg-green/10 rounded-lg">
                  <AvatarCircle size="md" />
                  <div>
                    <div className="text-ctg-dark font-medium text-sm">{player.name.split(' ')[0]}</div>
                    <div className="text-xs text-ctg-green">Mi Perfil</div>
                  </div>
                </Link>
                <button onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg mt-1 shadow-md">
                  Salir
                </button>
              </>
            ) : (
              <button onClick={() => { onLoginClick(); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2 bg-ctg-green text-white rounded-lg hover:bg-ctg-green/90 font-medium mt-2 shadow-md">
                Iniciar Sesión
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}