# PawSaathi Pune

A pet-care booking MVP for finding local caretakers and arranging walks, play, and short-duration care in Pune.

## What’s included

- **Pet owners:** Register, manage pets, browse services and caretakers, request bookings, pay through Razorpay when configured, and manage bookings, reviews, notifications, and support tickets.
- **Caretakers:** Register for approval, manage a care profile and weekly availability, and handle eligible bookings after approval.
- **Administrators:** Review caretaker applications and access basic platform operations.
- **API:** Spring Boot REST API with JWT access tokens, rotating refresh tokens, MySQL persistence, and Flyway migrations.

This is an MVP, not a production-complete service. Email/phone verification delivery, password reset, automated refunds, and several full admin workflows are not implemented.

## Technology

- Frontend: React, TypeScript, Vite, React Router, TanStack Query
- Backend: Java 21, Spring Boot, Spring Data JPA, Spring Security
- Database: MySQL 8.4 with Flyway
- Payments: Razorpay Checkout integration (optional for local development)

## Repository layout

```text
backend/                 Spring Boot API, migrations, and tests
frontend/                React application, tests, and browser tests
docker-compose.yml       MySQL, API, and frontend services
.env.example             Root environment template
frontend/.env.example    Frontend environment template
```

The backend uses controller, service, repository, entity, and API model layers. The frontend keeps its application code under `frontend/src/`.

## Requirements

For the complete Docker setup:

- Docker with Docker Compose

For running services locally:

- Java 21 and Maven 3.9+
- Node.js 20.19+ or 22.13+ and npm
- MySQL 8.4

## Run with Docker Compose

From the repository root, create the local environment file:

```bash
cp .env.example .env
```

Set `DB_PASSWORD` to a strong local-only password and replace `JWT_SECRET` with a private value of at least 32 characters. Razorpay values can remain empty if you are not testing payments.

Start the stack:

```bash
docker compose up --build
```

- Web app: <http://localhost:3000>
- API readiness: <http://localhost:8080/actuator/health/readiness>
- API health: <http://localhost:8080/api/health>
- Swagger UI: <http://localhost:8080/swagger-ui.html>

Flyway applies database migrations when the API starts. Stop the services with `docker compose down`; the MySQL data remains in the named `pawsaathi_mysql` volume. To remove that data as well, run `docker compose down --volumes`.

## Run services locally

Start MySQL 8.4 and create the database:

```sql
CREATE DATABASE pawsaathi_pune CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Copy the environment templates:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Edit `.env` with your local MySQL connection values and a private `JWT_SECRET` of at least 32 characters. The example uses the MySQL `root` user; a local user with access to `pawsaathi_pune` can be used instead.

In one terminal, load the root environment and start the API:

```bash
set -a
source .env
set +a
cd backend
mvn spring-boot:run
```

In a second terminal, start the frontend:

```bash
cd frontend
npm ci
npm run dev
```

Vite serves the app at <http://localhost:5173> and proxies `/api` requests to the local backend at `http://127.0.0.1:8080`. Flyway creates and updates the schema on backend startup.

## Environment configuration

The root `.env.example` lists the supported variables:

| Variable | Purpose |
| --- | --- |
| `DB_URL` | JDBC URL for the database |
| `DB_USERNAME`, `DB_PASSWORD` | Database credentials; required by the API and Compose setup |
| `JWT_SECRET` | JWT signing secret; provide a private value of at least 32 characters |
| `SPRING_PROFILES_ACTIVE` | Spring profile; defaults to `dev` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay order creation and payment verification |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature verification |
| `VITE_API_BASE_URL` | Frontend API base URL; defaults to `/api` |

Never commit `.env` files or real credentials. The frontend template currently sets `VITE_API_BASE_URL=/api`.

## API

All application endpoints are under `/api`. Swagger UI and the OpenAPI document are served by the backend at `/swagger-ui.html` and `/v3/api-docs`.

Main API areas include authentication (`/api/auth`), pets (`/api/pets`), bookings (`/api/bookings`), payments (`/api/payments`), caretaker profiles and availability, notifications, reviews, support tickets, and administration.

## Tests and checks

Run backend tests:

```bash
cd backend
mvn test
```

Run frontend checks:

```bash
cd frontend
npm ci
npm test
npm run typecheck
npm run lint
npm run build
```

`npm test` also checks that frontend API operations match the backend OpenAPI specification. MySQL/Testcontainers tests require Docker and may be skipped when Docker is unavailable. Browser tests can be run with `npm run test:e2e` from `frontend`; they require the Playwright browser dependencies.

## Notes

- Public registration supports customers and caretakers; administrators must be provisioned operationally.
- Razorpay credentials are optional for browsing and non-payment development flows. Use test-mode credentials for payment testing.
- Production use requires additional operational work, including HTTPS, secret management, backups, provider configuration, and the unfinished features noted above.
