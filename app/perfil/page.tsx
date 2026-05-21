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

function getCat(pos: number | null | undefined) {
  const p = pos ?? 0;
  if (p <= 12) return 'A';
  if (p <= 24) return 'B';
  if (p <= 36) return 'C';
  return 'D';
}

const CAT_LABEL: Record<string, string> = {
  A: 'Élite', B: 'Avanzado', C: 'Intermedio', D: 'Desarrollo',
};

export default function PerfilPage() {
  const router = useRouter();
  const { player, loading: authLoading, refreshPlayer } = useAuth();
  const { toasts, removeToast, success, error } = useToast();

  const [name, setName]                           = useState('');
  const [phone, setPhone]                         = useState('');
  const [currentPassword, setCurrentPassword]     = useState('');
  const [newPassword, setNewPassword]             = useState('');
  const [confirmPassword, setConfirmPassword]     = useState('');
  const [saving, setSaving]                       = useState(false);
  const [uploadingAvatar, setUploadingAvatar]     = useState(false);
  const [avatarPreview, setAvatarPreview]         = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !player) { router.push('/'); return; }
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
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Error al actualizar perfil.');
    } finally { setSaving(false); }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { error('La imagen no puede superar los 5MB.'); return; }
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
        } finally { setUploadingAvatar(false); }
      };
      reader.readAsDataURL(file);
    } catch { setUploadingAvatar(false); }
  };

  const handleDeleteAvatar = async () => {
    setShowDeleteConfirm(false);
    try {
      await api.deleteAvatar();
      await refreshPlayer();
      setAvatarPreview(null);
      success('Foto de perfil eliminada.');
    } catch (err: any) { error(err.message || 'Error al eliminar foto'); }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a1608] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-ctg-green/20 border-t-ctg-green animate-spin" />
      </div>
    );
  }

  if (!player) return null;

  const initials = getInitials(player.name);
  const cat      = getCat(player.position);
  const pos      = player.position ?? 0;
  const eff      = player.total_matches > 0 ? Math.round((player.wins / player.total_matches) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a1608]">
      <Header onLoginClick={() => {}} />

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-24 md:pb-10">
        <div className="mb-8">
          <p className="text-ctg-green/70 text-xs font-bold uppercase tracking-[0.2em] mb-1">Cuenta</p>
          <h1 className="font-display text-3xl font-extrabold text-[#F0F7E8]">Mi Perfil</h1>
        </div>

        {/* Avatar + identity */}
        <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6 mb-5">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full overflow-hidden shrink-0"
                style={{ background: 'linear-gradient(135deg, #9ed944, #8BC234 60%, #6ea127)' }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center font-display font-bold text-[#0a1608] text-2xl">{initials}</span>
                }
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-[10px] uppercase tracking-widest font-bold mb-0.5 cat-letter-${cat}`}>{CAT_LABEL[cat]}</div>
              <div className="font-display font-bold text-[#F0F7E8] text-xl truncate">{player.name}</div>
              {pos > 0 && <div className="text-[#F0F7E8]/50 text-sm mt-0.5">#{pos} en la escalerilla</div>}
              <div className="flex gap-2 mt-3 flex-wrap">
                <button onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}
                  className="btn-primary text-xs py-1.5 px-3">
                  {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                </button>
                {avatarPreview && (
                  <button onClick={() => setShowDeleteConfirm(true)} disabled={uploadingAvatar}
                    className="btn-danger text-xs py-1.5 px-3">
                    Eliminar foto
                  </button>
                )}
              </div>
              <p className="text-xs text-[#F0F7E8]/25 mt-1.5">JPG, PNG o WebP · máx 5MB</p>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            </div>
          </div>
        </div>

        {/* Stats */}
        {player.total_matches > 0 && (
          <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-5 mb-5">
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              {[
                { label: 'Victorias', value: player.wins,          color: 'text-ctg-green' },
                { label: 'Derrotas',  value: player.losses,        color: 'text-red-400'   },
                { label: 'Partidos',  value: player.total_matches, color: 'text-[#F0F7E8]' },
              ].map(s => (
                <div key={s.label}>
                  <div className={`font-display font-black text-3xl ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#F0F7E8]/40 font-semibold mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="label">Efectividad</span>
                <span className="font-mono text-ctg-green font-bold text-sm">{eff}%</span>
              </div>
              <div className="h-1.5 bg-[#0a1608] rounded-full overflow-hidden">
                <div className="h-full bg-ctg-green rounded-full" style={{ width: `${eff}%`, boxShadow: '0 0 8px rgba(139,194,52,.5)' }} />
              </div>
            </div>
          </div>
        )}

        {/* Personal info */}
        <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6 mb-5">
          <h2 className="font-display font-bold text-[#F0F7E8] mb-4">Información personal</h2>
          <div className="space-y-4">
            <div>
              <label className="label block mb-1.5">Nombre completo</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="field w-full" />
            </div>
            <div>
              <label className="label block mb-1.5">Teléfono</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+56912345678" className="field w-full" />
            </div>
            <div>
              <label className="label block mb-1.5">Email</label>
              <input type="email" value={player.email} disabled
                className="field w-full opacity-40 cursor-not-allowed" />
              <p className="text-xs text-[#F0F7E8]/25 mt-1">El email no se puede cambiar.</p>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-[#0f2211] border border-[#1e4020] rounded-2xl p-6 mb-6">
          <h2 className="font-display font-bold text-[#F0F7E8] mb-1">Cambiar contraseña</h2>
          <p className="text-sm text-[#F0F7E8]/35 mb-4">Deja en blanco si no quieres cambiarla.</p>
          <div className="space-y-4">
            <div>
              <label className="label block mb-1.5">Contraseña actual</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="field w-full" />
            </div>
            <div>
              <label className="label block mb-1.5">Nueva contraseña</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" className="field w-full" />
            </div>
            <div>
              <label className="label block mb-1.5">Confirmar nueva contraseña</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="field w-full" />
            </div>
          </div>
        </div>

        <button onClick={handleSaveProfile} disabled={saving} className="btn-primary w-full py-3">
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Delete photo confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-[#0f2211] border border-ctg-green/15 rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
            <h3 className="font-display font-bold text-[#F0F7E8] text-lg mb-2">¿Eliminar foto de perfil?</h3>
            <p className="text-[#F0F7E8]/45 text-sm mb-6">Se eliminará tu foto y se mostrará tu inicial.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-ghost flex-1">Cancelar</button>
              <button onClick={handleDeleteAvatar} className="btn-danger flex-1">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
