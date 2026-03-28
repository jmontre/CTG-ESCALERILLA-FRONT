'use client';

import { useState } from 'react';
import { Challenge, Player } from '@/types';

interface ResultModalProps {
  challenge: Challenge | null;
  currentPlayer: Player | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (winnerId: string, score: string) => void;
  loading?: boolean;
}

export default function ResultModal({
  challenge,
  currentPlayer,
  isOpen,
  onClose,
  onSubmit,
  loading = false
}: ResultModalProps) {
  const [set1Player1, setSet1Player1] = useState('');
  const [set1Player2, setSet1Player2] = useState('');
  const [set2Player1, setSet2Player1] = useState('');
  const [set2Player2, setSet2Player2] = useState('');
  const [set3Player1, setSet3Player1] = useState('');
  const [set3Player2, setSet3Player2] = useState('');
  const [stPlayer1, setStPlayer1]     = useState('');
  const [stPlayer2, setStPlayer2]     = useState('');
  const [hasRetirement, setHasRetirement] = useState(false);
  const [retiredPlayerId, setRetiredPlayerId] = useState('');

  if (!isOpen || !challenge || !currentPlayer) return null;

  const player1 = challenge.challenger!;
  const player2 = challenge.challenged!;

  const resetForm = () => {
    setSet1Player1(''); setSet1Player2('');
    setSet2Player1(''); setSet2Player2('');
    setSet3Player1(''); setSet3Player2('');
    setStPlayer1('');   setStPlayer2('');
    setHasRetirement(false);
    setRetiredPlayerId('');
  };

  const hasAnyScore = () => set1Player1 !== '' || set1Player2 !== '';

  const calculateWinner = (): { winnerId: string; score: string } | null => {
    // WO puro sin sets
    if (hasRetirement && !hasAnyScore()) {
      if (!retiredPlayerId) {
        alert('Selecciona quién se retiró / hizo W.O.');
        return null;
      }
      const winnerId = retiredPlayerId === player1.id ? player2.id : player1.id;
      return { winnerId, score: 'W.O.' };
    }

    if (!set1Player1 || !set1Player2) {
      alert('Debes ingresar al menos el primer set');
      return null;
    }

    const s1p1 = parseInt(set1Player1) || 0;
    const s1p2 = parseInt(set1Player2) || 0;
    const s2p1 = parseInt(set2Player1) || 0;
    const s2p2 = parseInt(set2Player2) || 0;
    const s3p1 = parseInt(set3Player1) || 0;
    const s3p2 = parseInt(set3Player2) || 0;
    const stp1 = parseInt(stPlayer1)   || 0;
    const stp2 = parseInt(stPlayer2)   || 0;

    let setsPlayer1 = 0;
    let setsPlayer2 = 0;

    if (s1p1 > s1p2) setsPlayer1++; else if (s1p2 > s1p1) setsPlayer2++;
    if (set2Player1 && set2Player2) {
      if (s2p1 > s2p2) setsPlayer1++; else if (s2p2 > s2p1) setsPlayer2++;
    }
    if (set3Player1 && set3Player2) {
      if (s3p1 > s3p2) setsPlayer1++; else if (s3p2 > s3p1) setsPlayer2++;
    }
    if (stPlayer1 && stPlayer2) {
      if (stp1 > stp2) setsPlayer1++; else if (stp2 > stp1) setsPlayer2++;
    }

    let winnerId: string;

    // Si hay retiro con sets: ganador es quien NO se retiró
    if (hasRetirement && retiredPlayerId) {
      winnerId = retiredPlayerId === player1.id ? player2.id : player1.id;
    } else {
      if (setsPlayer1 > setsPlayer2) {
        winnerId = player1.id;
      } else if (setsPlayer2 > setsPlayer1) {
        winnerId = player2.id;
      } else {
        alert('El resultado no es válido. Debe haber un ganador.');
        return null;
      }
    }

    const scoreParts: string[] = [];
    if (set1Player1 && set1Player2) scoreParts.push(`${s1p1}-${s1p2}`);
    if (set2Player1 && set2Player2) scoreParts.push(`${s2p1}-${s2p2}`);
    if (set3Player1 && set3Player2) scoreParts.push(`${s3p1}-${s3p2}`);
    if (stPlayer1   && stPlayer2)   scoreParts.push(`[${stp1}-${stp2}]`);

    let score = scoreParts.join(', ');
    if (hasRetirement) score += ' (Retiro)';

    return { winnerId, score };
  };

  const handleSubmit = () => {
    const result = calculateWinner();
    if (!result) return;
    onSubmit(result.winnerId, result.score);
    resetForm();
  };

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white', borderRadius: '16px', padding: '40px',
          maxWidth: '650px', width: '100%', position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute', top: '15px', right: '15px',
            background: '#1e5128', color: 'white', border: 'none',
            borderRadius: '50%', width: '35px', height: '35px',
            cursor: loading ? 'not-allowed' : 'pointer', fontSize: '24px', fontWeight: 'bold'
          }}
        >
          ×
        </button>

        <h2 style={{ color: '#1e5128', marginBottom: '24px', fontSize: '28px', fontWeight: 'bold', textAlign: 'center' }}>
          Ingresar Resultado
        </h2>

        {/* Retiro / WO */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
            padding: '10px', backgroundColor: '#fff3cd', borderRadius: '8px'
          }}>
            <input
              type="checkbox"
              checked={hasRetirement}
              onChange={(e) => { setHasRetirement(e.target.checked); if (!e.target.checked) setRetiredPlayerId(''); }}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#856404' }}>
              ⚠️ Hubo retiro / W.O.
            </span>
          </label>

          {hasRetirement && (
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff8e1', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', color: '#856404', marginBottom: '8px', fontWeight: 'bold' }}>
                ¿Quién se retiró?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[player1, player2].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setRetiredPlayerId(p.id)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '6px', border: '2px solid',
                      borderColor: retiredPlayerId === p.id ? '#856404' : '#ddd',
                      backgroundColor: retiredPlayerId === p.id ? '#fff3cd' : 'white',
                      fontWeight: 'bold', cursor: 'pointer', fontSize: '13px'
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              {!hasAnyScore() && (
                <p style={{ fontSize: '12px', color: '#999', marginTop: '6px' }}>
                  Sin sets → se registrará como W.O.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Tabla sets */}
        <div style={{ marginBottom: '25px' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
            <thead>
              <tr>
                {['Jugador', 'Set 1', 'Set 2', 'Set 3', 'ST'].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i === 0 ? 'left' : 'center', padding: '12px',
                    backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: '14px', color: '#666',
                    borderTopLeftRadius: i === 0 ? '8px' : 0,
                    borderTopRightRadius: i === 4 ? '8px' : 0,
                    width: i === 0 ? 'auto' : '80px'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  name: player1.name,
                  vals: [set1Player1, set2Player1, set3Player1, stPlayer1],
                  setters: [setSet1Player1, setSet2Player1, setSet3Player1, setStPlayer1]
                },
                {
                  name: player2.name,
                  vals: [set1Player2, set2Player2, set3Player2, stPlayer2],
                  setters: [setSet1Player2, setSet2Player2, setSet3Player2, setStPlayer2]
                },
              ].map((row, ri) => (
                <tr key={ri}>
                  <td style={{
                    padding: '15px 12px',
                    borderBottom: ri === 0 ? '1px solid #e5e5e5' : 'none',
                    fontWeight: 'bold', fontSize: '16px'
                  }}>
                    {row.name}
                  </td>
                  {row.vals.map((val, ci) => (
                    <td key={ci} style={{
                      padding: '8px',
                      borderBottom: ri === 0 ? '1px solid #e5e5e5' : 'none',
                      textAlign: 'center'
                    }}>
                      <input
                        type="number"
                        value={val}
                        onChange={(e) => row.setters[ci](e.target.value)}
                        min="0"
                        max={ci === 3 ? undefined : '7'}
                        style={{
                          width: '60px', padding: '8px', fontSize: '18px', fontWeight: 'bold',
                          textAlign: 'center', borderRadius: '6px',
                          border: `2px solid ${ci === 0 ? '#1e5128' : '#ddd'}`
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ backgroundColor: '#f0f9ff', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#1e40af' }}>
          💡 <strong>Set 1</strong> obligatorio. <strong>Set 2, 3 y ST</strong> solo si aplica.
          Para W.O. sin sets, marca retiro y selecciona quién se retiró.
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1, padding: '14px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ flex: 1, padding: '14px', backgroundColor: '#4e9f3d', color: 'white', border: 'none', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '16px', fontWeight: 'bold' }}
          >
            {loading ? 'Enviando...' : 'Confirmar Resultado'}
          </button>
        </div>
      </div>
    </div>
  );
}