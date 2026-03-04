# Klupni MVP — Backend

Backend de Klupni, una app para la creación y organización de actividades grupales deportivas.

> **Nota:** Todos los comandos deben ejecutarse desde esta carpeta (`backend/`).

## Stack

- Node.js + TypeScript
- NestJS
- PostgreSQL 16
- TypeORM (Data Mapper, migraciones manuales)
- JWT (access token + refresh token en HttpOnly cookie)
- Nodemailer (Mailtrap en desarrollo)
- Docker + Docker Compose

## Prerequisites

- Node.js >= 20
- npm
- Docker y Docker Compose (opcional si usas PostgreSQL local)
- PostgreSQL 16 (opcional si usas Docker)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values. The required variables are documented in `.env.example`.

### 3. Set up the database

There are two ways to run PostgreSQL: **Docker** (recommended) or **local**.

---

#### Option A: Docker (recommended)

Start only the PostgreSQL container:

```bash
docker compose up -d postgres
```

This creates a container `klupni_postgres` with the credentials from your `.env` (`DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`). Data is persisted in the `postgres_data` Docker volume.

> **Important:** If you already have a local PostgreSQL running on port 5432, Docker will fail to bind the port. Either stop your local PostgreSQL first, or change `DB_PORT` in `.env` to a different port (e.g. `5433`) — the `docker-compose.yml` maps `${DB_PORT}` to the container's internal port 5432 automatically.

Verify the container is healthy:

```bash
docker compose ps
```

Wait until the `STATUS` column shows `healthy` before proceeding.

#### Option B: Local PostgreSQL

If you prefer using your own local PostgreSQL, create the role and database manually:

```bash
psql -U <your_superuser> -d template1 -c "CREATE ROLE klupni WITH LOGIN PASSWORD 'klupni' SUPERUSER;"
psql -U <your_superuser> -d template1 -c "CREATE DATABASE klupni OWNER klupni;"
```

Replace `<your_superuser>` with your local PostgreSQL superuser (often your OS username). Make sure `DB_HOST=localhost` and `DB_PORT=5432` in your `.env` match this instance.

---

### 4. Run migrations

```bash
npm run migration:run
```

### 5. Seed the database (development only)

Populate the database with realistic test data: 6 verified users, activities, participations, external contacts and invitations.

```bash
npm run seed
```

All seeded users share the password **`Password123`**:

| Email | Nombre | Rol destacado |
|---|---|---|
| `ana@klupni.com` | Ana García | Host de Paddle y Fútbol 5 |
| `carlos@klupni.com` | Carlos Martínez | Host de Tenis |
| `sofia@klupni.com` | Sofía López | Host de Running |
| `diego@klupni.com` | Diego Torres | Host de Básquetbol |
| `maria@klupni.com` | María Fernández | Participante activa |
| `pablo@klupni.com` | Pablo Ramírez | Host de Fútbol 7 |

> **Note:** The seed truncates all tables before inserting, so you can run it multiple times to reset the database to a clean state.

### 6. Start the application

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000/api`.

## Documentation

- **[docs/API.md](docs/API.md)** — Documentación completa de la API (todos los endpoints)
- **[docs/FRONTEND_SPEC.md](docs/FRONTEND_SPEC.md)** — Especificación para el desarrollo del frontend
- **[klupni.postman_collection.json](klupni.postman_collection.json)** — Colección Postman para probar la API

## Docker — full stack

To run both PostgreSQL and the API as containers:

```bash
docker compose up -d
```

This builds the API image from the `Dockerfile` (multi-stage) and starts it alongside PostgreSQL. The API container overrides `DB_HOST=postgres` to connect to the database container via the Docker network.

To stop everything:

```bash
docker compose down
```

To stop and remove the database volume (fresh start):

```bash
docker compose down -v
```

## Migrations

TypeORM migrations are generated from entity changes. Never use `synchronize: true`.

```bash
# Generate a new migration after modifying entities
npm run migration:generate -- src/migrations/MigrationName

# Run pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert
```

## Available scripts

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start in watch mode |
| `npm run start:debug` | Start in debug + watch mode |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run compiled app from `dist/` |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:cov` | Run tests with coverage |
| `npm run migration:generate` | Generate migration from entity diff |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run seed` | Populate DB with development test data |

## Project structure

```
src/
  modules/
    auth/           Auth module (register, login, JWT, email verification)
    activities/     Activities module
    participations/ Activity participations module
    invitations/    Activity invitations module
    mail/           Mail service (Nodemailer + Mailtrap)
  common/
    decorators/     @Public(), @CurrentUser()
    exceptions/     DomainException
    filters/        Global HttpExceptionFilter
    guards/         JwtAuthGuard (global)
  config/
    database.config.ts   TypeORM DataSource (also used by CLI)
    jwt.config.ts        JWT config (registerAs)
    mail.config.ts       Mail config (registerAs)
  database/
    seed.ts        Development seed script
  migrations/      TypeORM migrations
  app.module.ts
  main.ts
```

## Email in development

The project uses [Mailtrap](https://mailtrap.io/) for email in development. Sign up for a free account, create an inbox, and set `MAIL_USER` and `MAIL_PASS` in your `.env` with the SMTP credentials from Mailtrap.
