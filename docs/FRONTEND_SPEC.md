# Klupni MVP — Especificación Frontend

Este documento describe todo lo necesario para desarrollar el frontend web de Klupni, una aplicación para la creación y organización de actividades grupales deportivas. El backend está implementado en NestJS y expone una API REST documentada aquí.

---

## 1. Visión general de la app

**Klupni** permite a los usuarios:

- **Registrarse** y verificar su email
- **Completar su perfil** (nombre, apellido, username, avatar)
- **Crear actividades** deportivas (fútbol, tenis, running, etc.) con fecha, lugar, cupos mínimos/máximos
- **Participar** en actividades: como host (creador) o como participante
- **Invitar** a otros usuarios registrados o a contactos externos (personas sin cuenta en la app) con email
- **Agregar participantes “libres”** manualmente (solo alias, sin user ni external contact)
- **Gestionar participantes**: cambiar roles, eliminar, abandonar actividad
- **Gestionar contactos externos** (crear, editar) para usar en invitaciones
- **Aceptar invitaciones** mediante un link (email) — flujo público sin autenticación

---

## 2. Stack recomendado

| Tecnología | Recomendación |
|------------|---------------|
| **Framework** | React 18+ |
| **Lenguaje** | TypeScript |
| **Build** | Vite |
| **Routing** | React Router v6 |
| **Estado global** | React Query (TanStack Query) para API |
| **Estado local** | useState / useReducer |
| **Formularios** | React Hook Form + Zod (o similar) |
| **HTTP** | fetch (nativo) o axios |
| **Estilos** | Tailwind CSS o CSS Modules |
| **UI** | A definir por el diseñador (shadcn/ui, Radix, etc.) |

**Principios**:

- Arquitectura modular y limpia
- Buenas prácticas sin over-engineering
- MVP sólido para extensibilidad futura
- Responsive web

---

## 3. API — Configuración base

### Paginación

Los listados devuelven `{ data: T[], meta: { total, page, limit, totalPages } }`.

Query params opcionales: `page` (default: 1), `limit` (default: 10, max: 100).

---

| Concepto | Valor |
|---------|-------|
| **Base URL** | `http://localhost:3000/api` (desarrollo) |
| **Prefijo global** | `/api` |
| **CORS** | Habilitado con `credentials: true` |
| **Content-Type** | `application/json` |

### Autenticación

- **JWT**: el access token se envía en el header `Authorization: Bearer <accessToken>`.
- **Refresh token**: se guarda en una cookie HttpOnly `refresh_token` (SameSite=strict, path=/).
- **Cada petición autenticada** debe incluir `credentials: 'include'` si usas fetch, para que el navegador envíe las cookies.

### Respuestas de error

Todas las respuestas de error siguen este formato:

```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "error": "Bad Request",
  "timestamp": "2026-02-23T12:00:00.000Z",
  "path": "/api/activities"
}
```

- **401**: No autenticado o token inválido/expirado.
- **403**: No autorizado (ej. no eres host).
- **404**: Recurso no encontrado.
- **409**: Conflicto (ej. email ya registrado).

---

## 4. Endpoints públicos (sin autenticación)

### `POST /api/auth/register`

Registra un usuario.

**Request:** `{ email: string, password: string }`  
- `password`: mínimo 8 caracteres.

**Response 201:** `{ id: string, email: string, message: string }`

---

### `GET /api/auth/verify-email?token=<token>`

Verifica el email tras registro. El token se obtiene del link enviado por email.

**Response 200:** `{ message: string }`

---

### `POST /api/auth/resend-verification`

Reenvía el email de verificación. **Público**.

**Request:** `{ email: string }`

**Response 200:** `{ message: string }` (mensaje genérico para evitar enumeración de emails)  
**Response 400:** si el email ya está verificado.

---

### `POST /api/auth/forgot-password`

Solicita el envío de un email para restablecer la contraseña. **Público**.

