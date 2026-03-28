'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  currentPage: 'escalerilla' | 'fixture' | 'historial' | 'partidos' | 'admin' | 'perfil' | 'master';
  onLoginClick: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Header({ currentPage, onLoginClick }: HeaderProps) {
  const { player, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getNavItems = () => {
    const baseItems = [
      { label: 'Escalerilla', page: 'escalerilla', path: '/' },
      { label: 'Ver Partidos', page: 'partidos',   path: '/fixture-publico' },
      { label: '🏆 Master',   page: 'master',      path: '/master' },
    ];

    if (!player) return baseItems;

    if (player.is_admin) {
      return [...baseItems, { label: '⚙️ Admin', page: 'admin', path: '/admin' }];
    }

    return [
      ...baseItems,
      { label: 'Mis desafíos', page: 'fixture',   path: '/fixture' },
      { label: 'Historial',    page: 'historial',  path: '/historial' },
    ];
  };

  const navItems = getNavItems();

  const AvatarCircle = ({ size = 'sm' }: { size?: 'sm' | 'md' }) => {
    const dim = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
    return (
      <div className={`${dim} rounded-full overflow-hidden bg-gradient-to-br from-ctg-green to-ctg-lime flex items-center justify-center font-bold text-white shadow-sm shrink-0`}>
        {player?.avatar_url ? (
          <img src={player.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <span>{player ? getInitials(player.name) : ''}</span>
        )}
      </div>
    );
  };

  return (
    <header className="bg-[#f5f5f5] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img src="/images/Logo_CTG_horizontal.png" alt="Club de Tenis Graneros" className="h-16 hidden md:block" />
            <img src="/images/Logo_CTG.png" alt="CTG" className="h-16 md:hidden" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.page}
                href={item.path}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === item.page
                    ? 'bg-ctg-green text-white font-medium shadow-md'
                    : 'text-ctg-dark hover:bg-ctg-green/10'
                }`}
              >
                {item.label}
              </Link>
            ))}

            {player ? (
              <div className="flex items-center gap-3 ml-4">
                <Link
                  href="/perfil"
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                    currentPage === 'perfil' ? 'bg-ctg-green/10' : 'hover:bg-ctg-green/10'
                  }`}
                >
                  <AvatarCircle />
                  <div className="flex flex-col items-start">
                    <span className="text-sm text-ctg-dark font-medium leading-tight">{player.name.split(' ')[0]}</span>
                    {player.is_admin && <span className="text-xs text-ctg-green leading-tight">Administrador</span>}
                  </div>
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md text-sm"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="ml-4 px-4 py-2 bg-ctg-green text-white rounded-lg hover:bg-ctg-green/90 transition-colors font-medium shadow-md"
              >
                Iniciar Sesión
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-ctg-green/10 text-ctg-dark"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 animate-slide-up">
            {navItems.map((item) => (
              <Link
                key={item.page}
                href={item.path}
                className={`block px-4 py-2 rounded-lg mb-1 ${
                  currentPage === item.page
                    ? 'bg-ctg-green text-white font-medium shadow-md'
                    : 'text-ctg-dark hover:bg-ctg-green/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {player ? (
              <>
                <Link
                  href="/perfil"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2 border-t border-ctg-dark/20 mt-2 pt-3 hover:bg-ctg-green/10 rounded-lg"
                >
                  <AvatarCircle size="md" />
                  <div>
                    <div className="text-ctg-dark font-medium text-sm">{player.name.split(' ')[0]}</div>
                    <div className="text-xs text-ctg-green">Mi Perfil</div>
                  </div>
                </Link>
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg mt-1 shadow-md"
                >
                  Salir
                </button>
              </>
            ) : (
              <button
                onClick={() => { onLoginClick(); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2 bg-ctg-green text-white rounded-lg hover:bg-ctg-green/90 font-medium mt-2 shadow-md"
              >
                Iniciar Sesión
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}