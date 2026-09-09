# 📦 Waypoint — Parcel Delivery & Logistics Management API

[![Bun](https://img.shields.io/badge/Runtime-Bun-black?logo=bun)](https://bun.sh)
[![Express](https://img.shields.io/badge/Framework-Express_v5-000000?logo=express)](https://expressjs.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript_v5-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/ORM-Prisma_v7-2D3748?logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql)](https://www.postgresql.org)
[![Stripe](https://img.shields.io/badge/Payments-Stripe-635BFF?logo=stripe)](https://stripe.com)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel)](https://waypointapi.vercel.app/)

> **Live Hosted API Base URL:** [https://waypointapi.vercel.app](https://waypointapi.vercel.app/)  
> **API Version:** `v1` (`https://waypointapi.vercel.app/api/v1`)

Waypoint is an enterprise-ready, modular logistics and parcel delivery backend API. Built with Express 5, Bun, PostgreSQL, and Prisma, it powers end-to-end shipment lifecycles, automated courier dispatching, Stripe payment integration, real-time status transitions, and actionable business intelligence analytics with CSV/JSON report exports.

---

## 📑 Table of Contents

- [Core Features](#-core-features)
- [User Roles & Access Control](#-user-roles--access-control)
- [End-to-End Workflow](#-end-to-end-workflow)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [API Documentation & Postman](#-api-documentation--postman)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Database Migration & Generation](#database-migration--generation)
  - [Running the Server](#running-the-server)
  - [Stripe Webhook Listener](#stripe-webhook-listener-local-testing)
- [Scripts Reference](#-scripts-reference)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Core Features

- **🔐 Dual-Mode Authentication & Security**
  - JWT authentication supporting both `Authorization: Bearer <token>` headers and HTTP-only Secure Cookies.
  - Role-Based Access Control (RBAC) enforced via route-level guards (`CUSTOMER`, `COURIER`, `ADMIN`).
  - Google OAuth 2.0 social login integration.
  - Strict input validation on all routes via Zod schemas.
  - Centralized uniform error handling and HTTP status mapping.

- **🚚 Shipment & Logistics Lifecycle**
  - Instant parcel creation with auto-generated tracking numbers.
  - Courier assignment with distribution hub association.
  - Step-by-step state progression: `PENDING` ➔ `ASSIGNED` ➔ `IN_TRANSIT` ➔ `DELIVERED` (or `CANCELLED`).
  - Strict ownership checks preventing unauthorized courier or customer mutations.

- **💳 Seamless Stripe Payment System**
  - Hosted Stripe Checkout Session creation per shipment.
  - Webhook listener handling `checkout.session.completed` events with cryptographic signature verification.
  - Real-time automatic synchronization of shipment payment status (`UNPAID` ➔ `PAID`).

- **🏢 Distribution Hub Management**
  - Full CRUD operations for logistics hubs and processing centers.
  - Automatic relationship tracking linking hubs to incoming and routed parcels.

- **📊 Analytics & Reporting Engine**
  - **Admin Overview**: High-level platform KPIs (total revenue, delivery success rate, shipment volume).
  - **Time-Series Trends**: Volume and revenue aggregated by `day`, `week`, or `month`.
  - **Performance Leaderboards**: Hub throughput rankings and courier delivery completion statistics.
  - **Exportable Reports**: Detailed shipments and financial transaction ledgers exportable as `json` or downloadable `csv`.
  - **Role-Specific Dashboards**: Personal analytics views tailored for individual couriers and customers.

---

## 👥 User Roles & Access Control

| Role       | Permissions & Scope                                                                                                                                     |
| :--------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `CUSTOMER` | Creates shipments, views own parcel history, initiates Stripe checkout, views personal shipping analytics.                                              |
| `COURIER`  | Views shipments assigned to them, advances delivery statuses (`IN_TRANSIT`, `DELIVERED`), views personal delivery stats.                                |
| `ADMIN`    | Full administrative access: creates/manages hubs, assigns couriers to shipments, inspects all shipments, accesses platform analytics & exports reports. |

---

## 🔄 End-to-End Workflow

For a detailed step-by-step walkthrough covering all user roles (**Customer**, **Courier**, and **Admin**) with sequence diagrams and request payloads, please refer to the dedicated guide:

👉 **[Complete End-to-End Workflow & Testing Guide (WORKFLOW.md)](WORKFLOW.md)**

### Lifecycle at a Glance:
1. **🏢 Hub Setup:** Admin provisions regional distribution hubs (`POST /api/v1/hubs`).
2. **📦 Booking & Payment:** Customer books parcel (`POST /api/v1/shipments`) and completes Stripe Checkout (`POST /api/v1/payments/create-checkout-session`).
3. **🎯 Dispatching:** Admin assigns an active courier and hub (`PATCH /api/v1/shipments/:id/assign-courier`).
4. **🛵 Delivery:** Courier transitions parcel from `IN_TRANSIT` to `DELIVERED` (`PATCH /api/v1/shipments/:id/status`).
5. **📊 Auditing & BI:** Role-tailored metrics for customers & couriers, plus platform-wide analytics and downloadable CSV reports for admins.

---

## 🛠 Tech Stack

- **Runtime & Execution:** [Bun](https://bun.sh/)
- **Server Framework:** [Express.js v5](https://expressjs.com/)
- **Programming Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM v7](https://www.prisma.io/) (Multi-file schema modularity)
- **Validation Engine:** [Zod](https://zod.dev/)
- **Authentication:** [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)
- **Payments:** [Stripe Node SDK](https://stripe.com/docs/api)
- **Deployment Platform:** [Vercel](https://vercel.com/)

---

## 🏛 Project Architecture

Adheres to a clean, domain-driven modular structure:

```text
src/
├── app.ts                  # Express application setup, CORS, cookies & root routes
├── server.ts               # Server entry point and database connection initialization
├── configs/
│   └── env-configs.ts      # Validated environment configuration constants
├── lib/
│   ├── jwt.ts              # JWT signing and verification utilities
│   ├── prisma.ts           # Shared Prisma client instance
│   └── stripe.ts           # Stripe SDK client initialization
├── middlewares/
│   ├── auth.middleware.ts  # protect, requireRole, authGuard middleware
│   ├── global-error-handler.ts # Centralized uniform error formatting
│   ├── not-found.ts        # 404 handler for unmapped endpoints
│   └── validate-request.ts # Zod request schema validation interceptor
├── modules/
│   ├── analytics/          # BI metrics, trends, leaderboards & CSV exports
│   ├── auth/               # Registration, login, refresh tokens, Google OAuth
│   ├── hub/                # Distribution hub CRUD operations
│   ├── payment/            # Stripe checkout sessions & webhook verification
│   ├── shipment/           # Parcel creation, courier assignment & status updates
│   └── users/              # User query and profile retrieval
├── routes/
│   └── index.ts            # Main application router mounting all feature modules
└── utils/                  # Response formatters, async wrappers, and AppError class
```

---

## 📮 API Documentation & Postman

A complete, production-ready Postman collection and environment are included in this repository, pre-configured with the live hosted URL (`https://waypointapi.vercel.app`):

- **Collection:** [`Waypoint_API.postman_collection.json`](Waypoint_API.postman_collection.json)
- **Environment:** [`Waypoint_Production.postman_environment.json`](Waypoint_Production.postman_environment.json)

### Quick Import in Postman:

1. Open Postman and click **Import**.
2. Select or drag both the Collection and Environment JSON files.
3. Choose the active environment: **Waypoint API (Production - Vercel)**.
4. Run `01. Authentication -> Login User` — the collection test script will automatically store your `accessToken` in the environment for subsequent authenticated requests.

---

## 📡 API Reference

Base URL: `https://waypointapi.vercel.app/api/v1`

### 00. Health Check

| Method | Endpoint                          | Access | Description                            |
| :----- | :-------------------------------- | :----- | :------------------------------------- |
| `GET`  | `https://waypointapi.vercel.app/` | Public | Server liveness & welcome verification |

### 01. Authentication (`/auth`)

| Method | Endpoint                | Access | Description                                              |
| :----- | :---------------------- | :----- | :------------------------------------------------------- |
| `POST` | `/auth/register`        | Public | Register new user account                                |
| `POST` | `/auth/login`           | Public | Authenticate user & receive access token / cookies       |
| `GET`  | `/auth/me`              | Bearer | Retrieve profile of currently authenticated user         |
| `POST` | `/auth/refresh-token`   | Public | Generate fresh access token using refresh token          |
| `POST` | `/auth/logout`          | Public | Clear authentication session cookies                     |
| `POST` | `/auth/google`          | Public | Social login using Google ID token or authorization code |
| `GET`  | `/auth/google`          | Public | Initiates Google OAuth redirect flow                     |
| `GET`  | `/auth/google/callback` | Public | Google OAuth callback handler                            |

### 02. Users (`/users`)

| Method | Endpoint | Access  | Description                                 |
| :----- | :------- | :------ | :------------------------------------------ |
| `GET`  | `/users` | `ADMIN` | List all registered users (Requires ADMIN) |

### 03. Shipments (`/shipments`)

| Method  | Endpoint                        | Access     | Description                                            |
| :------ | :------------------------------ | :--------- | :----------------------------------------------------- |
| `POST`  | `/shipments`                    | `CUSTOMER` | Book a new parcel shipment                             |
| `GET`   | `/shipments/my-shipments`       | `CUSTOMER` | List shipments created by the current customer         |
| `GET`   | `/shipments/assigned-shipments` | `COURIER`  | List shipments assigned to the current courier         |
| `PATCH` | `/shipments/:id/status`         | `COURIER`  | Update status (`IN_TRANSIT`, `DELIVERED`, `CANCELLED`) |
| `GET`   | `/shipments`                    | `ADMIN`    | List all shipments in the database                     |
| `GET`   | `/shipments/all`                | `ADMIN`    | Alternative alias to list all shipments                |
| `PATCH` | `/shipments/:id/assign-courier` | `ADMIN`    | Assign a courier and logistics hub to a parcel         |

### 04. Hubs (`/hubs`)

| Method   | Endpoint    | Access  | Description                                  |
| :------- | :---------- | :------ | :------------------------------------------- |
| `POST`   | `/hubs`     | `ADMIN` | Create a new regional distribution hub       |
| `GET`    | `/hubs`     | `ADMIN` | List all operational hubs with parcel counts |
| `GET`    | `/hubs/:id` | `ADMIN` | Retrieve specific hub details by UUID        |
| `PATCH`  | `/hubs/:id` | `ADMIN` | Update hub name or street address            |
| `DELETE` | `/hubs/:id` | `ADMIN` | Delete a hub record                          |

### 05. Payments (`/payments`)

| Method | Endpoint                            | Access     | Description                                                |
| :----- | :---------------------------------- | :--------- | :--------------------------------------------------------- |
| `POST` | `/payments/create-checkout-session` | `CUSTOMER` | Generate Stripe Checkout Session URL for a shipment        |
| `POST` | `/payments/create-intent`           | `CUSTOMER` | Backward-compatible alias for checkout session creation    |
| `POST` | `/payments/webhook`                 | Stripe     | Handle Stripe webhook events with cryptographic validation |
| `POST` | `/payments/webhook/stripe`          | Stripe     | Webhook alternative alias route                            |

### 06. Analytics (`/analytics`)

| Method | Endpoint                               | Access     | Description                                                |
| :----- | :------------------------------------- | :--------- | :--------------------------------------------------------- |
| `GET`  | `/analytics/admin/overview`            | `ADMIN`    | Total revenue, shipment volume, and completion rate        |
| `GET`  | `/analytics/admin/trends`              | `ADMIN`    | Historical volume & revenue by `interval=day\|week\|month` |
| `GET`  | `/analytics/admin/status-distribution` | `ADMIN`    | Shipment breakdown by lifecycle state                      |
| `GET`  | `/analytics/admin/hub-performance`     | `ADMIN`    | Throughput and volume rankings per hub                     |
| `GET`  | `/analytics/admin/courier-performance` | `ADMIN`    | Delivery completion leaderboard                            |
| `GET`  | `/analytics/admin/reports/shipments`   | `ADMIN`    | Export shipments report (`format=json` or `csv`)           |
| `GET`  | `/analytics/admin/reports/payments`    | `ADMIN`    | Export financial payments report (`format=json` or `csv`)  |
| `GET`  | `/analytics/courier/overview`          | `COURIER`  | Courier personal assignment and delivery metrics           |
| `GET`  | `/analytics/customer/overview`         | `CUSTOMER` | Customer personal shipping spend and history summary       |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.1+ recommended)
- [PostgreSQL](https://www.postgresql.org/) database (local instance or cloud like Neon / Supabase)
- [Stripe CLI](https://stripe.com/docs/stripe-cli) (optional, for local webhook testing)

### Installation

Clone the repository and install project dependencies:

```bash
git clone https://github.com/your-username/waypoint-backend.git
cd waypoint-backend
bun install
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# PostgreSQL Database Connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/waypoint_db?schema=public"

# JWT Secrets & Expiry
JWT_ACCESS_SECRET="your_super_secret_jwt_access_key"
JWT_ACCESS_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="your_super_secret_jwt_refresh_key"
JWT_REFRESH_EXPIRES_IN="30d"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/v1/auth/google/callback"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

### Database Migration & Generation

Synchronize the Prisma schema with your PostgreSQL database:

```bash
# Generate Prisma Client
bun run db:generate

# Push schema changes to database (Development)
bunx prisma db push

# Or run migrations
bun run db:migrate init
```

### Running the Server

Start the local development server with hot reload:

```bash
bun run dev
```

The server will be available at `http://localhost:5000`.

### Stripe Webhook Listener (Local Testing)

To test Stripe payment checkout and webhooks locally:

```bash
stripe listen --forward-to localhost:5000/api/v1/webhook/stripe
```

Copy the printed webhook signing secret (`whsec_...`) and update `STRIPE_WEBHOOK_SECRET` in your `.env`.

---

## 📜 Scripts Reference

| Command               | Description                                               |
| :-------------------- | :-------------------------------------------------------- |
| `bun run dev`         | Starts development server with `tsx watch` hot reloading  |
| `bun run build`       | Compiles TypeScript and runs type checks (`tsc --noEmit`) |
| `bun run db:generate` | Generates the latest Prisma Client based on schemas       |
| `bun run db:migrate`  | Runs database migrations                                  |
| `bunx prisma studio`  | Launches Prisma Studio GUI in the browser                 |

---

## ☁️ Deployment

The application is configured for deployment on [Vercel](https://vercel.com/) via `vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/src/server.ts" }]
}
```

Ensure the following build settings and environment variables are set in your Vercel Project Settings:

- Build Command: `bunx prisma generate && bunx tsc --noEmit`
- Install Command: `bun install`
- Add all required environment variables (`DATABASE_URL`, `JWT_ACCESS_SECRET`, `STRIPE_SECRET_KEY`, etc.).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
