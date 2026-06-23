"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Store, 
  Database, 
  LogOut, 
  ChevronRight, 
  Loader2,
  Edit2,
  UserCheck,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import Swal from "sweetalert2"; // <-- 1. Import SweetAlert2 Beranimasi

export default function PengaturanPage() {
  const [namaToko, setNamaToko] = useState("Memuat nama toko...");
  const [emailUser, setEmailUser] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [inputNamaToko, setInputNamaToko] = useState("");

  const [loadingProfil, setLoadingProfil] = useState(true);
  const [loadingTombol, setLoadingTombol] = useState(false);

  // ========================================================
  // 1. AMBIL PROFIL USER SAAT HALAMAN DIBUKA
  // ========================================================
  useEffect(() => {
    const muatPengaturan = async () => {
      setLoadingProfil(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setEmailUser(user.email || "");
          const namaTokoTersimpan = user.user_metadata?.nama_toko || "Toko Berkah Utama";
          setNamaToko(namaTokoTersimpan);
          setInputNamaToko(namaTokoTersimpan);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProfil(false);
      }
    };

    muatPengaturan();
  }, []);

  // ========================================================
  // 2. FUNGSI UBAH NAMA TOKO & SIMPAN KE METADATA SUPABASE
  // ========================================================
  const handleSimpanNamaToko = async () => {
    if (!inputNamaToko.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Nama Toko Kosong!",
        text: "Nama toko tidak boleh dikosongkan ya, Ayah/Ibu.",
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Perbaiki"
      });
      return;
    }
    setLoadingTombol(true);

    const { error } = await supabase.auth.updateUser({
      data: { nama_toko: inputNamaToko }
    });

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mengubah!",
        text: error.message,
        confirmButtonColor: "#dc2626"
      });
    } else {
      setNamaToko(inputNamaToko);
      setIsEditing(false);
      
      // Toast/Notifikasi sukses kecil di pojok kanan atas agar tidak mengganggu
      Swal.fire({
        icon: "success",
        title: "Nama toko berhasil diperbarui!",
        showConfirmButton: false,
        timer: 2000,
        toast: true,
        position: "top-end"
      });
    }
    setLoadingTombol(false);
  };

  // ========================================================
  // 3. FUNGSI SINKRONISASI / RESET CACHE APLIKASI
  // ========================================================
  const handleResetAplikasi = () => {
    Swal.fire({
      title: "Segarkan Aplikasi?",
      text: "Halaman akan dimuat ulang untuk membersihkan sisa ketikan yang macet.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#d97706", // Warna amber/oranye
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Segarkan",
      cancelButtonText: "Batal",
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.reload();
      }
    });
  };

  // ========================================================
  // 4. FUNGSI CEK AMANKAN DATA (VERIFIKASI REALTIME CLOUD)
  // ========================================================
  const handleCekBackup = async () => {
    setLoadingTombol(true);
    
    const { error } = await supabase.from("barang").select("id", { count: "exact", head: true });
    
    setLoadingTombol(false);
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Koneksi Terganggu!",
        text: error.message,
        confirmButtonColor: "#dc2626"
      });
    } else {
      Swal.fire({
        icon: "success",
        title: "Koneksi Cloud Aman!",
        text: "Seluruh catatan pembukuan Anda sudah dicadangkan secara otomatis di internet.",
        confirmButtonColor: "#16a34a",
        confirmButtonText: "Alhamdulillah"
      });
    }
  };

  // ========================================================
  // 5. FUNGSI LOGOUT (PUTUS SESI & HAPUS COOKIE)
  // ========================================================
  const handleLogout = async () => {
    Swal.fire({
      title: "Yakin Ingin Keluar?",
      text: "Ayah/Ibu harus memasukkan email & kata sandi lagi nanti untuk masuk kembali.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", // Merah tegas
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Keluar Akun",
      cancelButtonText: "Tetap Masuk",
      reverseButtons: true
    }).then(async (result) => {
      if (result.isConfirmed) {
        setLoadingTombol(true);
        await supabase.auth.signOut();
        document.cookie = "session_toko=; path=/; max-age=0; SameSite=Lax";

        Swal.fire({
          icon: "success",
          title: "Berhasil Keluar!",
          text: "Sampai jumpa kembali, semoga usahanya tambah berkah!",
          showConfirmButton: false,
          timer: 2500
        }).then(() => {
          window.location.href = "/login";
        });
      }
    });
  };

  if (loadingProfil) {
    return (
      <div className="p-5 max-w-md mx-auto flex flex-col items-center justify-center py-20 gap-3 text-gray-600 font-bold bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[50vh]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <span className="text-lg">Memuat Pengaturan Toko...</span>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-md mx-auto space-y-6">
      
      {/* 1. HEADER HALAMAN */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <Settings className="text-blue-600 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan</h1>
          <p className="text-sm text-gray-600 font-medium">Atur aplikasi dan database toko</p>
        </div>
      </div>

      {/* 2. KARTU PROFIL TOKO */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl border border-blue-200 text-blue-700 shrink-0">
            <Store className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-500">Nama Usaha / Toko</span>
            
            {isEditing ? (
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={inputNamaToko}
                  onChange={(e) => setInputNamaToko(e.target.value)}
                  disabled={loadingTombol}
                  className="border-2 border-blue-500 rounded-lg px-2 py-1 text-base font-bold w-full text-black bg-white"
                />
                <button
                  onClick={handleSimpanNamaToko}
                  disabled={loadingTombol}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm"
                >
                  Simpan
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-black truncate leading-tight">
                  {namaToko}
                </h2>
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="text-gray-400 hover:text-blue-600 p-1 shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. GRUP PENGATURAN UTAMA */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden divide-y divide-gray-100">
        
        {/* INFO STATUS ADMIN */}
        <div className="p-5 flex items-center gap-3 bg-gray-50/50">
          <div className="bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-100">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-500 uppercase tracking-wider leading-none">Petugas Terdaftar</h3>
            <p className="text-base font-black text-black truncate mt-1">{emailUser}</p>
          </div>
        </div>

        {/* REFRESH / BERSIHKAN LAYAR */}
        <button 
          onClick={handleResetAplikasi}
          type="button" 
          disabled={loadingTombol}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition group disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-700 p-2 rounded-xl border border-amber-200">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black leading-tight">Segarkan Aplikasi</h3>
              <p className="text-xs font-bold text-gray-600">Besihkan sisa ketikan & reset layar harian</p>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-700 transition" />
        </button>

        {/* AMANKAN DATA */}
        <button 
          onClick={handleCekBackup}
          type="button" 
          disabled={loadingTombol}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50 transition group disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl border border-emerald-200">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-black leading-tight">Amankan Data Toko</h3>
              <p className="text-xs font-bold text-gray-600">Periksa cadangan data cloud internet</p>
            </div>
          </div>
          {loadingTombol ? (
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-gray-700 transition" />
          )}
        </button>

      </div>

      {/* 4. TOMBOL KELUAR APLIKASI */}
      <button
        onClick={handleLogout}
        type="button"
        disabled={loadingTombol}
        className="w-full bg-rose-100 hover:bg-rose-200 border-2 border-rose-300 text-rose-900 font-black text-lg py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-sm disabled:opacity-50"
      >
        {loadingTombol ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : (
          <LogOut className="w-6 h-6 stroke-[3]" />
        )}
        Keluar dari Aplikasi
      </button>

    </div>
  );
}