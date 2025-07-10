import './globals.css'

export const metadata = {
  title: 'Voice Note Summarizer',
  description: 'Record, transcribe, and summarize your voice notes with AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
} 