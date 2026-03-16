'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddPlayerModal({ isOpen, onClose, onSuccess }: AddPlayerModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.createPlayer(formData);
      onSuccess();
      onClose();
      setFormData({ username: '', email: '', password: '', name: '', phone: '' });
    } catch (err: any) {
      setError(err.message || 'Error al crear jugador');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-ctg-dark">Agregar Jugador</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Nombre Completo *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              placeholder="jperez"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Para iniciar sesión en la plataforma</p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              placeholder="juan@example.com"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Contraseña *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              placeholder="••••••••"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Teléfono (opcional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              placeholder="+56912345678"
            />
            <p className="text-xs text-gray-500 mt-1">Para notificaciones WhatsApp</p>
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
              {loading ? 'Creando...' : 'Crear Jugador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
