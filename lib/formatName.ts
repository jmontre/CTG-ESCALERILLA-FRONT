/**
 * Formatea un nombre completo a "Nombre Apellido"
 * - Toma solo las primeras 2 palabras
 * - Capitaliza la primera letra de cada palabra
 */
export function formatPlayerName(fullName: string): string {
  if (!fullName) return '';

  const words = fullName
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Tomar solo las primeras 2 palabras (nombre + apellido)
  const firstTwo = words.slice(0, 2);

  // Capitalizar cada palabra
  const formatted = firstTwo.map(word => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formatted.join(' ');
}
