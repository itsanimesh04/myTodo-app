import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const proxy = auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Public paths
  const publicPaths = ['/login', '/signup', '/']
  const isPublicPath = publicPaths.some((p) => pathname === p)
  const isApiAuth = pathname.startsWith('/api/auth')
  const isApiPublic = pathname === '/api/auth/signup'

  // Allow public paths and auth API
  if (isApiAuth || isApiPublic) return NextResponse.next()

  // Redirect logged-in users away from auth pages
  if (isLoggedIn && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  // Protect app routes
  if (!isLoggedIn && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  return NextResponse.next()
})

export default proxy

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
}
