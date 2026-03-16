'use client';

import { Player } from '@/types';

interface ChallengeModalProps {
  challenger: Player;
  challenged: Player;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function ChallengeModal({ 
  challenger, 
  challenged, 
  isOpen, 
  onClose, 
  onConfirm,
  loading = false 
}: ChallengeModalProps) {
  if (!isOpen) return null;

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
          maxWidth: '500px',
          width: '100%',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
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
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loading ? 0.5 : 1
          }}
        >
          ×
        </button>

        <h2 style={{ 
          color: '#1e5128', 
          marginBottom: '25px',
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Confirmar Desafío
        </h2>

        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '25px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
              Desafiante
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {challenger.name}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Posición #{challenger.position}
            </div>
          </div>

          <div style={{ 
            textAlign: 'center', 
            fontSize: '32px', 
            margin: '15px 0',
            color: '#4e9f3d'
          }}>
            ⚔️
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '8px' }}>
              Desafiado
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {challenged.name}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Posición #{challenged.position}
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: '#fff3cd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '25px',
          fontSize: '14px',
          color: '#856404',
          textAlign: 'center'
        }}>
          ⏰ El desafiado tendrá <strong>24 horas</strong> para aceptar o rechazar
        </div>

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
              opacity: loading ? 0.5 : 1
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
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
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Creando...' : 'Confirmar Desafío'}
          </button>
        </div>
      </div>
    </div>
  );
}
