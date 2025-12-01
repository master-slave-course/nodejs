# Prisma + MySQL master/replica example (database: toko)

This repository contains a minimal Prisma setup configured for a MySQL database with one master and two read replicas.

Configuration (in `.env`)
- Master (write): 127.0.0.1:3307 — DATABASE_URL and DIRECT_DATABASE_URL
- Replica 1 (read): 127.0.0.1:3308 — REPLICA_1
- Replica 2 (read): 127.0.0.1:3309 — REPLICA_2

Prisma configuration is in `prisma/schema.prisma`. We store data in a database named `toko` and use one master + two read replicas. Writes and migrations use the direct/master URL while reads in this example are routed manually to replica clients.

Quick steps

1. Install dependencies

```powershell
npm install
```

2. Generate Prisma client

```powershell
npm run generate
```

3. Run migrations (this will create the database tables on the master; ensure DB is reachable)

```powershell
npm run migrate
```

4. Seed demo data

```powershell
npm run seed
```

5. Start the demo script (creates an item then reads items):

```powershell
npm start
```

Development with auto-reload

For development you can use nodemon to restart the server automatically when files change:

```powershell
npm run dev
```

- Important
- Update `.env` with correct username/password for your environment — the sample `.env` uses `toko` as the database name.
- Make sure MySQL is running at the configured ports. In local testing you can run multiple MySQL instances (or containers) bound to the ports `3307`, `3308`, and `3309`.

Schema (table in `toko` database)

Table `items` should contain the following fields:

- id INT PRIMARY KEY AUTOINCREMENT
- name VARCHAR / String
- price INT
- stock INT
- created_at TIMESTAMP (default now)
- updated_at TIMESTAMP (updated automatically)

API

 - GET /api/items — returns all items from the `items` table (reads from replicas when available).
	 If *all* replicas are down, the API now responds with HTTP 500 and a JSON error:

	```json
	{ "error": "cannot read database replica" }
	```

	```powershell
	curl http://localhost:3000/api/items
	```

	Load balancer for slaves

	- This project includes a simple in-process replica load balancer implemented in `src/replicaLoadBalancer.js`.
	- Behavior:
		- Performs lightweight health checks (SELECT 1) on replicas every `REPLICA_HEALTH_INTERVAL_MS` ms (defaults to 10000).
		- Uses a round-robin selection among healthy replicas.
		- Falls back to master for reads if no replicas are healthy.

	Configuration (optional environment variable):

	- `REPLICA_HEALTH_INTERVAL_MS` — health-check interval in milliseconds (default: 10000)

	Project structure (MVC)

	This repository uses a lightweight MVC structure under `src/`:

	- controllers/ — request handlers (e.g., `controllers/itemsController.js`)
	- routes/      — express routers (e.g., `routes/items.js` mounted at `/api/items`)
	- services/    — business/data access layer (e.g., `services/itemService.js` wraps Prisma access and replica logic)
	- prisma clients and load balancer are in `src/prismaClients.js` and `src/replicaLoadBalancer.js` respectively

	The server entry point is `src/server.js`. The `src/index.js` demo script shows simple create + read using the service.

