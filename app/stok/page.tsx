"use client";

import { useState, useEffect } from "react";
import { Package, Plus, FolderPlus, ClipboardList, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import Swal from "sweetalert2"; // Import SweetAlert2 Beranimasi

interface Barang {
  id: string;
  nama_barang: string;
  kode_barcode: string;
  stok: number;
  pesanan_diterima: number;
}

export default function StokPage() {
  const [tabAktif, setTabAktif] = useState<"TAMBAH" | "LIST">("TAMBAH");

  const [daftarBarang, setDaftarBarang] = useState<Barang[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingTombol, setLoadingTombol] = useState(false);

  const [namaBarang, setNamaBarang] = useState("");
  const [barcode, setBarcode] = useState("");
  const [pesananDiterima, setPesananDiterima] = useState("");

  // ========================================================
  // 1. FUNGSI AMBIL DATA DARI SUPABASE ONLINE
  // ========================================================
  const fetchBarang = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("barang")
        .select("id, nama_barang, kode_barcode, stok, pesanan_diterima")
        .order("created_at", { ascending: false }); 

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat!",
          text: error.message,
          confirmButtonColor: "#2563eb"
        });
      } else if (data) {
        setDaftarBarang(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchBarang();
  }, []);

  // ========================================================
  // 2. FUNGSI DAFTAR BARANG BARU (DENGAN PROTEKSI ANTI-KEMBAR)
  // ========================================================
  const handleDaftarBarang = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Nama Barang Kosong!",
        text: "Nama Barang wajib diisi ya, Ayah/Ibu.",
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Siap, Mengerti"
      });
      return;
    }

    setLoadingTombol(true);

    const { error } = await supabase
      .from("barang")
      .insert([
        {
          nama_barang: namaBarang.trim(), // Bersihkan spasi liar di depan/belakang
          kode_barcode: barcode || "-",
          stok: 0, 
          pesanan_diterima: parseInt(pesananDiterima) || 0,
        }
      ]);

    if (error) {
      setLoadingTombol(false);
      
      // JIKA ERROR KARENA DATA KEMBAR (Aturan Unique Constraint di Supabase)
      if (error.code === "23505") {
        Swal.fire({
          icon: "error",
          title: "Nama Sudah Ada!",
          text: `Produk dengan nama "${namaBarang}" sudah pernah didaftarkan sebelumnya. Coba pakai nama lain.`,
          confirmButtonColor: "#d97706"
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Menyimpan!",
          text: error.message,
          confirmButtonColor: "#dc2626"
        });
      }
      return;
    }

    // Pop-up Sukses Estetik Berdurasi Otomatis
    Swal.fire({
      icon: "success",
      title: "Berhasil Terdaftar!",
      text: `Produk "${namaBarang}" sudah aman di database toko.`,
      confirmButtonColor: "#16a34a",
      confirmButtonText: "Mantap!",
      timer: 2500
    });

    setNamaBarang(""); 
    setBarcode(""); 
    setPesananDiterima("");
    setLoadingTombol(false);
    
    setTabAktif("LIST");
    fetchBarang();
  };

  // ========================================================
  // 3. FUNGSI HAPUS PRODUK DENGAN DUA TOMBOL KONFIRMASI
  // ========================================================
  const handleHapusBarang = async (id: string, nama: string) => {
    Swal.fire({
      title: "Yakin Ingin Hapus?",
      text: `Produk "${nama}" akan dihilangkan permanen dari master pembukuan!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", // Merah kontras tinggi untuk eksekusi
      cancelButtonColor: "#6b7280",  // Abu-abu netral untuk batal
      confirmButtonText: "Ya, Hapus Saja",
      cancelButtonText: "Jangan, Batalkan",
      reverseButtons: true // Memposisikan tombol batal di sisi kiri agar ideal bagi navigasi jempol
    }).then(async (result) => {
      if (result.isConfirmed) {
        const { error } = await supabase
          .from("barang")
          .delete()
          .eq("id", id);

        if (error) {
          Swal.fire({
            icon: "error",
            title: "Gagal Menghapus!",
            text: error.message,
            confirmButtonColor: "#2563eb"
          });
        } else {
          Swal.fire({
            icon: "success",
            title: "Terhapus!",
            text: `"${nama}" telah bersih dari daftar produk.`,
            confirmButtonColor: "#16a34a",
            timer: 2000
          });
          fetchBarang(); 
        }
      }
    });
  };

  return (
    <div className="p-5 max-w-md mx-auto space-y-5 pb-24">
      
      {/* 1. HEADER HALAMAN */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <Package className="text-blue-600 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Master Barang</h1>
          <p className="text-sm text-gray-600 font-medium">Atur data nama dan pesanan produk toko</p>
        </div>
      </div>

      {/* 2. SAKLAR TAB JUMBO */}
      <div className="grid grid-cols-2 gap-2 bg-gray-200 p-1.5 rounded-2xl border border-gray-300 shadow-inner">
        <button
          type="button"
          onClick={() => setTabAktif("TAMBAH")}
          className={`py-3 rounded-xl text-base font-black flex items-center justify-center gap-2 transition ${
            tabAktif === "TAMBAH"
              ? "bg-blue-600 text-white shadow-md border border-blue-700"
              : "text-gray-700 hover:bg-gray-100/50"
          }`}
        >
          <FolderPlus className="w-5 h-5 stroke-[2.5]" />
          Pesanan
        </button>

        <button
          type="button"
          onClick={() => setTabAktif("LIST")}
          className={`py-3 rounded-xl text-base font-black flex items-center justify-center gap-2 transition ${
            tabAktif === "LIST"
              ? "bg-white text-blue-700 shadow-md border border-gray-200"
              : "text-gray-700 hover:bg-gray-100/50"
          }`}
        >
          <ClipboardList className="w-5 h-5 stroke-[2.5]" />
          Lihat Produk ({daftarBarang.length})
        </button>
      </div>

      {/* ========================================================
          KONDISI LAYAR KIRI: HALAMAN FORM INPUT BARANG BARU
          ======================================================== */}
      {tabAktif === "TAMBAH" && (
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <FolderPlus className="text-blue-600 w-6 h-6" />
            <h2 className="text-xl font-bold text-gray-800">Daftarkan Barang Baru</h2>
          </div>

          <form onSubmit={handleDaftarBarang} className="space-y-4">
            <div>
              <label className="block text-base font-bold text-gray-900 mb-1">Nama Barang <span className="text-red-500">*</span></label>
              <input 
                type="text"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                placeholder="Contoh: Beras Ramos 5kg"
                disabled={loadingTombol}
                className="w-full text-lg p-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-bold bg-gray-50 text-black placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-gray-900 mb-1">Kode / Barcode (Opsional)</label>
              <input 
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan atau ketik kode jika ada"
                disabled={loadingTombol}
                className="w-full text-lg p-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-medium bg-gray-50 text-black placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-gray-900 mb-1">Pesanan yang Diterima (Pcs)</label>
              <input 
                type="text" 
                inputMode="numeric" 
                pattern="[0-9]*" 
                value={pesananDiterima}
                onChange={(e) => {
                  const hanyaAngka = e.target.value.replace(/[^0-9]/g, "");
                  setPesananDiterima(hanyaAngka);
                }}
                placeholder="0"
                disabled={loadingTombol}
                className="w-full text-lg p-3.5 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-black bg-gray-50 text-black placeholder-gray-500"
              />
            </div>

            <button 
              type="submit"
              disabled={loadingTombol}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-black text-lg py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md mt-2"
            >
              {loadingTombol ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Sedang Menyimpan...</span>
                </>
              ) : (
                <>
                  <Plus className="w-6 h-6 stroke-[3]" />
                  <span>Kunci & Daftarkan Nama</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          KONDISI LAYAR KANAN: HALAMAN LIST DAFTAR MASTER BARANG
          ======================================================== */}
      {tabAktif === "LIST" && (
        <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <ClipboardList className="text-blue-600 w-6 h-6" />
            <h2 className="text-xl font-bold text-gray-800">Daftar Nama Produk</h2>
          </div>

          {loadingData ? (
            <div className="text-center py-12 text-gray-600 font-bold flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span>Memuat data dari internet...</span>
            </div>
          ) : daftarBarang.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-lg font-bold border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              Belum ada nama barang yang terdaftar.
              <button 
                onClick={() => setTabAktif("TAMBAH")}
                className="block mx-auto mt-3 text-sm font-black text-blue-600 hover:underline"
              >
                + Mulai Tambah Produk Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {daftarBarang.map((barang) => (
                <div 
                  key={barang.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-2 hover:bg-gray-100/70 transition"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-lg font-black text-black leading-tight truncate">{barang.nama_barang}</p>
                    <p className="text-sm font-bold text-gray-600">
                      Pesanan: <span className="text-blue-600 font-black">{barang.pesanan_diterima} pcs</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-center min-w-[65px]">
                      <span className="block text-[10px] text-blue-700 font-black uppercase tracking-wider">Stok</span>
                      <span className="text-lg font-black text-blue-900">{barang.stok}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleHapusBarang(barang.id, barang.nama_barang)}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-700 p-2.5 rounded-xl border border-rose-200 active:scale-90 transition"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}