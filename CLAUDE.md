# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# CTG Escalerilla — Frontend

Sistema de escalerilla, reserva de canchas y torneo Master para el **Club de Tenis Graneros (CTG)**.

> **Rediseño UI/UX (mayo 2026):** la app fue rediseñada completa al sistema "dark-green premium" (tema oscuro por defecto, fuentes nuevas, clases CSS compartidas). El plan detallado del rediseño está en `docs/superpowers/plans/2026-05-20-ui-redesign.md`. La rama de trabajo es `feature/redesign-ui-ux`.

---

## Stack Tecnológico

| Tecnología | Versión |
|-----------|---------|
| Next.js (App Router) | 16.1.6 |
| React | 19.2.3 |
| TypeScript | ^5 |
| Tailwind CSS | ^3.4.17 |
| xlsx (export Excel) | ^0.18.5 |
| Fuentes (next/font/google) | Bricolage Grotesque (display) + Manrope (sans) + JetBrains Mono |

Backend: NestJS + Prisma + PostgreSQL (repo separado `CTG-Backend`). Guía de onboarding general en `ONBOARDING.md`.

---

## Comandos

```bash
npm run dev     # Desarrollo (puerto 3000)
npm run build   # Build de producción
npm run start   # Servidor de producción
npm run lint    # ESLint
```

No hay tests configurados.

---

## Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3000   # URL del backend NestJS
NEXT_PUBLIC_WORDPRESS_URL=https://clubdetenisgraneros.cl
```

Archivos ignorados por git: `.env.local`, `.env.development`, `.env.production`.

---

## Git y Branching

- **`main`** → producción (Vercel). Nunca pushear directo.
- **`dev`** → rama de integración. Todo cambio va aquí primero.
- **Feature/fix branches** → `feature/nombre` o `fix/nombre`, se mergean a `dev`.
- **Flujo obligatorio:** `feature/fix` → `dev` → PR → `main`.
- Remote: `https://github.com/jmontre/CTG-ESCALERILLA-FRONT.git`

```bash
git checkout dev && git pull
git checkout -b feature/mi-feature
# ... trabajo ...
git push -u origin feature/mi-feature
# PR de feature/mi-feature → dev. Cuando dev está listo → PR de dev → main.
```

---

## Estructura del Proyecto

