# EventPilot

EventPilot is a Next.js event-registration app. An administrator signs in, creates an event, then shares a signed registration link or its QR code. Participants provide their name and email; only addresses ending in `@sc.com` can view the event details.

## Run locally

Requirements: Node.js 20 or newer.

1. Open a terminal in `frontend/` and install dependencies with `npm install`.
2. Copy `frontend/.env.example` to `frontend/.env.local`.
3. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a private random `APP_SECRET` of at least 32 characters.
4. Run `npm run dev` from `frontend/` and open [http://localhost:3000](http://localhost:3000).

The root `run-frontend-windows.bat` script starts the frontend on Windows. The old FastAPI backend is no longer used.

## Deploy to Vercel

1. Import the repository into Vercel and set **Root Directory** to `frontend`.
2. Add these environment variables for the deployment:
   - `ADMIN_EMAIL`: administrator sign-in email.
   - `ADMIN_PASSWORD`: a strong administrator password.
   - `APP_SECRET`: a private random secret of at least 32 characters. Keep it stable; changing it invalidates existing registration links and admin sessions.
3. Deploy with the default Next.js build settings.

Do not commit `.env.local` or share `APP_SECRET`.

## App flow

- **Admin:** Sign in with the configured credentials, create an event with its title, date, time, venue, and description, then copy its registration URL or QR.
- **Participant:** Open the link or scan the QR, enter their name and email, and pass the server-side `@sc.com` check to see the event details. Other email domains are denied.

## MVP storage limits

This version uses Next.js route handlers and does not require the Python backend. Event records are kept in the administrator's browser `localStorage`; a signed registration URL carries the event details so participants can open it on another device. Clearing that browser or using another admin browser loses the event list. Participant submissions are validated but are not stored or emailed. Add a persistent database and an email provider before using this for real attendee management or invitations.
