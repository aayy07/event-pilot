Change Log — EventPilot / Micepad-inspired local app
This log records the project work and troubleshooting discussed so far. It distinguishes implemented starter functionality from planned work and issues observed during local setup.
Current state
- Local project folder: micepad-local/
- Frontend: Next.js / React / TypeScript
- Backend: FastAPI / SQLAlchemy async
- Database: SQLite local file (backend/eventpilot.db when started from the backend directory)
- Frontend persistence: browser localStorage demo state
- Backend persistence: SQLite for API-created records
- Frontend-to-backend integration: not implemented yet
Change history
1. Initial Micepad-inspired application scaffold
- Created a local event-management starter named EventPilot.
- Added a responsive dashboard with sample event data and navigation for event operations.
- Added demo UI workflows for attendees, search, check-in, QR credentials, badge preview/printing, CSV export, and attendance reports.
- Added a FastAPI backend with event, attendee, check-in, and event statistics endpoints.
- Added Windows startup scripts for the frontend and backend.
- Added initial README/setup guidance.
2. Initial backend dependency setup
- Backend dependencies were installed from requirements.txt, including FastAPI, Uvicorn, SQLAlchemy, asyncpg, Pydantic settings, and supporting packages.
- The first backend configuration attempted to connect to PostgreSQL at localhost:5432.
- Startup failed with Windows connection-refused errors for both ::1:5432 and 127.0.0.1:5432, indicating that no PostgreSQL server was accepting the connection at that address/port.
3. Switched the local database plan to SQLite
- Replaced the need for a locally running PostgreSQL server with a local SQLite .db file.
- Updated backend dependency configuration to use aiosqlite instead of the PostgreSQL asyncpg driver for the local setup.
- Configured the default database URL as sqlite+aiosqlite:///./eventpilot.db.
- Added/updated .env.example for SQLite and the local frontend CORS origin.
- Updated the Windows backend startup script to create/activate a virtual environment, install dependencies, create .env when absent, and replace an old PostgreSQL URL with the SQLite example configuration.
- The backend creates its SQLAlchemy tables at application startup.
4. Diagnosed Python environment mismatch
- A later launch using uvicorn app.main:app --reload failed with ModuleNotFoundError: No module named 'pydantic_settings'.
- The likely cause is that the command invoked global Python/Uvicorn instead of the project's virtual environment. The earlier console output showed packages being installed in backend\.venv, while the failing process loaded modules from the global Python 3.13 installation.
- Recommended using the project interpreter explicitly:
  .\.venv\Scripts\python.exe -m pip install -r requirements.txt
  .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
- This diagnosis is based on the supplied traceback. A successful backend launch after this command has not yet been confirmed.
5. Documentation refresh
- Rewrote README.md with the current SQLite setup, Windows startup instructions, API endpoints, current feature boundaries, and next steps.
- Added this changes.md file to record the project history and distinguish current implementation from planned features.
Current API surface
Method	Endpoint	Purpose
GET	/health	Health check
GET	/api/events	List events
POST	/api/events	Create event
GET	/api/events/{event_id}	Get one event
GET	/api/events/{event_id}/attendees	List/search event attendees
POST	/api/events/{event_id}/attendees	Create attendee
POST	/api/events/{event_id}/check-in/{code}	Check in attendee; indicate duplicate
GET	/api/events/{event_id}/stats	Attendance statistics


Known gaps / not yet implemented
- The frontend demo UI is not yet connected to the FastAPI endpoints; browser localStorage and SQLite are separate stores.
- Authentication and authorization are not implemented.
- Organization membership and event-specific staff permissions are not implemented.
- Production-ready ticketing/payments and email delivery are not implemented.
- Offline check-in synchronization, multi-device conflict resolution, and printer-specific integrations are not implemented.
- Session attendance, exhibitor lead capture, and full attendee engagement modules remain planned.
- No successful local smoke test after the virtual-environment fix has been reported yet.
Immediate next steps
1. Start backend using the virtual-environment interpreter and confirm /health and /docs load.
2. Confirm backend/eventpilot.db is created and API-created records persist after restart.
3. Connect frontend event and attendee screens to the API.
4. Add authentication, access control, migrations, validation, and automated tests before using real attendee data.