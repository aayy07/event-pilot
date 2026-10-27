@echo off
cd /d "%~dp0backend"
if not exist .venv (
  python -m venv .venv
)
call .venv\Scripts\activate.bat
python -m pip install -r requirements.txt
if not exist .env copy .env.example .env
if exist .env (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$content = Get-Content .env -Raw; if ($content -match 'postgresql\+asyncpg') { $updated = $content -replace 'postgresql\+asyncpg://postgres:postgres@localhost:5432/eventpilot', 'sqlite+aiosqlite:///./eventpilot.db'; Set-Content -Path .env -Value $updated }"
)
echo Starting EventPilot backend with SQLite database...
python -m uvicorn app.main:app --reload
pause
