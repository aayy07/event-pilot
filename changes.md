# Change log

## Current app

EventPilot is a Next.js-only private event registration MVP intended for deployment on Vercel.

- Admin sign-in uses credentials configured with `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Admins create events and share a signed registration page URL or QR code.
- The registration form accepts only valid email addresses ending in `@sc.com`; the server checks the domain before revealing event details.
- Admin event records are stored in that browser's `localStorage`. Signed URLs carry event details between devices.
- Participant submissions are validated but are not persisted or emailed.

## Replaced

- Removed the FastAPI application and its startup script.
- Removed the old sample attendee dashboard, check-in, reports, and seed data.
- Added Next.js route handlers for admin sessions, signed event links, and participant access checks.
- Updated setup and deployment guidance for Vercel.

## Known limits

This MVP has no database, attendee persistence, OTP/email delivery, admin user management, or registration rate limiting. Use a persistent database and an email/authentication provider before production use.
