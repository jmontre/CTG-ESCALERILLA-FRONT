# CTG Escalerilla — Frontend

Sistema de escalerilla, reserva de canchas y torneo Master para el **Club de Tenis Graneros (CTG)**.

---

## Stack Tecnológico

| Tecnología | Versión |
|-----------|---------|
| Next.js (App Router) | 16.1.6 |
| React | 19.2.3 |
| TypeScript | ^5 |
| Tailwind CSS | ^3.4.17 |
| xlsx (export Excel) | ^0.18.5 |
| Build | SWC (incluido en Next.js) |

---

## Comandos

```bash
npm run dev     # Desarrollo (puerto 3000)
npm run build   # Build de producción
npm run start   # Servidor de producción
npm run lint    # ESLint
```

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

```bash
# Workflow estándar
git checkout dev
git pull
git checkout -b feature/mi-feature
# ... trabajo ...
git push -u origin feature/mi-feature
# Crear PR de feature/mi-feature → dev en GitHub
# Cuando dev está listo → PR de dev → main
```

---

## Estructura del Proyecto

```
frontend/
├── app/                              # Páginas (Next.js App Router)
│   ├── layout.tsx                   # Layout raíz: fonts Geist, metadata, Footer
│   ├── page.tsx                     # / → Landing page
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
│   └── globals.css                  # Solo @tailwind base/components/utilities
├── components/
│   ├── Header.tsx                   # Navbar con dropdowns y auth
│   ├── Footer.tsx                   # Footer con links
│   ├── Ladder.tsx                   # Escalerilla categorías A/B/C/D
│   ├── LoginModal.tsx               # Login + olvidé contraseña
│   ├── ChallengeModal.tsx           # Confirmación de desafío
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
│   └── useToast.ts                  # Gestión de toasts
├── lib/
│   ├── api.ts                       # Cliente API único (objeto `api` con todos los endpoints)
│   └── formatName.ts                # `formatPlayerName()` — toma 2 palabras + sufijos
├── types/
│   └── index.ts                     # Todos los tipos TypeScript del proyecto
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

---

## Autenticación — `useAuth`

```ts
const { user, player, loading, login, logout, refreshPlayer } = useAuth();
```

- Token JWT en `localStorage` key `auth_token`.
- Cache en memoria (`authCache`) para evitar flickering — no tocar directamente.
- Validación vía `GET /auth/me`.
- Timer de inactividad: logout automático a los **5 minutos** sin actividad del usuario (mousemove, keydown, click, scroll, touchstart).
- `refreshPlayer()` — llamar después de cualquier mutación que cambie datos del jugador en el backend.

**Patrón de protección de página:**
```ts
useEffect(() => {
  if (!authLoading && !player) router.push('/');
}, [player, authLoading]);
```

---

## API Backend

**Base URL:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`).

### Usar siempre `api.*` de `lib/api.ts`

Todas las llamadas al backend deben ir por el objeto `api` exportado en `lib/api.ts`. Solo en `admin-reservas/page.tsx` se usan `fetch` directo para endpoints no incluidos en `api`:

| Endpoint directo | Descripción |
|-----------------|-------------|
| `GET /reservations/blocks?date=` | Bloqueos por fecha |
| `POST /reservations/blocks` | Guardar bloqueos (court_id, date, slots[], reason?) |
| `GET /reservations/light-config?date=` | Cobro de luz por fecha |
| `POST /reservations/light-config` | Guardar cobro de luz |
| `GET /reservations/light-summary?month=` | Resumen cobro luz del mes |
| `GET /admin/players/all` | Todos los jugadores (incluye sin posición) |
| `GET /reservations?month=` | Reservas del mes completo (para export) |

