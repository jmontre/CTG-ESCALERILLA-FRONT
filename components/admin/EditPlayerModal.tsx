'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Player } from '@/types';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  player: Player | null;
}

export default function EditPlayerModal({ isOpen, onClose, onSuccess, player }: EditPlayerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: 0,
    wins: 0,
    losses: 0,
    immune_until: '',
    vulnerable_until: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name,
        email: player.email,
        phone: player.phone || '',
        position: player.position,
        wins: player.wins || 0,
        losses: player.losses || 0,
        immune_until: player.immune_until 
          ? new Date(player.immune_until).toISOString().slice(0, 16) 
          : '',
        vulnerable_until: player.vulnerable_until 
          ? new Date(player.vulnerable_until).toISOString().slice(0, 16) 
          : '',
      });
    }
  }, [player]);

  if (!isOpen || !player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Preparar datos para enviar
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        position: formData.position,
        wins: formData.wins,
        losses: formData.losses,
        total_matches: formData.wins + formData.losses,
      };

      // Agregar fechas si existen
      if (formData.immune_until) {
        updateData.immune_until = new Date(formData.immune_until).toISOString();
      } else {
        updateData.immune_until = null;
      }

      if (formData.vulnerable_until) {
        updateData.vulnerable_until = new Date(formData.vulnerable_until).toISOString();
      } else {
        updateData.vulnerable_until = null;
      }

      await api.updatePlayer(player.id, updateData);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar jugador');
    } finally {
      setLoading(false);
    }
  };

  const handleClearImmunity = () => {
    setFormData({ ...formData, immune_until: '' });
  };

  const handleClearVulnerability = () => {
    setFormData({ ...formData, vulnerable_until: '' });
  };

  const handleSet24hImmunity = () => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    setFormData({ ...formData, immune_until: date.toISOString().slice(0, 16) });
  };

  const handleSet24hVulnerability = () => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    setFormData({ ...formData, vulnerable_until: date.toISOString().slice(0, 16) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-ctg-dark">Editar Jugador</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Información Básica */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-ctg-dark mb-3">Información Básica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                  placeholder="+56912345678"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Posición</label>
                <input
                  type="number"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-ctg-dark mb-3">Estadísticas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Victorias</label>
                <input
                  type="number"
                  value={formData.wins}
                  onChange={(e) => setFormData({ ...formData, wins: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Derrotas</label>
                <input
                  type="number"
                  value={formData.losses}
                  onChange={(e) => setFormData({ ...formData, losses: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                  min="0"
                />
              </div>
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Total de partidos: {formData.wins + formData.losses}
            </p>
          </div>

          {/* Estados */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-ctg-dark mb-3">Estados Especiales</h3>
            
            {/* Inmunidad */}
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                🛡️ Inmunidad (hasta)
              </label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={formData.immune_until}
                  onChange={(e) => setFormData({ ...formData, immune_until: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                />
                <button
                  type="button"
                  onClick={handleSet24hImmunity}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm"
                >
                  +24h
                </button>
                <button
                  type="button"
                  onClick={handleClearImmunity}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Quitar
                </button>
              </div>
            </div>

            {/* Vulnerabilidad */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ⚠️ Vulnerabilidad (hasta)
              </label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  value={formData.vulnerable_until}
                  onChange={(e) => setFormData({ ...formData, vulnerable_until: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
                />
                <button
                  type="button"
                  onClick={handleSet24hVulnerability}
                  className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm"
                >
                  +24h
                </button>
                <button
                  type="button"
                  onClick={handleClearVulnerability}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  Quitar
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-ctg-green text-white font-bold py-2 rounded-lg hover:bg-ctg-lime transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