**Request:** `{ email: string }`

**Response 200:** `{ message: string }` (mensaje genérico para evitar enumeración).  
Solo envía email si la cuenta existe y está verificada. El link apunta a `FRONTEND_URL/reset-password?token=xxx`. Token válido 1 hora.

---

### `POST /api/auth/reset-password`

Restablece la contraseña usando el token del email. **Público**.

**Request:** `{ token: string, password: string }` (password mínimo 8 caracteres)

**Response 200:** `{ message: 'Password has been reset successfully' }`  
**Response 400:** token inválido, expirado o ya usado.

---

### `POST /api/auth/login`

Inicia sesión. El email debe estar verificado.

**Request:** `{ email: string, password: string }`

**Response 200:** `{ accessToken: string, user: { id: string, email: string, emailVerifiedAt: string } }`  
El servidor envía la cookie `refresh_token` en la respuesta.

---

### `POST /api/auth/refresh`

Refresca el access token usando la cookie `refresh_token` (sin body).

**Response 200:** `{ accessToken: string }`

---

### `GET /api/invitations/preview?token=<token>`

Vista previa de una invitación sin aceptarla. **Público**. Útil para mostrar "Te invitaron a X por Y" antes del botón Aceptar.

**Response 200:** `{ activity: { id, title, startAt, endAt, locationText, sportName, status } | null, inviter: { displayName, email }, status: string, expiresAt: string, canAccept: boolean }`  
- `canAccept`: true solo si status es `pending`, no expirada y la actividad está `open`.

**Response 400:** token inválido.

---

### `POST /api/invitations/accept?token=<token>`

Acepta una invitación. Usado desde el link del email. **Público**.

**Response 200:** `{ message: string, activity: { id: string, title: string, startAt: string, locationText: string | null } }`

---

## 5. Endpoints autenticados

### Auth

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/logout` | Cierra sesión (limpia cookie refresh). |

---

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/users/me` | Info básica del usuario. |
| `GET` | `/api/users/profile` | Perfil completo del usuario autenticado. |
| `PATCH` | `/api/users/profile` | Actualizar perfil (onboarding). |
| `GET` | `/api/users/check-username` | Verificar si un username está disponible. |
| `GET` | `/api/users/search` | Buscar usuarios por email o username (para invitar). |
| `GET` | `/api/users/:userId/profile` | Perfil público de otro usuario. |

**`GET /api/users/check-username`** (público)  
Query params: `username` (requerido), `excludeUserId` (opcional, para excluir al editar perfil).  
Response: `{ available: boolean }`  
Response 400: si el username no cumple formato (3-30 chars, alfanumérico + guión bajo).

**`GET /api/users/search`** (requiere auth)  
Query params: `q` (requerido, min 2 caracteres). Busca por email o username (parcial, case-insensitive).  
Response: `[{ id, email, firstName, lastName, username }]` (máx. 20 resultados). Excluye usuarios no verificados y al usuario actual.

**`GET /api/users/me`**  
Response: `{ id, email, emailVerifiedAt, createdAt, profileId }`

**`GET /api/users/profile`**  
Response: `{ id, userId, firstName, lastName, username, avatarUrl, createdAt, updatedAt }`

**`PATCH /api/users/profile`**  
Request (todos opcionales): `{ firstName?, lastName?, username?, avatarUrl? }`  
- `username`: 3–30 chars, alfanumérico + guión bajo.  
- `avatarUrl`: URL válida, max 500 chars.

**`GET /api/users/:userId/profile`**  
Response: `{ id, userId, firstName, lastName, username, avatarUrl }` (sin timestamps).

---

