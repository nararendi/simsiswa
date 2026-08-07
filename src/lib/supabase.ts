import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
}

// 1. Inisialisasi Supabase Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Definisi interface data siswa (opsional, sesuaikan dengan skema tabel Supabase Anda)
export interface Siswa {
  id?: string | number;
  nama: string;
  nisn?: string;
  kelas?: string;
  created_at?: string;
}

// 2. Operasi Query Dasar & Penanganan Error
export const siswaService = {
  // 3. Mengambil semua data siswa
  async getAllSeniors() {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .order('nama', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error fetching siswa:', error.message || error);
      return { data: null, error };
    }
  },

  // Mengambil siswa berdasarkan ID
  async getById(id: string | number) {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error fetching siswa with ID ${id}:`, error.message || error);
      return { data: null, error };
    }
  },

  // Menambahkan data siswa baru
  async create(siswa: Siswa) {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .insert([siswa])
        .select();

      if (error) throw error;
      return { data: data?.[0] || null, error: null };
    } catch (error: any) {
      console.error('Error creating siswa:', error.message || error);
      return { data: null, error };
    }
  },

  // Mengupdate data siswa
  async update(id: string | number, updates: Partial<Siswa>) {
    try {
      const { data, error } = await supabase
        .from('siswa')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;
      return { data: data?.[0] || null, error: null };
    } catch (error: any) {
      console.error(`Error updating siswa with ID ${id}:`, error.message || error);
      return { data: null, error };
    }
  },

  // Menghapus data siswa
  async delete(id: string | number) {
    try {
      const { error } = await supabase
        .from('siswa')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error: any) {
      console.error(`Error deleting siswa with ID ${id}:`, error.message || error);
      return { success: false, error };
    }
  }
};
