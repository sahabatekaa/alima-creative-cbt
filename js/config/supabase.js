// js/config/supabase.js

const SUPABASE_URL = 'https://qsizuivohreeilqzhcef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Fii896jSXttOD57g6yh0Rw_-BJA2bZT';

if (!window.supabase) {
    console.error("Gagal memuat Supabase! Pastikan CDN terpasang di HTML.");
}

// Inisialisasi Database
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
