# Sales Dashboard

A small full-stack web application: user registration and login, a dashboard with charts and an
interactive orders table, a PostgreSQL database and a REST API.

The data set is the **Sample Superstore** orders data (9,994 order lines, 2014–2017), a widely used
sample data set that is also available on Kaggle. The copy in this repository
(`backend/data/superstore.csv`) comes from a public Hugging Face mirror, so no Kaggle login is
needed to run the project.

## Features

- Sign up / sign in / sign out with username and password
- Dashboard (only for signed-in users):
  - KPI cards: sales, profit, profit margin, orders, units sold
  - Line chart of sales and profit over time
  - Bar charts of sales by category and by region (click a bar to filter by it)
  - Bar chart of profit by sub-category (loss-making sub-categories in red)
  - Orders table with server-side pagination, sorting and search
  - Filters (date range, year presets, region, category, segment) that apply to every chart,
    every KPI and the table at once
- Data manipulation: add, edit and delete orders; charts and KPIs update immediately
- Responsive layout: on phones the table becomes a list of cards

## Tech stack

| Layer | Technology |
|---|---|
| API | Python 3.12, FastAPI, Pydantic v2 |
| Database access | SQLAlchemy 2.0, Alembic migrations, psycopg 3 |
| Database | PostgreSQL 16 |
| Auth | argon2 password hashes (`pwdlib`), JWT (`PyJWT`) in an httpOnly cookie |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Data fetching / charts | TanStack Query, Recharts |
| Tooling | Docker, Docker Compose, pytest |

## Quick start (Docker)

Requires Docker with Compose.

```bash
cp .env.example .env
docker compose up --build
```

The backend container applies the migrations and loads the data set on start, so the first start
takes a little longer.

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:8000 |
| Interactive API docs (Swagger) | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 (user, password and database name from `.env`) |

Open http://localhost:3000, create an account and you land on the dashboard.

Stop with `docker compose down`; add `-v` to also delete the database volume.

## Running without Docker

You need a running PostgreSQL (the `db` service from the compose file is enough:
`docker compose up -d db`).

