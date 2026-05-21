'use client';

import Link from 'next/link';

function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <circle cx="20" cy="20" r="18" fill="#8BC234" />
      <path d="M3 20 Q20 6 37 20" stroke="#0a1608" strokeWidth="1.8" fill="none" />
      <path d="M3 20 Q20 34 37 20" stroke="#0a1608" strokeWidth="1.8" fill="none" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="hidden md:block bg-[#0a1608] border-t border-ctg-green/10 mt-20">
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-8 flex flex-col md:flex-row items-center gap-4 md:gap-0 justify-between text-xs">
        <div className="flex items-center gap-3 opacity-60 hover:opacity-100 transition">
          <LogoMark size={22} />
          <div className="text-[#F0F7E8]/50">© {new Date().getFullYear()} Club de Tenis Graneros</div>
        </div>
        <div className="flex items-center gap-3 text-[#F0F7E8]/40">
          <Link href="/escalerilla" className="hover:text-ctg-green transition">Escalerilla</Link>
          <span className="text-ctg-green/20">/</span>
          <Link href="/reservar" className="hover:text-ctg-green transition">Reservas</Link>
          <span className="text-ctg-green/20">/</span>
          <Link href="/master" className="hover:text-ctg-green transition">Master</Link>
        </div>
        <div className="text-[#F0F7E8]/25">MatchLab Chile · v1.0</div>
      </div>
    </footer>
  );
}
