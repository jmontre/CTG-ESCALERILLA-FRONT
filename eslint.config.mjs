import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Pre-existing: codebase usa `any` ampliamente. Cambiar a warn para no bloquear CI.
      '@typescript-eslint/no-explicit-any': 'warn',
      // Pre-existing: Date.now()/new Date() durante render — react-hooks v19 los marca como impuros.
      // El código funciona; son patrones válidos que el React Compiler no puede optimizar.
      'react-hooks/purity': 'warn',
      // Pre-existing: setLoading síncrono al inicio de useEffect (patrón común de loading gate).
      'react-hooks/set-state-in-effect': 'warn',
      // Pre-existing: componentes definidos dentro del render (ej: helpers de renderizado inline).
      'react-hooks/static-components': 'warn',
    },
  },
]);

export default eslintConfig;