Backend:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg://app:app@localhost:5432/sales
export JWT_SECRET=dev-secret
alembic upgrade head
python -m scripts.seed
uvicorn app.main:app --reload
```

Frontend (in another terminal):

```bash
cd frontend
npm install
npm run dev
```

The frontend proxies `/api/*` to `http://localhost:8000` by default; set `API_URL` to change it.

## Configuration

| Variable | Used by | Description |
|---|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | db | Database credentials for the compose `db` service |
| `DATABASE_URL` | backend | SQLAlchemy URL, e.g. `postgresql+psycopg://app:app@db:5432/sales` |
| `JWT_SECRET` | backend | Secret used to sign tokens. **Change it outside local development** |
| `JWT_EXPIRE_MINUTES` | backend | Optional, token lifetime, default 1440 (24 h) |
| `COOKIE_SECURE` | backend | Optional, set to `true` when served over HTTPS so the cookie is `Secure` |
| `FRONTEND_ORIGIN` | backend | Origin allowed by CORS, default `http://localhost:3000` |
| `API_URL` | frontend | Backend address used by the `/api` rewrite. It is read **at build time** (`http://backend:8000` in compose) |

## Tests

```bash
docker compose exec backend pytest
```

23 tests cover registration and login, protected endpoints, CRUD on orders, validation, pagination,
sorting, filtering, search and the correctness of the aggregations against known data. They run
against a separate `sales_test` database that is created automatically, and every test runs in a
rolled-back transaction, so the application data is never touched.

## API

Interactive documentation with request and response schemas is served at `/docs`. All `/orders`
and `/stats` endpoints require a signed-in user (the `access_token` cookie set by login/register).

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| POST | `/auth/register` | Create an account and sign in (201) |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | Sign out (204) |
| GET | `/auth/me` | Current user |
| GET | `/orders` | List orders: `page`, `page_size` (1–100), `sort_by`, `sort_dir`, `search` and the shared filters |
| GET | `/orders/{id}` | One order |
| POST | `/orders` | Create an order (201) |
| PATCH | `/orders/{id}` | Partially update an order |
| DELETE | `/orders/{id}` | Delete an order (204) |
| GET | `/stats/summary` | KPIs: sales, profit, margin, orders, units |
| GET | `/stats/timeseries` | Sales, profit and orders per `granularity=month\|year` |
| GET | `/stats/breakdown` | The same measures grouped `by=category\|sub_category\|region\|segment` |
| GET | `/stats/options` | Distinct regions, categories, segments and the date range (feeds the filter controls) |

The shared filters are `date_from`, `date_to`, `region`, `category` and `segment`. They are
accepted by `/orders` and by every `/stats` endpoint through one dependency, so the table and the
charts always describe the same slice of data.

## Database

Two tables, created by the Alembic migration `0001`:

- `users`: `id`, `username` (unique), `password_hash`, `created_at`
- `orders`: `id`, `order_id`, `order_date`, `ship_date`, `ship_mode`, `customer_name`, `segment`,
  `city`, `state`, `region`, `category`, `sub_category`, `product_name`, `sales`, `quantity`,
  `discount`, `profit`. Monetary columns are `NUMERIC`, not floats. There are indexes on
  `order_date`, `category` and `region`, the columns the filters and charts use.

The seed script (`backend/scripts/seed.py`) is idempotent: it loads the CSV only when `orders` is
empty.

## Project structure

```
backend/
  app/
    main.py            application factory, CORS, routers
    config.py          settings from environment variables
    db.py              engine, session, declarative base
    deps.py            current-user and DB-session dependencies
    security.py        password hashing, JWT
    models/            SQLAlchemy models
    schemas/           Pydantic request/response models
    routers/           auth, orders, stats
    services/filters.py  shared filter object applied to every query
  alembic/             migrations
  scripts/seed.py      CSV loader
  data/superstore.csv
  tests/
frontend/
  app/                 pages: /login, /register, /dashboard
  components/          dashboard widgets, DatePicker, Select, UI primitives
  lib/                 API client, query hooks, types, formatting
  proxy.ts             redirects unauthenticated users away from /dashboard
docker-compose.yml
```

## Design decisions

- **One flat `orders` table.** The data set is a single fact table and every view is a `GROUP BY`
  over it, so normalising customers and products into extra tables would add joins without adding
  value at this size. The trade-off is repeated customer and product text on each row.
- **Aggregation happens in SQL**, not in Python or the browser. The API returns small, ready-to-plot
  result sets regardless of how many rows match.
- **"Orders" counts distinct `order_id`.** One order contains several lines, so the KPI shows 5,009
  orders from 9,994 rows.
- **Token in an httpOnly cookie** rather than `localStorage`, so page scripts cannot read it. The
  browser only talks to its own origin: Next.js rewrites `/api/*` to the backend, so the cookie is
  first-party (`SameSite=Lax`) and CORS is not needed in the normal setup.
- **Route protection in two layers.** `proxy.ts` (the Next.js 16 name for middleware) only checks
  that a session cookie exists, to avoid showing the dashboard shell to anonymous visitors. The real
  check is the API: on a 401 the client clears the cookie and goes to `/login`.
- **Same response for "unknown user" and "wrong password"**, so usernames cannot be enumerated.
- **Sorting is whitelisted.** `sort_by` is a `Literal` of known columns and `by=` in the breakdown
  is a fixed set, so request parameters never reach SQL as identifiers.
- **Custom `Select` and `DatePicker`.** Native `<select>` popups are drawn by the operating system
  and open in different places on different platforms. The custom ones always open directly below
  the field, keep a fixed width so the layout does not jump, and are keyboard accessible.

## Known limitations

- No refresh tokens, password reset, e-mail verification or rate limiting on login.
- No CSRF tokens; protection relies on `SameSite=Lax` and on the API only accepting JSON bodies.
- Orders are edited line by line; there is no concept of editing a whole multi-line order.
- Frontend behaviour was checked by hand and with browser automation in Chromium only; there are no
  automated frontend tests in the repository.
- The sample data is anonymous demo data. Anyone can register an account and modify orders.

## Deploying

The stack is three containers (database, backend, frontend). For a hosted deployment:

1. Provision PostgreSQL and set `DATABASE_URL` for the backend.
2. Set a strong `JWT_SECRET`, `COOKIE_SECURE=true` and `FRONTEND_ORIGIN` to the public frontend URL.
3. Build the frontend with `API_URL` pointing at the backend's internal or public URL; it is baked
   into the build because Next.js evaluates rewrites at build time.
4. The backend image runs `alembic upgrade head` and the seed before starting `uvicorn`, so no manual
   database step is needed.
