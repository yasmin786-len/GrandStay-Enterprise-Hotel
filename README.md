# GrandStay Enterprise Hotel ERP — MERN Stack

A runnable multi-property hotel ERP starter built with **MongoDB, Express 5, React 19, Node.js and TypeScript**. It includes a three-level role hierarchy, granular API permissions, property/department data isolation, audit logs, seed data and operational workflows.


## Included modules

1. Executive dashboard
2. Properties
3. Users and role assignments
4. Roles and permissions
5. Guests and loyalty CRM
6. Rooms and live room status
7. Reservations, check-in, checkout and cancellation
8. Housekeeping assignments and inspection
9. Restaurant POS and room-charge posting
10. Guest folios, charges, settlement and refunds
11. Inventory and reorder alerts
12. Purchase requisitions and approval
13. Maintenance work orders
14. Employees
15. Banquets and events
16. Security incidents
17. Audit logs

## Role-based access model

The API is the security authority. Hiding a button in React is only a convenience; every endpoint checks permissions and data scope again.

- **Level 1 — Corporate:** group-wide records or assigned regional properties.
- **Level 2 — Property management:** one or more assigned hotels.
- **Level 3 — Department operations:** assigned property plus assigned department.

Access decisions combine:

- permission, such as `reservations.checkin`
- role scope: `corporate`, `property`, `department`, or `self`
- assigned `propertyIds`
- assigned `departmentIds`
- workflow state, such as allowing checkout only after check-in

## Seeded roles

- Corporate Administrator
- Group Owner
- Corporate Finance Director
- Regional Manager
- General Manager
- Front Office Manager
- Housekeeping Manager
- Food & Beverage Manager
- Finance Manager
- Purchase Manager
- Engineering Manager
- HR Manager
- Sales & Banquet Manager
- Security Manager
- Receptionist
- Night Auditor
- Room Attendant
- Waiter / POS Operator
- Storekeeper
- Maintenance Technician

Every seeded user uses:

```text
Email: <role_code>@grandstay.test
Password: Hotel@123
```

Main administrator:

```text
corporate_admin@grandstay.test
Hotel@123
```

Other useful accounts:

```text
general_manager@grandstay.test
receptionist@grandstay.test
housekeeping_manager@grandstay.test
fnb_manager@grandstay.test
finance_manager@grandstay.test
technician@grandstay.test
```

## Technology

### Backend

- Node.js 20.19+
- Express 5
- MongoDB and Mongoose
- TypeScript
- JWT authentication
- bcrypt password hashing
- Zod request validation
- Helmet, CORS and Morgan

### Frontend

- React 19
- Vite
- TypeScript
- React Router
- Axios
- Responsive custom CSS

## Local setup

### 1. Prerequisites

Install:

- Node.js 20.19 or newer
- MongoDB 7/8, or Docker Desktop
- npm

### 2. Install dependencies

```bash
cd hotel-erp-mern
npm install
```

### 3. Configure environment

Windows PowerShell:

```powershell
Copy-Item apps/server/.env.example apps/server/.env
Copy-Item apps/web/.env.example apps/web/.env
```

Linux/macOS:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

Change `JWT_SECRET` in `apps/server/.env` before deployment.

### 4. Start MongoDB

Local MongoDB:

```bash
mongod
```

Or start only MongoDB with Docker:

```bash
docker compose up -d mongo
```

### 5. Seed roles and demo records

```bash
npm run seed
```

The seed command resets the configured database before creating demo data.

### 6. Run backend and frontend

```bash
npm run dev
```

Open:

```text
Frontend: http://localhost:5173
API:      http://localhost:5000/api
Health:   http://localhost:5000/api/health
```

## Full Docker setup

```bash
docker compose up --build
```

Then seed the database in the API container:

```bash
docker compose exec api node apps/server/dist/seed.js
```

For regular local development, `npm run seed` is simpler because the TypeScript seed runs directly through `tsx`.

Open:

```text
Frontend: http://localhost:4173
API:      http://localhost:5000/api
```

## Production build

```bash
npm run build
npm run start
```

The React build is generated in `apps/web/dist` and the API build in `apps/server/dist`.

## Working business workflows

### Reservation to checkout

1. Create a guest.
2. Create a room or select an available room.
3. Create a reservation.
4. Use **Check in**. The API validates room availability, changes the room to `occupied`, creates a folio and posts room charges.
5. Add POS orders or folio charges.
6. Settle the folio.
7. Use **Check out**. The room becomes `vacant_dirty` and a priority housekeeping task is created.
8. Complete and inspect the housekeeping task. The room becomes `inspected`.

### Restaurant room charge

1. Create a POS order with an in-house reservation.
2. Use **Post to room**.
3. The order total is posted to the matching open folio.
4. The order becomes paid by `room_charge`.

### Procurement approval

1. A department submits a purchase requisition with line items.
2. An authorised manager approves or rejects it.
3. The approver, timestamp and note are stored.
4. The change appears in the audit log.

### Maintenance

1. Create a work order.
2. Assign a technician.
3. Move it through open, assigned, in progress and completed/closed states.
4. Record parts, labour and resolution.

## API conventions

All protected requests require:

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

List endpoints support:

```text
?page=1&limit=20&search=text&status=confirmed
```

Responses use:

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "pages": 0
  }
}
```

See [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and [docs/RBAC.md](docs/RBAC.md).

## Production hardening checklist

Before a real hotel deployment, add or integrate:

- rotating refresh tokens and token revocation
- MFA for privileged roles
- Redis-backed rate limiting and sessions
- MongoDB transactions for financial workflows
- payment gateway tokenisation; never store raw card information
- object storage and malware scanning for attachments
- OTA/channel-manager connectors
- door-lock and key-card integration
- GST/VAT/local tax configuration by jurisdiction
- immutable external audit archive
- automated backups and point-in-time restore
- SSO/SAML for corporate users
- observability, alerting and centralised logs
- approval limits by amount and segregation-of-duties rules
- automated API, integration, security and end-to-end tests

This repository is a substantial working ERP foundation and reference implementation. Hotel-specific statutory integrations, payment certification, channel contracts and physical-device integrations require environment-specific credentials and certification.
