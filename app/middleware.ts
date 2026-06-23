import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Ambil penanda login (Token/Cookie) dari browser.
  // Saat ini menggunakan token simulasi bernama "session_toko".
  // Nantinya cookies ini otomatis diatur oleh Supabase Auth.
  const isAuthenticated = request.cookies.get("session_toko");

  // 2. KONDISI A: Jika BELUM LOGIN dan mencoba mengakses halaman aplikasi (seperti dashboard, stok, dll)
  if (!isAuthenticated && pathname !== "/login") {
    // Paksa pengguna putar balik ke halaman login dapet-dapet!
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 3. KONDISI B: Jika SUDAH LOGIN tapi malah mencoba membuka halaman login lagi
  if (isAuthenticated && pathname === "/login") {
    // Alihkan langsung ke dashboard agar tidak masuk ke form login lagi
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Jika kondisi di atas aman, izinkan pengguna melanjutkan perjalanan ke halaman tujuan
  return NextResponse.next();
}

// 4. ATUR RUTE MANA SAJA YANG WAJIB DIJAGA OLEH SATPAM MIDDLEWARE
export const config = {
  matcher: [
    /*
     * Cocokkan semua rute pencatatan barang kecuali:
     * - api (jalur backend api)
     * - _next/static (file desain statis Next.js)
     * - _next/image (fitur optimasi gambar)
     * - favicon.ico atau icon gambar pwa lainnya
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon-).*)"
  ],
};