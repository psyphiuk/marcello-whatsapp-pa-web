import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.scss'

export const metadata: Metadata = {
  title: 'PICORTEX AI - Assistente WhatsApp per Aziende',
  description: 'Automatizza le tue attività con Google Workspace tramite WhatsApp. Gestisci calendario, contatti, email e attività con messaggi vocali e testuali.',
  keywords: 'WhatsApp Business, Google Calendar, Google Tasks, assistente virtuale, automazione aziendale',
  authors: [{ name: 'PICORTEX AI' }],
  openGraph: {
    title: 'PICORTEX AI - Assistente WhatsApp per Aziende',
    description: 'Automatizza le tue attività con Google Workspace tramite WhatsApp',
    type: 'website',
    locale: 'it_IT',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}