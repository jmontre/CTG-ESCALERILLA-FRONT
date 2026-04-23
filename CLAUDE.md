# CTG Escalerilla - Frontend

Sistema de escalerilla (ladder), reserva de canchas y torneo Master para el **Club de Tenis Graneros (CTG)**.

## Stack Tecnológico

- **Framework:** Next.js 16.1.6 (App Router)
- **React:** 19.2.3
- **TypeScript:** 5
- **CSS:** Tailwind CSS 3.4.17 (utility-first, sin CSS Modules)
- **Build:** SWC (incluido en Next.js)

## Comandos

```bash
npm run dev     # Desarrollo (puerto 3000 por defecto)
npm run build   # Build de producción
npm run start   # Servidor de producción
npm run lint    # ESLint
```

## Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3000   # URL del backend NestJS
NEXT_PUBLIC_WORDPRESS_URL=https://clubdetenisgraneros.cl
```

Archivos de entorno ignorados por git: `.env.local`, `.env.development`, `.env.production`.

## Estructura del Proyecto

```
frontend/
├── app/                              # Páginas (Next.js App Router)
│   ├── layout.tsx                   # Layout raíz — fonts, metadata, Footer
│   ├── page.tsx                     # / → Landing page (hero + accesos rápidos)
│   ├── home/page.tsx                # /home → Alias de la landing
│   ├── escalerilla/page.tsx         # /escalerilla → Escalerilla con categorías
│   ├── fixture/page.tsx             # /fixture → Mis desafíos (auth)
│   ├── fixture-publico/page.tsx     # /fixture-publico → Todos los desafíos (public)
│   ├── fixture-reservas/page.tsx    # /fixture-reservas → Fixture + reservas (auth)
│   ├── historial/page.tsx           # /historial → Historial de partidos (auth)
│   ├── reservar/page.tsx            # /reservar → Reserva de canchas 3 pasos (auth)
│   ├── mis-reservas/page.tsx        # /mis-reservas → Mis reservas (auth)
│   ├── perfil/page.tsx              # /perfil → Perfil + avatar del jugador (auth)
│   ├── master/page.tsx              # /master → Torneo Master (auth, con posición)
│   ├── reset-password/page.tsx      # /reset-password?token=… → Reset de contraseña
│   ├── admin/page.tsx               # /admin → Panel admin escalerilla
│   ├── admin-reservas/page.tsx      # /admin-reservas → Panel admin reservas
│   ├── globals.css
│   └── favicon.ico
├── components/                       # Componentes React
│   ├── Header.tsx                   # Navbar responsive con navegación
│   ├── Footer.tsx                   # Footer con links al club
│   ├── Ladder.tsx                   # Escalerilla con categorías (A/B/C/D)
│   ├── LoginModal.tsx               # Modal login + registro
│   ├── ChallengeModal.tsx           # Confirmación de desafío
│   ├── ChallengesList.tsx           # Lista de desafíos activos
│   ├── PlayerModal.tsx              # Detalle de jugador
│   ├── PlayerCard.tsx               # Tarjeta individual de jugador
│   ├── ResultModal.tsx              # Envío de resultados (~518 líneas)
│   ├── ModifyReservationModal.tsx   # Modificar reserva existente
│   ├── ScheduleDateModal.tsx        # Fijar fecha de partido de desafío
│   ├── Toast.tsx                    # Notificaciones toast
│   └── admin/
│       ├── AddPlayerModal.tsx
│       ├── EditPlayerModal.tsx
│       ├── EditUserModal.tsx        # Editar usuario (credenciales, rol admin)
│       └── ChallengeManagementModal.tsx
├── hooks/
│   ├── useAuth.ts                   # Auth: JWT en localStorage, cache en memoria, timer inactividad (5 min)
│   └── useToast.ts                  # Gestión de notificaciones toast
├── lib/
│   ├── api.ts                       # Cliente API único (fetch nativo, todos los endpoints)
│   └── formatName.ts                # Formateador de nombres de jugadores
├── types/
│   └── index.ts                     # Tipos TypeScript compartidos
└── public/images/                   # Logos y favicons
```

## Rutas y Autenticación

| Ruta | Descripción | Auth |
|------|-------------|------|
| `/` | Landing (hero + accesos) | No |
| `/escalerilla` | Escalerilla principal | No |
| `/fixture` | Mis desafíos | Sí (jugador) |
| `/fixture-publico` | Ver todos los desafíos | No |
| `/fixture-reservas` | Desafíos + reservas | Sí (jugador) |
| `/historial` | Historial de partidos | Sí (jugador) |
| `/reservar` | Reservar cancha (3 pasos) | Sí (jugador) |
| `/mis-reservas` | Mis reservas activas e historial | Sí (jugador) |
| `/perfil` | Perfil y avatar | Sí (jugador) |
| `/master` | Torneo Master (grupos + playoff) | Sí (jugador con posición) |
| `/reset-password` | Resetear contraseña (vía token email) | No |
| `/admin` | Panel admin escalerilla | Sí (admin) |
| `/admin-reservas` | Panel admin reservas + temporada | Sí (admin) |

**Niveles de acceso:** Sin auth → Jugador autenticado → Admin.  
**`admin_role`:** `'escalerilla' | 'reservas' | 'all' | null` — permite acceso granular por módulo.

## Autenticación

- Token JWT en `localStorage` (`auth_token`).
- Validación vía `GET /auth/me`.
- Hook `useAuth` gestiona estado con cache en memoria para evitar flickering.
- Timer de inactividad: logout automático a los 5 minutos sin actividad.
- `refreshPlayer()` disponible para re-fetch después de mutaciones.

## API Backend

**Base URL:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`).  
**Cliente:** `lib/api.ts` — objeto `api` con todas las funciones usando `fetch` nativo y Bearer token.