### Endpoints en `api.*`

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
GET  /reservations/stats?month=   api.getStats(month?)
POST /reservations                api.createReservation(data)
DEL  /reservations/:id            api.cancelReservation(id)
PATCH /reservations/:id/modify    api.modifyReservation(id, data)
DEL  /reservations/:id/admin      api.adminCancelReservation(id, reason?)
POST /reservations/season         api.adminSetSeason(season)
```

**Master**
```
GET  /master                     api.getMaster()
GET  /master/:category           api.getMasterCategory(category)
```

---

## Modelo de Datos

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

### Player
```ts
{
  id: string
  name: string
  email: string
  phone?: string
  avatar_url?: string | null
  position?: number | null   // null o 0 = sin escalerilla; >0 = posición activa
  wins: number
  losses: number
  total_matches: number
  immune_until: string | null
  vulnerable_until: string | null
  member_type: 'socio' | 'hijo_socio' | 'profe'
  parent_id?: string | null  // Solo hijo_socio
  has_debt: boolean           // true = bloquea reservas
  extra_high_demand_slots?: number
  school_names?: string[]     // Solo profe
  is_admin?: boolean
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

| Cat | Posiciones | Color Tailwind |
|-----|-----------|----------------|
| A | 1–12 | Oro (yellow) |
| B | 13–24 | Plata (gray) |
| C | 25–36 | Bronce (orange) |
| D | 37–48 | Verde (green) |

### Emojis de estado en escalerilla
- ⏰ Desafío pendiente recibido
- 🎾 Partido aceptado, por jugar
- 📤 Desafío enviado, esperando respuesta
- 🛡️ Jugador inmune
- ⚠️ Jugador vulnerable

---

## Estilos y Colores

Tailwind custom en `tailwind.config.ts`:

```ts
ctg-green:  '#8BC234'   // Principal — pelota
ctg-dark:   '#2D5016'   // Verde oscuro
ctg-forest: '#1e4620'   // Muy oscuro, headers
ctg-light:  '#d4e9b8'   // Verde claro, backgrounds
ctg-lime:   '#9ed944'   // Hover
club-primary:   '#1e5128'
club-secondary: '#4e9f3d'
club-accent:    '#95d5b2'
club-dark:      '#081c15'
club-bg:        '#d8f3dc'   // Fondo general del body
```

Sombras custom: `shadow-soft`, `shadow-card`, `shadow-hover`.

Animaciones custom: `animate-fade-in`, `animate-slide-up`, `animate-scale-in`.

Fuente: `Geist` (sans) + `Geist_Mono` — cargadas en `layout.tsx`.

---

## Reglas de Código

### Páginas
- Siempre `'use client'` en páginas con estado o hooks.
- Estado local con `useState`/`useEffect` — sin estado global (no Redux, no Zustand, no Context).
- Cada página gestiona su propio loading, error y refetch.
- Siempre pasarle a `<Header>` el `currentPage` correcto y `onLoginClick` que abra `<LoginModal>`.

### API calls
- Usar siempre `api.*` de `lib/api.ts`. No hacer `fetch` directo en páginas excepto para los endpoints que no están en `api` (ver tabla arriba).
- Errores: try/catch con toasts (`useToast`). Modales permanecen abiertos en error.
- Refetch manual después de mutaciones — no hay cache automático.

### Tipos
- Definir tipos en `types/index.ts`. No crear tipos inline si ya existen.
- Usar `any` solo cuando el backend no está tipado aún (ej: slots de disponibilidad).

### Nombres
- Archivos de página: `page.tsx` (Next.js App Router).
- Componentes: PascalCase (`LoginModal.tsx`).
- Hooks: camelCase con prefijo `use` (`useAuth.ts`).
- Helpers: camelCase (`formatName.ts`).

### Fechas
- Usar el patrón local `toDateStr(date: Date): string` que genera `YYYY-MM-DD` (presente en múltiples páginas). No usar `date.toISOString().split('T')[0]` porque tiene bugs de zona horaria. Usar `new Date(dateStr + 'T12:00:00')` para parsear fechas del backend.

### Nombres de jugadores
- Usar `formatPlayerName(name)` de `lib/formatName.ts` para mostrar nombres (toma primeras 2 palabras + sufijo si aplica).

### Toasts
```ts
const { success, error, warning, info } = useToast();
// En JSX, renderizar: {toasts.map(t => <Toast key={t.id} ...t onClose={() => removeToast(t.id)} />)}
```

### Header
```tsx
<Header currentPage="reservar" onLoginClick={() => setShowLogin(true)} />
// currentPage type: 'home' | 'escalerilla' | 'fixture' | 'historial' | 'partidos' | 
//   'admin' | 'perfil' | 'master' | 'reservar' | 'mis-reservas' | 'fixture-reservas' | 'admin-reservas'
```

### Modales
- Patrón: `isOpen: boolean`, `onClose: () => void`, `onSuccess: () => void`.
- Permanecen abiertos en error — no cerrar automáticamente ante errores.

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

- Admin crea bloqueos en `/admin-reservas` tab "Reservas": selecciona cancha, fecha, horarios y motivo opcional.
- Se guardan con `POST /reservations/blocks` → body: `{ court_id, date, slots[], reason? }`.
- Se cargan con `GET /reservations/blocks?date=` → array de `{ court_id, time_slot, reason, created_at }`.
- En la UI, `loadBlocks` carga el reason del primer bloque (`courtBlocks[0]?.reason`) — todos los bloques de una cancha/fecha comparten el mismo motivo.
- En `/fixture-reservas`, un slot bloqueado se detecta con `!s.reservation` (sin reserva asignada). Se muestra `s.block_reason` si existe.

---

## Export Excel/CSV (admin-reservas stats)

- Solo reservas normales (`!r.is_challenge`).
- Separado por canchas: hoja/sección "Cancha 1", hoja/sección "Cancha 2".
- Hoja/sección "Luz" si hay cobro de luz configurado ese mes.
- Librería: `xlsx` (`XLSX.utils.book_append_sheet`, `XLSX.writeFile`).
- El CSV usa `'﻿'` (BOM) para compatibilidad con Excel.
- Endpoint: `GET /reservations?month=YYYY-MM` para obtener todas las reservas del mes.

---

## Cobro de Luz (admin)

- Admin configura en `/admin-reservas` qué horarios tienen cobro de luz y el monto por horario.
- `GET /reservations/light-config?date=` → `{ time_slots: string[], amount_per_slot: number }`.
- `POST /reservations/light-config` → body: `{ date, time_slots[], amount_per_slot }`.
- `GET /reservations/light-summary?month=` → `{ by_day: [...], total_revenue: number }`.
- Se muestra en stats como KPI y en la hoja de export.
