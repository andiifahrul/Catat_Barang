"use client";

import { useState, useEffect } from "react";
import { History, Search, ArrowUpRight, ArrowDownLeft, Calendar, Loader2, X, Download } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

interface Transaksi {
  id: string;
  created_at: string;
  jenis_transaksi: "MASUK" | "KELUAR";
  jumlah: number;
  keterangan: string;
  barang: {
    nama_barang: string;
  } | null;
}

export default function RiwayatPage() {
  const [daftarRiwayat, setDaftarRiwayat] = useState<Transaksi[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [kataKunci, setKataKunci] = useState("");

  // Ambil waktu saat ini secara realtime
  const waktuSekarang = new Date();
  const [filterBulan, setFilterBulan] = useState<string>(String(waktuSekarang.getMonth() + 1)); 
  const [filterTahun, setFilterTahun] = useState<string>(String(waktuSekarang.getFullYear())); 

  // Pilihan nama bulan baku
  const daftarNamaBulan = [
    { angka: "1", nama: "Januari" },
    { angka: "2", nama: "Februari" },
    { angka: "3", nama: "Maret" },
    { angka: "4", nama: "April" },
    { angka: "5", nama: "Mei" },
    { angka: "6", nama: "Juni" },
    { angka: "7", nama: "Juli" },
    { angka: "8", nama: "Agustus" },
    { angka: "9", nama: "September" },
    { angka: "10", nama: "Oktober" },
    { angka: "11", nama: "November" },
    { angka: "12", nama: "Desember" },
  ];

  // ========================================================
  // FUNGSI HITUNG TOTAL TRANSAKSI PER BULAN (Berdasarkan Tahun yang Dipilih)
  // ========================================================
  const hitungTransaksiPerBulan = (angkaBulan: string) => {
    const total = daftarRiwayat.filter((item) => {
      const tglItem = new Date(item.created_at);
      const blnItem = String(tglItem.getMonth() + 1);
      const thnItem = String(tglItem.getFullYear());
      
      // Hitung kecocokan data transaksi di bulan tersebut pada TAHUN AKTIF
      return blnItem === angkaBulan && thnItem === filterTahun;
    });
    
    return total.length;
  };

  // ========================================================
  // LOGIKA OTOMATIS: Mengambil daftar tahun langsung dari data yang ADA
  // ========================================================
  const dapatkanDaftarTahun = () => {
    if (daftarRiwayat.length === 0) {
      return [String(waktuSekarang.getFullYear())];
    }
    const semuaTahun = daftarRiwayat.map((item) => String(new Date(item.created_at).getFullYear()));
    const tahunUnik = Array.from(new Set(semuaTahun)).sort((a, b) => b.localeCompare(a));
    return tahunUnik;
  };

  const fetchRiwayat = async () => {
    setLoadingData(true);
    try {
      const { data, error } = await supabase
        .from("transaksi")
        .select(`
          id,
          created_at,
          jenis_transaksi,
          jumlah,
          keterangan,
          barang ( nama_barang )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Gagal Memuat Riwayat!",
          text: error.message,
          confirmButtonColor: "#2563eb"
        });
      } else if (data) {
        setDaftarRiwayat(data as any);
        if (data.length > 0) {
          const tahunTerbaru = String(new Date(data[0].created_at).getFullYear());
          setFilterTahun(tahunTerbaru);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchRiwayat();
  }, []);

  // Logika Penyaring Daftar Tampilan Utama
  const riwayatTersaring = daftarRiwayat.filter((item) => {
    const tglItem = new Date(item.created_at);
    const blnItem = String(tglItem.getMonth() + 1);
    const thnItem = String(tglItem.getFullYear());

    if (blnItem !== filterBulan || thnItem !== filterTahun) {
      return false;
    }

    const namaBarang = item.barang?.nama_barang?.toLowerCase() || "";
    const catatan = item.keterangan?.toLowerCase() || "";
    const cari = kataKunci.toLowerCase();

    return namaBarang.includes(cari) || catatan.includes(cari);
  });

  const handleEksporCSV = () => {
    if (riwayatTersaring.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Data Saringan Kosong!",
        text: "Tidak ada data riwayat yang cocok di bulan ini untuk diekspor.",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    const namaBulanAktif = daftarNamaBulan.find(b => b.angka === filterBulan)?.nama || "";
    const header = ["Tanggal & Jam", "Nama Barang", "Jenis Mutasi", "Jumlah (Pcs)", "Catatan / Keterangan\n"];
    
    const barisData = riwayatTersaring.map((item) => {
      const tanggal = new Date(item.created_at).toLocaleString("id-ID");
      const nama = item.barang?.nama_barang || "Produk Dihapus";
      const jenis = item.jenis_transaksi;
      const qty = item.jumlah;
      const ket = item.keterangan || "-";
      
      return `"${tanggal}","${nama}","${jenis}",${qty},"${ket}"\n`;
    });

    const kontenCSV = "\uFEFF" + header.join(",") + barisData.join("");
    const blob = new Blob([kontenCSV], { type: "text/csv;charset=utf-8;" });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Laporan_Toko_${namaBulanAktif}_${filterTahun}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: "success",
      title: "Berhasil Diekspor!",
      text: `Laporan bulan ${namaBulanAktif} ${filterTahun} sukses diunduh.`,
      confirmButtonColor: "#16a34a",
      timer: 2500
    });
  };

  const formatTanggal = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WITA";
  };

  return (
    <div className="p-5 max-w-md mx-auto space-y-5 pb-24">

      {/* 1. HEADER HALAMAN */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-200 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <History className="text-blue-600 w-8 h-8 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Riwayat Aktivitas</h1>
            <p className="text-xs text-gray-600 font-medium truncate">Rekap bulanan cloud internet</p>
          </div>
        </div>

        <button
          onClick={handleEksporCSV}
          disabled={riwayatTersaring.length === 0} // Otomatis mengunci jika hasil saringan bulan tersebut kosong
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-black text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 shadow-md active:scale-95 transition shrink-0"
        >
          <Download className="w-4 h-4 stroke-[3]" />
          Excel (CSV)
        </button>
      </div>

      {/* 2. KOLOM PENCARIAN REAL-TIME */}
      <div className="relative shadow-sm">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
          <Search className="w-5 h-5 stroke-[2.5]" />
        </span>
        <input
          type="text"
          value={kataKunci}
          onChange={(e) => setKataKunci(e.target.value)}
          disabled={daftarRiwayat.length === 0}
          placeholder={daftarRiwayat.length === 0 ? "Belum ada transaksi nyata..." : "Cari nama produk / catatan..."}
          className="w-full text-lg p-4 pl-12 pr-12 border-2 border-gray-300 rounded-2xl focus:border-blue-600 focus:outline-none font-bold bg-white text-black placeholder-gray-400 transition disabled:opacity-60"
        />
        {kataKunci && (
          <button
            type="button"
            onClick={() => setKataKunci("")}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-rose-600"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* 3. DROPDOWN FILTER BULAN & TAHUN DENGAN INDIKATOR ANGKA KECIL */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pilih Bulan</label>
          <select
            value={filterBulan}
            onChange={(e) => setFilterBulan(e.target.value)}
            disabled={daftarRiwayat.length === 0}
            className="w-full text-base p-3 border-2 border-gray-300 rounded-xl font-bold bg-white text-black focus:border-blue-600 focus:outline-none disabled:opacity-50"
          >
            {daftarNamaBulan.map((b) => {
              // Hitung jumlah riwayat transaksi nyata khusus bulan ini
              const jmlTransaksi = hitungTransaksiPerBulan(b.angka);
              return (
                <option key={b.angka} value={b.angka}>
                  {b.nama} ({jmlTransaksi})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pilih Tahun</label>
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(e.target.value)}
            disabled={daftarRiwayat.length === 0}
            className="w-full text-base p-3 border-2 border-gray-300 rounded-xl font-bold bg-white text-black focus:border-blue-600 focus:outline-none disabled:opacity-50"
          >
            {dapatkanDaftarTahun().map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. LIST DATA LOG AKTIVITAS */}
      <div className="space-y-3">
        {loadingData ? (
          <div className="text-center bg-white border border-gray-200 rounded-2xl py-12 text-gray-600 font-bold flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span>Memuat catatan riwayat...</span>
          </div>
        ) : riwayatTersaring.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-base font-bold border-2 border-dashed border-gray-200 rounded-2xl bg-white p-5">
            {daftarRiwayat.length === 0 
              ? "Belum ada catatan aktivitas transaksi harian." 
              : `Tidak ada transaksi di bulan ${daftarNamaBulan.find(b => b.angka === filterBulan)?.nama} ${filterTahun}.`
            }
          </div>
        ) : (
          riwayatTersaring.map((item) => (
            <div 
              key={item.id}
              className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-3 hover:border-gray-300 transition"
            >
              <div className={`p-2.5 rounded-xl border shrink-0 mt-0.5 ${
                item.jenis_transaksi === "MASUK"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : "bg-rose-50 border-rose-200 text-rose-600"
              }`}>
                {item.jenis_transaksi === "MASUK" ? (
                  <ArrowDownLeft className="w-6 h-6 stroke-[3]" />
                ) : (
                  <ArrowUpRight className="w-6 h-6 stroke-[3]" />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-black text-black leading-tight truncate">
                    {item.barang?.nama_barang || "Produk Telah Dihapus"}
                  </h3>
                  <span className={`text-lg font-black shrink-0 ${
                    item.jenis_transaksi === "MASUK" ? "text-emerald-700" : "text-rose-700"
                  }`}>
                    {item.jenis_transaksi === "MASUK" ? "+" : "-"}
                    {item.jumlah} pcs
                  </span>
                </div>

                <p className="text-sm font-bold text-gray-700 leading-snug bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 inline-block max-w-full truncate">
                  Ket: {item.keterangan}
                </p>

                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 pt-0.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatTanggal(item.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}