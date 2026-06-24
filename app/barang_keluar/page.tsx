"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, Minus, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import Swal from "sweetalert2";

interface Barang {
  id: string;
  nama_barang: string;
  stok: number;
}

export default function BarangKeluarPage() {
  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingTombol, setLoadingTombol] = useState(false);

  const [barangTerpilih, setBarangTerpilih] = useState("");
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
    
    if (!barangTerpilih || !jumlah) {
      Swal.fire({
        icon: "warning",
        title: "Belum Lengkap!",
        text: "Pilih nama barang dan isi jumlahnya dulu.",
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
        text: "Jumlah barang harus lebih dari 0.",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    const produkData = daftarBarang.find((b) => b.id === barangTerpilih);
    if (!produkData) return;

    if (produkData.stok - qty < 0) {
      Swal.fire({
        icon: "error",
        title: "Stok Tidak Cukup!",
        text: `Sisa stok saat ini hanya ${produkData.stok} pcs. Tidak bisa dikurangi ${qty} pcs.`,
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    setLoadingTombol(true);

    const stokBaru = produkData.stok - qty;

    const { error: errorTransaksi } = await supabase
      .from("transaksi")
      .insert({
          barang_id: barangTerpilih,
          jenis_transaksi: "KELUAR",
          jumlah: qty,
          keterangan: keterangan || "Penjualan",
        });

    if (errorTransaksi) {
      Swal.fire({ icon: "error", title: "Gagal Menyimpan!", text: errorTransaksi.message });
      setLoadingTombol(false);
      return;
    }

    const { error: errorUpdateStok } = await supabase
      .from("barang")
      .update({ stok: stokBaru })
      .eq("id", barangTerpilih);

    if (errorUpdateStok) {
      Swal.fire({ icon: "error", title: "Gagal Sinkronisasi Stok!", text: errorUpdateStok.message });
      setLoadingTombol(false);
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Berhasil Disimpan!",
      text: `Stok barang telah diperbarui.`,
      timer: 2000,
      showConfirmButton: false
    });

    // Optimasi: Update state lokal tanpa fetch ulang semua data
    setDaftarBarang(prevDaftar => 
      prevDaftar.map(barang => 
        barang.id === barangTerpilih 
          ? { ...barang, stok: stokBaru } 
          : barang
      )
    );

    setBarangTerpilih("");
    setJumlah("");
    setKeterangan("");
    setLoadingTombol(false);
  };

  return (
    <div className="p-5 max-w-md mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <ShoppingBag className="text-rose-600 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Barang Keluar / Penjualan</h1>
          <p className="text-sm text-gray-600 font-medium">Catat barang yang keluar atau terjual</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200">
        <form onSubmit={handleSimpanTransaksi} className="space-y-5">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Pilih Nama Barang</label>
            {loadingData ? (
              <div className="w-full text-base p-3.5 border-2 border-gray-200 rounded-xl bg-gray-100 font-bold text-gray-500">Memuat produk...</div>
            ) : (
              <select
                value={barangTerpilih}
                onChange={(e) => setBarangTerpilih(e.target.value)}
                disabled={loadingTombol}
                className="w-full text-lg p-3.5 border-2 border-gray-300 rounded-xl focus:border-rose-600 focus:outline-none font-bold bg-gray-50"
              >
                <option value="">-- Pilih Barang --</option>
                {daftarBarang.map((barang) => (
                  <option key={barang.id} value={barang.id}>
                    {barang.nama_barang} (Stok: {new Intl.NumberFormat('id-ID').format(barang.stok)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Jumlah Keluar</label>
            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={jumlah} 
              onChange={(e) => {
                const hanyaAngka = e.target.value.replace(/[^0-9]/g, "");
                setJumlah(hanyaAngka);
              }} 
              placeholder="Jumlah barang yang keluar" 
              disabled={loadingTombol} className="w-full text-lg p-3.5 border-2 border-gray-300 rounded-xl focus:border-rose-600 focus:outline-none font-black bg-gray-50" />
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-1">Keterangan (Opsional)</label>
            <input type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Contoh: Dijual ke pelanggan A" disabled={loadingTombol} className="w-full text-lg p-3.5 border-2 border-gray-300 rounded-xl focus:border-rose-600 focus:outline-none font-medium bg-gray-50" />
          </div>

          <button type="submit" disabled={loadingTombol || loadingData} className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-gray-400 text-white font-black text-xl py-4.5 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md mt-4">
            {loadingTombol ? (
              <><Loader2 className="w-6 h-6 animate-spin" /><span>Menyimpan...</span></>
            ) : (
              <><Minus className="w-6 h-6 stroke-[3]" /><span>Simpan Barang Keluar</span></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}