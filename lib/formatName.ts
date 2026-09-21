/**
 * Formatea un nombre completo a "Nombre Apellido" (o "Nombre Apellido Jr")
 * - Toma las primeras 2 palabras + sufijo si existe (Jr, Jr., Sr, Sr., II, III)
 * - Capitaliza la primera letra de cada palabra
 */

const SUFFIXES = new Set(['jr', 'jr.', 'sr', 'sr.', 'ii', 'iii', 'iv']);

export function formatPlayerName(fullName: string): string {
  if (!fullName) return '';

  const words = fullName
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0);

  // Capitalizar cada palabra (preservar mayúsculas en sufijos conocidos)
  const capitalize = (word: string) => {
    const lower = word.toLowerCase();
    if (SUFFIXES.has(lower)) {
      // Jr → Jr, jr. → Jr., II → II
      return lower === 'ii' || lower === 'iii' || lower === 'iv'
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  };

  // Tomar primeras 2 palabras
  const base = words.slice(0, 2).map(capitalize);

  // Si hay una tercera palabra y es sufijo, incluirla
  if (words.length >= 3 && SUFFIXES.has(words[2].toLowerCase())) {
    base.push(capitalize(words[2]));
  }

  return base.join(' ');
}

/**
 * Versión corta para espacios estrechos: "Daniel Soto Jr" → "D. Soto Jr".
 *
 * El sufijo NO se descarta: en el club hay padre e hijo con el mismo nombre
 * y apellido, y sin el "Jr" la escalerilla diría que juegan contra la misma
 * persona.
 */
export function shortPlayerName(fullName: string): string {
  const formatted = formatPlayerName(fullName);
  if (!formatted) return '';

  const [nombre, ...resto] = formatted.split(' ');
  if (resto.length === 0) return nombre; // un solo nombre: no hay qué abreviar

  return `${nombre[0]}. ${resto.join(' ')}`;
}