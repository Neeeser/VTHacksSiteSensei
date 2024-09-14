// src/app/layout.jsx
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { ThemeProvider } from 'next-themes';
import { Analytics } from "@vercel/analytics/react";
import Navbar from '../components/Navbar';
import './globals.css';

export const metadata = {
  title: 'Site Sensei',
  description: 'Generate interactive code for your website quickly',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex flex-col h-screen">
        <UserProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Navbar className="z-10" />
            <main className="flex-grow overflow-auto">
              {children}
            </main>
            <Analytics />
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}