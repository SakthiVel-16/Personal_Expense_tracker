# FinanceOS - Project Architecture & Documentation

## Overview
FinanceOS is a highly secure, modern, and aesthetic personal expense tracking application. It features a stunning dark-mode UI with glassmorphic effects, ambient lighting, and fully responsive layouts. The app is built with a decoupled architecture, separating the client-side UI from the backend API.

## Tech Stack
### Frontend (Client)
- **Framework:** React + Vite (Fast compilation and HMR)
- **Styling:** Tailwind CSS (Utility-first CSS, dark theme configuration)
- **Routing:** React Router DOM (Client-side routing)
- **Icons:** Lucide React
- **HTTP Client:** Axios (Configured with interceptors for global authentication handling)
- **Charts:** Recharts (For analytics and net worth visualization)

### Backend (Server)
- **Framework:** Node.js with Express
- **Database:** Turso (libSQL/SQLite distributed cloud database)
- **Database Client:** `@libsql/client` (Async queries via HTTP)
- **Authentication:** JWT (JSON Web Tokens), `bcrypt` for hashing, `cookie-parser` for secure HTTP-only cookies
- **Security:** `express-rate-limit` (brute force protection), CORS configuration

## Directory Structure
```
expense-tracker/
├── client/                     # Frontend Vite App
│   ├── src/
│   │   ├── components/         # Reusable UI elements (Sidebar, TopBar, Charts, Widgets)
│   │   ├── context/            # React Contexts (DateContext for global date filtering)
│   │   ├── lib/                # Utilities (Axios API configuration)
│   │   ├── pages/              # Route components (Dashboard, Analytics, Login, etc.)
│   │   ├── App.jsx             # Main routing and layout component
│   │   └── index.css           # Global CSS, scrollbar hiding, ambient colors
│   └── package.json            # Frontend dependencies
│
├── server/                     # Backend Express App
│   ├── database/               # Database connection logic
│   │   └── init.js             # Connects to Turso, creates tables, provides async query wrappers
│   ├── middleware/             # Express Middlewares
│   │   └── auth.js             # Validates JWT tokens on protected API routes
│   ├── routes/                 # API Endpoints
│   │   ├── ai.js               # AI Coach integration
│   │   ├── analytics.js        # Aggregation endpoints for charts
│   │   ├── auth.js             # Login, Logout, Session validation
│   │   ├── budgets.js          # CRUD for budgets
│   │   ├── categories.js       # CRUD for transaction categories
│   │   ├── networth.js         # Historical net worth tracking
│   │   ├── savings.js          # Savings goals and contributions
│   │   └── transactions.js     # CRUD for main transactions
│   ├── index.js                # Server entry point, route mounting, express config
│   └── package.json            # Backend dependencies
└── PROJECT_CONTEXT.md          # This file
```

## Security & Authentication Flow
The application uses a **Hybrid JWT Session Model** designed for a single admin user.

### 1. The Secrets
- In the backend `server/.env`, there is an `ADMIN_PASSWORD_HASH` (a bcrypt hash of the master password) and a `JWT_SECRET` (a strong random string). The raw password is NEVER stored.

### 2. The Login Process (`/api/auth/login`)
- The user enters the password on the frontend `/login` page.
- The backend compares the password using `bcrypt.compare`.
- If successful, it generates a JWT with a strict 1-hour expiration.
- The JWT is sent back in an `httpOnly`, `secure`, `SameSite=Strict` cookie (it cannot be accessed by frontend JavaScript, protecting against XSS).
- The backend login endpoint is protected by `express-rate-limit` to prevent brute-forcing.

### 3. The "Tab Close" Killswitch
- When the user successfully logs in, the frontend stores a flag in `sessionStorage`.
- `sessionStorage` is unique to that specific browser tab and is instantly destroyed if the tab is closed.
- When the `App.jsx` component mounts, it checks for this flag. If the flag is missing (e.g., the user opened a new tab or closed the old one), it instantly calls `/api/auth/logout` to destroy the backend cookie and forces the user back to the login screen.

## Database Flow (Turso)
- The database is hosted on **Turso** (a globally distributed libSQL database).
- Connections are made asynchronously using the `@libsql/client` package via HTTPS, not a local SQLite file.
- The connection URL and Auth Token are securely stored in `server/.env`.
- In `server/database/init.js`, we export custom wrapper functions (`dbRun`, `dbAll`, `dbGet`) that execute async queries on Turso but format the responses in a way that our existing Express routes understand. This avoided needing to completely rewrite the logic for processing rows!

## Common Tasks & Maintenance

**To add a new API route:**
1. Create a new file in `server/routes/`.
2. Ensure you use `async/await` since all Turso db calls are asynchronous.
3. Mount the route in `server/index.js` wrapped with the `requireAuth` middleware.
4. Add the frontend logic to call the endpoint via `api.js` (which automatically handles passing the cookie and handling 401 unauthenticated errors).

**To change the master password:**
Run the following inside the `server/` folder using Node to generate a new hash:
```javascript
const bcrypt = require('bcrypt');
console.log(bcrypt.hashSync('NEW_PASSWORD_HERE', 10));
```
Then paste the output string into `server/.env` under `ADMIN_PASSWORD_HASH`.

## Future Deployments
- **Backend:** Designed to be hosted on Render (Node.js web service). Requires adding the environment variables (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`, `ADMIN_PASSWORD_HASH`) in the Render dashboard.
- **Frontend:** Designed to be hosted on Vercel. Needs `VITE_API_BASE_URL` set to the deployed Render backend URL. Ensure API calls are correctly pointed so the CORS and cookies function securely.
