// js/pages/dashboard.js
import { supabase } from '../config/supabase.js';
import { renderSidebar } from '../components/sidebar.js';

// 1. Fungsi Utama: Cek Auth dan Tarik Data
async function initDashboard() {
    try {
        // A. CEK APAKAH USER SUDAH LOGIN
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!session || sessionError) {
            // Kalau belum login, tendang ke halaman login
            window.location.replace('login.html');
            return;
        }

        // B. TARIK DATA PROFIL GURU DARI DATABASE
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

        if (profileError) throw profileError;

        // C. JAHIT SIDEBAR (Masukkan profil guru ke menu samping)
        const schoolId = profile.school_id ? profile.school_id.toUpperCase() : 'TIDAK TERDAFTAR';
        const userName = profile.name || 'Guru Staf';
        
        document.getElementById('sidebar-root').innerHTML = renderSidebar('dashboard', userName, schoolId);
        
        // D. AKTIFKAN TOMBOL LOGOUT
        document.getElementById('btn-logout').addEventListener('click', async () => {
            if(confirm("Yakin ingin keluar?")) {
                await supabase.auth.signOut();
                window.location.replace('login.html');
            }
        });

        // E. UPDATE TEKS SAMBUTAN
        document.getElementById('welcome-text').innerText = `Selamat Datang, ${userName}!`;

        // F. MATIKAN LAYAR LOADING
        document.getElementById('loading-screen').classList.add('hidden');

        // G. (NANTI: Tarik statistik soal, sesi, dll di sini)
        document.getElementById('stat-soal').innerText = "0";
        document.getElementById('stat-sesi').innerText = "0";
        document.getElementById('stat-siswa').innerText = "0";

    } catch (error) {
        console.error("Gagal inisialisasi dashboard:", error.message);
        alert("Sesi bermasalah. Mengalihkan ke login...");
        await supabase.auth.signOut();
        window.location.replace('login.html');
    }
}

// Jalankan fungsi saat halaman HTML dibuka
initDashboard();
