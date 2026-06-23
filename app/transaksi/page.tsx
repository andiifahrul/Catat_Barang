"use client";

import { useState, useEffect } from "react";
import { ArrowLeftRight, Plus, Minus, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import Swal from "sweetalert2"; // <-- 1. Import SweetAlert2 untuk Pop-up Estetik

interface Barang {
  id: string;
  nama_barang: string;
  stok: number;
}

export default function TransaksiPage() {
  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingTombol, setLoadingTombol] = useState(false);

  const [barangTerpilih, setBarangTerpilih] = useState("");
  const [jenisTransaksi, setJenisTransaksi] = useState<"MASUK" | "KELUAR">("MASUK");
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");

  // ========================================================
  // 1. FUNGSI AMBIL DAFTAR PRODUK UNTUK PILIHAN DROPDOWN
  // ========================================================
  const fetchDaftarBarang = async () => {
    setLoadingData(true);
    const { data, error } = await supabase
      .from("barang")
      .select("id, nama_barang, stok")
      .order("nama_barang", { ascending: true }); 

    if (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat Produk!",
        text: error.message,
        confirmButtonColor: "#2563eb"
      });
    } else if (data) {
      setDaftarBarang(data);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    fetchDaftarBarang();
  }, []);

  // ========================================================
  // 2. FUNGSI SIMPAN Catatan & UPDATE OTOMATIS STOK BARANG
  // ========================================================
  const handleSimpanTransaksi = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi Isian Kosong dengan SweetAlert2
    if (!barangTerpilih || !jumlah) {
      Swal.fire({
        icon: "warning",
        title: "Belum Lengkap!",
        text: "Pilih nama barang dan isi jumlahnya dulu ya, Ayah/Ibu.",
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Siap, Mengerti"
      });
      return;
    }

    const qty = parseInt(jumlah);
    if (qty <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Jumlah Tidak Valid!",
        text: "Jumlah barang yang dicatat harus lebih dari 0 pcs.",
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Perbaiki"
      });
      return;
    }

    const produkData = daftarBarang.find((b) => b.id === barangTerpilih);
    if (!produkData) {
      Swal.fire({
        icon: "error",
        title: "Produk Rusak!",
        text: "Data produk tidak ditemukan di sistem gudang.",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    // Validasi Stok Kurang Kontras Tinggi
    if (jenisTransaksi === "KELUAR" && produkData.stok - qty < 0) {
      Swal.fire({
        icon: "error",
        title: "Stok Tidak Cukup!",
        text: `Sisa stok fisik nyata saat ini hanya ${produkData.stok} pcs. Tidak bisa dikurangi ${qty} pcs.`,
        confirmButtonColor: "#dc2626",
        confirmButtonText: "Cek Kembali"
      });
      return;
    }

    setLoadingTombol(true);

    const stokBaru = jenisTransaksi === "MASUK" 
      ? produkData.stok + qty 
      : produkData.stok - qty;

    // A. Masukkan baris baru ke log riwayat tabel 'transaksi'
    const { error: errorTransaksi } = await supabase
      .from("transaksi")
      .insert([
        {
          barang_id: barangTerpilih,
          jenis_transaksi: jenisTransaksi,
          jumlah: qty,
          keterangan: keterangan || "-",
        },
      ]);

    if (errorTransaksi) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan!",
        text: errorTransaksi.message,
        confirmButtonColor: "#dc2626"
      });
      setLoadingTombol(false);
      return;
    }

    // B. Perbarui angka kolom stok di tabel master 'barang'
    const { error: errorUpdateStok } = await supabase
      .from("barang")
      .update({ stok: stokBaru })
      .eq("id", barangTerpilih);

    if (errorUpdateStok) {
      Swal.fire({
        icon: "error",
        title: "Gagal Sinkronisasi!",
        text: `Log tercatat, namun gagal memperbarui master stok: ${errorUpdateStok.message}`,
        confirmButtonColor: "#dc2626"
      });
      setLoadingTombol(false);
      return;
    }

    // Pop-up Berhasil yang Sangat Cantik & Menutup Otomatis
    Swal.fire({
      icon: "success",
      title: "Berhasil Disimpan!",
      text: `Catatan aktivitas barang ${jenisTransaksi.toLowerCase()} sudah aman di cloud.`,
      confirmButtonColor: "#16a34a",
      confirmButtonText: "Mantap!",
      timer: 2500
    });
    
    setJumlah("");
    setKeterangan("");
    setLoadingTombol(false);
    fetchDaftarBarang();
  };

  return (
    <div className="p-5 max-w-md mx-auto space-y-6">
      
      {/* 1. HEADER HALAMAN */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <ArrowLeftRight className="text-blue-600 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transaksi Barang</h1>
          <p className="text-sm text-gray-600 font-medium">Catat barang masuk atau barang keluar</p>
        </div>
      </div>

      {/* 2. FORM TRANSAKSI UTAMA */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200">
        <form onSubmit={handleSimpanTransaksi} className="space-y-5">
          
          {/* PILIH BARANG (Dropdown Jumbo) */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Pilih Nama Barang</label>
            {loadingData ? (
              <div className="w-full text-base p-3.5 border-2 border-gray-200 rounded-xl bg-gray-100 font-bold text-gray-500 flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Sedang memuat daftar produk...
              </div>
            ) : (
              <select
                value={barangTerpilih}
                onChange={(e) => setBarangTerpilih(e.target.value)}
                disabled={loadingTombol}
                className="w-full text-lg p-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-bold bg-gray-50 text-black disabled:opacity-50"
              >
                <option value="">-- Sentuh & Pilih Barang --</option>
                {daftarBarang.map((barang) => (
                  <option key={barang.id} value={barang.id}>
                    {barang.nama_barang} (Stok: {barang.stok} pcs)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* TOMBOL AKTIVITAS (Hijau / Merah Kontras) */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Jenis Aktivitas</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={loadingTombol}
                onClick={() => setJenisTransaksi("MASUK")}
                className={`py-4 px-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 border-2 transition disabled:opacity-50 ${
                  jenisTransaksi === "MASUK"
                    ? "bg-emerald-600 border-emerald-700 text-white shadow-md scale-102"
                    : "bg-gray-100 border-gray-300 text-gray-700"
                }`}
              >
                <Plus className="w-6 h-6 stroke-[3]" />
                Barang Masuk
              </button>

              <button
                type="button"
                disabled={loadingTombol}
                onClick={() => setJenisTransaksi("KELUAR")}
                className={`py-4 px-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 border-2 transition disabled:opacity-50 ${
                  jenisTransaksi === "KELUAR"
                    ? "bg-rose-600 border-rose-700 text-white shadow-md scale-102"
                    : "bg-gray-100 border-gray-300 text-gray-700"
                }`}
              >
                <Minus className="w-6 h-6 stroke-[3]" />
                Barang Keluar
              </button>
            </div>
          </div>

          {/* JUMLAH BARANG (FIXED: AMAN DARI SCROLLING ACCIDENT) */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Jumlah Barang (Pcs)</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={jumlah}
              onChange={(e) => {
                const hanyaAngka = e.target.value.replace(/[^0-9]/g, "");
                setJumlah(hanyaAngka);
              }}
              placeholder="Ketik angka jumlah barang"
              disabled={loadingTombol}
              className="w-full text-lg p-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-black bg-gray-50 text-black placeholder-gray-500 disabled:opacity-50"
            />
          </div>

          {/* CATATAN TAMBAHAN */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Catatan / Keterangan (Opsional)</label>
            <input
              type="text"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Kiriman agen / Pesanan diambil"
              disabled={loadingTombol}
              className="w-full text-lg p-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-medium bg-gray-50 text-black placeholder-gray-500 disabled:opacity-50"
            />
          </div>

          {/* TOMBOL SIMPAN UTAMA */}
          <button
            type="submit"
            disabled={loadingTombol || loadingData}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black text-xl py-4.5 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md mt-4"
          >
            {loadingTombol ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Sedang Menyimpan Ke Cloud...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                <span>Simpan Catatan Transaksi</span>
              </>
            )}
          </button>

        </form>
      </div>

    </div>
  );
}