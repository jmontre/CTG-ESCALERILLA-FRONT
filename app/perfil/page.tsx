'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Toast from '@/components/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { api } from '@/lib/api';

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function PerfilPage() {
  const router = useRouter();
  const { player, loading: authLoading, refreshPlayer } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const [name, setName]                         = useState('');
  const [phone, setPhone]                       = useState('');
  const [currentPassword, setCurrentPassword]   = useState('');
  const [newPassword, setNewPassword]           = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [saving, setSaving]                     = useState(false);
  const [uploadingAvatar, setUploadingAvatar]   = useState(false);
  const [avatarPreview, setAvatarPreview]       = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !player) {
      router.push('/');
      return;
    }
    if (player) {
      setName(player.name);
      setPhone(player.phone || '');
      setAvatarPreview(player.avatar_url || null);
    }
  }, [player, authLoading, router]);

  const handleSaveProfile = async () => {
    if (!name.trim()) { error('El nombre no puede estar vacío.'); return; }

    if (newPassword) {
      if (!currentPassword) { error('Debes ingresar tu contraseña actual.'); return; }
      if (newPassword.length < 6) { error('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
      if (newPassword !== confirmPassword) { error('Las contraseñas no coinciden.'); return; }
    }

    setSaving(true);
    try {
      await api.updateProfile({
        name: name.trim(),
        phone: phone.trim() || undefined,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });
      await refreshPlayer();
      success('Perfil actualizado correctamente.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Error al actualizar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      error('La imagen no puede superar los 5MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setAvatarPreview(base64);
        try {
          await api.uploadAvatar(base64);
          await refreshPlayer();
          success('Foto de perfil actualizada.');
        } catch (err: any) {
          error(err.message || 'Error al subir la imagen.');
          setAvatarPreview(player?.avatar_url || null);
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setShowDeleteConfirm(false);
    try {
      await api.deleteAvatar();
      await refreshPlayer();
      setAvatarPreview(null);
      success('Foto de perfil eliminada.');
    } catch (err: any) {
      error(err.message || 'Error al eliminar foto');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-ctg-green"></div>
      </div>
    );
  }

  if (!player) return null;

  const initials = getInitials(player.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-ctg-light via-white to-ctg-light/50">
      <Header currentPage="escalerilla" onLoginClick={() => {}} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ctg-dark mb-1">Mi Perfil</h1>
          <p className="text-gray-500">Actualiza tu información personal</p>
        </div>

        {/* Avatar */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-ctg-dark mb-4">Foto de perfil</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-ctg-green to-ctg-lime flex items-center justify-center shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">{initials}</span>
                )}
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                </div>
              )}
            </div>
            <div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="px-4 py-2 bg-ctg-green text-white rounded-lg hover:bg-ctg-lime transition font-medium disabled:opacity-50"
                >
                  {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                </button>
                {avatarPreview && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition font-medium disabled:opacity-50"
                  >
                    Eliminar foto
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">JPG, PNG o WebP. Máx 5MB.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </div>
        </div>

        {/* Info personal */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-ctg-dark mb-4">Información personal</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56912345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={player.email}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">El email no se puede cambiar.</p>
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-6">
          <h2 className="text-lg font-semibold text-ctg-dark mb-1">Cambiar contraseña</h2>
          <p className="text-sm text-gray-400 mb-4">Deja en blanco si no quieres cambiarla.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ctg-green"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-ctg-dark mb-4">Estadísticas</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">{player.wins}</p>
              <p className="text-xs text-gray-500 mt-1">Victorias</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{player.losses}</p>
              <p className="text-xs text-gray-500 mt-1">Derrotas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ctg-dark">#{player.position}</p>
              <p className="text-xs text-gray-500 mt-1">Posición</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full bg-ctg-green text-white font-bold py-3 rounded-xl hover:bg-ctg-lime transition disabled:opacity-50 shadow-md"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Modal confirmación eliminar foto */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-scale-in">
            <h3 className="text-lg font-bold text-ctg-dark mb-2">¿Eliminar foto de perfil?</h3>
            <p className="text-gray-500 text-sm mb-6">Se eliminará tu foto y se mostrará tu inicial.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAvatar}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}