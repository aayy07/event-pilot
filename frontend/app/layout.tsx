import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'EventPilot | Private event registration', description: 'Create private events and share registration links with eligible participants.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
