'use client';

import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ctg-dark text-white/70 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo + copyright */}
          <div className="flex items-center gap-3">
            <img src="/images/Logo_CTG.png" alt="CTG" className="h-8 opacity-80" />
            <div>
              <p className="text-sm font-medium text-white">Club de Tenis Graneros</p>
              <p className="text-xs text-white/50">© {year} Todos los derechos reservados</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4 text-xs">
            <Link href="/escalerilla" className="hover:text-white transition">Escalerilla</Link>
            <span className="text-white/30">·</span>
            <Link href="/reservar" className="hover:text-white transition">Reservas</Link>
            <span className="text-white/30">·</span>
            <Link href="/fixture-reservas" className="hover:text-white transition">Fixture</Link>
            <span className="text-white/30">·</span>
            <Link href="/master" className="hover:text-white transition">Master</Link>
          </div>

          {/* Powered by */}
          <p className="text-xs text-white/30">
            Desarrollado por{' '}
            <span className="text-white/50 font-medium">MatchLab Chile</span>
          </p>
        </div>
      </div>
    </footer>
  );
}