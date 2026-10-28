import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type EventDetails = {
  id: string;
  name: string;
  date: string;
  startTime: string;
  venue: string;
  description: string;
};

export const sessionCookie = 'eventpilot_admin';

function secret() {
  const value = process.env.APP_SECRET;
  if (!value || value.length < 32) {
    throw new Error('APP_SECRET must be set to a random value of at least 32 characters.');
  }
  return value;
}

function signature(value: string) {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function isValidSignature(value: string, expected: string) {
  const actualBytes = Buffer.from(signature(value));
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function createAdminSession(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function isAdminSession(value: string | undefined) {
  if (!value) return false;
  const [payload, suppliedSignature] = value.split('.');
  if (!payload || !suppliedSignature || !isValidSignature(payload, suppliedSignature)) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email: string; expiresAt: number };
    return session.email === process.env.ADMIN_EMAIL && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export function isAdminCredentials(email: string, password: string) {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;
  return safeEqual(email.trim().toLowerCase(), adminEmail.trim().toLowerCase()) && safeEqual(password, adminPassword);
}

function safeEqual(value: string, expected: string) {
  const valueBytes = Buffer.from(value);
  const expectedBytes = Buffer.from(expected);
  return valueBytes.length === expectedBytes.length && timingSafeEqual(valueBytes, expectedBytes);
}

export function createRegistrationToken(event: EventDetails) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', createHash('sha256').update(secret()).digest(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(event), 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function readRegistrationToken(value: string): EventDetails | null {
  const [encodedIv, encodedTag, encodedData] = value.split('.');
  if (!encodedIv || !encodedTag || !encodedData) return null;

  try {
    const decipher = createDecipheriv('aes-256-gcm', createHash('sha256').update(secret()).digest(), Buffer.from(encodedIv, 'base64url'));
    decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encodedData, 'base64url')), decipher.final()]).toString('utf8');
    const event = JSON.parse(decrypted) as EventDetails;
    if (![event.id, event.name, event.date, event.startTime, event.venue, event.description].every((field) => typeof field === 'string')) return null;
    return event;
  } catch {
    return null;
  }
}