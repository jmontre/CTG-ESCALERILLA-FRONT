# Contrato Backend — Notificaciones

El frontend ya consume estos endpoints (`lib/api.ts` → `getNotifications`, `markNotificationRead`, `markAllNotificationsRead`). Mientras el backend no los implemente, la UI muestra "Sin notificaciones" (fallback a lista vacía). Este documento define lo que hay que construir en NestJS + Prisma.

## Modelo Prisma

```prisma
model Notification {
  id           String   @id @default(uuid())
  player_id    String
  type         String   // ver lista de tipos abajo
  title        String
  body         String
  read         Boolean  @default(false)
  action_label String?  // ej: "Responder"
  action_path  String?  // ruta del frontend, ej: "/fixture"
  created_at   DateTime @default(now())

  player Player @relation(fields: [player_id], references: [id], onDelete: Cascade)

  @@index([player_id, read])
  @@index([player_id, created_at])
}
```

## Endpoints (todos con JWT guard, scoped al jugador del token)

### `GET /notifications`
Devuelve las notificaciones del jugador autenticado, más recientes primero (limitar a ~50).

```json
[
  {
    "id": "uuid",
    "type": "challenge_received",
    "read": false,
    "title": "¡Tienes un desafío!",
    "body": "Joaquín Vergara te desafió. Tienes 72h para responder.",
    "created_at": "2026-06-11T14:30:00.000Z",
    "action_label": "Responder",
    "action_path": "/fixture"
  }
]
```

Notas:
- `created_at` en ISO 8601 — el frontend calcula el texto relativo ("hace 2 horas").
- `action_label`/`action_path` son opcionales (pueden ser `null`).
- Tipos desconocidos para el frontend se ignoran silenciosamente, así que el backend puede agregar tipos nuevos sin coordinar deploy.

### `POST /notifications/:id/read`
Marca una notificación como leída. Responder `{ "message": "ok" }` (cualquier JSON sirve). Debe validar que la notificación pertenezca al jugador del token.

### `POST /notifications/read-all`
Marca todas las del jugador como leídas. Responder `{ "message": "ok" }`.

## Tipos de notificación y cuándo crearlas

El frontend reconoce estos `type` (en `hooks/useNotifications.ts` → `NOTIF_META`). Sugerencia de wiring por evento del backend:

| `type` | Crear cuando... | Destinatario |
|--------|----------------|--------------|
| `challenge_received` | `POST /challenges` | desafiado |
| `challenge_accepted` | `POST /challenges/:id/accept` | desafiante |
| `challenge_rejected` | `POST /challenges/:id/reject` | desafiante |
| `challenge_expiring` | cron: faltan <24h del deadline | ambos |
| `result_submitted` | un jugador envía resultado | el otro jugador |
| `result_confirmed` | resultados coinciden → completed | ambos |
| `reservation_done` | `POST /reservations` | quien reserva |
| `reservation_cancelled` | cancelación (propia o admin) | quien reservó |
| `reservation_modified` | `PATCH /reservations/:id/modify` | quien reservó |
| `position_up` / `position_down` | cambio de posición tras partido o move admin | jugador afectado |
| `category_promoted` | cruce de límite de categoría (12/24/36) | jugador |
| `match_reminder` | cron: partido aceptado sin fecha o fecha próxima | ambos |
| `season_ending` / `season_winner` | eventos de temporada | todos / ganador |
| `master_*` | eventos del torneo Master | según caso |

Los demás tipos (`streak`, `achievement`, `personal_record`, `challenge_suggestion`, `court_available`, `master_news`, `rival_played`) son opcionales — implementar cuando exista la lógica correspondiente.

## Prioridad mínima viable

Para que la campana sea útil desde el día uno basta con: `challenge_received`, `challenge_accepted`, `challenge_rejected`, `result_submitted`, `result_confirmed`. Todas se generan en endpoints que ya existen — es agregar un `prisma.notification.create()` en cada service.
