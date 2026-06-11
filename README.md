# CTG Escalerilla — Frontend

Frontend del sistema de escalerilla, reserva de canchas y torneo Master del **Club de Tenis Graneros**. Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS.

## Inicio rápido

```bash
npm install
# crear .env.local (ver abajo)
npm run dev      # http://localhost:3000
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000   # backend NestJS
NEXT_PUBLIC_WORDPRESS_URL=https://clubdetenisgraneros.cl
```

Requiere el backend corriendo (repo `CTG-Backend`: NestJS + Prisma + PostgreSQL).

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |

## Documentación

- **`CLAUDE.md`** — arquitectura, convenciones de código, sistema de diseño, endpoints del API. Léelo antes de tocar código.
- **`ONBOARDING.md`** — guía de onboarding para colaboradores nuevos (incluye setup del backend).
- **`docs/`** — planes de implementación y contratos backend pendientes.

## Branching

`feature/*` o `fix/*` → `dev` → PR → `main` (producción en Vercel). Nunca pushear directo a `main`.
