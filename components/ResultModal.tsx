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
  const [stPlayer1, setStPlayer1] = useState('');
  const [stPlayer2, setStPlayer2] = useState('');
  const [hasRetirement, setHasRetirement] = useState(false);

  if (!isOpen || !challenge || !currentPlayer) return null;

  const player1 = challenge.challenger!;
  const player2 = challenge.challenged!;

  const resetForm = () => {
    setSet1Player1('');
    setSet1Player2('');
    setSet2Player1('');
    setSet2Player2('');
    setSet3Player1('');
    setSet3Player2('');
    setStPlayer1('');
    setStPlayer2('');
    setHasRetirement(false);
  };

  const calculateWinner = (): { winnerId: string; score: string } | null => {
    const s1p1 = parseInt(set1Player1) || 0;
    const s1p2 = parseInt(set1Player2) || 0;
    const s2p1 = parseInt(set2Player1) || 0;
    const s2p2 = parseInt(set2Player2) || 0;
    const s3p1 = parseInt(set3Player1) || 0;
    const s3p2 = parseInt(set3Player2) || 0;
    const stp1 = parseInt(stPlayer1) || 0;
    const stp2 = parseInt(stPlayer2) || 0;

    if (!set1Player1 || !set1Player2) {
      alert('Debes ingresar al menos el primer set');
      return null;
    }

    let setsPlayer1 = 0;
    let setsPlayer2 = 0;

    if (s1p1 > s1p2) setsPlayer1++;
    else if (s1p2 > s1p1) setsPlayer2++;

    if (set2Player1 && set2Player2) {
      if (s2p1 > s2p2) setsPlayer1++;
      else if (s2p2 > s2p1) setsPlayer2++;
    }

    if (set3Player1 && set3Player2) {
      if (s3p1 > s3p2) setsPlayer1++;
      else if (s3p2 > s3p1) setsPlayer2++;
    }

    if (stPlayer1 && stPlayer2) {
      if (stp1 > stp2) setsPlayer1++;
      else if (stp2 > stp1) setsPlayer2++;
    }

    let winnerId: string;
    if (setsPlayer1 > setsPlayer2) {
      winnerId = player1.id;
    } else if (setsPlayer2 > setsPlayer1) {
      winnerId = player2.id;
    } else {
      alert('El resultado no es válido. Debe haber un ganador.');
      return null;
    }

    let scoreParts = [];
    if (set1Player1 && set1Player2) scoreParts.push(`${s1p1}-${s1p2}`);
    if (set2Player1 && set2Player2) scoreParts.push(`${s2p1}-${s2p2}`);
    if (set3Player1 && set3Player2) scoreParts.push(`${s3p1}-${s3p2}`);
    if (stPlayer1 && stPlayer2) scoreParts.push(`[${stp1}-${stp2}]`);
    
    let score = scoreParts.join(', ');
    if (hasRetirement) {
      score += ' (Retiro)';
    }

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
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '650px',
          width: '100%',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: '#1e5128',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '35px',
            height: '35px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '24px',
            fontWeight: 'bold'
          }}
        >
          ×
        </button>

        <h2 style={{ 
          color: '#1e5128', 
          marginBottom: '30px',
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Ingresar Resultado
        </h2>

        {/* Tabla de resultados */}
        <div style={{ marginBottom: '25px' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'separate',
            borderSpacing: '0'
          }}>
            <thead>
              <tr>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderTopLeftRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#666'
                }}>
                  Jugador
                </th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#666',
                  width: '80px'
                }}>
                  Set 1
                </th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#666',
                  width: '80px'
                }}>
                  Set 2
                </th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#666',
                  width: '80px'
                }}>
                  Set 3
                </th>
                <th style={{ 
                  textAlign: 'center', 
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderTopRightRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  color: '#666',
                  width: '80px'
                }}>
                  ST
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Jugador 1 */}
              <tr>
                <td style={{ 
                  padding: '15px 12px',
                  borderBottom: '1px solid #e5e5e5',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {player1.name}
                </td>
                <td style={{ 
                  padding: '8px',
                  borderBottom: '1px solid #e5e5e5',
                  textAlign: 'center'
                }}>
                  <input
                    type="number"
                    value={set1Player1}
                    onChange={(e) => setSet1Player1(e.target.value)}
                    min="0"
                    max="7"
                    style={{
                      width: '60px',
                      padding: '8px',
                      border: '2px solid #1e5128',
                      borderRadius: '6px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ 
                  padding: '8px',
                  borderBottom: '1px solid #e5e5e5',
                  textAlign: 'center'
                }}>
                  <input
                    type="number"
                    value={set2Player1}
                    onChange={(e) => setSet2Player1(e.target.value)}
                    min="0"
                    max="7"
                    style={{
                      width: '60px',
                      padding: '8px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ 
                  padding: '8px',
                  borderBottom: '1px solid #e5e5e5',
                  textAlign: 'center'
                }}>
                  <input
                    type="number"
                    value={set3Player1}
                    onChange={(e) => setSet3Player1(e.target.value)}
                    min="0"
                    max="7"
                    style={{
                      width: '60px',
                      padding: '8px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ 
                  padding: '8px',
                  borderBottom: '1px solid #e5e5e5',
                  textAlign: 'center'
                }}>
                  <input
                    type="number"
                    value={stPlayer1}
                    onChange={(e) => setStPlayer1(e.target.value)}
                    min="0"
                    style={{
                      width: '60px',
                      padding: '8px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </td>
              </tr>

              {/* Jugador 2 */}
              <tr>
                <td style={{ 
                  padding: '15px 12px',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {player2.name}
                </td>
                <td style={{ 
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <input
                    type="number"
                    value={set1Player2}
                    onChange={(e) => setSet1Player2(e.target.value)}
                    min="0"
                    max="7"
                    style={{
                      width: '60px',
                      padding: '8px',
                      border: '2px solid #1e5128',
                      borderRadius: '6px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ 
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <input
                    type="number"
                    value={set2Player2}
                    onChange={(e) => setSet2Player2(e.target.value)}
                    min="0"
                    max="7"
                    style={{
                      width: '60px',
                      padding: '8px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ 
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <input
                    type="number"
                    value={set3Player2}
                    onChange={(e) => setSet3Player2(e.target.value)}
                    min="0"
                    max="7"
                    style={{
                      width: '60px',
                      padding: '8px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </td>
                <td style={{ 
                  padding: '8px',
                  textAlign: 'center'
                }}>
                  <input
                    type="number"
                    value={stPlayer2}
                    onChange={(e) => setStPlayer2(e.target.value)}
                    min="0"
                    style={{
                      width: '60px',
                      padding: '8px',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Nota explicativa */}
        <div style={{
          backgroundColor: '#f0f9ff',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#1e40af'
        }}>
          💡 <strong>Set 1 y Set 2</strong> son obligatorios. <strong>Set 3 y ST</strong> solo si es necesario.
        </div>

        {/* Retiro */}
        <div style={{ marginBottom: '25px' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            padding: '10px',
            backgroundColor: '#fff3cd',
            borderRadius: '8px'
          }}>
            <input
              type="checkbox"
              checked={hasRetirement}
              onChange={(e) => setHasRetirement(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#856404' }}>
              ⚠️ Hubo retiro (W.O.)
            </span>
          </label>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: '#4e9f3d',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {loading ? 'Enviando...' : 'Confirmar Resultado'}
          </button>
        </div>
      </div>
    </div>
    );
}
