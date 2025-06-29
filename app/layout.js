import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ToastProvider } from "../contexts/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Forge - Build Lasting Habits",
  description: "Track your weekly habits and complete 21-day challenges with visual progress tracking.",
  icons: {
    icon: [
      { url: '/forge-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/forge-logo.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/forge-logo.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [{ url: '/forge-logo.png' }],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Forge',
    startupImage: '/forge-logo.png',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Forge',
    title: 'Forge - Build Lasting Habits',
    description: 'Track your weekly habits and complete 21-day challenges with visual progress tracking.',
    images: [
      {
        url: '/forge-logo.png',
        width: 512,
        height: 512,
        alt: 'Forge Logo'
      }
    ]
  },
  twitter: {
    card: 'summary',
    title: 'Forge - Build Lasting Habits',
    description: 'Track your weekly habits and complete 21-day challenges with visual progress tracking.',
    images: ['/forge-logo.png'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="forge">
      <head>
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#8200DB" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Forge" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, user-scalable=no, viewport-fit=cover" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/forge-logo.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/forge-logo.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/forge-logo.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/forge-logo.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" sizes="32x32" href="/forge-logo.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/forge-logo.png" />
        <link rel="shortcut icon" href="/forge-logo.png" />
        
        {/* Splash Screens for iOS */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <link rel="apple-touch-startup-image" href="/forge-logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