### Endpoints

**Auth**
```
POST /auth/login
POST /auth/register
GET  /auth/me
POST /auth/forgot-password
POST /auth/reset-password
```

**Players**
```
GET  /players
GET  /players/:id
GET  /players/user/:userId
PUT  /players/me                     # Actualizar perfil (nombre, teléfono, contraseña)
POST /players/me/avatar              # Subir avatar (base64)
DEL  /players/me/avatar              # Eliminar avatar
```

**Admin Players**
```
POST /admin/players
PUT  /admin/players/:id
DEL  /admin/players/:id
POST /admin/players/:id/move
POST /admin/players/:id/reset-immunity
POST /admin/players/:id/reset-vulnerability
```

**Challenges**
```
GET  /challenges
POST /challenges
POST /challenges/:id/accept
POST /challenges/:id/reject
POST /challenges/:id/result
POST /challenges/:id/schedule        # Fijar fecha (scheduled_date + court_id)
```

**Admin Challenges**
```
POST /admin/challenges/:id/resolve
DEL  /admin/challenges/:id
DEL  /admin/challenges/:id/force
POST /admin/challenges/:id/extend
```

**Master**
```
GET  /master                         # Todas las temporadas activas
GET  /master/:category               # Temporada por categoría (A/B/C/D)
```

**Reservations**
```
GET  /reservations/courts
GET  /reservations/season
GET  /reservations/availability?date=
GET  /reservations/my
GET  /reservations/player/:playerId
GET  /reservations?date=
GET  /reservations/stats?month=
POST /reservations
DEL  /reservations/:id               # Cancelar (jugador)
PATCH /reservations/:id/modify       # Modificar reserva existente
```

**Admin Reservations**
```
POST /reservations/season            # Cambiar temporada (verano/invierno)
DEL  /reservations/:id/admin         # Cancelar con motivo
```

## Modelo de Datos Clave

### Player
```ts
{
  position?: number | null            // 0 = inactivo, >0 = en escalerilla
  member_type: 'socio' | 'hijo_socio' | 'profe'
  school_names?: string[]             // Solo para profes
  extra_high_demand_slots?: number    // Slots adicionales de alta demanda
  avatar_url?: string | null
  immune_until: string | null         // Protegido de ser desafiado
  vulnerable_until: string | null     // No puede desafiar
  has_debt: boolean                   // Bloquea reservas
  challenger_challenge?: Challenge    // Desafío activo como retador
  challenged_challenge?: Challenge    // Desafío activo como retado
}
```

### User
```ts
{
  is_admin: boolean
  admin_role: 'escalerilla' | 'reservas' | 'all' | null
}
```

### Challenge (estados)
```
pending → accepted → completed | disputed (admin resuelve)
pending → rejected | cancelled | expired_not_accepted
accepted → expired_not_played
```

### MasterSeason (Torneo Master)
```ts
{
  status: 'pending' | 'active' | 'semifinals' | 'final' | 'completed'
  category: string    // A, B, C, D
  groups: MasterGroup[]
}
```

## Categorías de la Escalerilla

| Cat | Posiciones | Color |
|-----|-----------|-------|
| A   | 1–12      | Oro (yellow) |
| B   | 13–24     | Plata (gray) |
| C   | 25–36     | Bronce (orange) |
| D   | 37–48     | Verde (green) |

## Emojis de Estado (Escalerilla)

- ⏰ Desafío pendiente recibido
- 🎾 Partido aceptado, por jugar
- 📤 Desafío enviado, esperando respuesta
- 🛡️ Jugador inmune
- ⚠️ Jugador vulnerable

## Estilos y Colores

Tailwind custom en `tailwind.config.ts`:
```
ctg-green:  #8BC234  (primario — pelota)
ctg-dark:   #2D5016  (verde oscuro)
ctg-forest: #1e4620  (muy oscuro, headers)
ctg-light:  #d4e9b8  (verde claro, backgrounds)
ctg-lime:   #9ed944  (hover)
club-primary:   #1e5128
club-secondary: #4e9f3d
club-accent:    #95d5b2
club-bg:        #d8f3dc  (fondo general del body)
```

Animaciones custom: `fade-in`, `slide-up`, `scale-in`.

## Patrones y Estado

- **Sin estado global** (no Redux/Zustand/Context). Cada página gestiona su propio estado con `useState`/`useEffect`.
- **Data fetching:** `fetch` nativo directo, sin caching. Refetch manual después de mutaciones.
- **Responsive:** Mobile-first con breakpoints `md:`.
- **Errores:** Try/catch con toasts. Modales permanecen abiertos en error para reintentar.
- **Temporadas:** Admin configura verano/invierno desde `/admin-reservas`; afecta horarios de alta demanda.

## Flujo de Reserva (3 pasos en `/reservar`)

1. **Cancha:** Grid de canchas disponibles
2. **Fecha y hora:** Calendario (solo fechas futuras) + grilla de horarios con indicador de alta demanda (🔥)
3. **Confirmación:** Resumen + opción invitado (+$3.000) + login si no autenticado
