import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if exists
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/bids')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/companies')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/contacts')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/templates')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/settings')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
}
