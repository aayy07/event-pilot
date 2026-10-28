'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronRight, Clock3, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import type { EventDetails } from '../../../lib/security';

type RegistrationResponse = { valid: boolean };

export default function RegistrationPage({ params }: { params: { token: string } }) {
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/registration/${encodeURIComponent(params.token)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('invalid');
        const result = await response.json() as RegistrationResponse;
        if (!result.valid) throw new Error('invalid');
      })
      .catch(() => {
        if (active) setInvalidLink(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [params.token]);

  async function checkAccess(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await fetch(`/api/registration/${encodeURIComponent(params.token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'We could not verify your registration.');
        return;
      }
      setEvent(result.event);
      setApproved(true);
    } catch {
      setError('The event could not be reached. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="public-screen">
      <header className="public-topbar"><a className="brand-lockup" href="/" aria-label="EventPilot"><span className="brand-symbol"><Sparkles size={19} /></span><span><strong>eventpilot</strong><small>EVENT OPERATIONS</small></span></a><span className="public-access-label"><ShieldCheck size={16} /> PRIVATE EVENT ACCESS</span></header>
      <div className="public-content">
        <section className="public-intro"><span className="eyebrow">YOU’RE INVITED</span><h1>{approved ? 'You’re all set.' : 'Join the event.'}</h1><p>{approved ? 'Your work email has been verified. Here are the event details.' : 'Enter your name and Standard Chartered work email to check your access.'}</p><div className="public-rule" /></section>
        <div className={`registration-layout ${approved ? 'registration-approved' : ''}`}>
          {approved && event ? (
            <section className="public-event-card"><div className="public-event-banner"><span className="event-label"><i /> EVENT DETAILS</span><span className="public-event-mark"><CalendarDays size={21} /></span></div><div className="public-event-body"><span className="eyebrow">STANDARD CHARTERED</span><h2>{event.name}</h2>{event.description && <p className="public-event-description">{event.description}</p>}<div className="public-event-facts"><div><CalendarDays size={18} /><span><small>DATE</small><strong>{new Date(`${event.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong></span></div>{event.startTime && <div><Clock3 size={18} /><span><small>START TIME</small><strong>{event.startTime}</strong></span></div>}<div><MapPin size={18} /><span><small>LOCATION</small><strong>{event.venue}</strong></span></div></div><div className="approval-banner"><CheckCircle2 size={19} /><span><strong>Access approved</strong><small>Verified for {email.toLowerCase()}</small></span></div></div></section>
          ) : (
            <section className="registration-card"><div className="registration-card-heading"><span className="registration-icon"><ShieldCheck size={20} /></span><div><h2>Verify your access</h2><p>Registration is limited to Standard Chartered employees.</p></div></div>{loading ? <div className="registration-loading">Checking invitation link…</div> : invalidLink ? <div className="link-error"><strong>This invitation link is unavailable.</strong><span>Ask the event organizer for a new registration link.</span></div> : <form className="form-stack" onSubmit={checkAccess}><label>Full name<input required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={(formEvent) => setName(formEvent.target.value)} placeholder="Your name" /></label><label>Work email<input required type="email" autoComplete="email" value={email} onChange={(formEvent) => setEmail(formEvent.target.value)} placeholder="you@sc.com" /></label><p className="domain-hint"><ShieldCheck size={15} /> Only email addresses ending in <strong>@sc.com</strong> are eligible.</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary button-wide" type="submit" disabled={submitting || loading || invalidLink}>{submitting ? 'Checking access…' : <>Continue to event details <ChevronRight size={17} /></>}</button></form>}</section>
          )}
          <aside className="privacy-aside"><span className="privacy-icon"><ShieldCheck size={19} /></span><h3>Your details stay private.</h3><p>Your name and work email are used to verify eligibility for this invitation.</p><span className="privacy-domain">ACCESS RESTRICTED <i /> @SC.COM</span></aside>
        </div>
      </div>
      <footer className="public-footer"><span>© 2026 EventPilot</span><span>Private event registration</span></footer>
    </main>
  );
}
