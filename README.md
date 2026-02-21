# AI Med School Application Assistant

This is a code bundle for AI Med School Application Assistant.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

1. Frontend (Terminal A)

Start from the project root so Vite picks up vite.config.ts (proxy).

```
cd "/Users/aksharreddy/Downloads/AI Med School Application Assistant"
npm install
npm run dev
# open http://localhost:5173
```

2. Backend (Terminal B)

```
cd "/Users/aksharreddy/Downloads/AI Med School Application Assistant/backend"
npm install
npm run start
# backend listens on http://localhost:4000 by default
```

## Recommended: automatic dev launcher (avoids port conflicts)

A launcher will find a free API port and start both the backend and the Vite dev server with the proper environment variables.

From the project root run:

```
npm run dev:auto
```

What it does:
- Picks an available port (tries 4000–4010, then an ephemeral port).
- Starts the backend with PORT and VITE_API_PORT set to that port.
- Starts the frontend (Vite) with VITE_API_PORT set so the proxy forwards /api to the running backend.

When to use:
- Use `npm run dev:auto` if port 4000 is sometimes in use — the launcher handles finding an open port automatically.

Alternative (manual) — two terminals
- Terminal A (frontend):
  ```
  cd "/Users/aksharreddy/Downloads/AI Med School Application Assistant"
  npm install
  npm run dev
  ```

- Terminal B (backend):
  ```
  cd "/Users/aksharreddy/Downloads/AI Med School Application Assistant/backend"
  npm install
  PORT=4001 npm run start   # example: run backend on a different port
  ```

If you change the backend port manually, start the frontend with VITE_API_PORT set to match so Vite's proxy routes /api correctly:

```
VITE_API_PORT=4001 npm run dev
```

Troubleshooting
- If you see ECONNREFUSED from Vite proxy, ensure the backend is running and listening on the port Vite expects (VITE_API_PORT or 4000).
- Keep loopback hostnames consistent during OAuth. If `GOOGLE_REDIRECT_URI` uses `127.0.0.1`, use `127.0.0.1` for your frontend URL too (and vice versa for `localhost`) to avoid session cookies being written to one host alias and read from another.
- To force-stop a process using a port:
  ```
  lsof -ti:<port> | xargs -r kill
  ```

## Google OAuth setup (Authorization Code flow)

Follow these steps to enable real Google sign-in.

1) Create OAuth Consent Screen in Google Cloud Console.
2) Create OAuth Client ID of type **Web application**.
3) Authorized redirect URIs should include:
   - `http://localhost:<BACKEND_PORT>/api/auth/google/callback`
   - `https://<prod-domain>/api/auth/google/callback`
4) Authorized JavaScript origins (optional for this flow) include:
   - `http://localhost:<FRONTEND_PORT>`
   - `https://<prod-domain>`
5) Scopes: `openid`, `email`, `profile`.

### Required environment variables

Backend (`backend/.env` or environment):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (must exactly match Google Console)
- `FRONTEND_URL` (e.g., `http://localhost:5173`)
- `SESSION_JWT_SECRET` (random strong string)
- `DEV_AUTH=true` (optional dev fallback when Google credentials are missing)

Frontend (`.env` for Vite):
- `VITE_API_BASE_URL` (e.g., `http://localhost:4000`)
- `VITE_GOOGLE_CLIENT_ID` (optional, used only to toggle dev fallback UI)
- `VITE_DEV_AUTH=true` (optional dev fallback UI in development)