### Actividades

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/activities` | Crear actividad. |
| `GET` | `/api/activities` | Listar actividades. |
| `GET` | `/api/activities/:id` | Detalle de actividad. |
| `PATCH` | `/api/activities/:id` | Actualizar (solo host). |
| `DELETE` | `/api/activities/:id` | Soft delete (solo host). |
| `GET` | `/api/activities/:id/participants` | Listar participantes. |

**`POST /api/activities`**  
Request:
```json
{
  "title": "string (1-100)",
  "description": "string (opcional, max 500)",
  "startAt": "ISO 8601 (futuro)",
  "endAt": "ISO 8601 (opcional, > startAt)",
  "sportName": "string (opcional, max 50)",
  "locationText": "string (opcional, max 200)",
  "maxParticipants": "number (2-100)",
  "minParticipants": "number (1-100, ≤ maxParticipants)"
}
```
Response: actividad completa con `activityOpen`.

**`GET /api/activities`**  
Query params:
- `type`: `'all'` \| `'created'` \| `'participating'` (default: `all`)
- `time`: `'upcoming'` \| `'past'` \| `'all'` (default: `upcoming`)
- `page`, `limit` (paginación)

Response: `{ data: [...], meta: { total, page, limit, totalPages } }`

**`GET /api/activities/:id`**  
Response: `{ id, title, description, startAt, endAt, status, createdAt, updatedAt, activityOpen, participants }`  
`participants`: `{ id, role, joinedAt, user?: { userId, email }, externalContact?: { externalContactId } }`

**`GET /api/activities/:id/participants`**  
Query params: `status`, `page`, `limit`

Response: `{ data: [...], meta: { total, page, limit, totalPages } }` donde cada item es:
```json
{
  "type": "user" | "external_contact" | "free" | "invited",
  "participationId": "string | null",
  "invitationId": "string | null",
  "role": "string | null",
  "status": "string",
  "displayName": "string | null",
  "avatarUrl": "string | null",
  "userId": "string | null",
  "externalContactId": "string | null"
}
```
Usar `userId` para `GET /api/users/:userId/profile` y `externalContactId` para `GET /api/external-contacts/:id`.

---

### Participaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/activities/:activityId/participations/free` | Agregar participante libre. |
| `PATCH` | `/api/activities/:activityId/participations/:participationId/role` | Cambiar rol. |
| `PATCH` | `/api/activities/:activityId/participations/:participationId/remove` | Eliminar participante. |
| `DELETE` | `/api/activities/:activityId/participations/me` | Abandonar actividad. |

**`POST .../participations/free`**  
Request: `{ alias: string (1-100) }`  
Response: `{ id, activityId, alias, role, status, joinedAt, createdAt }`

**`PATCH .../participations/:id/role`**  
Request: `{ role: 'host' | 'participant' }`  
- Solo usuarios registrados pueden ser host. External contacts y participantes libres no.

**`PATCH .../participations/:id/remove`**  
Response: `{ message: 'Participant removed successfully' }`  
- No se puede eliminar a otro host sin antes degradarlo a participante.

**`DELETE .../participations/me`**  
Response: `{ message: 'You have left the activity' }`  
- Solo si no eres el único host.

---

### External contacts

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/external-contacts` | Listar contactos del usuario. |
| `POST` | `/api/external-contacts` | Crear contacto. |
| `GET` | `/api/external-contacts/:id` | Obtener contacto. |
| `PATCH` | `/api/external-contacts/:id` | Actualizar (solo propietario). |
| `DELETE` | `/api/external-contacts/:id` | Eliminar (soft delete, solo propietario). |

**`GET /api/external-contacts`**  
Query params: `page`, `limit`  
Response: `{ data: [...], meta: { total, page, limit, totalPages } }`

**`POST /api/external-contacts`**  
Request: `{ alias: string (1-100), email?: string, phoneNumber?: string (max 30) }`  
Response: `{ id, alias, email, phoneNumber, createdAt }`

**`GET /api/external-contacts/:id`**  
Response: `{ id, alias, email, phoneNumber, createdAt, updatedAt }`

**`PATCH /api/external-contacts/:id`**  
Request (todos opcionales): `{ alias?, email?, phoneNumber? }`

**`DELETE /api/external-contacts/:id`**  
Response: `{ message: 'External contact deleted successfully' }`

---

### Invitaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/activities/:activityId/invitations` | Enviar invitación (uno). |
| `POST` | `/api/activities/:activityId/invitations/batch` | Enviar invitaciones en batch. |
| `GET` | `/api/activities/:activityId/invitations` | Listar invitaciones (solo host). |
| `POST` | `/api/activities/:activityId/invitations/:invitationId/cancel` | Cancelar invitación. |
| `GET` | `/api/invitations/received` | Listar invitaciones recibidas por el usuario. |

