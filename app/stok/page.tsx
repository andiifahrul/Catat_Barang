"use client";

import { useState, useEffect } from "react";
import { Package, ClipboardList, Loader2, Trash2, Search, Plus, RefreshCw, ServerCrash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import { useBarang, type Barang } from "@/lib/hooks"; // Impor hook SWR kustom dan tipe Barang

export default function StokPage() {
  const { data: daftarBarang, isLoading: loadingData, error, mutate } = useBarang();
  const [hasilPencarian, setHasilPencarian] = useState<Barang[]>([]);
  const [kataKunci, setKataKunci] = useState("");

  // Efek untuk melakukan filter pencarian setiap kali kata kunci atau daftar barang berubah
  useEffect(() => {
    // Jika tidak ada daftarBarang (misal saat loading atau error), set hasil pencarian ke array kosong
    if (!daftarBarang) {
      setHasilPencarian([]);
      return;
    }

    if (kataKunci === "") {
      setHasilPencarian(daftarBarang);
    } else {
      const hasilFilter = daftarBarang.filter((barang: Barang) =>
        barang.nama_barang.toLowerCase().includes(kataKunci.toLowerCase())
      );
      setHasilPencarian(hasilFilter);
    }
  }, [kataKunci, daftarBarang]);

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
          // Panggil `mutate()` dari SWR untuk memberitahu SWR agar mengambil ulang data
          // dan memperbarui cache secara otomatis.
          mutate();
        }
      }
    });
  };

  // ========================================================
  // 4. FUNGSI TAMBAH STOK DENGAN KONFIRMASI
  // ========================================================
  const handleTambahStok = async (id: string, nama: string, stokSaatIni: number) => {
    const { value: jumlahTambah } = await Swal.fire({
      title: `Tambah Stok: ${nama}`,
      input: "text",
      inputLabel: "Jumlah stok yang ingin ditambahkan",
      inputPlaceholder: "Masukkan angka jumlah...",
      showCancelButton: true,
      confirmButtonText: "Tambah",
      cancelButtonText: "Batal",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      inputValidator: (value) => {
        if (!value || !/^\d+$/.test(value) || parseInt(value) <= 0) {
          return "Jumlah harus berupa angka positif!";
        }
      },
    });

    if (jumlahTambah) {
      const jumlahBaru = parseInt(jumlahTambah);
      const stokBaru = stokSaatIni + jumlahBaru;

      // Update stok di tabel 'barang'
      const { error: updateError } = await supabase
        .from("barang")
        .update({ stok: stokBaru })
        .eq("id", id);

      if (updateError) {
        Swal.fire("Gagal!", `Gagal memperbarui stok: ${updateError.message}`, "error");
        return;
      }

      // Catat ke tabel 'transaksi'
      const { error: transasiError } = await supabase
      .from("transaksi")
      .insert({
        barang_id: id,
        jenis_transaksi: "MASUK",
        jumlah: jumlahBaru,
        keterangan: `Penambahan stok manual`,
      });

      if (transasiError) {
        Swal.fire("Gagal!", `Stok berhasil diupdate, tapi gagal mencatat transaksi: ${transasiError.message}`, "warning");
      } else {
        Swal.fire("Berhasil!", `Stok ${nama} telah diperbarui menjadi ${stokBaru}.`, "success");
      }

      // Panggil `mutate()` dari SWR untuk memperbarui data di cache setelah stok diubah.
      // UI akan otomatis ter-update dengan data terbaru.
      mutate();
    }
  };

  return (
    <div className="p-5 max-w-md mx-auto space-y-5 pb-24">
      
      {/* 1. HEADER HALAMAN */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <Package className="text-blue-600 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Master Barang</h1>
          <p className="text-sm text-gray-600 font-medium">Daftar produk dan stok saat ini</p>
        </div>
      </div>

      {/* 2. DAFTAR PRODUK */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2 flex-1">
              <ClipboardList className="text-blue-600 w-6 h-6" />
              <h2 className="text-xl font-bold text-gray-800">Daftar Produk ({hasilPencarian.length})</h2>
            </div>
            {/* Tombol untuk refresh data secara manual */}
            <button onClick={() => mutate()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
              <RefreshCw className={`w-5 h-5 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Kolom Pencarian */}
          <div className="relative mb-4">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={kataKunci}
              onChange={(e) => setKataKunci(e.target.value)}
              placeholder="Cari nama barang..."
              className="w-full text-lg p-3.5 pl-12 border-2 border-gray-300 rounded-xl focus:border-blue-600 focus:outline-none font-medium bg-gray-50 text-black placeholder-gray-500"
            />
          </div>

          {loadingData ? (
            <div className="text-center py-12 text-gray-600 font-bold flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <span>Memuat data dari internet...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600 font-bold flex flex-col items-center gap-3 border-2 border-dashed border-red-200 rounded-xl bg-red-50/50">
              <ServerCrash className="w-10 h-10" />
              <span>Gagal memuat data. Coba refresh.</span>
            </div>
          ) : hasilPencarian.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-lg font-bold border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              {kataKunci
                ? `Produk "${kataKunci}" tidak ditemukan.`
                : "Belum ada produk yang terdaftar."}
            </div>
          ) : (
            <div className="space-y-3">
              {hasilPencarian.map((barang) => (
                <div 
                  key={barang.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 gap-2 hover:bg-gray-100/70 transition"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-lg font-black text-black leading-tight truncate">{barang.nama_barang}</p>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg text-center min-w-[65px]">
                      <span className="block text-[10px] text-blue-700 font-black uppercase tracking-wider">Stok</span>
                      <span className="text-lg font-black text-blue-900">{barang.stok}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTambahStok(barang.id, barang.nama_barang, barang.stok)}
                      className="bg-green-100 hover:bg-green-200 text-green-700 p-2.5 rounded-xl border border-green-200 active:scale-90 transition"
                      title="Tambah Stok"
                    >
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </button>

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
    </div>
  );
}