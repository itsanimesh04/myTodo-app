import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Navigation } from '@/components/layout/Navigation'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="app-layout">
      <Navigation />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
