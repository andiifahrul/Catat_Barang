"use client";

import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase"; 

export default function DashboardPage() {
  // State untuk menampung metrik angka jumbo
  const [totalJenisBarang, setTotalJenisBarang] = useState(0);
  const [barangMasukHariIni, setBarangMasukHariIni] = useState(0);
  const [barangKeluarHariIni, setBarangKeluarHariIni] = useState(0);
  const [stokKosong, setStokKosong] = useState(0);
  
  // State indikator pemuatan data
  const [loading, setLoading] = useState(true);

  // ========================================================
  // FUNGSI UTAMA HITUNG STATISTIK DARI DATABASE SUPABASE
  // ========================================================
  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // A. Hitung Total Jenis Produk
      const { count: countBarang, error: errBarang } = await supabase
        .from("barang")
        .select("*", { count: "exact", head: true });

      if (!errBarang && countBarang !== null) {
        setTotalJenisBarang(countBarang);
      }

      // B. Hitung Produk yang Stoknya Habis (Stok bernilai 0)
      const { count: countKosong, error: errKosong } = await supabase
        .from("barang")
        .select("*", { count: "exact", head: true })
        .eq("stok", 0);

      if (!errKosong && countKosong !== null) {
        setStokKosong(countKosong);
      }

      // C. Setel batasan waktu Hari Ini
      const hariIni = new Date();
      hariIni.setHours(0, 0, 0, 0);
      const formatIsoHariIni = hariIni.toISOString();

      // D. Ambil data mutasi harian dari tabel 'transaksi'
      const { data: transaksiData, error: errTransaksi } = await supabase
        .from("transaksi")
        .select("jenis_transaksi, jumlah")
        .gte("created_at", formatIsoHariIni);

      if (!errTransaksi && transaksiData) {
        let totalMasuk = 0;
        let totalKeluar = 0;

        transaksiData.forEach((item) => {
          if (item.jenis_transaksi === "MASUK") {
            totalMasuk += item.jumlah;
          } else if (item.jenis_transaksi === "KELUAR") {
            totalKeluar += item.jumlah;
          }
        });

        setBarangMasukHariIni(totalMasuk);
        setBarangKeluarHariIni(totalKeluar);
      }

    } catch (err) {
      console.error("Terjadi kesalahan hitung dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // ========================================================
  // TAMPILAN LOADING JUMBO BERGAYA MODERN
  // ========================================================
  if (loading) {
    return (
      <div className="p-6 max-w-md mx-auto flex flex-col items-center justify-center py-28 gap-4 bg-white rounded-3xl border border-gray-200 shadow-sm min-h-[60vh]">
        <Loader2 className="w-12 h-10 text-blue-600 animate-spin" />
        <span className="text-xl font-black text-gray-800 tracking-tight">Menghitung Buku Toko...</span>
        <p className="text-sm font-bold text-gray-600 text-center">Menghubungkan ke cloud server Supabase</p>
      </div>
    );
  }

  // ========================================================
  // RETURN UTAMA HALAMAN REVISI DESAIN MODERN PREMIUM
  // ========================================================
  return (
    <div className="p-5 max-w-md mx-auto space-y-5 pb-24">
      
      {/* 1. HEADER HALAMAN ELEGAN */}
      <div className="flex items-center gap-4 bg-white p-4.5 rounded-3xl shadow-sm border border-gray-100">
        <div className="bg-blue-50 p-2.5 rounded-2xl text-blue-600 border border-blue-100 shadow-inner">
          <LayoutDashboard className="w-7 h-7 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Ringkasan Toko</h1>
          <p className="text-sm text-gray-600 font-bold">Kondisi pembukuan barang hari ini</p>
        </div>
      </div>

      {/* 2. KARTU UTAMA JUMBO: TOTAL PRODUK (GRADIENT MODE) */}
      <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 p-6 rounded-3xl shadow-xl border border-indigo-900 relative overflow-hidden group">
        {/* Dekorasi Ornamen Lingkaran Transparan Belakang Layar */}
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-0.5">
            <span className="text-xs font-black text-indigo-300 uppercase tracking-widest block">MASTER DATA</span>
            <h2 className="text-xl font-bold text-white/90 leading-tight">Total Jenis Produk</h2>
            <span className="text-xs font-semibold text-white/60 block mt-1">Nama produk terkunci di internet</span>
          </div>
          <div className="bg-white/10 text-white p-3.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <Package className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 relative z-10">
          <span className="text-6xl font-black text-white block tracking-tighter leading-none">
            {totalJenisBarang} <span className="text-xl font-bold text-indigo-300 tracking-normal ml-1">Macam</span>
          </span>
        </div>
      </div>

      {/* 3. GRID AKTIVITAS MUTASI HARIAN (SEJAJAR KIRI-KANAN SIMETRIS) */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* KARTU BARANG MASUK */}
        <div className="bg-emerald-50/60 p-4 rounded-3xl shadow-sm border-2 border-emerald-200 flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-black text-emerald-900 uppercase tracking-wide leading-tight">Barang<br />Masuk</span>
            <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md border border-emerald-700 shrink-0">
              <ArrowUpRight className="w-5 h-5 stroke-[3]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-3xl font-black text-emerald-700 block tracking-tight">
              +{barangMasukHariIni}
            </span>
            <span className="text-[11px] font-bold text-emerald-800/80 block leading-none">Total pcs datang</span>
          </div>
        </div>

        {/* KARTU BARANG KELUAR */}
        <div className="bg-rose-50/60 p-4 rounded-3xl shadow-sm border-2 border-rose-200 flex flex-col justify-between gap-4">
          <div className="flex justify-between items-start">
            <span className="text-sm font-black text-rose-900 uppercase tracking-wide leading-tight">Barang<br />Keluar</span>
            <div className="bg-rose-600 text-white p-2 rounded-xl shadow-md border border-rose-700 shrink-0">
              <ArrowDownLeft className="w-5 h-5 stroke-[3]" />
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-3xl font-black text-rose-700 block tracking-tight">
              -{barangKeluarHariIni}
            </span>
            <span className="text-[11px] font-bold text-rose-800/80 block leading-none">Total pcs pesanan</span>
          </div>
        </div>

      </div>

      {/* 4. KOTAK STATUS PERINGATAN VITAL REALTIME */}
      <div className={`p-4.5 rounded-3xl border-2 flex items-center gap-4 transition-all duration-300 shadow-md ${
        stokKosong > 0 
          ? "bg-amber-50 border-amber-300 text-amber-950 animate-pulse" 
          : "bg-indigo-50/80 border-indigo-200 text-indigo-950"
      }`}>
        <div className={`p-3 rounded-2xl shrink-0 border shadow-inner ${
          stokKosong > 0 
            ? "bg-amber-200 text-amber-900 border-amber-300" 
            : "bg-blue-600 text-white border-blue-700"
        }`}>
          {stokKosong > 0 ? (
            <AlertTriangle className="w-6 h-6 stroke-[3]" />
          ) : (
            <TrendingUp className="w-6 h-6 stroke-[3]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-black leading-tight tracking-tight">
            {stokKosong > 0 ? `${stokKosong} Produk Stok Habis!` : "Hebat! Semua Stok Aman"}
          </h2>
          <p className="text-xs font-bold text-gray-700 mt-1 leading-snug">
            {stokKosong > 0 
              ? "Segera cek daftar barang dan hubungi agen untuk kulakan ulang." 
              : "Belum ada produk terdaftar yang sisa kuantitas fisiknya nol."}
          </p>
        </div>
      </div>

    </div>
  );
}