```
frontend/
├── app/                              # Páginas (Next.js App Router)
│   ├── layout.tsx                   # Layout raíz: fuentes, themeScript (dark mode), metadata, Footer
│   ├── page.tsx                     # / → Landing (hero, QuickChips, court SVG)
│   ├── home/page.tsx                # /home → Alias de landing
│   ├── escalerilla/page.tsx         # /escalerilla → Escalerilla pública
│   ├── fixture/page.tsx             # /fixture → Mis desafíos (auth)
│   ├── fixture-publico/page.tsx     # /fixture-publico → Todos los desafíos
│   ├── fixture-reservas/page.tsx    # /fixture-reservas → Vista de canchas por día
│   ├── historial/page.tsx           # /historial → Historial de partidos (auth)
│   ├── reservar/page.tsx            # /reservar → Reserva 3 pasos (auth)
│   ├── mis-reservas/page.tsx        # /mis-reservas → Mis reservas activas e historial
│   ├── perfil/page.tsx              # /perfil → Perfil + avatar (auth)
│   ├── master/page.tsx              # /master → Torneo Master (auth)
│   ├── reset-password/page.tsx      # /reset-password?token= → Reset contraseña
│   ├── admin/page.tsx               # /admin → Panel admin escalerilla
│   ├── admin-reservas/page.tsx      # /admin-reservas → Panel admin reservas
│   └── globals.css                  # Sistema CSS completo: tema, clases .card/.btn-*/.chip/etc.
├── components/
│   ├── Header.tsx                   # Nav por usePathname: pills + sub-nav + bottom tabs móvil + campana + dropdown cuenta
│   ├── NotificationsPanel.tsx       # Panel dropdown de la campana de notificaciones
│   ├── Footer.tsx                   # Footer minimal oscuro
│   ├── Ladder.tsx                   # Escalerilla categorías A/B/C/D (pirámide + chips de estado)
│   ├── LoginModal.tsx               # Login + olvidé contraseña
│   ├── ChallengeModal.tsx           # Confirmación de desafío (layout VS)
│   ├── ChallengesList.tsx           # Lista desafíos activos
│   ├── PlayerModal.tsx              # Detalle de jugador
│   ├── PlayerCard.tsx               # Tarjeta compacta de jugador
│   ├── ResultModal.tsx              # Envío de resultados
│   ├── ModifyReservationModal.tsx   # Modificar reserva existente
│   ├── ScheduleDateModal.tsx        # Fijar fecha de partido
│   ├── Toast.tsx                    # Notificaciones toast
│   └── admin/
│       ├── AddPlayerModal.tsx
│       ├── EditPlayerModal.tsx
│       ├── EditUserModal.tsx        # Editar credenciales y rol admin
│       └── ChallengeManagementModal.tsx
├── hooks/
│   ├── useAuth.ts                   # Auth: JWT en localStorage + cache en memoria + timer 5 min
│   ├── useNotifications.ts          # Notificaciones reales (store compartido + polling 60s)
│   └── useToast.ts                  # Gestión de toasts
├── lib/
│   ├── api.ts                       # Cliente API único (objeto `api` con TODOS los endpoints)
│   ├── utils.ts                     # `toDateStr(d)` — fecha YYYY-MM-DD en zona America/Santiago
│   └── formatName.ts                # `formatPlayerName()` — toma 2 palabras + sufijos
├── types/
│   └── index.ts                     # Todos los tipos TypeScript del proyecto
├── docs/superpowers/plans/          # Planes de implementación (ej: rediseño UI 2026-05-20)
└── public/images/                   # Logos y favicons
```

---

## Rutas y Autenticación

| Ruta | Descripción | Auth requerida |
|------|-------------|----------------|
| `/` | Landing | No |
| `/escalerilla` | Escalerilla pública | No |
| `/fixture-publico` | Ver todos los desafíos | No |
| `/fixture-reservas` | Canchas ocupadas/bloqueadas por día | No |
| `/fixture` | Mis desafíos | Jugador |
| `/historial` | Historial de partidos | Jugador |
| `/reservar` | Reservar cancha 3 pasos | Jugador |
| `/mis-reservas` | Mis reservas activas e historial | Jugador |
| `/perfil` | Perfil y avatar | Jugador |
| `/master` | Torneo Master | Jugador con posición |
| `/reset-password` | Resetear contraseña (token email) | No |
| `/admin` | Panel admin escalerilla | Admin (`escalerilla` o `all`) |
| `/admin-reservas` | Panel admin reservas | Admin (`reservas` o `all`) |

**Admin roles:** `'escalerilla' | 'reservas' | 'all' | null`
- `escalerilla` → solo `/admin`
- `reservas` → solo `/admin-reservas`
- `all` → ambos paneles + label "Super Admin"

**Patrón de protección de página:**
```ts
useEffect(() => {
  if (!authLoading && !player) router.push('/');
}, [player, authLoading]);
```

---

## Autenticación — `useAuth`

```ts
const { user, player, loading, login, logout, refreshPlayer } = useAuth();
```

- Token JWT en `localStorage` key `auth_token`.
- Cache en memoria (`authCache`, module-level) para evitar flickering — no tocar directamente.
- Validación vía `GET /auth/me`.
- Timer de inactividad: logout automático a los **5 minutos** sin actividad (mousemove, keydown, click, scroll, touchstart). `logout()` hace `window.location.href = '/'` (recarga completa).
- `refreshPlayer()` — llamar después de cualquier mutación que cambie datos del jugador en el backend.
- **Sincronización entre instancias:** `login()` dispara el evento `window 'auth:login'`; toda instancia de `useAuth` lo escucha y re-valida. Así el Header se actualiza al hacer login desde cualquier modal. También existe el alias `refreshAuth` (retrocompatibilidad).

