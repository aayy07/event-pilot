EventPilot — Local Event Management MVP
EventPilot is a local, Micepad-inspired event operations starter. It is intended to grow into a broader event-management application with organizer tools, attendee registration, onsite check-in, badge printing, and reporting.
Current status: The Next.js dashboard is a browser-persisted demo UI. The FastAPI API has separate SQLite-backed endpoints for events, attendees, check-in, and event statistics. The frontend is not yet connected to those API endpoints, so changes made in the demo dashboard do not currently persist to the SQLite database.

Features in this starter
Frontend
- Responsive Next.js / React dashboard.
- Event overview and sample event data.
- Attendee listing and search.
- Demo attendee creation and CSV export.
- QR credential / check-in interface.
- Badge preview and browser printing.
- Attendance metrics and reports.
- Browser localStorage persistence for demo UI state.
Backend API
- FastAPI application with interactive OpenAPI docs.
- SQLite database using SQLAlchemy's async interface and aiosqlite.
- Event creation and listing.
- Attendee creation and listing by event.
- Duplicate attendee-email check within an event.
- Check-in by attendee code, including duplicate-check-in response.
- Event statistics: registered, checked in, awaiting arrival, and attendance rate.
- CORS configured for the local frontend origin.
Requirements
- Windows 10/11 (the included .bat scripts are for Windows)
- Python 3.11 or newer
- Node.js 20 or newer
- Internet connection for the first dependency installation
- No PostgreSQL installation required. SQLite stores data in a local .db file.
Start the backend on Windows
Recommended: use the included script
From the project root, double-click run-api-windows.bat.

The script creates a virtual environment if needed, installs backend/requirements.txt, creates .env from .env.example if needed, and launches Uvicorn. If it detects an old PostgreSQL URL in backend/.env, it replaces it with the SQLite example configuration.

The database URL defaults to:
DATABASE_URL=sqlite+aiosqlite:///./eventpilot.db
CORS_ORIGINS=http://localhost:3000
Because the backend is started from the backend directory, the database file is created at backend/eventpilot.db.
Manual PowerShell setup
Open PowerShell in the project root and run:
cd .\backend\
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
Important: use  .\.venv\Scripts\python.exe -m uvicorn ... as shown, rather than plain uvicorn, to ensure Uvicorn uses the project's virtual environment and can import pydantic-settings and the other dependencies.

Open:
- API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health
If startup fails, confirm backend/.env uses the SQLite URL above and that installation completed successfully.
Start the frontend on Windows
From the project root, double-click run-frontend-windows.bat.

Or run manually:
cd .\frontend\
npm install
npm run dev
Open http://localhost:3000.

The frontend can currently be explored without the backend. Its demo data is stored in browser localStorage; this is separate from backend/eventpilot.db until API integration is implemented.
API endpoint summary
Method	Endpoint	Purpose
GET	/health	API health status
GET	/api/events	List events
POST	/api/events	Create an event
GET	/api/events/{event_id}	Retrieve an event
GET	/api/events/{event_id}/attendees	List attendees; optional q search
POST	/api/events/{event_id}/attendees	Add an attendee
POST	/api/events/{event_id}/check-in/{code}	Check in an attendee by code
GET	/api/events/{event_id}/stats	Event attendance statistics


Use /docs to inspect request schemas and try the endpoints interactively.
Data and safety notes
- The SQLite database is a local development database and should be backed up if its data matters.
- Do not use real attendee personal data in this demo build.
- This starter does not yet implement production authentication, organization-level tenant isolation, payment processing, email delivery, full offline synchronization, or a robust printer-specific integration.
- The API currently creates database tables at startup. A production deployment should use schema migrations such as Alembic.
- Do not commit .env, .venv, or the generated .db file to a public repository.
Next development steps
1. Connect dashboard data loading and mutations to the FastAPI API.
2. Add authentication and organization/event role-based access control.
3. Add CSV attendee import and robust validation.
4. Add attendance history and session-level attendance.
5. Build a proper offline-first check-in PWA with queued sync and conflict handling.
6. Add configurable registration forms, email notifications, and ticketing.
See [`changes.md`](./changes.md) for the project change log and current implementation status.