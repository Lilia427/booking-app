# Booking API

Backend service for reservations, admin auth, and cottage management.

## Stack

- Runtime: Node.js
- Framework: NestJS
- Database: PostgreSQL 16
- ORM: TypeORM
- Containerization: Docker
- File storage: AWS S3
- Infrastructure: AWS (ECS Fargate, RDS, ALB) via Terraform

## Local Run

### 1) Install dependencies

```bash
npm install
```

### 2) Start PostgreSQL (Docker)

```bash
docker compose up -d db
```

Check status:

```bash
docker compose ps
docker compose logs -f db
```

### 3) Run migrations

```bash
npm run migration:run
```

### 4) Seed default admin (optional manual step)

```bash
npm run admin:seed
```

The app also attempts to create default admin on startup (only when admin table is empty and env vars are set).

### 5) Start API

```bash
npm run start:dev
```

API base URL:

- `http://localhost:3000/api`

Health check:

- `http://localhost:3000/health`

## Default Admin Credentials

Configured via `.env`:

- `DEFAULT_ADMIN_NAME`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`

Current local defaults:

- Email: `admin@booking.local`
- Password: `admin12345`

Only one admin is allowed (enforced in service logic and database constraint).

## Main Scripts

- `npm run start:dev` - start Nest in watch mode
- `npm run build` - build project
- `npm test` - run unit tests
- `npm run migration:run` - apply migrations
- `npm run migration:revert` - revert last migration
- `npm run admin:seed` - create default admin if none exists

## Core API Areas

- `POST /api/admin` - create admin (works only when no admin exists)
- `POST /api/admin/login` - admin login
- `POST /api/admin/logout` - admin logout
- `GET /api/admin/profile` - current admin profile
- `GET /api/reservation` and CRUD endpoints
- `GET /api/cottages` and CRUD endpoints

For cottages, image upload is multipart via `images` field and stored in S3 (`ASSETS_BUCKET`, `AWS_DEFAULT_REGION`).

## Required Environment Variables

- DB: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PGSSLMODE`
- Auth: `JWT_SECRET`
- S3: `ASSETS_BUCKET`, `AWS_DEFAULT_REGION`
- Default admin: `DEFAULT_ADMIN_NAME`, `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`

## Troubleshooting

### Port 5432 is already allocated

Another container/process is using PostgreSQL port. Stop the conflicting container/process, then run:

```bash
docker compose up -d db
```

### Port 3000 is already in use

Find and stop process:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
kill <PID>
```

Then restart API:

```bash
npm run start:dev
```