---

## API Backend

**Base URL:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`).

### Usar siempre `api.*` de `lib/api.ts`

**Todas** las llamadas al backend van por el objeto `api` exportado en `lib/api.ts`. Ya no hay excepciones de `fetch` directo en páginas — los endpoints de bloqueos, cobro de luz y admin players que antes eran fetch directo ya están en `api`.

**Auth**
```
POST /auth/login                 api.login(username, password)
POST /auth/register              api.register(data)
GET  /auth/me                    api.validateToken(token)
POST /auth/forgot-password       api.forgotPassword(username)
POST /auth/reset-password        api.resetPassword(token, password)
```

**Players**
```
GET  /players                    api.getPlayers()
GET  /players/:id                api.getPlayer(id)
GET  /players/user/:userId       api.getPlayerByUserId(userId)
PUT  /players/me                 api.updateProfile(data)
POST /players/me/avatar          api.uploadAvatar(base64)
DEL  /players/me/avatar          api.deleteAvatar()
```

**Admin Players**
```
POST /admin/players              api.createPlayer(data)
PUT  /admin/players/:id          api.updatePlayer(id, data)
DEL  /admin/players/:id          api.deletePlayer(id)
POST /admin/players/:id/move     api.movePlayer(id, newPosition)
POST /admin/players/:id/reset-immunity       api.resetImmunity(id)
POST /admin/players/:id/reset-vulnerability  api.resetVulnerability(id)
GET  /admin/players/all          api.getAllPlayersAdmin()   # incluye jugadores sin posición
```

**Challenges**
```
GET  /challenges                 api.getChallenges()
POST /challenges                 api.createChallenge(challengerId, challengedId)
POST /challenges/:id/accept      api.acceptChallenge(id, playerId)
POST /challenges/:id/reject      api.rejectChallenge(id, playerId)
POST /challenges/:id/result      api.submitResult(id, playerId, winnerId, score)
POST /challenges/:id/schedule    api.scheduleMatch(id, playerId, date, courtId)
```

**Admin Challenges**
```
POST /admin/challenges/:id/resolve   api.resolveChallenge(id, winnerId, score)
DEL  /admin/challenges/:id           api.cancelChallenge(id)
DEL  /admin/challenges/:id/force     api.forceDeleteChallenge(id)
POST /admin/challenges/:id/extend    api.extendDeadline(id, hours, type)
```

**Reservations**
```
GET  /reservations/courts         api.getCourts()
GET  /reservations/season         api.getSeason()
GET  /reservations/availability?date=  api.getAvailability(date)
GET  /reservations/my             api.getMyReservations()
GET  /reservations/player/:id     api.getPlayerReservations(playerId)
GET  /reservations?date=          api.getAllReservations(date?)
GET  /reservations?month=         api.getReservationsByMonth(month)   # para export
GET  /reservations/stats?month=   api.getStats(month?)
POST /reservations                api.createReservation(data)
DEL  /reservations/:id            api.cancelReservation(id)
PATCH /reservations/:id/modify    api.modifyReservation(id, data)
DEL  /reservations/:id/admin      api.adminCancelReservation(id, reason?)
POST /reservations/season         api.adminSetSeason(season)
```

**Bloqueos y Cobro de Luz (admin)**
```
GET  /reservations/blocks?date=          api.getBlocks(date)
POST /reservations/blocks                api.saveBlocks({ court_id, date, slots[], reason? })
GET  /reservations/light-config?date=    api.getLightConfig(date)
POST /reservations/light-config          api.saveLightConfig({ date, time_slots[], amount_per_slot })
GET  /reservations/light-summary?month=  api.getLightSummary(month)
```

**Notificaciones** (backend pendiente — ver `docs/backend-notifications.md`)
```
GET  /notifications              api.getNotifications()        # [] si falla
POST /notifications/:id/read     api.markNotificationRead(id)
POST /notifications/read-all     api.markAllNotificationsRead()
```

**Master**
```
GET  /master                     api.getMaster()
GET  /master/:category           api.getMasterCategory(category)
```

---

## Modelo de Datos

Tipos completos en `types/index.ts` (`User`, `Player`, `Challenge`, `AuthResponse`, `MasterSeason`, `MasterGroup`, `MasterMatch`, `MasterGroupPlayer`).

### Availability Slot (response de `/reservations/availability`)
```ts
{
  slot: string           // '09:30'
  available: boolean
  block_reason?: string  // Presente si bloqueado por admin (no por reserva)
  reservation?: {        // Presente si hay reserva activa
    player_name: string
    partner_name?: string
    school_name?: string
    guest_name?: string
    has_guest: boolean
    is_challenge: boolean
  }
}
```
> Un slot sin `reservation` y con `available: false` es un bloqueo de admin. Usar `!s.reservation` para detectarlo.

### Player (campos clave)
```ts
{
  position?: number | null   // null o 0 = sin escalerilla; >0 = posición activa
  immune_until: string | null
  vulnerable_until: string | null
  member_type: 'socio' | 'hijo_socio' | 'profe'
  parent_id?: string | null  // Solo hijo_socio
  has_debt: boolean           // true = bloquea reservas
  extra_high_demand_slots?: number
  school_names?: string[]     // Solo profe
  admin_role?: 'escalerilla' | 'reservas' | 'all' | null
  challenger_challenge?: Challenge | null
  challenged_challenge?: Challenge | null
}
```

### Challenge (estados)
```
pending → accepted → completed
pending → accepted → disputed (admin resuelve)
pending → rejected
pending → cancelled
pending → expired_not_accepted
accepted → expired_not_played
```

### MasterSeason
```ts
{
  status: 'pending' | 'active' | 'semifinals' | 'final' | 'completed'
  category: 'A' | 'B' | 'C' | 'D'
  groups: MasterGroup[]
}
```

---

## Horarios de Canchas

Slots fijos para toda la aplicación:
```ts
['06:00', '07:45', '09:30', '11:15', '13:00', '14:45', '16:30', '18:15', '20:00', '21:45']
```

Alta demanda por temporada:
- **Verano:** `07:45, 09:30, 18:15, 20:00`
- **Invierno:** `09:30, 11:15, 16:30, 18:15`

---

## Categorías de Escalerilla

| Cat | Posiciones | Color |
|-----|-----------|-------|
| A | 1–12 | Oro `#FCD34D` |
| B | 13–24 | Plata `#D1D5DB` |
| C | 25–36 | Bronce `#FBA76F` |
| D | 37–48 | Verde `#8BC234` |

