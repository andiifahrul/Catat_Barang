import { createServerClient } from '@supabase/ssr'; 
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Inisialisasi response awal
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Buat client supabase khusus untuk middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Sinkronisasi cookie ke request dan response
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 3. Cek session user (Ini bagian yang paling krusial)
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // 4. Logika Proteksi
  // Jika TIDAK ADA user DAN akses bukan ke /login, maka paksa ke /login
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika SUDAH ADA user DAN akses ke /login, maka paksa ke /dashboard
  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon|screenshot|.*\\.png$).*)',
  ],
};