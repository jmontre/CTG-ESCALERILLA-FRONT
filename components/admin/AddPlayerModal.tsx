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
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-8 animate-fade-in">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg animate-scale-in">
        <div className="bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden max-h-[85vh] overflow-y-auto">
          <div className="bg-[#152b18] border-b border-[#1e4020] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
            <h3 className="font-display text-xl font-bold text-[#F0F7E8]">Agregar Jugador</h3>
            <button onClick={onClose} className="text-[#F0F7E8]/30 hover:text-[#F0F7E8] text-2xl leading-none transition">×</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="label block mb-1.5">Nombre Completo *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="field"
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div>
              <label className="label block mb-1.5">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="field"
                placeholder="jperez"
                required
              />
              <p className="text-xs text-[#F0F7E8]/40 mt-1">Para iniciar sesión en la plataforma</p>
            </div>

            <div>
              <label className="label block mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="field"
                placeholder="juan@example.com"
                required
              />
            </div>

            <div>
              <label className="label block mb-1.5">Contraseña *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="field"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-[#F0F7E8]/40 mt-1">Mínimo 6 caracteres</p>
            </div>

            <div>
              <label className="label block mb-1.5">Teléfono (opcional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="field"
                placeholder="+56912345678"
              />
              <p className="text-xs text-[#F0F7E8]/40 mt-1">Para notificaciones WhatsApp</p>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500/30 text-red-400 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creando...' : 'Crear Jugador'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
