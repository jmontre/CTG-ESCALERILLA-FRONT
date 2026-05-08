export function toDateStr(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
}
