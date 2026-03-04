# Klupni API — Documentación de endpoints

Documentación completa de la API REST de Klupni para desarrolladores frontend.

---

## Índice

1. [Configuración base](#1-configuración-base)
2. [Autenticación](#2-autenticación)
3. [Formato de respuesta](#3-formato-de-respuesta)
4. [Errores](#4-errores)
5. [Paginación](#5-paginación)
6. [Auth](#6-auth)
7. [Usuarios](#7-usuarios)
8. [Actividades](#8-actividades)
9. [Participaciones](#9-participaciones)
10. [Contactos externos](#10-contactos-externos)
11. [Invitaciones](#11-invitaciones)
12. [Catálogo de códigos API](#12-catálogo-de-códigos-api)

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

## 3. Formato de respuesta

Todas las respuestas de la API siguen un **envelope** uniforme:

```json
{
  "success": true,
  "code": "ACTIVITY_CREATED",
  "message": "Activity created successfully",
  "data": { ... },
  "meta": null
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `success` | boolean | `true` si la operación fue exitosa, `false` si hubo error |
| `code` | string | Código API en SCREAMING_SNAKE_CASE (ej. `USER_REGISTERED`, `ACTIVITY_NOT_FOUND`) |
| `message` | string | Mensaje legible para debugging |
| `data` | object \| array \| null | Payload de la respuesta. En errores suele ser `null` |
| `meta` | object \| null | Metadatos de paginación (`total`, `page`, `limit`, `totalPages`) |

- **Éxito**: `success: true`, `data` contiene el resultado.
- **Error**: `success: false`, `code` identifica el tipo de error, `message` describe el problema.
- **Paginado**: `meta` contiene `{ total, page, limit, totalPages }`, `data` es el array de items.

---

## 4. Errores

Formato estándar de error (siempre dentro del envelope):

```json
{
  "success": false,
  "code": "USERNAME_TAKEN",
  "message": "This username is already taken",
  "data": null,
  "meta": null
}
```

En errores de **validación** (ValidationPipe), `data` contiene el detalle:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "data": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "meta": null
}
```

| HTTP | Significado |
|------|-------------|
| 400 | Bad Request — datos inválidos, regla de negocio violada |
| 401 | Unauthorized — no autenticado o token inválido/expirado |
| 403 | Forbidden — no autorizado (ej. no eres host) |
| 404 | Not Found — recurso no encontrado |
| 409 | Conflict — conflicto (ej. email ya registrado) |

El campo `code` permite al frontend reaccionar de forma programática (ej. `USERNAME_TAKEN` → mostrar error junto al campo username).

---

## 5. Paginación

Los listados devuelven `data` (array de items) y `meta` (metadatos):

```json
{
  "success": true,
  "code": "ACTIVITY_LIST_RETRIEVED",
  "message": "Activities list retrieved",
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

## 6. Auth

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
  "success": true,
  "code": "USER_REGISTERED",
  "message": "Check your email to verify your account",
  "data": {
    "id": "uuid",
    "email": "string",
    "message": "Check your email to verify your account"
  },
  "meta": null
}
```

---

### `GET /api/auth/verify-email`

Verifica el email tras registro. El token viene del link enviado por email. **Público.**

**Query params:** `token` (string)

**Response 200:**
```json
{
  "success": true,
  "code": "EMAIL_VERIFIED",
  "message": "Email verified successfully",
  "data": {
    "message": "Email verified successfully"
  },
  "meta": null
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
  "success": true,
  "code": "VERIFICATION_EMAIL_SENT",
  "message": "If an account exists with this email, a verification link has been sent",
  "data": {
    "message": "If an account exists with this email, a verification link has been sent"
  },
  "meta": null
}
```

**Response 400:** `EMAIL_ALREADY_VERIFIED` — el email ya está verificado.

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
  "success": true,
  "code": "PASSWORD_RESET_EMAIL_SENT",
  "message": "If an account exists with this email, a password reset link has been sent",
  "data": {
    "message": "If an account exists with this email, a password reset link has been sent"
  },
  "meta": null
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
  "success": true,
  "code": "PASSWORD_RESET",
  "message": "Password has been reset successfully",
  "data": {
    "message": "Password has been reset successfully"
  },
  "meta": null
}
```

**Response 400:** `INVALID_RESET_TOKEN`, `RESET_TOKEN_ALREADY_USED`, `RESET_TOKEN_EXPIRED`.

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
  "success": true,
  "code": "LOGIN_SUCCESS",
  "message": "Logged in successfully",
  "data": {
    "accessToken": "string",
    "user": {
      "id": "uuid",
      "email": "string",
      "emailVerifiedAt": "string | null"
    }
  },
  "meta": null
}
```
El servidor envía la cookie `refresh_token` en la respuesta.

**Response 401:** `INVALID_CREDENTIALS` — credenciales incorrectas.

**Response 403:** `EMAIL_NOT_VERIFIED` — email no verificado.

---

### `POST /api/auth/refresh`

Refresca el access token usando la cookie `refresh_token`. Sin body. **Público.**

**Response 200:**
```json
{
  "success": true,
  "code": "REFRESH_SUCCESS",
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "string"
  },
  "meta": null
}
```

**Response 401:** `REFRESH_TOKEN_NOT_FOUND`, `REFRESH_TOKEN_INVALID`.

---

### `POST /api/auth/logout`

Cierra sesión (limpia la cookie refresh). **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "LOGOUT_SUCCESS",
  "message": "Logged out successfully",
  "data": null,
  "meta": null
}
```

---

## 7. Usuarios

### `GET /api/users/me`

Información básica del usuario autenticado. **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "USER_INFO_RETRIEVED",
  "message": "User info retrieved",
  "data": {
    "id": "uuid",
    "email": "string",
    "emailVerifiedAt": "string | null",
    "createdAt": "string",
    "profileId": "uuid | null"
  },
  "meta": null
}
```

---

### `GET /api/users/profile`

Perfil completo del usuario autenticado. **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "USER_PROFILE_RETRIEVED",
  "message": "User profile retrieved",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "firstName": "string | null",
    "lastName": "string | null",
    "username": "string | null",
    "avatarUrl": "string | null",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "meta": null
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

**Response 200:**
```json
{
  "success": true,
  "code": "USER_PROFILE_UPDATED",
  "message": "Profile updated successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "firstName": "string | null",
    "lastName": "string | null",
    "username": "string | null",
    "avatarUrl": "string | null",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "meta": null
}
```

**Response 409:** `USERNAME_TAKEN` — username ya tomado.

---

### `GET /api/users/check-username`

Verifica si un username está disponible. **Público.**

**Query params:**
- `username` (requerido): 3-30 chars, alfanumérico + guión bajo
- `excludeUserId` (opcional): excluir este user ID (ej. al editar perfil propio)

**Response 200:**
```json
{
  "success": true,
  "code": "USERNAME_AVAILABLE",
  "message": "Username is available",
  "data": {
    "available": true
  },
  "meta": null
}
```

**Response 400:** `USERNAME_INVALID_LENGTH`, `USERNAME_INVALID_CHARS`.

---

### `GET /api/users/search`

Busca usuarios por email o username. Para invitar a actividades. **Requiere auth.**

**Query params:**
- `q` (requerido): término de búsqueda, mínimo 2 caracteres. Búsqueda parcial, case-insensitive.
- `page`, `limit` (paginación)

**Response 200:**
```json
{
  "success": true,
  "code": "USERS_SEARCH_SUCCESS",
  "message": "Users search completed",
  "data": [
    {
      "id": "uuid",
      "email": "string",
      "firstName": "string | null",
      "lastName": "string | null",
      "username": "string | null"
    }
  ],
  "meta": {
    "total": 20,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```
Excluye usuarios no verificados y al usuario actual.

**Response 400:** `SEARCH_QUERY_TOO_SHORT` — query menor a 2 caracteres.

---

### `GET /api/users/:userId/profile`

Perfil público de otro usuario. **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "USER_PUBLIC_PROFILE_RETRIEVED",
  "message": "Public profile retrieved",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "firstName": "string | null",
    "lastName": "string | null",
    "username": "string | null",
    "avatarUrl": "string | null"
  },
  "meta": null
}
```

**Response 404:** `USER_NOT_FOUND` — usuario no encontrado.

---

## 8. Actividades

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

**Response 201:**
```json
{
  "success": true,
  "code": "ACTIVITY_CREATED",
  "message": "Activity created successfully",
  "data": {
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
    }
  },
  "meta": null
}
```

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
  "success": true,
  "code": "ACTIVITY_LIST_RETRIEVED",
  "message": "Activities list retrieved",
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
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### `GET /api/activities/:id`

Detalle de una actividad. **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "ACTIVITY_RETRIEVED",
  "message": "Activity retrieved",
  "data": {
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
  },
  "meta": null
}
```

**Response 404:** `ACTIVITY_NOT_FOUND`.

---

### `GET /api/activities/:id/participants`

Lista participantes de una actividad. **Requiere auth.**

**Query params:**
- `status`: `'confirmed'` | `'pending'` | `'all'` (default: `all`)
- `page`, `limit` (paginación)

**Response 200:**
```json
{
  "success": true,
  "code": "ACTIVITY_PARTICIPANTS_LIST_RETRIEVED",
  "message": "Participants list retrieved",
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
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
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

**Response 200:**
```json
{
  "success": true,
  "code": "ACTIVITY_UPDATED",
  "message": "Activity updated successfully",
  "data": { ... },
  "meta": null
}
```

**Response 403:** `ACTIVITY_MODIFY_FORBIDDEN` — no eres host.

**Response 404:** `ACTIVITY_NOT_FOUND`, `ACTIVITY_NOT_ACTIVE`, `ACTIVITY_ALREADY_ENDED`.

---

### `DELETE /api/activities/:id`

Elimina una actividad (soft delete). Solo el host. **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "ACTIVITY_DELETED",
  "message": "Activity deleted successfully",
  "data": null,
  "meta": null
}
```

**Response 403:** `ACTIVITY_MODIFY_FORBIDDEN` — no eres host.

---

## 9. Participaciones

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
  "success": true,
  "code": "PARTICIPANT_ADDED",
  "message": "Participant added successfully",
  "data": {
    "id": "uuid",
    "activityId": "uuid",
    "alias": "string",
    "role": "participant",
    "status": "active",
    "joinedAt": "string",
    "createdAt": "string"
  },
  "meta": null
}
```

**Response 400:** `ACTIVITY_FULL` — actividad llena.

**Response 403:** `ACTIVITY_MODIFY_FORBIDDEN`.

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

**Response 200:**
```json
{
  "success": true,
  "code": "PARTICIPANT_ROLE_UPDATED",
  "message": "Participant role updated",
  "data": {
    "id": "uuid",
    "activityId": "uuid",
    "userId": "uuid | null",
    "externalContactId": "uuid | null",
    "role": "string",
    "status": "string",
    "joinedAt": "string",
    "updatedAt": "string"
  },
  "meta": null
}
```

**Response 400:** `CANNOT_CHANGE_OWN_ROLE`, `ONLY_REGISTERED_CAN_BE_HOST`.

**Response 404:** `PARTICIPATION_NOT_FOUND`.

---

### `PATCH /api/activities/:activityId/participations/:participationId/remove`

Elimina un participante de la actividad. **Requiere auth.** Solo host.

**Response 200:**
```json
{
  "success": true,
  "code": "PARTICIPANT_REMOVED",
  "message": "Participant removed successfully",
  "data": null,
  "meta": null
}
```
No se puede eliminar a otro host sin antes degradarlo a participante.

**Response 400:** `CANNOT_REMOVE_HOST`.

**Response 404:** `ACTIVE_PARTICIPATION_NOT_FOUND`.

---

### `DELETE /api/activities/:activityId/participations/me`

Abandona la actividad. **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "ACTIVITY_LEFT",
  "message": "You have left the activity",
  "data": null,
  "meta": null
}
```
Solo si no eres el único host.

**Response 400:** `CANNOT_REMOVE_SOLE_HOST` — eres el único host.

**Response 404:** `NOT_ACTIVE_PARTICIPANT` — no eres participante activo.

---

## 10. Contactos externos

### `GET /api/external-contacts`

Lista contactos del usuario. **Requiere auth.**

**Query params:** `page`, `limit` (paginación)

**Response 200:**
```json
{
  "success": true,
  "code": "EXTERNAL_CONTACT_LIST_RETRIEVED",
  "message": "External contacts list retrieved",
  "data": [
    {
      "id": "uuid",
      "alias": "string",
      "email": "string | null",
      "phoneNumber": "string | null",
      "createdAt": "string"
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
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
  "success": true,
  "code": "EXTERNAL_CONTACT_CREATED",
  "message": "External contact created",
  "data": {
    "id": "uuid",
    "alias": "string",
    "email": "string | null",
    "phoneNumber": "string | null",
    "createdAt": "string"
  },
  "meta": null
}
```

---

### `GET /api/external-contacts/:id`

Obtiene un contacto externo. **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "EXTERNAL_CONTACT_RETRIEVED",
  "message": "External contact retrieved",
  "data": {
    "id": "uuid",
    "alias": "string",
    "email": "string | null",
    "phoneNumber": "string | null",
    "createdAt": "string",
    "updatedAt": "string"
  },
  "meta": null
}
```

**Response 404:** `EXTERNAL_CONTACT_NOT_FOUND` — contacto no encontrado o no te pertenece.

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

**Response 200:**
```json
{
  "success": true,
  "code": "EXTERNAL_CONTACT_UPDATED",
  "message": "External contact updated",
  "data": { ... },
  "meta": null
}
```

**Response 404:** `EXTERNAL_CONTACT_NOT_FOUND`.

---

### `DELETE /api/external-contacts/:id`

Elimina un contacto externo (soft delete). Solo propietario. **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "EXTERNAL_CONTACT_DELETED",
  "message": "External contact deleted successfully",
  "data": null,
  "meta": null
}
```

**Response 404:** `EXTERNAL_CONTACT_NOT_FOUND`.

---

## 11. Invitaciones

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
  "success": true,
  "code": "INVITATION_CREATED",
  "message": "Invitation sent",
  "data": {
    "id": "uuid",
    "email": "string",
    "userId": "uuid | null",
    "externalContactId": "uuid | null",
    "status": "pending",
    "expiresAt": "string"
  },
  "meta": null
}
```

**Códigos de error:** `INVITATION_USER_OR_CONTACT_REQUIRED`, `INVITATION_BOTH_PROVIDED`, `INVITATION_ACTIVITY_FULL`, `INVITATION_CANNOT_INVITE_SELF`, `INVITATION_USER_ALREADY_PARTICIPANT`, `INVITATION_ALREADY_PENDING`, `INVITATION_EXTERNAL_CONTACT_NO_EMAIL`, `INVITATION_EXTERNAL_CONTACT_ALREADY_PARTICIPANT`, `ACTIVITY_NOT_FOUND`, `USER_NOT_FOUND`, `EXTERNAL_CONTACT_NOT_FOUND`.

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
  "success": true,
  "code": "INVITATION_BATCH_CREATED",
  "message": "Invitations batch processed",
  "data": {
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
  },
  "meta": null
}
```
Los targets inválidos se omiten y se listan en `failed`.

**Códigos de error:** `INVITATION_BATCH_EMPTY`, `INVITATION_BATCH_TOO_MANY`, `INVITATION_ACTIVITY_FULL`.

---

### `GET /api/activities/:activityId/invitations`

Lista invitaciones de una actividad. Solo el host. **Requiere auth.**

**Query params:**
- `status`: `'pending'` | `'accepted'` | `'cancelled'` | `'all'` (default: `all`)
- `page`, `limit` (paginación)

**Response 200:**
```json
{
  "success": true,
  "code": "INVITATION_LIST_RETRIEVED",
  "message": "Invitations list retrieved",
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
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### `POST /api/activities/:activityId/invitations/:invitationId/cancel`

Cancela una invitación pendiente. Solo el host. **Requiere auth.**

**Response 200:**
```json
{
  "success": true,
  "code": "INVITATION_CANCELLED",
  "message": "Invitation cancelled",
  "data": null,
  "meta": null
}
```

**Response 400:** `INVITATION_CANCEL_INVALID_STATUS` — invitación no pendiente.

**Response 404:** `INVITATION_NOT_FOUND`.

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
  "success": true,
  "code": "INVITATION_RECEIVED_LIST_RETRIEVED",
  "message": "Received invitations list retrieved",
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
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### `GET /api/invitations/preview`

Vista previa de una invitación sin aceptarla. **Público.**

**Query params:** `token` (string)

**Response 200:**
```json
{
  "success": true,
  "code": "INVITATION_PREVIEW_RETRIEVED",
  "message": "Invitation preview retrieved",
  "data": {
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
  },
  "meta": null
}
```
- `canAccept`: true solo si status es `pending`, no expirada y la actividad está `open`.

**Response 400:** `INVITATION_INVALID` — token inválido.

---

### `POST /api/invitations/accept`

Acepta una invitación. Usado desde el link del email. **Público.**

**Query params:** `token` (string)

**Response 200:**
```json
{
  "success": true,
  "code": "INVITATION_ACCEPTED",
  "message": "You have joined the activity",
  "data": {
    "message": "You have joined the activity",
    "activity": {
      "id": "uuid",
      "title": "string",
      "startAt": "string",
      "locationText": "string | null"
    }
  },
  "meta": null
}
```

**Response 400:** `INVITATION_INVALID`, `INVITATION_ALREADY_ACCEPTED`, `INVITATION_REJECTED`, `INVITATION_ALREADY_CANCELLED`, `INVITATION_EXPIRED`, `INVITATION_ACTIVITY_NOT_OPEN`, `ACTIVITY_ALREADY_ENDED`, `INVITATION_ACTIVITY_FULL`, `INVITATION_INVITEE_ALREADY_PARTICIPANT`.

---

## 12. Catálogo de códigos API

Referencia de todos los códigos que puede devolver la API. El frontend puede usarlos para lógica condicional (ej. `if (response.code === 'USERNAME_TAKEN')`).

### Genéricos
| Código | Tipo | Descripción |
|--------|------|-------------|
| `VALIDATION_ERROR` | error | Fallo de validación (DTO) |
| `NOT_FOUND` | error | Recurso no encontrado |
| `UNAUTHORIZED` | error | No autenticado |
| `FORBIDDEN` | error | Sin permisos |
| `INTERNAL_SERVER_ERROR` | error | Error interno del servidor |

### Auth
| Código | Tipo |
|--------|------|
| `USER_REGISTERED`, `EMAIL_VERIFIED`, `VERIFICATION_EMAIL_SENT`, `PASSWORD_RESET_EMAIL_SENT`, `PASSWORD_RESET`, `LOGIN_SUCCESS`, `REFRESH_SUCCESS`, `LOGOUT_SUCCESS`, `USER_INFO_RETRIEVED`, `USER_PROFILE_RETRIEVED`, `USERNAME_AVAILABLE`, `USERS_SEARCH_SUCCESS`, `USER_PUBLIC_PROFILE_RETRIEVED`, `USER_PROFILE_UPDATED` | éxito |
| `EMAIL_ALREADY_IN_USE`, `INVALID_VERIFICATION_TOKEN`, `VERIFICATION_TOKEN_ALREADY_USED`, `VERIFICATION_TOKEN_EXPIRED`, `EMAIL_ALREADY_VERIFIED`, `INVALID_RESET_TOKEN`, `RESET_TOKEN_ALREADY_USED`, `RESET_TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `REFRESH_TOKEN_NOT_FOUND`, `REFRESH_TOKEN_INVALID`, `USER_NOT_FOUND`, `USERNAME_INVALID_LENGTH`, `USERNAME_INVALID_CHARS`, `USERNAME_TAKEN`, `SEARCH_QUERY_TOO_SHORT` | error |

### Actividades
| Código | Tipo |
|--------|------|
| `ACTIVITY_CREATED`, `ACTIVITY_LIST_RETRIEVED`, `ACTIVITY_RETRIEVED`, `ACTIVITY_PARTICIPANTS_LIST_RETRIEVED`, `ACTIVITY_UPDATED`, `ACTIVITY_DELETED` | éxito |
| `ACTIVITY_NOT_FOUND`, `ACTIVITY_NOT_ACTIVE`, `ACTIVITY_ALREADY_ENDED`, `ACTIVITY_MODIFY_FORBIDDEN` | error |

### Participaciones
| Código | Tipo |
|--------|------|
| `PARTICIPANT_ADDED`, `PARTICIPANT_ROLE_UPDATED`, `PARTICIPANT_REMOVED`, `ACTIVITY_LEFT` | éxito |
| `ACTIVITY_FULL`, `PARTICIPATION_NOT_FOUND`, `ACTIVE_PARTICIPATION_NOT_FOUND`, `CANNOT_CHANGE_OWN_ROLE`, `ONLY_REGISTERED_CAN_BE_HOST`, `CANNOT_REMOVE_HOST`, `NOT_ACTIVE_PARTICIPANT`, `CANNOT_REMOVE_SOLE_HOST` | error |

### Contactos externos
| Código | Tipo |
|--------|------|
| `EXTERNAL_CONTACT_CREATED`, `EXTERNAL_CONTACT_LIST_RETRIEVED`, `EXTERNAL_CONTACT_RETRIEVED`, `EXTERNAL_CONTACT_UPDATED`, `EXTERNAL_CONTACT_DELETED` | éxito |
| `EXTERNAL_CONTACT_NOT_FOUND` | error |

### Invitaciones
| Código | Tipo |
|--------|------|
| `INVITATION_CREATED`, `INVITATION_BATCH_CREATED`, `INVITATION_LIST_RETRIEVED`, `INVITATION_RECEIVED_LIST_RETRIEVED`, `INVITATION_PREVIEW_RETRIEVED`, `INVITATION_ACCEPTED`, `INVITATION_CANCELLED` | éxito |
| `INVITATION_USER_OR_CONTACT_REQUIRED`, `INVITATION_BOTH_PROVIDED`, `INVITATION_ACTIVITY_FULL`, `INVITATION_CANNOT_INVITE_SELF`, `INVITATION_USER_ALREADY_PARTICIPANT`, `INVITATION_ALREADY_PENDING`, `INVITATION_EXTERNAL_CONTACT_NO_EMAIL`, `INVITATION_EXTERNAL_CONTACT_ALREADY_PARTICIPANT`, `INVITATION_BATCH_EMPTY`, `INVITATION_BATCH_TOO_MANY`, `INVITATION_INVALID`, `INVITATION_ALREADY_ACCEPTED`, `INVITATION_REJECTED`, `INVITATION_ALREADY_CANCELLED`, `INVITATION_EXPIRED`, `INVITATION_ACTIVITY_NOT_OPEN`, `INVITATION_INVITEE_ALREADY_PARTICIPANT`, `INVITATION_NOT_FOUND`, `INVITATION_CANCEL_INVALID_STATUS`, `INVITATION_MANAGE_FORBIDDEN` | error |

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
- `src/common/constants/api-codes.ts` — definición de códigos en el backend
- `src/common/constants/api-messages.ts` — mensajes por código
