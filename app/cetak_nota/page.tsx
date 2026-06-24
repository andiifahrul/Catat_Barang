"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Loader2, Printer, ArrowLeft, ShoppingCart, AlertTriangle } from "lucide-react";
import Swal from "sweetalert2";

// Definisikan tipe data untuk transaksi yang akan dicetak
interface NotaTransaksi {
  id: string;
  created_at: string;
  jumlah: number;
  keterangan: string;
  barang: {
    nama_barang: string;
    harga_jual?: number;
    harga_beli?: number;
  }[] | null; // <--- Ubah ini menjadi array objek
}

// Definisikan tipe data untuk Pengaturan Toko
interface PengaturanToko {
  nama_toko?: string;
  alamat?: string;
  telepon?: string;
}

function CetakNotaComponent() {
  const searchParams = useSearchParams();
  const transaksiId = searchParams.get("id");
  
  const [transaksi, setTransaksi] = useState<NotaTransaksi | null>(null);
  const [loading, setLoading] = useState(true);
  const [pengaturan, setPengaturan] = useState<PengaturanToko>({});

  useEffect(() => {
    if (!transaksiId) {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "ID Transaksi Tidak Ditemukan",
        text: "Pastikan Anda mengakses halaman ini dari link di halaman riwayat.",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Ambil data transaksi dan pengaturan secara bersamaan untuk efisiensi
        const [transaksiResult, pengaturanResult] = await Promise.all([
          supabase
            .from("transaksi")
            .select(`id, created_at, jumlah, keterangan, barang ( nama_barang, harga_beli )`)
            .eq("id", transaksiId)
            .eq("jenis_transaksi", "KELUAR")
            .single(),
          supabase
            .from("pengaturan")
            .select('nama_toko, alamat, telepon')
            .eq('id', 1)
            .single()
        ]);

        // Proses hasil transaksi
        if (transaksiResult.error) throw transaksiResult.error;
        setTransaksi(transaksiResult.data);

        // Proses hasil pengaturan (tidak melempar error jika gagal, agar nota tetap tampil)
        if (pengaturanResult.error && pengaturanResult.error.code !== 'PGRST116') {
          console.error("Gagal mengambil data pengaturan:", pengaturanResult.error.message);
        }
        if (pengaturanResult.data) {
          setPengaturan(pengaturanResult.data);
        }

      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Gagal Mengambil Data Nota",
          text: `Pesan Error: ${err.message}`,
          confirmButtonColor: "#d33"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [transaksiId]); // Dependensi tetap, karena hanya butuh transaksiId untuk trigger

  // Efek untuk otomatis membuka dialog print saat data siap
  useEffect(() => {
    if (transaksi && !loading) {
      window.print();
    }
  }, [transaksi, loading]);

  const handlePrint = () => window.print();

  const formatTanggal = (isoString: string) => {
    if (!isoString) return "Tanggal tidak valid";
    const d = new Date(isoString);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) + " " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WITA";
  };

  const formatRupiah = (angka: number) => {
    if (isNaN(angka)) return "Rp 0";
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-lg font-semibold text-gray-700">Memuat detail nota...</p>
      </div>
    );
  }

  if (!transaksi) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-5 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500" />
        <h1 className="mt-4 text-2xl font-bold text-gray-800">Nota Tidak Ditemukan</h1>
        <p className="mt-2 text-base text-gray-600">ID Transaksi tidak valid atau transaksi ini bukan merupakan transaksi penjualan.</p>
        <Link href="/riwayat" className="mt-8 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition flex items-center gap-2">
          <ArrowLeft className="w-5 h-5" />
          Kembali ke Riwayat
        </Link>
      </div>
    );
  }
  
  const barangNota = transaksi.barang ? transaksi.barang[0] : null; // Ambil barang pertama dari array
  const hargaSatuan = barangNota?.harga_jual || barangNota?.harga_beli || 0;
  const totalHarga = hargaSatuan * (transaksi.jumlah || 0);

  return (
    <div 
      id="print-wrapper" 
      className="bg-gray-100 min-h-screen flex items-center justify-center p-4 print:bg-white print:p-0"
    >
      <main 
        id="printable-area" 
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-6 print:shadow-none print:rounded-none"
      >
        
        <header className="text-center space-y-1 border-b-2 border-dashed border-gray-300 pb-4">
          <div className="flex justify-center items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-gray-800"/>
            <h1 className="text-2xl font-black text-gray-900">{pengaturan.nama_toko || 'NAMA TOKO'}</h1>
          </div>
          <p className="text-sm text-gray-600">{pengaturan.alamat || 'Alamat Toko'}</p>
          <p className="text-sm text-gray-600">Telp: {pengaturan.telepon || 'Nomor Telepon'}</p>
        </header>

        <section className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="font-semibold text-gray-600">No. Transaksi:</span><span className="font-mono font-bold text-gray-800">#{transaksi.id.substring(0, 8)}</span></div>
          <div className="flex justify-between"><span className="font-semibold text-gray-600">Tanggal:</span><span className="font-mono font-bold text-gray-800">{formatTanggal(transaksi.created_at)}</span></div>
        </section>

        <section className="border-t-2 border-b-2 border-dashed border-gray-300 py-4 space-y-3">
          <div className="grid grid-cols-5 gap-2 font-bold text-sm text-gray-900">
            <p className="col-span-2">Barang</p><p className="text-center">Qty</p><p className="col-span-2 text-right">Subtotal</p>
          </div>
          <div className="grid grid-cols-5 gap-2 text-sm">
            <div className="col-span-2 space-y-0.5"><p className="font-bold text-gray-800 leading-tight">{barangNota?.nama_barang || "Nama Barang Error"}</p><p className="text-xs text-gray-600">{formatRupiah(hargaSatuan)}</p></div>
            <p className="text-center font-medium text-gray-700">x{transaksi.jumlah}</p>
            <p className="col-span-2 text-right font-bold text-gray-800">{formatRupiah(totalHarga)}</p>
          </div>
        </section>

        <section className="space-y-2 pt-2">
          <div className="flex justify-between items-center text-lg font-black text-gray-900"><p>GRAND TOTAL</p><p>{formatRupiah(totalHarga)}</p></div>
          {transaksi.keterangan && (<div className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md border border-gray-200"><span className="font-bold">Catatan:</span> {transaksi.keterangan}</div>)}
        </section>

        <footer className="text-center text-xs text-gray-500 pt-4 border-t-2 border-dashed border-gray-300">
          <p className="font-semibold">Terima kasih telah berbelanja!</p><p>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
        </footer>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 print:hidden">
          <Link href="/riwayat" className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"><ArrowLeft className="w-5 h-5" />Kembali</Link>
          <button onClick={handlePrint} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md active:scale-95 transition flex items-center justify-center gap-2"><Printer className="w-5 h-5" />Cetak Ulang</button>
        </div>
        
        <style jsx global>{`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            /* 1. Sembunyikan semua elemen di body dari pandangan */
            body * {
              visibility: hidden;
            }
            /* 2. Reset semua style pembungkus agar tidak memakan tempat */
            #print-wrapper, #__next, main {
              all: unset !important;
            }
            /* 3. Tampilkan HANYA area nota dan semua isinya */
            #printable-area, #printable-area * {
              visibility: visible;
            }
            /* 4. Posisikan nota di pojok kiri atas halaman cetak */
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }          }
        `}</style>
      </main>
    </div>
  );
}

export default function CetakNotaPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CetakNotaComponent />
    </Suspense>
  );
}