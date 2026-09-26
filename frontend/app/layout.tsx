import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'CogniVoice — Adaptive Voice AI for Education',
  description:
    'A production-grade Adaptive Cognitive Voice Assistant Platform for teachers and students with cognitive challenges. Voice-first, step-by-step, accessible.',
  keywords: ['voice assistant', 'AI', 'education', 'accessibility', 'cognitive', 'teachers', 'students'],
  openGraph: {
    title: 'CogniVoice — Adaptive Voice AI for Education',
    description: 'Voice-first AI assistant that adapts to every user\'s cognitive needs.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans aurora-bg">
        {children}
      </body>
    </html>
  );
}
