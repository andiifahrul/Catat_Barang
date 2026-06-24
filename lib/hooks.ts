import useSWR from 'swr';
import { supabase } from './supabase';

// Sebuah "fetcher" universal untuk Supabase
const supabaseFetcher = async (query: any) => {
  const { data, error } = await query;

  if (error) {
    throw error;
  }
  return data;
};

// Hook kustom untuk mengambil data barang
export const useBarang = () => useSWR(supabase.from('barang').select('id, nama_barang, stok').order('created_at', { ascending: false }), supabaseFetcher);