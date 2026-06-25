"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, CheckCircle2, Loader2, Tag, ScanBarcode, Ruler, Boxes } from "lucide-react";
import { supabase } from "@/lib/supabase"; 
import Swal from "sweetalert2";

export default function PembelianPage() {
  const [loadingTombol, setLoadingTombol] = useState(false);

  // State untuk form pembelian barang baru
  const [namaBarang, setNamaBarang] = useState("");
  const [kodeBarang, setKodeBarang] = useState("");
  const [ukuran, setUkuran] = useState("");
  const [hargaBeli, setHargaBeli] = useState("");
  const [jumlah, setJumlah] = useState("");

  // Helper untuk format angka ke Rupiah
  const formatRupiah = (angka: string) => {
    const number_string = angka.replace(/[^,\d]/g, "").toString();
    return number_string.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Helper untuk memastikan input hanya angka (tanpa format)
  const formatAngkaSaja = (angka: string) => {
    // Hanya izinkan angka. Hapus semua karakter non-digit.
    return angka.replace(/\D/g, "");
  };

  // ========================================================
  // FUNGSI SIMPAN PEMBELIAN BARANG BARU
  // ========================================================
  const handleSimpanPembelian = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi input wajib
    if (!namaBarang || !jumlah || !hargaBeli) {
      Swal.fire({
        icon: "warning",
        title: "Belum Lengkap!",
        text: "Nama Barang, Harga Beli, dan Jumlah wajib diisi.",
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Siap, Mengerti"
      });
      return;
    }

    const jumlahBeli = parseInt(formatAngkaSaja(jumlah));
    const hargaBeliAngka = parseFloat(formatAngkaSaja(hargaBeli));

    if (jumlahBeli <= 0 || hargaBeliAngka <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Jumlah Tidak Valid!",
        text: "Harga dan Jumlah pembelian harus lebih dari 0.",
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Perbaiki"
      });
      return;
    }

    setLoadingTombol(true);

    // Ambil user yang sedang login untuk disimpan
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Daftarkan produk baru ke tabel 'barang'
    const { data: barangBaru, error: errorBarang } = await supabase
      .from("barang")
      .insert({
        nama_barang: namaBarang.trim(),
        kode_barcode: kodeBarang.trim() || null,
        ukuran: ukuran.trim() || null,
        harga_beli: hargaBeliAngka,
        stok: jumlahBeli, // Stok awal langsung diisi dari jumlah pembelian
        user_id: user?.id, // <-- TAMBAHKAN: Simpan ID user yang membuat
      })
      .select() // Wajib ada .select() untuk mendapatkan data yang baru dibuat
      .single(); // .single() untuk mengambil objeknya langsung

    if (errorBarang) {
      // Jika error karena nama barang sudah ada (unique constraint)
      if (errorBarang.code === '23505') {
        Swal.fire({
          icon: "error",
          title: "Nama Barang Sudah Ada!",
          text: `Produk dengan nama "${namaBarang}" sudah terdaftar. Silakan gunakan menu 'Transaksi' untuk menambah stok.`,
          confirmButtonColor: "#d97706"
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Gagal Mendaftarkan Barang!",
          text: errorBarang.message,
          confirmButtonColor: "#dc2626"
        });
      }
      setLoadingTombol(false);
      return;
    }

    // 2. Catat transaksi pembelian ke tabel 'transaksi'
    const { error: errorTransaksi } = await supabase
      .from("transaksi")
      .insert({
        barang_id: barangBaru.id, // Gunakan ID dari barang yang baru dibuat
        user_id: user?.id, // <-- TAMBAHKAN: Simpan juga ID user di transaksi
        jenis_transaksi: "MASUK",
        jumlah: jumlahBeli,
        keterangan: `Pembelian awal produk baru`,
      });

    if (errorTransaksi) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mencatat Transaksi!",
        text: `Barang baru berhasil dibuat, namun log transaksinya gagal: ${errorTransaksi.message}`,
        confirmButtonColor: "#dc2626"
      });
      setLoadingTombol(false);
      return;
    }

    Swal.fire({
      icon: "success",
      title: "Pembelian Berhasil!",
      text: `Produk "${namaBarang}" berhasil ditambahkan ke stok.`,
      confirmButtonColor: "#16a34a",
      confirmButtonText: "Mantap!",
      timer: 2500
    });
    
    // Kosongkan form setelah berhasil
    setNamaBarang("");
    setKodeBarang("");
    setUkuran("");
    setHargaBeli("");
    setJumlah("");
    setLoadingTombol(false);
  };

  return (
    <div className="p-5 max-w-md mx-auto space-y-5 pb-24">
      
      {/* 1. HEADER HALAMAN */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <ShoppingCart className="text-emerald-600 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pembelian Barang</h1>
          <p className="text-sm text-gray-600 font-medium">Daftarkan produk baru ke dalam stok</p>
        </div>
      </div>

      {/* 2. FORM TRANSAKSI UTAMA */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200">
        <form onSubmit={handleSimpanPembelian} className="space-y-5">
          
          <InputField icon={Tag} label="Nama Barang" value={namaBarang} onChange={setNamaBarang} placeholder="Contoh: Beras Ramos 5kg" required />
          <InputField icon={ScanBarcode} label="Kode Barang" value={kodeBarang} onChange={setKodeBarang} placeholder="(Opsional)" />
          <InputField icon={Ruler} label="Ukuran" value={ukuran} onChange={setUkuran} placeholder="Contoh: L, XL, 42 (Opsional)" />
          
          {/* Input Harga dengan Format Rupiah */}
          <InputField 
            prefix="Rp" 
            label="Harga Pembelian" 
            value={hargaBeli} 
            onChange={(val) => setHargaBeli(formatRupiah(val))} 
            placeholder="Contoh: 15.000" 
            type="number" 
            required />

          {/* Input Jumlah dengan Format Angka */}
          <InputField 
            icon={Boxes} 
            label="Jumlah Pembelian" 
            value={jumlah} 
            onChange={(val) => setJumlah(formatAngkaSaja(val))} 
            placeholder="Jumlah stok yang masuk" 
            type="number" 
            required />

          {/* TOMBOL SIMPAN UTAMA */}
          <button
            type="submit"
            disabled={loadingTombol}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-black text-lg py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md mt-4"
          >
            {loadingTombol ? (
              <>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-8 h-8 stroke-[3]" />
                <span>Simpan Pembelian</span>
              </>
            )}
          </button>

        </form>
      </div>

    </div>
  );
}

// Definisikan tipe untuk props dari InputField agar lebih jelas dan aman
interface InputFieldProps {
  icon?: React.ElementType;
  prefix?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}

// Komponen Helper untuk Input Field (Prinsip DRY)
// Terapkan tipe yang sudah didefinisikan ke dalam komponen secara eksplisit
const InputField: React.FC<InputFieldProps> = ({ icon: Icon, prefix, label, value, onChange, placeholder, type = "text", required = false }) => (
  <div>
    <label className="block text-base font-bold text-gray-900 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && (
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
          <Icon className="w-5 h-5" />
        </span>
      )}
      {prefix && (
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500 font-bold text-base">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode={type === 'number' ? 'numeric' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full text-base p-3.5 ${Icon || prefix ? 'pl-12' : 'pl-4'} border-2 border-gray-300 rounded-xl focus:border-emerald-600 focus:outline-none font-medium bg-gray-50 text-black placeholder-gray-500`}
      />
    </div>
  </div>
);