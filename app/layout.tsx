import type { Metadata } from 'next'
import '@/styles/globals.css'
import 'highlight.js/styles/github-dark.css'
import styles from './layout.module.css'

export const metadata: Metadata = {
  title: {
    default: 'Kevin Hyde - AI-Augmented Product Engineer',
    template: '%s | Kevin Hyde'
  },
  description: 'Building at the speed of thought with AI-first development. Portfolio of an AI-Augmented Product Engineer showcasing high-velocity software development.',
  keywords: ['AI Development', 'Product Engineering', 'React', 'Next.js', 'TypeScript', 'Claude', 'AI Tools'],
  authors: [{ name: 'Kevin Hyde' }],
  creator: 'Kevin Hyde',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kevinhyde.com',
    title: 'Kevin Hyde - AI-Augmented Product Engineer',
    description: 'Building at the speed of thought with AI-first development',
    siteName: 'Kevin Hyde Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kevin Hyde - AI-Augmented Product Engineer',
    description: 'Building at the speed of thought with AI-first development',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Theme detection and application
              (function() {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              })();
            `,
          }}
        />
      </head>
      <body>
        <a href="#main-content" className={styles.skipToContent}>
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  )
}