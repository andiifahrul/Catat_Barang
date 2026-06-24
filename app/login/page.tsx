"use client";

import { useState } from "react";
import { LogIn, UserPlus, Mail, Lock, Store, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase"; 

export default function LoginPage() {
  // Mode Tampilan: 'LOGIN' untuk masuk, 'REGISTER' untuk daftar baru
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // State untuk menangkap input data form
  const [namaToko, setNamaToko] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Pengatur visual keamanan sandi & status loading harian
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ========================================================
  // 1. PROSES AUTENTIKASI: MASUK AKUN (LOGIN)
  // ========================================================
  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setLoading(false);
      return alert(`Gagal Masuk: ${error.message}`);
    }

    if (data?.session) {
      // Pasang tanda cookie untuk Satpam Middleware Next.js
      document.cookie = `session_toko=${data.session.access_token}; path=/; max-age=86400; SameSite=Lax`;
      // alert("Login Berhasil! Selamat Datang."); // Dihapus agar tidak mengganggu
      window.location.href = "/stok";
    }
  };

  // ========================================================
  // 2. PROSES AUTENTIKASI: DAFTAR AKUN BARU (REGISTER)
  // ========================================================
  const handleRegister = async () => {
    if (!namaToko.trim()) {
      setLoading(false);
      return alert("Nama Usaha / Toko wajib diisi!");
    }

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // Kunci nama toko langsung ke profile metadata akun online baru
        data: {
          nama_toko: namaToko,
        },
      },
    });

    if (error) {
      setLoading(false);
      return alert(`Gagal Mendaftar: ${error.message}`);
    }

    setLoading(false);
    // alert("Pendaftaran Berhasil! Akun toko Anda sudah aktif. Silakan langsung masuk."); // Dihapus agar tidak mengganggu
    
    // Alihkan otomatis kembali ke halaman login, kosongkan input nama toko
    setNamaToko("");
    setMode("LOGIN");
  };

  // ========================================================
  // 3. FUNGSI UTAMA TOMBOL SUBMIT FORM
  // ========================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return alert("Email dan Kata Sandi wajib diisi!");
    }
    if (password.length < 6) {
      return alert("Kata Sandi minimal harus 6 karakter biar aman!");
    }

    setLoading(true);

    if (mode === "LOGIN") {
      await handleLogin();
    } else {
      await handleRegister();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-[#f4f1ea]">
      <div className="bg-white p-6 rounded-3xl shadow-md border border-gray-200 w-full max-w-md space-y-6">
        
        {/* HEADER FORM DINAMIS (Berubah Sesuai Mode Pilihan) */}
        <div className="text-center space-y-2">
          <div className="mx-auto bg-blue-100 text-blue-700 w-16 h-16 rounded-2xl border border-blue-200 flex items-center justify-center shadow-sm transition-all duration-300">
            {mode === "LOGIN" ? (
              <LogIn className="w-8 h-8 stroke-[2.5]" />
            ) : (
              <UserPlus className="w-8 h-8 stroke-[2.5]" />
            )}
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight mt-3">
            {mode === "LOGIN" ? "Selamat Datang" : "Buat Akun Baru"}
          </h1>
          <p className="text-base font-bold text-gray-600">
            {mode === "LOGIN" ? "Masuk ke Akun Toko Anda" : "Registrasi sistem isolasi data toko"}
          </p>
        </div>

        {/* INTEGRASI FORM INPUT */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* INPUT KHUSUS NAMA TOKO (Hanya muncul jika memilih mode DAFTAR/REGISTER) */}
          {mode === "REGISTER" && (
            <div className="transition-all duration-300">
              <label className="block text-base font-bold text-gray-900 mb-1">Nama Usaha / Toko <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                  <Store className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  value={namaToko}
                  onChange={(e) => setNamaToko(e.target.value)}
                  placeholder="Contoh: Toko Maju Jaya"
                  disabled={loading}
                  className="w-full text-lg p-3.5 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-bold bg-gray-50 text-black placeholder-gray-500 disabled:opacity-50"
                />
              </div>
            </div>
          )}

          {/* INPUT ALAMAT EMAIL */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Alamat Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ketik@email.com"
                disabled={loading}
                className="w-full text-lg p-3.5 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-bold bg-gray-50 text-black placeholder-gray-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* INPUT KATA SANDI / PASSWORD */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Kata Sandi (Password)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                disabled={loading}
                className="w-full text-lg p-3.5 pl-12 pr-12 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-bold bg-gray-50 text-black placeholder-gray-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-black transition"
              >
                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* TOMBOL AKSI UTAMA DENGAN ANIMASI INDIKATOR LOADING */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black text-xl py-4.5 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md mt-4"
          >
            {loading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Sedang Memproses Cloud...</span>
              </>
            ) : mode === "LOGIN" ? (
              "Masuk Sekarang"
            ) : (
              "Daftar Akun Toko"
            )}
          </button>
        </form>

        {/* NAVIGASI PINDAH MODE (Ganti Tampilan Masuk/Daftar Tanpa Reload) */}
        <div className="text-center pt-2 border-t border-gray-100">
          {mode === "LOGIN" ? (
            <p className="text-sm font-bold text-gray-600">
              Belum punya akun aplikasi?{" "}
              <button
                type="button"
                onClick={() => { setMode("REGISTER"); setShowPassword(false); }}
                className="text-blue-600 font-black hover:underline"
              >
                Daftar di Sini
              </button>
            </p>
          ) : (
            <p className="text-sm font-bold text-gray-600">
              Sudah pernah mendaftarkan toko?{" "}
              <button
                type="button"
                onClick={() => { setMode("LOGIN"); setShowPassword(false); }}
                className="text-blue-600 font-black hover:underline"
              >
                Masuk Saja
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}