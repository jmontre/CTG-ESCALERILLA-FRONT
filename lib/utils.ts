export function toDateStr(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
}

/**
 * ¿El turno ya empezó? Compara contra la hora de Chile, sin depender de la
 * zona horaria del navegador. `date` acepta 'YYYY-MM-DD' o un ISO del backend.
 */
export function hasSlotStarted(date: string, slot: string): boolean {
  const now = new Date();
  const nowStr =
    now.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' }) + 'T' +
    now.toLocaleTimeString('sv', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit' });
  return `${date.split('T')[0]}T${slot}` <= nowStr;
}