Clases CSS por categoría en `globals.css`: `.cat-letter-{A-D}`, `.cat-num-{A-D}`, `.cat-watermark-{A-D}`, `.cat-divider-{A-D}` (con variantes light/dark).

### Estados en escalerilla (chips, no emojis)
El rediseño reemplazó los emojis por chips (`Ladder.tsx`):
- `chip-info` "Inmune" — inmune 3 días post-victoria
- `chip-warning` "Vulnerable" — vulnerable a desafíos
- `chip-warning` "Esperando" — desafío pendiente
- `chip-success` "Por jugar" — partido aceptado
- `chip-info` "Enviado" — desafío enviado
- `chip-muted` "Sin actividad"

---

## Sistema de Diseño (rediseño 2026)

### Tema claro/oscuro
- Theming por clase: `body.dark`. **Oscuro es el default**; solo es claro si `localStorage.ctg_theme === 'light'`.
- `app/layout.tsx` inyecta un `themeScript` en `<head>` que aplica la clase antes del primer paint (evita FOUC). No mover esa lógica a un componente cliente.
- El toggle de tema vive en el dropdown de cuenta del Header (`ThemeToggleRow`) y persiste en `localStorage.ctg_theme`.

### Convención de colores — IMPORTANTE
Los componentes escriben las clases Tailwind **en hex oscuro hardcodeado** (`bg-[#0a1608]`, `bg-[#0f2211]`, `text-[#F0F7E8]`, `border-[#1e4020]`). El modo claro NO se escribe en los componentes: `globals.css` tiene selectores `body:not(.dark) [class*="bg-[#0a1608]"]` que mapean automáticamente esos hex a equivalentes claros. Al crear UI nueva, usar los mismos hex del sistema y el modo claro sale gratis.

