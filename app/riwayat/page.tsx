"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { History, ArrowUpRight, ArrowDownLeft, Calendar, Loader2, Download, Printer } from "lucide-react";
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
    harga_beli?: number;
  } | null;
}

interface PengaturanToko {
  id: number;
  nama_toko: string;
  alamat: string;
  telepon: string;
}

export default function RiwayatPage() {
  const [daftarRiwayat, setDaftarRiwayat] = useState<Transaksi[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  const waktuSekarang = new Date();
  const [startDate, setStartDate] = useState(new Date(waktuSekarang.getFullYear(), waktuSekarang.getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(waktuSekarang.getFullYear(), waktuSekarang.getMonth() + 1, 0));

  useEffect(() => {
    const fetchRiwayat = async () => {
      setLoadingData(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User tidak ditemukan");

        const { data, error } = await supabase
          .from("transaksi")
          .select(`*, barang ( nama_barang, harga_beli )`)
          .eq("user_id", user.id)
          .gte("created_at", startDate.toISOString())
          .lte("created_at", endDate.toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDaftarRiwayat(data || []);
      } catch (err: any) {
        Swal.fire("Gagal", `Gagal memuat riwayat: ${err.message}`, "error");
      } finally {
        setLoadingData(false);
      }
    };
    fetchRiwayat();
  }, [startDate, endDate]);

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);

  const handleCetakNota = async (transaksi: Transaksi) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: settings, error } = await supabase
      .from("pengaturan")
      .select("*")
      .eq("user_id", user.id)
      .single<PengaturanToko>();

    if (error && error.code !== 'PGRST116') {
      Swal.fire("Gagal", "Tidak dapat mengambil data toko untuk nota.", "error");
      return;
    }

    const namaToko = settings?.nama_toko || "Toko Anda";
    const alamatToko = settings?.alamat || "Alamat belum diatur";
    const teleponToko = settings?.telepon || "-";
    const tanggalNota = new Date(transaksi.created_at).toLocaleString("id-ID", { dateStyle: 'medium', timeStyle: 'short' });
    const namaBarang = transaksi.barang?.nama_barang || "Produk Dihapus";
    const hargaSatuan = transaksi.barang?.harga_beli || 0;
    const jumlah = transaksi.jumlah;
    const totalHarga = hargaSatuan * jumlah;

    const notaHTML = `
      <html>
        <head>
          <title>Nota Transaksi</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 0; padding: 10px; color: #000; }
            .container { width: 300px; margin: auto; }
            .header { text-align: center; }
            .header h1 { margin: 0; font-size: 18px; }
            .header p { margin: 2px 0; font-size: 12px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .item { display: flex; justify-content: space-between; font-size: 12px; }
            .item-total { font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${namaToko}</h1>
              <p>${alamatToko}</p>
              <p>Telp: ${teleponToko}</p>
              <p>${tanggalNota}</p>
            </div>
            <div class="divider"></div>
            <div class="item"><span>${namaBarang} (${jumlah}x)</span> <span>${formatRupiah(hargaSatuan)}</span></div>
            <div class="divider"></div>
            <div class="item item-total"><span>TOTAL</span> <span>${formatRupiah(totalHarga)}</span></div>
            <div class="footer"><p>--- Terima Kasih ---</p></div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(notaHTML);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { printWindow.print(); }, 500);
    }
  };

  const formatTanggal = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-5 max-w-md mx-auto space-y-5 pb-24">
      {/* 1. HEADER HALAMAN */}
      <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <History className="text-blue-600 w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Riwayat Transaksi</h1>
          <p className="text-sm text-gray-600 font-medium">Jejak semua barang masuk dan keluar</p>
        </div>
      </div>

      {/* 2. DAFTAR RIWAYAT */}
      <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-200">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
          <h2 className="text-xl font-bold text-gray-800 flex-1">Daftar Transaksi</h2>
          {/* TODO: Tambahkan komponen filter tanggal di sini */}
        </div>

        {loadingData ? (
          <div className="text-center py-12 text-gray-600 font-bold flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span>Memuat riwayat...</span>
          </div>
        ) : daftarRiwayat.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-lg font-bold border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            Belum ada transaksi tercatat.
          </div>
        ) : (
          <div className="space-y-3">
            {daftarRiwayat.map((item) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100/70 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-800 truncate">{item.barang?.nama_barang || "Produk Dihapus"}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.keterangan}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 font-bold text-sm shrink-0 ${item.jenis_transaksi === "MASUK" ? "text-emerald-600" : "text-rose-600"}`}>
                    {item.jenis_transaksi === "MASUK" ? 
                      <ArrowDownLeft className="w-4 h-4" /> : 
                      <ArrowUpRight className="w-4 h-4" />
                    }
                    <span>{item.jumlah}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatTanggal(item.created_at)}</span>
                  </div>
                  {item.jenis_transaksi === "KELUAR" && (
                    <button onClick={() => handleCetakNota(item)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 transition" title="Cetak Nota Transaksi Ini">
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Nota</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}