import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'EventPilot | Event operations', description: 'A local event management and check-in workspace.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
