# Booking API

Hotel room booking backend service.

## Tech Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Database:** PostgreSQL 16
- **Containerization:** Docker
- **Infrastructure:** AWS (ECS Fargate, RDS, ALB) via Terraform
- **CI/CD:** CircleCI

## Local Development

```bash
# Start with Docker
docker compose up --build

# API available at http://localhost:3000
```

## API Endpoints

| Method | Path       | Description             |
|--------|------------|-------------------------|
| GET    | /          | Service info            |
| GET    | /health    | Health check (DB check) |
| GET    | /bookings  | List all bookings       |
| POST   | /booking   | Create a booking        |

### POST /booking

```json
{
  "checkIn": "2026-04-01",
  "checkOut": "2026-04-05",
  "adults": "2",
  "kids": "1"
}
```

## Environment Variables

See `.env.example` for the full list.

## Project Structure

```
booking-app/
├── index.js                    # Express API server
├── package.json
├── docker-compose.yml          # Local development
├── .env.example
├── deployment/
│   ├── Dockerfile              # Production (multi-stage, non-root)
│   ├── local/
│   │   ├── Dockerfile          # Dev with hot-reload
│   │   └── .env.local
│   └── migrations/
│       └── docker-compose.yml  # DB migrations for CI/CD
├── .terraform_files/           # Infrastructure as Code (Terraform)
└── .circleci/                  # CI/CD pipeline
```
