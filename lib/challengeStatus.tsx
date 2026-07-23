export const getStatusBadge = (status: string) => {
  const map: Record<string, { label: string; chip: string }> = {
    pending: { label: '⏳ Pendiente', chip: 'chip-warning' },
    accepted: { label: '🎾 Por jugar', chip: 'chip-info' },
    completed: { label: '✅ Completado', chip: 'chip-success' },
    disputed: { label: '⚠️ Disputa', chip: 'chip-danger' },
    cancelled: { label: '🚫 Cancelado', chip: 'chip-muted' },
    rejected: { label: '🏆 W.O.', chip: 'chip-success' },
    expired_not_accepted: { label: '⏰ Expiró (no resp)', chip: 'chip-warning' },
    expired_not_played: { label: '⏰ Expiró (no jugó)', chip: 'chip-warning' },
  };
  const s = map[status] || { label: status, chip: 'chip-muted' };
  return <span className={`chip ${s.chip}`}>{s.label}</span>;
};
