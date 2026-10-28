'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { CalendarDays, Check, ChevronRight, Copy, ExternalLink, LogOut, MapPin, Plus, QrCode, ShieldCheck, Sparkles, Ticket, Users } from 'lucide-react';
import type { EventDetails } from '../lib/security';

type SavedEvent = EventDetails & { registrationUrl: string };
type EventDraft = Omit<EventDetails, 'id'>;

const emptyDraft: EventDraft = { name: '', date: '', startTime: '', venue: '', description: '' };
const storageKey = 'eventpilot-events-v2';

export default function Home() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [events, setEvents] = useState<SavedEvent[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    fetch('/api/admin/session')
      .then(async (response) => {
        if (!response.ok) return;
        const session = await response.json();
        setAdminEmail(session.email ?? '');
        setAuthenticated(true);
        try {
          const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as SavedEvent[];
          setEvents(saved);
          setSelectedId(saved[0]?.id ?? '');
        } catch {
          localStorage.removeItem(storageKey);
        }
      })
      .catch(() => undefined)
      .finally(() => setCheckingSession(false));
  }, []);

  const selectedEvent = useMemo(() => events.find((event) => event.id === selectedId) ?? null, [events, selectedId]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError('');
    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password }),
    });
    const result = await response.json();
    if (!response.ok) {
      setLoginError(result.error ?? 'Unable to sign in.');
      return;
    }
    setAdminEmail(result.email);
    setPassword('');
    setAuthenticated(true);
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? '[]') as SavedEvent[];
      setEvents(saved);
      setSelectedId(saved[0]?.id ?? '');
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    const details: EventDetails = { ...draft, id: crypto.randomUUID() };
    const response = await fetch('/api/events/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    const result = await response.json();
    if (!response.ok) {
      setFormError(result.error ?? 'Could not create a registration link.');
      return;
    }
    const created: SavedEvent = { ...details, registrationUrl: `${window.location.origin}/register/${result.token}` };
    const updated = [created, ...events];
    setEvents(updated);
    setSelectedId(created.id);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setDraft(emptyDraft);
    setShowForm(false);
    setNotice('Event created. Your registration link and QR are ready.');
  }

  async function handleLogout() {
    await fetch('/api/admin/session', { method: 'DELETE' });
    setAuthenticated(false);
    setEvents([]);
    setSelectedId('');
  }

  async function copyLink() {
    if (!selectedEvent) return;
    try {
      await navigator.clipboard.writeText(selectedEvent.registrationUrl);
      setCopying(true);
      setNotice('Registration link copied.');
      window.setTimeout(() => setCopying(false), 1600);
    } catch {
      setNotice('Clipboard access is unavailable on this browser.');
    }
  }

  async function copyShareDetails() {
    if (!selectedEvent) return;

    const registrationUrl = selectedEvent.registrationUrl;
    const qrCanvas = document.querySelector('.qr-export-source canvas') as HTMLCanvasElement | null;

    try {
      if (navigator.clipboard && window.ClipboardItem && qrCanvas) {
        const padding = 64;
        const shareCanvas = document.createElement('canvas');
        const context = shareCanvas.getContext('2d');
        if (!context) throw new Error('Canvas is unavailable.');

        const width = 1280;
        const qrSize = 1024;
        const lineHeight = 38;
        const urlFont = '25px Arial';
        const maxTextWidth = width - padding * 2;
        context.font = urlFont;
        const urlLines: string[] = [];
        let line = '';
        for (const character of registrationUrl) {
          const nextLine = line + character;
          if (context.measureText(nextLine).width > maxTextWidth && line) {
            urlLines.push(line);
            line = character;
          } else {
            line = nextLine;
          }
        }
        if (line) urlLines.push(line);

        const titleHeight = 52;
        const labelHeight = 38;
        const height = padding * 2 + titleHeight + qrSize + labelHeight + urlLines.length * lineHeight;
        shareCanvas.width = width;
        shareCanvas.height = height;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.fillStyle = '#173f3b';
        context.font = '700 32px Arial';
        context.fillText(`${selectedEvent.name} registration`, padding, padding + 34);
        context.drawImage(qrCanvas, padding + (width - padding * 2 - qrSize) / 2, padding + titleHeight, qrSize, qrSize);
        context.font = '700 24px Arial';
        context.fillText('Registration link', padding, padding + titleHeight + qrSize + 30);
        context.fillStyle = '#263b3d';
        context.font = urlFont;
        urlLines.forEach((urlLine, index) => {
          context.fillText(urlLine, padding, padding + titleHeight + qrSize + labelHeight + (index + 1) * lineHeight - 8);
        });

        const imageBlob = await new Promise<Blob>((resolve, reject) => {
          shareCanvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the share image.')), 'image/png');
        });
        const imageDataUrl = shareCanvas.toDataURL('image/png');
        const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character] ?? character);
        const safeUrl = escapeHtml(registrationUrl);
        const safeEventName = escapeHtml(selectedEvent.name);
        const html = `<div><p><a href="${safeUrl}">Register here: ${safeUrl}</a></p><img src="${imageDataUrl}" alt="${safeEventName} QR code and registration link" width="640"></div>`;

        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([registrationUrl], { type: 'text/plain' }),
            'text/html': new Blob([html], { type: 'text/html' }),
            'image/png': imageBlob,
          }),
        ]);
        setNotice('Registration link and high-resolution QR copied.');
        return;
      }

      await navigator.clipboard.writeText(registrationUrl);
      setNotice('Registration link copied. QR image copying is not supported by this browser.');
    } catch {
      try {
        await navigator.clipboard.writeText(registrationUrl);
        setNotice('Registration link copied. QR image copying is not supported by this browser.');
      } catch {
        setNotice('Clipboard access is unavailable on this browser.');
      }
    }
  }

  if (checkingSession) return <main className="screen-loading"><Sparkles size={22} /> Loading EventPilot</main>;

  if (!authenticated) {
    return (
      <main className="auth-screen">
        <section className="auth-aside">
          <a className="brand-lockup" href="/" aria-label="EventPilot home"><span className="brand-symbol"><Sparkles size={20} /></span><span><strong>eventpilot</strong><small>EVENT OPERATIONS</small></span></a>
          <div className="auth-message"><span className="eyebrow eyebrow-light">ADMIN WORKSPACE</span><h1>Bring your next event to life.</h1><p>Create a focused registration experience for your people, with one link to share wherever they are.</p><div className="auth-feature"><span><QrCode size={18} /></span><div><strong>One link, ready to share</strong><small>Every event gets its own registration page and QR.</small></div></div></div>
          <span className="auth-footer">EVENTPILOT · PRIVATE EVENT ACCESS</span>
        </section>
        <section className="auth-main"><div className="auth-form-wrap"><span className="mobile-brand"><span className="brand-symbol"><Sparkles size={19} /></span> eventpilot</span><span className="eyebrow">WELCOME BACK</span><h2>Admin sign in</h2><p className="auth-intro">Use the administrator credentials configured for this deployment.</p>
          <form className="form-stack" onSubmit={handleLogin}>
            <label>Email address<input required type="email" autoComplete="username" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} placeholder="admin@yourcompany.com" /></label>
            <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></label>
            {loginError && <p className="form-error" role="alert">{loginError}</p>}
            <button className="button button-primary button-wide" type="submit">Sign in <ChevronRight size={17} /></button>
          </form>
          <div className="secure-note"><ShieldCheck size={16} /><span>Admin access is verified securely by the server.</span></div>
        </div></section>
      </main>
    );
  }

  return (
    <div className="workspace-shell">
      <aside className="sidebar">
        <a className="brand-lockup" href="/" aria-label="EventPilot home"><span className="brand-symbol"><Sparkles size={19} /></span><span><strong>eventpilot</strong><small>EVENT OPERATIONS</small></span></a>
        <div className="workspace-switch"><span className="workspace-avatar">{adminEmail.slice(0, 1).toUpperCase()}</span><span className="workspace-copy"><strong>Admin workspace</strong><small>{adminEmail}</small></span><ShieldCheck size={17} /></div>
        <div className="side-label">WORKSPACE</div>
        <button className="nav-item active"><CalendarDays size={18} /><span>Events</span><span className="nav-count">{events.length}</span></button>
        <div className="side-label event-list-label">YOUR EVENTS<button className="tiny-icon" onClick={() => { setShowForm(true); setFormError(''); }} aria-label="Create event"><Plus size={15} /></button></div>
        <div className="event-shortcuts">{events.map((event) => <button key={event.id} onClick={() => { setSelectedId(event.id); setShowForm(false); }} className={`event-shortcut ${selectedId === event.id ? 'event-current' : ''}`}><span className="event-dot" /><span>{event.name}</span></button>)}</div>
        <div className="sidebar-bottom"><div className="help-card"><span className="help-icon"><QrCode size={18} /></span><strong>Registration, simplified</strong><p>Share one event link or let guests scan the QR to request access.</p></div><button className="profile-row" onClick={handleLogout}><span className="profile-avatar">{adminEmail.slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{adminEmail}</strong><small>Administrator</small></span><LogOut size={17} /></button></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="topbar-left"><span className="breadcrumb-muted">Admin workspace</span><ChevronRight size={15} /><span className="breadcrumb-current">Events</span></div><div className="topbar-right"><span className="admin-status"><i /> Admin access</span><button className="logout-button" onClick={handleLogout}><LogOut size={16} /><span>Sign out</span></button></div></header>
        <div className="content-wrap">
          {showForm ? (
            <>
              <div className="page-heading"><div><div className="eyebrow">EVENT SETUP</div><h1>Create an event</h1><p>Add the details guests need. We’ll make a registration page and QR link for you.</p></div></div>
              <form className="event-form panel" onSubmit={handleCreateEvent}>
                <div className="form-section-title"><span className="section-icon"><CalendarDays size={18} /></span><div><h2>Event details</h2><p>Start with the essentials. You can share your link as soon as the event is created.</p></div></div>
                <div className="event-fields"><label className="field-span">Event name<input required minLength={2} maxLength={120} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Annual Leadership Summit" /></label><label>Event date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label>Start time<input type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} /></label><label className="field-span">Venue<input required maxLength={180} value={draft.venue} onChange={(event) => setDraft({ ...draft, venue: event.target.value })} placeholder="Office, venue, or online location" /></label><label className="field-span">Event details<textarea rows={4} maxLength={1200} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder="Share a few details about what guests can expect." /></label></div>
                {formError && <p className="form-error" role="alert">{formError}</p>}
                <div className="form-actions"><button className="button button-quiet" type="button" onClick={() => { setShowForm(false); setFormError(''); }}>Cancel</button><button className="button button-primary" type="submit"><Plus size={17} /> Create event & registration link</button></div>
              </form>
            </>
          ) : (
            <>
              <div className="page-heading"><div><div className="eyebrow">ADMIN WORKSPACE <span className="eyebrow-separator">/</span> EVENTS</div><h1>Your events</h1><p>Create an event, then share its registration link or QR with participants.</p></div><button className="button button-primary" onClick={() => { setShowForm(true); setFormError(''); }}><Plus size={17} /> Create event</button></div>
              {events.length === 0 ? (
                <section className="empty-workspace"><div className="empty-icon"><CalendarDays size={25} /></div><span className="eyebrow">A FRESH START</span><h2>Your event starts here.</h2><p>Create your first event to generate a participant registration page and shareable QR code.</p><button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={17} /> Create your first event</button></section>
              ) : (
                <div className="event-workspace-grid">
                  <section className="event-list-panel"><div className="list-heading"><div><h2>Events</h2><p>{events.length} {events.length === 1 ? 'event' : 'events'} in this browser</p></div><span className="list-count">{events.length}</span></div><div className="event-list">{events.map((event) => <button key={event.id} className={`event-list-item ${event.id === selectedId ? 'selected' : ''}`} onClick={() => setSelectedId(event.id)}><span className="event-list-icon"><CalendarDays size={18} /></span><span className="event-list-copy"><strong>{event.name}</strong><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {event.venue}</small></span><ChevronRight size={16} /></button>)}</div></section>
                  {selectedEvent && <section className="event-details-panel"><div className="detail-topline"><span className="event-label"><i /> UPCOMING EVENT</span><button className="button button-quiet button-small" onClick={() => window.open(selectedEvent.registrationUrl, '_blank', 'noopener,noreferrer')}><ExternalLink size={15} /> Preview page</button></div><h2>{selectedEvent.name}</h2><p className="event-description">{selectedEvent.description || 'An event by invitation. Verify your work email to view the event details.'}</p><div className="event-meta"><span><CalendarDays size={17} /><strong>{new Date(`${selectedEvent.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}{selectedEvent.startTime ? ` · ${selectedEvent.startTime}` : ''}</strong></span><span><MapPin size={17} /><strong>{selectedEvent.venue}</strong></span></div><div className="share-section"><div className="share-heading"><div><span className="eyebrow">PARTICIPANT ACCESS</span><h3>Share registration</h3></div><span className="share-lock"><ShieldCheck size={16} /> @sc.com only</span></div><div className="share-link-row"><span className="link-icon"><Ticket size={17} /></span><span className="share-link-text">{selectedEvent.registrationUrl}</span><button className="icon-action" onClick={copyLink} aria-label="Copy registration link" title="Copy registration link">{copying ? <Check size={17} /> : <Copy size={17} />}</button></div><div className="qr-share-row"><div className="qr-frame"><QRCodeCanvas value={selectedEvent.registrationUrl} size={108} bgColor="#ffffff" fgColor="#173f3b" includeMargin /></div><div className="qr-copy"><strong>Scan to request access</strong><p>Participants enter their name and work email. Approved guests can view the event details.</p><button className="button button-quiet button-small" onClick={copyShareDetails}><Copy size={15} /> Copy link + QR</button></div></div></div><div className="eligibility-note"><Users size={17} /><span>Only addresses ending with @sc.com can access the event.</span></div></section>}
                </div>
              )}
            </>
          )}
        </div>
        <footer className="app-footer"><span>© 2026 EventPilot</span><span><ShieldCheck size={14} /> Private event access</span></footer>
      </main>
      {selectedEvent && <div className="qr-export-source" aria-hidden="true" style={{ position: 'fixed', left: '-2000px', top: 0, width: 0, height: 0, overflow: 'hidden', visibility: 'hidden' }}><QRCodeCanvas value={selectedEvent.registrationUrl} size={1024} bgColor="#ffffff" fgColor="#173f3b" includeMargin /></div>}
      {notice && <div className="toast" role="status"><Check size={17} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss">×</button></div>}
    </div>
  );
}