**`POST .../invitations`**  
Request: exactamente uno de `{ userId?: string }` o `{ externalContactId?: string }` (UUID).  
- `externalContactId` debe ser del propietario y tener email.  
Response: `{ id, email, userId, externalContactId, status, expiresAt }`

**`POST .../invitations/batch`**  
Request: `{ userIds?: string[], externalContactIds?: string[] }`  
- Al menos uno de los arrays debe ser no vacío. Máx. 50 por array, 50 en total.  
- Puede combinar usuarios y contactos externos en la misma petición.  
Response: `{ created: [{ id, email, userId?, externalContactId?, status, expiresAt }], failed: [{ userId?, externalContactId?, reason }], message }`  
- Los targets inválidos (ya participante, invitación pendiente, sin email, etc.) se omiten y aparecen en `failed`.

**`GET .../invitations`**  
Query params: `page`, `limit`  
Response: `{ data: [...], meta: { total, page, limit, totalPages } }`

**`POST .../invitations/:id/cancel`**  
Response: `{ message: 'Invitation cancelled' }`  
- Solo invitaciones pendientes.

**`GET /api/invitations/received`** (requiere auth)  
Query params: `status` (`pending` \| `accepted` \| `past` \| `expired` \| `all`, default: `all`), `page`, `limit`  
Response: `{ data: [{ id, token, status, createdAt, expiresAt, respondedAt, activity: {...}, inviter: { userId, email, displayName } }], meta: { total, page, limit, totalPages } }`  
- `past`: invitaciones de actividades ya realizadas (historial).

---

## 6. Flujos de usuario principales

### Registro y onboarding

1. Registro → `POST /api/auth/register`
2. Usuario recibe email con link de verificación
3. Si no llega el email: `POST /api/auth/resend-verification` con `{ email }`
4. Usuario hace clic en link → `GET /api/auth/verify-email?token=...`
5. Login → `POST /api/auth/login`
6. Completar perfil → `PATCH /api/users/profile` (firstName, lastName, username, avatarUrl)

### Crear actividad

1. Login
2. `POST /api/activities` con datos
3. Usuario autenticado queda como host automáticamente

### Invitar a una actividad

1. Host entra al detalle de la actividad
2. Para invitados **registrados**: buscar usuario por email o ID (puede requerir un endpoint de búsqueda en backend) y enviar `{ userId }`
3. Para **contactos externos**: crear primero (si no existe) con `POST /api/external-contacts`, luego enviar `{ externalContactId }`

### Aceptar invitación

1. Usuario recibe email con link tipo `https://app.klupni.com/invitations/accept?token=xxx`
2. Frontend abre la ruta `/invitations/accept?token=xxx` (publica)
3. Llamar `GET /api/invitations/preview?token=xxx` para mostrar título, fecha, lugar, quién invita y si `canAccept`
4. Si `canAccept` es false: mostrar mensaje según status (expirada, ya aceptada, etc.)
5. Si `canAccept` es true: botón Aceptar → `POST /api/invitations/accept?token=xxx` (publico, no requiere auth)
6. Mostrar mensaje de éxito con datos de la actividad

### Olvidé mi contraseña

