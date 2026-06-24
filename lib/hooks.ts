import useSWR from 'swr';
import { supabase } from './supabase';

interface Barang {
  id: string;
  nama_barang: string;
  stok: number;
}

// Sebuah "fetcher" universal yang akan digunakan oleh semua hook SWR kita.
// Fungsi ini menerima query dari Supabase dan mengembalikan datanya.
const supabaseFetcher = async (query: any) => {
  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return data;
};

// Hook kustom untuk mengambil data barang.
// Anda bisa membuat hook serupa untuk data lain (misal: useRiwayat, usePengaturan).
// SWR akan otomatis meng-cache hasil dari query ini.
export const useBarang = () => useSWR<Barang[]>(supabase.from('barang').select('id, nama_barang, stok').order('created_at', { ascending: false }), supabaseFetcher);