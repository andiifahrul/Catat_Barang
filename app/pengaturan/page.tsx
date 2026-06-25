"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loader2, Save, ArrowLeft, Settings, Power } from "lucide-react";
import Swal from "sweetalert2";

// Definisikan tipe data untuk pengaturan
interface PengaturanToko {
  id: number;
  nama_toko: string;
  alamat: string;
  telepon: string;
}

function PengaturanComponent() {
  // State untuk menyimpan data form, loading, dan status penyimpanan
  const [settings, setSettings] = useState<Partial<PengaturanToko>>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  // useEffect untuk mengambil data pengaturan saat komponen dimuat
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User tidak ditemukan!");

        const { data, error } = await supabase
          .from("pengaturan")
          .select("*")
          .eq("user_id", user.id) // Kembali mengambil data berdasarkan user yang login
          .single(); // Gunakan .single() karena setiap user hanya punya 1 pengaturan

        if (data) {
          setSettings(data);
        }
        
        if (error && error.code !== 'PGRST116') {
          throw error;
        }
      } catch (err: any) {
        Swal.fire({
          icon: "error",
          title: "Gagal Mengambil Data",
          text: `Pesan Error: ${err.message}`,
          confirmButtonColor: "#d33"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Handler untuk memperbarui state saat input di form berubah
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak ditemukan!");

      // Pisahkan 'id' dari data yang akan disimpan untuk menghindari konflik
      const { id, ...settingsData } = settings;

      const dataToUpsert = {
        ...settingsData,
        user_id: user.id, // Simpan user_id yang sedang login
      };
      // Gunakan onConflict: 'user_id' karena kolom ini yang UNIQUE untuk setiap user
      const { error } = await supabase.from("pengaturan").upsert(dataToUpsert, { onConflict: 'user_id' });
      if (error) throw error;
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Pengaturan telah berhasil disimpan.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Menyimpan",
        text: `Pesan Error: ${err.message}`,
        confirmButtonColor: "#d33"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal Logout!",
        text: error.message,
        confirmButtonColor: "#d33"
      });
    } else {
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-lg font-semibold text-gray-700">Memuat Pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center p-4">
      <main className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
        <header className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pengaturan Toko</h1>
            <p className="text-sm text-gray-500">Ubah informasi dasar mengenai toko Anda.</p>
          </div>
        </header>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="nama_toko" className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
            <input type="text" name="nama_toko" id="nama_toko" value={settings.nama_toko || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="alamat" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <input type="text" name="alamat" id="alamat" value={settings.alamat || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="telepon" className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            <input type="text" name="telepon" id="telepon" value={settings.telepon || ""} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button type="button" onClick={() => router.back()} className="w-full text-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Kembali
            </button>
            <button type="submit" disabled={isSaving || loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md active:scale-95 transition flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>

        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg shadow-md active:scale-95 transition flex items-center justify-center gap-2"
          >
            <Power className="w-5 h-5" />
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}

export default function PengaturanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PengaturanComponent />
    </Suspense>
  );
}