1. Usuario en `/forgot-password` ingresa email
2. `POST /api/auth/forgot-password` con `{ email }`
3. Usuario recibe email con link a `FRONTEND_URL/reset-password?token=xxx`
4. Usuario abre link, ingresa nueva contraseña
5. `POST /api/auth/reset-password` con `{ token, password }`
6. Redirigir a login con mensaje de éxito

### Refresco de token

- Antes de cada petición autenticada, verificar si el access token está expirado.
- Si expiró: `POST /api/auth/refresh` con `credentials: 'include'` para usar la cookie.
- Si falla: redirigir a login.

---

## 7. Estructura de proyecto recomendada

```
src/
  api/              # Cliente HTTP, interceptores, refresh token
  components/       # Componentes reutilizables
  features/         # Módulos por dominio (auth, activities, profile, etc.)
  hooks/            # Custom hooks (useAuth, useActivities, etc.)
  layouts/          # Layouts (header, sidebar, etc.)
  pages/            # Páginas de rutas
  routes/           # Configuración de rutas
  types/            # Tipos TypeScript compartidos
  utils/             # Helpers
```

**Cada feature** puede tener:

```
features/
  auth/
    api.ts
    components/
    hooks/
    types.ts
  activities/
    api.ts
    components/
    hooks/
    types.ts
```

- `api.ts`: funciones que llaman a los endpoints.
- `hooks`: React Query (useQuery, useMutation) para datos y mutaciones.
- `types.ts`: interfaces para request/response.

---

## 8. Consideraciones técnicas

### CORS y credenciales

- Configurar `fetch` con `credentials: 'include'` en todas las peticiones que requieran cookies.
- En desarrollo, el frontend suele estar en otro puerto (ej. 5173). El backend debe permitir `origin` del frontend (ej. `http://localhost:5173`).

### Rutas protegidas

- Rutas que requieren autenticación: verificar si hay token antes de renderizar.
- Si no hay token: intentar refresh; si falla, redirigir a login.

### Rutas públicas

- `/login`, `/register`, `/verify-email`, `/resend-verification`, `/forgot-password`, `/reset-password`, `/invitations/preview`, `/invitations/accept`

### Formato de fechas

- La API usa ISO 8601 (`"2026-03-15T18:00:00.000Z"`).
- Formatear en el frontend según locale (ej. `Intl.DateTimeFormat`).

### Paginación

- La API no implementa paginación en listados. Los endpoints de listado devuelven arrays completos.

---

## 9. Datos de prueba

El backend incluye un seed de desarrollo:

```bash
npm run seed
```

Usuarios con contraseña `Password123`:

| Email | Nombre |
|-------|--------|
| ana@klupni.com | Ana García |
| carlos@klupni.com | Carlos Martínez |
| sofia@klupni.com | Sofía López |
| diego@klupni.com | Diego Torres |
| maria@klupni.com | María Fernández |
| pablo@klupni.com | Pablo Ramírez |

---

## 10. Resumen de tareas

1. **Configurar** proyecto React + TypeScript + Vite.
2. **Implementar** cliente HTTP con refresh token y manejo de errores.
3. **Pantallas**: registro, login, verificación email, onboarding (perfil).
4. **Pantallas**: listado de actividades (filtros type/time), detalle de actividad, crear/editar actividad.
5. **Participaciones**: listado de participantes, agregar libres, cambiar roles, eliminar, abandonar.
6. **External contacts**: listar, crear, editar, eliminar.
7. **Invitaciones**: enviar (userId o externalContactId), listar, cancelar.
8. **Aceptar invitación**: página pública con token en query.
9. **Perfiles**: ver propio perfil, editar, ver perfil público de otros.
10. **Diseño**: responsive, accesible, consistente con el diseño definido.

---

## 11. Referencias

- [API.md](./API.md) — documentación completa de todos los endpoints
- [Backend README](../README.md) — instalación y ejecución del API
- [Postman Collection](../klupni.postman_collection.json) — colección para probar endpoints
