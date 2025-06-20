
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { UserSettingsProvider } from '@/contexts/UserSettingsContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CountsProvider } from '@/contexts/CountsContext';
import { UserDataCacheProvider } from '@/contexts/UserDataCacheContext';
import { UserSessionProvider } from '@/contexts/UserSessionContext';

export const metadata: Metadata = {
  title: 'ProspectFlow',
  description: 'Manage your cold outreach efficiently.',
  icons: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning={true}>
        <AuthProvider>
          <UserSessionProvider>
            <UserSettingsProvider>
              <CountsProvider>
                <UserDataCacheProvider>
                  {children}
                </UserDataCacheProvider>
              </CountsProvider>
            </UserSettingsProvider>
          </UserSessionProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
