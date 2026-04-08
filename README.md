# Run and deploy DinarLive

<img width="1772" height="1264" alt="image" src="https://github.com/user-attachments/assets/7de19f47-f448-478a-af2d-16f741660b45" />

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example`.
3. Run the app:
   `npm run dev`

The live exchange rates now come from a backend `/api/rates` endpoint, not from Gemini. The frontend no longer needs any secret key.

## Data Sources

- Local market rates are fetched server-side from public Telegram market channels.
- The official USD rate is fetched server-side from the [Central Bank of Iraq](https://cbi.iq/).
- Global FX rates for EUR, TRY, GBP, and IRR are fetched from [ExchangeRate-API open access](https://www.exchangerate-api.com/docs/free).

## Deployment

### Vercel

Vercel is the easiest deployment target for the current codebase.

- The frontend builds as a normal Vite app.
- The backend runs through [`api/rates.ts`](./api/rates.ts) as a Vercel Function.
- No `VITE_API_BASE_URL` is required when frontend and API are deployed together on the same Vercel project.

### Render

This repo is now ready for a two-service Render setup:

- A Node web service for the backend API
- A static site for the frontend

The included [`render.yaml`](./render.yaml) creates both services. After the backend is deployed, set:

`VITE_API_BASE_URL=https://your-backend-service.onrender.com`

And set this on the backend:

`FRONTEND_ORIGIN=https://your-frontend-site.onrender.com`

The backend start command is:

`npm run start:backend`

You can test the backend health endpoint at:

`/healthz`

## Environment Variables

- `GEMINI_API_KEY`
  Optional. Only needed for the chat assistant backend route.
- `GEMINI_CHAT_MODEL`
  Optional. Defaults to `gemini-2.5-flash` for the backend chat route.
- `VITE_API_BASE_URL`
  Optional. Use this when your frontend and backend are hosted on different domains.
- `FRONTEND_ORIGIN`
  Optional but recommended for the backend when frontend and backend are on different domains.
- `TELEGRAM_MARKET_SOURCES`
  Optional comma-separated override for the Telegram market channels used by the backend.

## Services

### Frontend

- Build command: `npm install && npm run build`
- Publish directory: `dist`

### Backend

- Build command: `npm install`
- Start command: `npm run start:backend`
- Health check: `/healthz`
