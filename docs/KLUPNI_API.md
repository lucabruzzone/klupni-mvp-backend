# Klupni API — Documentación de endpoints

Documentación completa de la API REST de Klupni para desarrolladores frontend.

---

## Índice

1. [Configuración base](#1-configuración-base)
2. [Autenticación](#2-autenticación)
3. [Errores](#3-errores)
4. [Paginación](#4-paginación)
5. [Auth](#5-auth)
6. [Usuarios](#6-usuarios)
7. [Actividades](#7-actividades)
8. [Participaciones](#8-participaciones)
9. [Contactos externos](#9-contactos-externos)
10. [Invitaciones](#10-invitaciones)

---

## 1. Configuración base

| Concepto | Valor |
|----------|-------|
| **Base URL** | `http://localhost:3000/api` (desarrollo) |
| **Prefijo global** | `/api` |
| **Content-Type** | `application/json` |
| **CORS** | Habilitado con `credentials: true` |

---

## 2. Autenticación

- **JWT**: el access token se envía en el header `Authorization: Bearer <accessToken>`.
- **Refresh token**: se guarda en una cookie HttpOnly `refresh_token` (SameSite=strict, path=/).
- Las peticiones autenticadas deben incluir `credentials: 'include'` en fetch para enviar cookies.

**Endpoints públicos** (no requieren token): registro, login, refresh, verify-email, resend-verification, forgot-password, reset-password, invitations/preview, invitations/accept, users/check-username.

**Resto de endpoints**: requieren `Authorization: Bearer <accessToken>`.

---

## 3. Errores

Formato estándar de error:

```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "error": "Bad Request",
  "timestamp": "2026-02-23T12:00:00.000Z",
  "path": "/api/activities"
}
```

| Código | Significado |
|--------|-------------|
| 400 | Bad Request — datos inválidos |
| 401 | Unauthorized — no autenticado o token inválido/expirado |
| 403 | Forbidden — no autorizado (ej. no eres host) |
| 404 | Not Found — recurso no encontrado |
| 409 | Conflict — conflicto (ej. email ya registrado) |

---

## 4. Paginación

Los listados devuelven:

```json
{
  "data": [...],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

**Query params** (opcionales en endpoints que los soportan):

- `page` — número de página (default: 1)
- `limit` — items por página (default: 10, max: 100)

---

## 5. Auth

### `POST /api/auth/register`

Registra un usuario. **Público.**

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```
- `password`: mínimo 8 caracteres

**Response 201:**
```json
{
  "id": "uuid",
  "email": "string",
  "message": "Check your email to verify your account"
}
```

---

### `GET /api/auth/verify-email`

Verifica el email tras registro. El token viene del link enviado por email. **Público.**

**Query params:** `token` (string)

**Response 200:**
```json
{
  "message": "Email verified successfully"
}
```

---

### `POST /api/auth/resend-verification`

Reenvía el email de verificación. **Público.**

**Request:**
```json
{
  "email": "string"
}
```

**Response 200:**
```json
{
  "message": "If an account exists with this email, a verification link has been sent"
}
```

**Response 400:** si el email ya está verificado.

---

### `POST /api/auth/forgot-password`

Solicita restablecimiento de contraseña por email. **Público.**

**Request:**
```json
{
  "email": "string"
}
```

**Response 200:**
```json
{
  "message": "If an account exists with this email, a password reset link has been sent"
}
```
Solo envía email si la cuenta existe y está verificada. Link: `FRONTEND_URL/reset-password?token=xxx`. Token válido 1 hora.

---

### `POST /api/auth/reset-password`

Restablece la contraseña con el token del email. **Público.**

**Request:**
```json
{
  "token": "string",
  "password": "string"
}
```
- `password`: mínimo 8 caracteres

**Response 200:**
```json
{
  "message": "Password has been reset successfully"
}
```

**Response 400:** token inválido, expirado o ya usado.

---

### `POST /api/auth/login`

Inicia sesión. El email debe estar verificado. **Público.**

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "accessToken": "string",
  "user": {
    "id": "uuid",
    "email": "string",
    "emailVerifiedAt": "string | null"
  }
}
```
El servidor envía la cookie `refresh_token` en la respuesta.

---

### `POST /api/auth/refresh`

Refresca el access token usando la cookie `refresh_token`. Sin body. **Público.**

**Response 200:**
```json
{
  "accessToken": "string"
}
```

---

### `POST /api/auth/logout`

Cierra sesión (limpia la cookie refresh). **Requiere auth.**

**Response 200:**
```json
{
  "message": "Logged out successfully"
}
```

---

## 6. Usuarios

### `GET /api/users/me`

Información básica del usuario autenticado. **Requiere auth.**

**Response 200:**
```json
{
  "id": "uuid",
  "email": "string",
  "emailVerifiedAt": "string | null",
  "createdAt": "string",
  "profileId": "uuid | null"
}
```

---

### `GET /api/users/profile`

Perfil completo del usuario autenticado. **Requiere auth.**

**Response 200:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "firstName": "string | null",
  "lastName": "string | null",
  "username": "string | null",
  "avatarUrl": "string | null",
  "createdAt": "string",
  "updatedAt": "string"
}
```

---

### `PATCH /api/users/profile`

Actualiza el perfil del usuario autenticado. **Requiere auth.**

**Request** (todos opcionales):
```json
{
  "firstName": "string",
  "lastName": "string",
  "username": "string",
  "avatarUrl": "string"
}
```
- `firstName`, `lastName`: 1-50 caracteres
- `username`: 3-30 caracteres, alfanumérico + guión bajo
- `avatarUrl`: URL válida, max 500 caracteres

**Response 200:** perfil actualizado (mismo formato que GET profile)

**Response 409:** username ya tomado

---

### `GET /api/users/check-username`

Verifica si un username está disponible. **Público.**

**Query params:**
- `username` (requerido): 3-30 chars, alfanumérico + guión bajo
- `excludeUserId` (opcional): excluir este user ID (ej. al editar perfil propio)

**Response 200:**
```json
{
  "available": true
}
```

**Response 400:** formato de username inválido

---

### `GET /api/users/search`

Busca usuarios por email o username. Para invitar a actividades. **Requiere auth.**

**Query params:**
- `q` (requerido): término de búsqueda, mínimo 2 caracteres. Búsqueda parcial, case-insensitive.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "email": "string",
    "firstName": "string | null",
    "lastName": "string | null",
    "username": "string | null"
  }
]
```
Máximo 20 resultados. Excluye usuarios no verificados y al usuario actual.

**Response 400:** query menor a 2 caracteres

---

### `GET /api/users/:userId/profile`

Perfil público de otro usuario. **Requiere auth.**

**Response 200:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "firstName": "string | null",
  "lastName": "string | null",
  "username": "string | null",
  "avatarUrl": "string | null"
}
```

**Response 404:** usuario no encontrado

---

## 7. Actividades

### `POST /api/activities`

Crea una actividad. El usuario queda como host. **Requiere auth.**

**Request:**
```json
{
  "title": "string",
  "description": "string",
  "startAt": "ISO 8601",
  "endAt": "ISO 8601",
  "sportName": "string",
  "locationText": "string",
  "maxParticipants": "number",
  "minParticipants": "number"
}
```
- `title`: 1-100 caracteres
- `description`: opcional, max 500
- `startAt`: fecha futura
- `endAt`: opcional, debe ser > startAt
- `sportName`: opcional, max 50
- `locationText`: opcional, max 200
- `maxParticipants`: 2-100
- `minParticipants`: 1-100, ≤ maxParticipants

**Response 201:** actividad completa con `activityOpen`

---

### `GET /api/activities`

Lista actividades del usuario. **Requiere auth.**

**Query params:**
- `type`: `'all'` | `'created'` | `'participating'` (default: `all`)
- `time`: `'upcoming'` | `'past'` | `'all'` (default: `upcoming`)
- `page`, `limit` (paginación)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "sportName": "string | null",
      "locationText": "string | null",
      "startAt": "string",
      "endAt": "string | null",
      "status": "string",
      "maxParticipants": "number",
      "minParticipants": "number",
      "participantCount": "number",
      "createdAt": "string"
    }
  ],
  "meta": { "total", "page", "limit", "totalPages" }
}
```

---

### `GET /api/activities/:id`

Detalle de una actividad. **Requiere auth.**

**Response 200:**
```json
{
  "id": "uuid",
  "title": "string",
  "description": "string | null",
  "startAt": "string",
  "endAt": "string | null",
  "status": "string",
  "createdAt": "string",
  "updatedAt": "string",
  "activityOpen": {
    "sportName": "string | null",
    "locationText": "string | null",
    "maxParticipants": "number",
    "minParticipants": "number"
  },
  "participants": [
    {
      "id": "uuid",
      "role": "host | participant",
      "joinedAt": "string",
      "user": { "userId": "uuid", "email": "string" }
    },
    {
      "id": "uuid",
      "role": "participant",
      "joinedAt": "string",
      "externalContact": { "externalContactId": "uuid" }
    }
  ]
}
```

---

### `GET /api/activities/:id/participants`

Lista participantes de una actividad. **Requiere auth.**

**Query params:**
- `status`: `'confirmed'` | `'pending'` | `'all'` (default: `all`)
- `page`, `limit` (paginación)

**Response 200:**
```json
{
  "data": [
    {
      "type": "user | external_contact | free | invited",
      "participationId": "uuid | null",
      "invitationId": "uuid | null",
      "role": "host | participant | null",
      "status": "string",
      "displayName": "string | null",
      "avatarUrl": "string | null",
      "userId": "uuid | null",
      "externalContactId": "uuid | null"
    }
  ],
  "meta": { "total", "page", "limit", "totalPages" }
}
```
Usar `userId` para `GET /api/users/:userId/profile` y `externalContactId` para `GET /api/external-contacts/:id`.

---

### `PATCH /api/activities/:id`

Actualiza una actividad. Solo el host. **Requiere auth.**

**Request** (todos opcionales):
```json
{
  "title": "string",
  "description": "string",
  "startAt": "ISO 8601",
  "endAt": "ISO 8601",
  "sportName": "string",
  "locationText": "string",
  "maxParticipants": "number",
  "minParticipants": "number"
}
```

**Response 200:** actividad actualizada

**Response 403:** no eres host

---

### `DELETE /api/activities/:id`

Elimina una actividad (soft delete). Solo el host. **Requiere auth.**

**Response 200:**
```json
{
  "message": "Activity deleted successfully"
}
```

**Response 403:** no eres host

---

## 8. Participaciones

### `POST /api/activities/:activityId/participations/free`

Agrega un participante libre (solo alias, sin user ni external contact). **Requiere auth.** Solo host.

**Request:**
```json
{
  "alias": "string"
}
```
- `alias`: 1-100 caracteres

**Response 201:**
```json
{
  "id": "uuid",
  "activityId": "uuid",
  "alias": "string",
  "role": "participant",
  "status": "active",
  "joinedAt": "string",
  "createdAt": "string"
}
```

---

### `PATCH /api/activities/:activityId/participations/:participationId/role`

Cambia el rol de un participante. **Requiere auth.** Solo host.

**Request:**
```json
{
  "role": "host | participant"
}
```
Solo usuarios registrados pueden ser host. External contacts y participantes libres no.

**Response 200:** participación actualizada

**Response 400:** no se puede asignar host a external contact o participante libre

---

### `PATCH /api/activities/:activityId/participations/:participationId/remove`

Elimina un participante de la actividad. **Requiere auth.** Solo host.

**Response 200:**
```json
{
  "message": "Participant removed successfully"
}
```
No se puede eliminar a otro host sin antes degradarlo a participante.

---

### `DELETE /api/activities/:activityId/participations/me`

Abandona la actividad. **Requiere auth.**

**Response 200:**
```json
{
  "message": "You have left the activity"
}
```
Solo si no eres el único host. **Response 400** si eres el único host.

---

## 9. Contactos externos

### `GET /api/external-contacts`

Lista contactos del usuario. **Requiere auth.**

**Query params:** `page`, `limit` (paginación)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "alias": "string",
      "email": "string | null",
      "phoneNumber": "string | null",
      "createdAt": "string"
    }
  ],
  "meta": { "total", "page", "limit", "totalPages" }
}
```

---

### `POST /api/external-contacts`

Crea un contacto externo. **Requiere auth.**

**Request:**
```json
{
  "alias": "string",
  "email": "string",
  "phoneNumber": "string"
}
```
- `alias`: 1-100 caracteres (requerido)
- `email`: opcional
- `phoneNumber`: opcional, max 30 caracteres

**Response 201:**
```json
{
  "id": "uuid",
  "alias": "string",
  "email": "string | null",
  "phoneNumber": "string | null",
  "createdAt": "string"
}
```

---

### `GET /api/external-contacts/:id`

Obtiene un contacto externo. **Requiere auth.**

**Response 200:**
```json
{
  "id": "uuid",
  "alias": "string",
  "email": "string | null",
  "phoneNumber": "string | null",
  "createdAt": "string",
  "updatedAt": "string"
}
```

---

### `PATCH /api/external-contacts/:id`

Actualiza un contacto externo. Solo propietario. **Requiere auth.**

**Request** (todos opcionales):
```json
{
  "alias": "string",
  "email": "string",
  "phoneNumber": "string"
}
```

**Response 200:** contacto actualizado

**Response 404:** contacto no encontrado o no te pertenece

---

### `DELETE /api/external-contacts/:id`

Elimina un contacto externo (soft delete). Solo propietario. **Requiere auth.**

**Response 200:**
```json
{
  "message": "External contact deleted successfully"
}
```

---

## 10. Invitaciones

### `POST /api/activities/:activityId/invitations`

Envía una invitación a un usuario o contacto externo. Solo el host. **Requiere auth.**

**Request:** exactamente uno de:
```json
{
  "userId": "uuid"
}
```
o
```json
{
  "externalContactId": "uuid"
}
```
- `externalContactId` debe ser del propietario y tener email.

**Response 201:**
```json
{
  "id": "uuid",
  "email": "string",
  "userId": "uuid | null",
  "externalContactId": "uuid | null",
  "status": "pending",
  "expiresAt": "string"
}
```

**Validaciones:** actividad abierta, cupos disponibles, sin invitación pendiente previa, target no participante activo, no auto-invitación.

---

### `POST /api/activities/:activityId/invitations/batch`

Envía invitaciones a múltiples usuarios y/o contactos externos. Solo el host. **Requiere auth.**

**Request:**
```json
{
  "userIds": ["uuid", "uuid"],
  "externalContactIds": ["uuid"]
}
```
- Al menos uno de los arrays debe ser no vacío
- Máx. 50 por array, 50 en total
- Se pueden combinar usuarios y contactos en la misma petición

**Response 200:**
```json
{
  "created": [
    {
      "id": "uuid",
      "email": "string",
      "userId": "uuid",
      "externalContactId": null,
      "status": "pending",
      "expiresAt": "string"
    }
  ],
  "failed": [
    {
      "userId": "uuid",
      "reason": "Pending invitation already exists"
    },
    {
      "externalContactId": "uuid",
      "reason": "Contact has no email address"
    }
  ],
  "message": "Sent 3 invitation(s). 2 target(s) skipped."
}
```
Los targets inválidos se omiten y se listan en `failed`.

---

### `GET /api/activities/:activityId/invitations`

Lista invitaciones de una actividad. Solo el host. **Requiere auth.**

**Query params:**
- `status`: `'pending'` | `'accepted'` | `'cancelled'` | `'all'` (default: `all`)
- `page`, `limit` (paginación)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "userId": "uuid | null",
      "externalContactId": "uuid | null",
      "status": "string",
      "createdAt": "string",
      "expiresAt": "string",
      "respondedAt": "string | null"
    }
  ],
  "meta": { "total", "page", "limit", "totalPages" }
}
```

---

### `POST /api/activities/:activityId/invitations/:invitationId/cancel`

Cancela una invitación pendiente. Solo el host. **Requiere auth.**

**Response 200:**
```json
{
  "message": "Invitation cancelled"
}
```

**Response 400:** invitación no pendiente

---

### `GET /api/invitations/received`

Lista las invitaciones recibidas por el usuario autenticado (solo las enviadas a usuarios registrados). **Requiere auth.**

**Query params:**
- `status`: `'pending'` | `'accepted'` | `'past'` | `'expired'` | `'all'` (default: `all`)
  - `pending`: solo pendientes
  - `accepted`: solo aceptadas
  - `past`: invitaciones de actividades ya realizadas (historial)
  - `expired`: solo invitaciones expiradas
  - `all`: todas
- `page`, `limit` (paginación)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "token": "string",
      "status": "string",
      "createdAt": "string",
      "expiresAt": "string",
      "respondedAt": "string | null",
      "activity": {
        "id": "uuid",
        "title": "string",
        "startAt": "string",
        "endAt": "string | null",
        "status": "string",
        "sportName": "string | null",
        "locationText": "string | null"
      },
      "inviter": {
        "userId": "uuid",
        "email": "string",
        "displayName": "string | null"
      }
    }
  ],
  "meta": { "total", "page", "limit", "totalPages" }
}
```

---

### `GET /api/invitations/preview`

Vista previa de una invitación sin aceptarla. **Público.**

**Query params:** `token` (string)

**Response 200:**
```json
{
  "activity": {
    "id": "uuid",
    "title": "string",
    "startAt": "string",
    "endAt": "string",
    "locationText": "string | null",
    "sportName": "string | null",
    "status": "string"
  },
  "inviter": {
    "displayName": "string | null",
    "email": "string | null"
  },
  "status": "string",
  "expiresAt": "string",
  "canAccept": true
}
```
- `canAccept`: true solo si status es `pending`, no expirada y la actividad está `open`.

**Response 400:** token inválido

---

### `POST /api/invitations/accept`

Acepta una invitación. Usado desde el link del email. **Público.**

**Query params:** `token` (string)

**Response 200:**
```json
{
  "message": "You have joined the activity",
  "activity": {
    "id": "uuid",
    "title": "string",
    "startAt": "string",
    "locationText": "string | null"
  }
}
```

**Response 400:** token inválido, expirado, ya aceptado, o actividad no abierta

---

## Resumen de endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/register` | — | Registrar usuario |
| GET | `/auth/verify-email` | — | Verificar email |
| POST | `/auth/resend-verification` | — | Reenviar verificación |
| POST | `/auth/forgot-password` | — | Solicitar reset password |
| POST | `/auth/reset-password` | — | Resetear password |
| POST | `/auth/login` | — | Login |
| POST | `/auth/refresh` | — | Refresh token |
| POST | `/auth/logout` | ✓ | Logout |
| GET | `/users/me` | ✓ | Info usuario |
| GET | `/users/profile` | ✓ | Perfil propio |
| PATCH | `/users/profile` | ✓ | Actualizar perfil |
| GET | `/users/check-username` | — | Verificar username |
| GET | `/users/search` | ✓ | Buscar usuarios |
| GET | `/users/:userId/profile` | ✓ | Perfil público |
| POST | `/activities` | ✓ | Crear actividad |
| GET | `/activities` | ✓ | Listar actividades |
| GET | `/activities/:id` | ✓ | Detalle actividad |
| GET | `/activities/:id/participants` | ✓ | Listar participantes |
| PATCH | `/activities/:id` | ✓ | Actualizar actividad |
| DELETE | `/activities/:id` | ✓ | Eliminar actividad |
| POST | `/activities/:activityId/participations/free` | ✓ | Agregar participante libre |
| PATCH | `/activities/:activityId/participations/:id/role` | ✓ | Cambiar rol |
| PATCH | `/activities/:activityId/participations/:id/remove` | ✓ | Eliminar participante |
| DELETE | `/activities/:activityId/participations/me` | ✓ | Abandonar actividad |
| GET | `/external-contacts` | ✓ | Listar contactos |
| POST | `/external-contacts` | ✓ | Crear contacto |
| GET | `/external-contacts/:id` | ✓ | Obtener contacto |
| PATCH | `/external-contacts/:id` | ✓ | Actualizar contacto |
| DELETE | `/external-contacts/:id` | ✓ | Eliminar contacto |
| POST | `/activities/:activityId/invitations` | ✓ | Enviar invitación |
| POST | `/activities/:activityId/invitations/batch` | ✓ | Enviar invitaciones batch |
| GET | `/activities/:activityId/invitations` | ✓ | Listar invitaciones |
| POST | `/activities/:activityId/invitations/:id/cancel` | ✓ | Cancelar invitación |
| GET | `/invitations/received` | ✓ | Listar invitaciones recibidas |
| GET | `/invitations/preview` | — | Vista previa invitación |
| POST | `/invitations/accept` | — | Aceptar invitación |

---

## Referencias

- [FRONTEND_SPEC.md](./FRONTEND_SPEC.md) — especificación completa para el frontend
- [Postman Collection](../klupni.postman_collection.json) — colección para probar la API
