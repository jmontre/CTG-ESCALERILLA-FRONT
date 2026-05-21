'use client';

import { useEffect, useState } from 'react';
import { Challenge, Player } from '@/types';

interface ResultModalProps {
  challenge: Challenge | null;
  currentPlayer: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (winnerId: string, score: string) => void;
  loading?: boolean;
}

function AvatarEl({ player, size = 26 }: { player: Player; size?: number }) {
  const initials = player.name.trim().split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const style: React.CSSProperties = {
    width: size, height: size, fontSize: size * 0.36,
    background: 'linear-gradient(135deg, #9ed944, #8BC234 60%, #6ea127)',
  };
  if (player.avatar_url) {
    return <div className="rounded-full overflow-hidden shrink-0" style={style}><img src={player.avatar_url} alt="" className="w-full h-full object-cover" /></div>;
  }
  return <div className="inline-flex items-center justify-center rounded-full font-display font-bold text-[#0a1608] shrink-0" style={style}>{initials}</div>;
}

export default function ResultModal({ challenge, currentPlayer, isOpen, onClose, onSubmit, loading = false }: ResultModalProps) {
  // sets[col][row]: col=set index (0-2), row=player index (0-1)
  const [sets, setSets] = useState<[string, string][]>([['', ''], ['', ''], ['', '']]);
  const [wo, setWo] = useState(false);
  const [retiredId, setRetiredId] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !loading) onClose(); }
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen, loading, onClose]);

  if (!isOpen || !challenge || !currentPlayer) return null;

  const player1 = challenge.challenger!;
  const player2 = challenge.challenged!;

  function setVal(col: number, row: number, v: string) {
    const copy: [string, string][] = sets.map(s => [s[0], s[1]]);
    copy[col][row] = v.replace(/[^0-9]/g, '').slice(0, 2);
    setSets(copy);
  }

  function hasAnyScore() { return sets[0][0] !== '' || sets[0][1] !== ''; }

  function handleSubmit() {
    setErr('');
    if (wo && !hasAnyScore()) {
      if (!retiredId) { setErr('Selecciona quién se retiró / hizo W.O.'); return; }
      const winnerId = retiredId === player1.id ? player2.id : player1.id;
      onSubmit(winnerId, 'W.O.');
      return;
    }
    if (!sets[0][0] || !sets[0][1]) { setErr('El primer set es obligatorio'); return; }

    const nums = sets.map(s => [parseInt(s[0]) || 0, parseInt(s[1]) || 0]);
    let w1 = 0, w2 = 0;
    for (let i = 0; i < 3; i++) {
      if (!sets[i][0] && !sets[i][1]) continue;
      if (nums[i][0] > nums[i][1]) w1++;
      else if (nums[i][1] > nums[i][0]) w2++;
    }

    let winnerId: string;
    if (wo && retiredId) {
      winnerId = retiredId === player1.id ? player2.id : player1.id;
    } else if (w1 > w2) {
      winnerId = player1.id;
    } else if (w2 > w1) {
      winnerId = player2.id;
    } else {
      setErr('El resultado no es válido. Debe haber un ganador.');
      return;
    }

    const parts: string[] = [];
    for (let i = 0; i < 3; i++) {
      if (sets[i][0] && sets[i][1]) parts.push(`${nums[i][0]}-${nums[i][1]}`);
    }
    let score = parts.join(', ');
    if (wo) score += ' (Retiro)';
    onSubmit(winnerId, score);
  }

  const rows = [
    { player: player1, vals: sets.map(s => s[0]), rowIdx: 0 },
    { player: player2, vals: sets.map(s => s[1]), rowIdx: 1 },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
          {/* Header */}
          <div className="bg-[#152b18] border-b border-[#1e4020] px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl font-bold text-[#F0F7E8]">Ingresar Resultado</h3>
              <p className="text-[#F0F7E8]/45 text-sm mt-0.5">Hasta 3 sets · solo el primero es obligatorio</p>
            </div>
            <button
              onClick={loading ? undefined : onClose}
              disabled={loading}
              className="text-[#F0F7E8]/30 hover:text-[#F0F7E8] text-2xl leading-none transition"
            >×</button>
          </div>

          <div className="p-6 space-y-5">
            {/* Score table */}
            <div className="overflow-hidden rounded-xl border border-[#1e4020]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#152b18] text-[#F0F7E8]/45">
                    <th className="text-left px-4 py-2 font-semibold text-xs uppercase tracking-wider">Jugador</th>
                    {[1, 2, 3].map(i => (
                      <th key={i} className="font-semibold text-xs uppercase tracking-wider text-center w-16">Set {i}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ player, vals, rowIdx }) => (
                    <tr key={player.id} className="border-t border-[#1e4020]">
                      <td className="px-4 py-3 text-[#F0F7E8] font-semibold">
                        <div className="flex items-center gap-2">
                          <AvatarEl player={player} size={26} />
                          <span className="truncate">{player.name.split(' ')[0]}</span>
                        </div>
                      </td>
                      {[0, 1, 2].map(col => (
                        <td key={col} className="text-center px-1 py-2">
                          <input
                            disabled={wo}
                            value={vals[col]}
                            onChange={e => setVal(col, rowIdx, e.target.value)}
                            className={'w-12 h-11 font-mono font-bold text-center bg-[#0f2211] border rounded-lg text-[#F0F7E8] text-lg focus:outline-none focus:border-ctg-green/70 focus:ring-2 focus:ring-ctg-green/20 transition ' +
                              (col === 0 ? 'border-ctg-green/40' : 'border-[#1e4020]') + (wo ? ' opacity-30' : '')}
                            placeholder="–"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* WO toggle */}
            <label className="flex items-center gap-2 text-sm text-[#F0F7E8]/80 cursor-pointer">
              <input
                type="checkbox"
                checked={wo}
                onChange={e => { setWo(e.target.checked); if (!e.target.checked) setRetiredId(''); }}
                className="accent-ctg-green w-4 h-4"
              />
              Hubo retiro / W.O.
            </label>

            {/* WO retired player selection */}
            {wo && (
              <div className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3 space-y-2">
                <label className="label block">Motivo del retiro</label>
                <div className="flex gap-2">
                  {[player1, player2].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRetiredId(p.id)}
                      className={'flex-1 py-2 px-3 rounded-lg text-xs font-bold transition border ' +
                        (retiredId === p.id
                          ? 'border-amber-500 bg-amber-900/40 text-amber-300'
                          : 'border-[#1e4020] bg-[#152b18] text-[#F0F7E8]/60 hover:text-[#F0F7E8]')}
                    >
                      {p.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
                {!hasAnyScore() && (
                  <p className="text-[10px] text-[#F0F7E8]/35">Sin sets → se registrará como W.O.</p>
                )}
              </div>
            )}

            {/* Tip */}
            <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-3 text-blue-300/80 text-xs">
              <strong className="text-blue-300">Tip:</strong> Si ganas, automáticamente se intercambian las posiciones.
              El rival tendrá 24h para disputar el resultado.
            </div>

            {err && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">{err}</div>
            )}

            <div className="flex gap-3">
              <button onClick={loading ? undefined : onClose} disabled={loading} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Enviando…' : 'Guardar resultado'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