Tokens (también en `tailwind.config.ts` como `dark.*` y `ctg.*`):

| Token | Hex | Uso |
|-------|-----|-----|
| `dark-bg` | `#0a1608` | Fondo de página |
| `dark-surface` | `#0f2211` | Superficie de card |
| `dark-card` | `#152b18` | Card elevada |
| `dark-border` | `#1e4020` | Bordes |
| `ctg-green` | `#8BC234` | Acento único |
| `ctg-lime` | `#9ed944` | Hover |
| `ctg-text` | `#F0F7E8` | Texto en oscuro |
| (light bg) | `#f4f7ee` | Fondo modo claro |

### Clases CSS compartidas (globals.css) — usarlas, no reinventar
- `.card` / `.card-glow` — paneles
- `.btn-primary` / `.btn-ghost` / `.btn-danger` — botones
- `.field` / `.select` / `.label` — formularios
- `.chip` + `.chip-success|warning|danger|info|muted|purple` — badges
- `.glow-green` / `.glow-soft` — text-shadow verde
- `.landing-bg`, `.landing-vignette-1/2` — fondos de landing
- `.scrollbar-hide`, `.no-grain` (desactiva la textura de grano de `body::before`)
- `.font-display` — Bricolage Grotesque (títulos); `font-mono` — JetBrains Mono (scores, números)

### Animaciones Tailwind custom
`animate-fade-in`, `animate-slide-up`, `animate-scale-in`, `animate-glow-pulse`.

### Iconos
SVG inline path-based: cada archivo define un objeto `I = { nombre: 'path...' }` y un componente `Icon`. No hay librería de iconos — seguir ese patrón.

---

## Header

```tsx
<Header onLoginClick={() => setShowLogin(true)} />
```

- La sección activa se deriva de `usePathname()` — el prop `currentPage` quedó **legacy** y se ignora (no pasarlo en código nuevo).
- Estructura: nav primaria de 5 pills (Inicio, Escalerilla, Desafíos, Reservas, Master) → sub-nav contextual para secciones Desafíos y Reservas → bottom tab bar fija en móvil.
- Campana de notificaciones con badge → abre `NotificationsPanel`.
- Dropdown de cuenta: perfil, reservas, historial, links admin según `admin_role`, toggle de tema, logout.

---

## Notificaciones

- `hooks/useNotifications.ts` consume `api.getNotifications()` con **store compartido a nivel de módulo** (mismo patrón que `authCache`): todas las instancias (badge del Header, panel) ven el mismo estado. Polling cada 60s + refetch en evento `auth:login`.
- Interfaz del hook: `{ items, unreadCount, markRead, markAllRead }`. `markRead`/`markAllRead` son optimistas (UI primero, API fire-and-forget).
- Si el backend aún no expone los endpoints, `getNotifications` devuelve `[]` y la UI muestra "Sin notificaciones" — no rompe nada.
- **Contrato backend pendiente de implementar:** ver `docs/backend-notifications.md` (modelo Prisma + 3 endpoints + tabla de eventos que generan cada `NotifType`).
- `NOTIF_META` mapea cada `NotifType` a icono/color/urgencia/confetti. Tipos desconocidos del backend se ignoran silenciosamente.
- El tipo wire es `ApiNotification` (`types/index.ts`); el shape de UI `Notification` (con `time` relativo) vive en el hook.
- `NotificationsPanel.tsx` renderiza el dropdown desde la campana del Header.

---

## Reglas de Código

### Páginas
- Siempre `'use client'` en páginas con estado o hooks.
- Estado local con `useState`/`useEffect` — sin estado global (no Redux, no Zustand, no Context).
- Cada página gestiona su propio loading, error y refetch.

