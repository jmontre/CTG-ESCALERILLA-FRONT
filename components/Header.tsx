'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  currentPage: 'escalerilla' | 'fixture' | 'historial' | 'partidos' | 'admin';
  onLoginClick: () => void;
}

export default function Header({ currentPage, onLoginClick }: HeaderProps) {
  const { player, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Lógica de navegación según rol
  const getNavItems = () => {
    const baseItems = [
      { label: 'Escalerilla', page: 'escalerilla', path: '/' },
      { label: 'Ver Partidos', page: 'partidos', path: '/fixture-publico' }, // 👈 TODOS pueden ver esto
    ];

    if (!player) {
      // Usuario público - Escalerilla + Ver Partidos
      return baseItems;
    }

    if (player.is_admin) {
      // Admin - Escalerilla + Ver Partidos + Admin
      return [
        ...baseItems,
        { label: '⚙️ Admin', page: 'admin', path: '/admin' },
      ];
    }

    // Player normal - Todo menos Admin
    return [
      ...baseItems,
      { label: 'Mis desafíos', page: 'fixture', path: '/fixture' },
      { label: 'Historial', page: 'historial', path: '/historial' },
    ];
  };

  const navItems = getNavItems();

  return (
    <header className="bg-gradient-to-r from-ctg-forest to-ctg-dark text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <img 
              src="/images/Logo_CTG_horizontal.png" 
              alt="Club de Tenis Graneros" 
              className="h-20 hidden md:block"
            />
            <img 
              src="/images/Logo_CTG.png" 
              alt="CTG" 
              className="h-20 md:hidden"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.page}
                href={item.path}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentPage === item.page
                    ? 'bg-ctg-green text-ctg-dark font-medium'
                    : 'hover:bg-white/10'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {player ? (
              <div className="flex items-center gap-4 ml-4">
                <div className="flex flex-col items-end">
                  <span className="text-sm">Hola, {player.name.split(' ')[0]}</span>
                  {player.is_admin && (
                    <span className="text-xs text-ctg-lime">Administrador</span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="ml-4 px-4 py-2 bg-ctg-green text-ctg-dark rounded-lg hover:bg-ctg-lime transition-colors font-medium"
              >
                Iniciar Sesión
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/10"
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
                    ? 'bg-ctg-green text-ctg-dark font-medium'
                    : 'hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {player ? (
              <>
                <div className="px-4 py-2 text-sm border-t border-white/20 mt-2 pt-2">
                  <div>Hola, {player.name.split(' ')[0]}</div>
                  {player.is_admin && (
                    <div className="text-xs text-ctg-lime mt-1">Administrador</div>
                  )}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg mt-1"
                >
                  Salir
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onLoginClick();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 bg-ctg-green text-ctg-dark rounded-lg hover:bg-ctg-lime font-medium mt-2"
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
