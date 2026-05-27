import './globals.css'

export const metadata = {
  title: 'SubFlow',
  description: 'Estimating and project management for subcontractors',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