### API calls
- Usar siempre `api.*` de `lib/api.ts`. No hacer `fetch` directo en páginas; si falta un endpoint, agregarlo a `api`.
- Errores: try/catch con toasts (`useToast`). Modales permanecen abiertos en error.
- Refetch manual después de mutaciones — no hay cache automático.

### Tipos
- Definir tipos en `types/index.ts`. No crear tipos inline si ya existen.
- Usar `any` solo cuando el backend no está tipado aún (ej: slots de disponibilidad).

### Fechas
- Importar `toDateStr` desde `@/lib/utils` (genera `YYYY-MM-DD` en zona `America/Santiago`). **No** usar `date.toISOString().split('T')[0]` ni copias locales — tienen bugs de zona horaria.
- Para parsear fechas del backend: `new Date(dateStr + 'T12:00:00')`.

### Nombres de jugadores
- Usar `formatPlayerName(name)` de `lib/formatName.ts` para mostrar nombres (toma primeras 2 palabras + sufijo si aplica).

### Toasts
```ts
const { toasts, removeToast, success, error, warning, info } = useToast();
// En JSX: {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}
```

### Modales
- Patrón: `isOpen: boolean`, `onClose: () => void`, `onSuccess: () => void`.
- Permanecen abiertos en error — no cerrar automáticamente ante errores.
- Visual: fondo `bg-[#0f2211]` / `bg-[#152b18]`, overlay `bg-black/75 backdrop-blur-sm`, `animate-scale-in`.

---

## Flujo de Reserva (3 pasos en `/reservar`)

1. **Cancha** — Grid de canchas o "sin preferencia" (anyCourtMode).
2. **Fecha y hora** — Calendario (solo fechas futuras) + grilla de horarios.
   - Slots pasados se filtran con `isSlotPast(dateStr, slot)`.
   - Alta demanda: indicador 🔥.
   - Modo `anyCourtMode`: un slot está disponible si AL MENOS una cancha lo tiene libre.
3. **Confirmar** — Resumen + selección de compañero o invitado (+$3.000) o escuela (profes).

**Invitado externo:** `has_guest: true` + `guest_name` → cargo adicional de $3.000.
**Profe:** selecciona `school_name` de `player.school_names[]`.
**anyCourtMode:** la cancha se asigna automáticamente al confirmar via `getAutoAssignedCourt(slot)`.

---

## Bloqueos de Canchas (admin)

- Admin crea bloqueos en `/admin-reservas` tab "Reservas": cancha, fecha, horarios y motivo opcional.
- Guardar: `api.saveBlocks({ court_id, date, slots[], reason? })`. Cargar: `api.getBlocks(date)` → array de `{ court_id, time_slot, reason, created_at }`.
- Todos los bloques de una cancha/fecha comparten el mismo motivo (la UI carga `courtBlocks[0]?.reason`).
- En `/fixture-reservas`, un slot bloqueado se detecta con `!s.reservation`. Se muestra `s.block_reason` si existe.

---

## Export Excel/CSV (admin-reservas stats)

- Solo reservas normales (`!r.is_challenge`).
- Separado por canchas: hoja/sección "Cancha 1", hoja/sección "Cancha 2".
- Hoja/sección "Luz" si hay cobro de luz configurado ese mes.
- Librería: `xlsx` (`XLSX.utils.book_append_sheet`, `XLSX.writeFile`). El CSV lleva BOM (`'﻿'`) para compatibilidad con Excel.
- Datos del mes completo: `api.getReservationsByMonth('YYYY-MM')`.

---

## Cobro de Luz (admin)

- Admin configura en `/admin-reservas` qué horarios tienen cobro de luz y el monto por horario.
- `api.getLightConfig(date)` → `{ time_slots: string[], amount_per_slot: number }`.
- `api.saveLightConfig({ date, time_slots[], amount_per_slot })`.
- `api.getLightSummary(month)` → `{ by_day: [...], total_revenue: number }`.
- Se muestra en stats como KPI y en la hoja de export.
