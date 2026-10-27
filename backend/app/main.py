from contextlib import asynccontextmanager
from datetime import datetime, date
from typing import Optional
from uuid import uuid4
import os

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy import String, DateTime, Date as SQLDate, Integer, ForeignKey, select, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./eventpilot.db"
    cors_origins: str = "http://localhost:3000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
settings = Settings()
engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
class Base(DeclarativeBase): pass

class Event(Base):
    __tablename__ = "events"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    event_date: Mapped[date] = mapped_column(SQLDate, nullable=False)
    venue: Mapped[str] = mapped_column(String(300), default="Venue to be confirmed")
    status: Mapped[str] = mapped_column(String(30), default="Draft")
    capacity: Mapped[int] = mapped_column(Integer, default=200)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class Attendee(Base):
    __tablename__ = "attendees"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    event_id: Mapped[str] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(320), nullable=False, index=True)
    company: Mapped[str] = mapped_column(String(200), default="")
    ticket_type: Mapped[str] = mapped_column(String(40), default="General")
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, default=lambda: "EP-" + uuid4().hex[:8].upper())
    status: Mapped[str] = mapped_column(String(30), default="Registered")
    checked_in_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class EventIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    event_date: date
    venue: str = Field(default="Venue to be confirmed", max_length=300)
    status: str = "Draft"
    capacity: int = Field(default=200, ge=1, le=1000000)
class EventOut(EventIn):
    id: str
    model_config = ConfigDict(from_attributes=True)
class AttendeeIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    company: str = Field(default="", max_length=200)
    ticket_type: str = Field(default="General", max_length=40)
class AttendeeOut(BaseModel):
    id: str; event_id: str; name: str; email: str; company: str; ticket_type: str; code: str; status: str; checked_in_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)
class CheckInOut(BaseModel):
    attendee: AttendeeOut
    already_checked_in: bool

async def get_db():
    async with SessionLocal() as session:
        yield session

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()
app = FastAPI(title="EventPilot API", version="0.1.0", description="Event, attendee and check-in API", lifespan=lifespan)
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health(): return {"status": "ok", "service": "eventpilot-api"}

@app.get("/api/events", response_model=list[EventOut])
async def list_events(db: AsyncSession = Depends(get_db)):
    result = await db.scalars(select(Event).order_by(Event.created_at.desc()))
    return list(result)

@app.post("/api/events", response_model=EventOut, status_code=201)
async def create_event(payload: EventIn, db: AsyncSession = Depends(get_db)):
    event = Event(**payload.model_dump()); db.add(event); await db.commit(); await db.refresh(event); return event

@app.get("/api/events/{event_id}", response_model=EventOut)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    event = await db.get(Event, event_id)
    if not event: raise HTTPException(404, "Event not found")
    return event

@app.get("/api/events/{event_id}/attendees", response_model=list[AttendeeOut])
async def list_attendees(event_id: str, q: Optional[str] = Query(default=None, max_length=200), db: AsyncSession = Depends(get_db)):
    if not await db.get(Event, event_id): raise HTTPException(404, "Event not found")
    stmt = select(Attendee).where(Attendee.event_id == event_id).order_by(Attendee.created_at.desc())
    if q: stmt = stmt.where((Attendee.name.ilike(f"%{q}%")) | (Attendee.email.ilike(f"%{q}%")) | (Attendee.company.ilike(f"%{q}%")))
    return list(await db.scalars(stmt))

@app.post("/api/events/{event_id}/attendees", response_model=AttendeeOut, status_code=201)
async def create_attendee(event_id: str, payload: AttendeeIn, db: AsyncSession = Depends(get_db)):
    if not await db.get(Event, event_id): raise HTTPException(404, "Event not found")
    existing = await db.scalar(select(Attendee).where(Attendee.event_id == event_id, Attendee.email == str(payload.email)))
    if existing: raise HTTPException(409, "This email is already registered for the event")
    attendee = Attendee(event_id=event_id, **payload.model_dump()); db.add(attendee); await db.commit(); await db.refresh(attendee); return attendee

@app.post("/api/events/{event_id}/check-in/{code}", response_model=CheckInOut)
async def check_in(event_id: str, code: str, db: AsyncSession = Depends(get_db)):
    attendee = await db.scalar(select(Attendee).where(Attendee.event_id == event_id, Attendee.code == code))
    if not attendee: raise HTTPException(404, "No attendee matches this code")
    duplicate = attendee.status == "Checked in"
    if not duplicate:
        attendee.status = "Checked in"; attendee.checked_in_at = datetime.now().astimezone(); await db.commit(); await db.refresh(attendee)
    return {"attendee": attendee, "already_checked_in": duplicate}

@app.get("/api/events/{event_id}/stats")
async def event_stats(event_id: str, db: AsyncSession = Depends(get_db)):
    if not await db.get(Event, event_id): raise HTTPException(404, "Event not found")
    total = await db.scalar(select(func.count()).select_from(Attendee).where(Attendee.event_id == event_id)) or 0
    checked = await db.scalar(select(func.count()).select_from(Attendee).where(Attendee.event_id == event_id, Attendee.status == "Checked in")) or 0
    return {"registered": total, "checked_in": checked, "awaiting_arrival": total - checked, "attendance_rate": round(checked / total * 100) if total else 0}
