// js/pages/auth.js
import { supabase } from '../config/supabase.js';

// DOM Elements
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const alertBox = document.getElementById('alert-box');
const alertText = document.getElementById('alert-text');

// 1. FUNGSI TOGGLE UI (Ganti Mode Login <-> Register)
document.getElementById('switch-to-register').addEventListener('click', () => {
    formLogin.classList.add('hidden');
    formRegister.classList.remove('hidden');
    formTitle.innerText = "Daftar Guru Baru";
    formSubtitle.innerText = "Isi data dan kode instansi";
    hideAlert();
});

document.getElementById('switch-to-login').addEventListener('click', () => {
    formRegister.classList.add('hidden');
    formLogin.classList.remove('hidden');
    formTitle.innerText = "Portal Staf Instansi";
    formSubtitle.innerText = "Masuk ke sistem ujian";
    hideAlert();
});

// 2. FUNGSI ROUTING OTOMATIS BERDASARKAN ROLE
async function routeUserByRole(userId, email) {
    // Jalur Khusus Founder (Sesuai kode React Bos)
    if (email === 'admin@alima.com' || email === 'admin@sekolah.com') {
        window.location.href = '../master/dashboard.html';
        return;
    }

    try {
        const { data: profile, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !profile) {
            await supabase.auth.signOut();
            showAlert("Data profil Anda tidak ditemukan di sistem database!", "error");
            return;
        }

        if (profile.status === 'pending') {
            await supabase.auth.signOut();
            showAlert("AKUN BELUM AKTIF! Menunggu persetujuan Admin Tata Usaha Sekolah.", "error");
            return;
        }

        // Routing berdasarkan Role
        if (profile.role === 'admin_sekolah') {
            window.location.href = '../admin-sekolah/dashboard.html';
        } else if (profile.role === 'proctor' || profile.role === 'pengawas') {
            window.location.href = '../pengawas/dashboard.html';
        } else {
            window.location.href = '../guru/dashboard.html';
        }
    } catch (err) {
        console.error("Gagal Routing:", err.message);
        showAlert("Gagal mengarahkan dashboard.", "error");
    }
}

// 3. PROSES LOGIN EMAIL/PASS
formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-login');
    const originalText = btn.innerHTML;
    btn.innerHTML = "MEMVERIFIKASI...";
    btn.disabled = true;
    hideAlert();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await routeUserByRole(data.user.id, email);
    } catch (error) {
        showAlert("Login Gagal! Periksa kembali email dan password Anda.", "error");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// 4. PROSES REGISTRASI GURU
formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-register');
    const originalText = btn.innerHTML;
    btn.innerHTML = "MENDAFTARKAN...";
    btn.disabled = true;
    hideAlert();

    const name = document.getElementById('reg-name').value;
    const schoolCodeRaw = document.getElementById('reg-school').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    // SMART ID FORMATTING (Persis seperti React)
    const cleanSchoolCode = schoolCodeRaw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    try {
        // Cek Tabel Schools
        const { data: schoolData, error: schoolErr } = await supabase
            .from('schools')
            .select('id')
            .eq('id', cleanSchoolCode)
            .maybeSingle();

        if (schoolErr || !schoolData) {
            throw new Error(`Kode Instansi "${cleanSchoolCode}" tidak ditemukan! Minta kode yang benar ke Admin TU.`);
        }

        // Buat Akun Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;

        // Insert Profil Guru
        const { error: dbError } = await supabase
            .from('users')
            .insert([{ 
                id: authData.user.id, 
                name: name, 
                email: email, 
                role: 'teacher', 
                school_id: cleanSchoolCode,
                status: 'pending'
            }]);

        if (dbError) {
            await supabase.auth.admin.deleteUser(authData.user.id); // Fail-safe
            throw new Error("Gagal menyimpan profil.");
        }

        await supabase.auth.signOut();
        showAlert(`DAFTAR BERHASIL! Akun Anda terhubung dengan Instansi: [ ${cleanSchoolCode.toUpperCase()} ]. Silakan tunggu persetujuan Admin TU.`, "success");
        formRegister.reset();
        
        // Pindah otomatis ke tab login setelah 3 detik
        setTimeout(() => document.getElementById('switch-to-login').click(), 3000);

    } catch (error) {
        if (error.message.includes('already registered')) {
            showAlert('Email ini sudah terdaftar. Silakan langsung Login.', "error");
        } else {
            showAlert(error.message, "error");
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// 5. FUNGSI LOGIN DENGAN GOOGLE (OAuth)
async function handleGoogleLogin() {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Supabase akan me-redirect kembali ke halaman ini setelah login Google sukses
                redirectTo: window.location.origin + '/pages/auth/login.html'
            }
        });
        if (error) throw error;
    } catch (error) {
        showAlert("Gagal terhubung ke Google.", "error");
    }
}

document.getElementById('btn-google-login').addEventListener('click', handleGoogleLogin);
document.getElementById('btn-google-register').addEventListener('click', handleGoogleLogin);

// 6. Cek Sesi Otomatis (Termasuk penangkapan setelah balik dari Google Login)
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        routeUserByRole(session.user.id, session.user.email);
    }
}
checkSession();

// Utility Notifikasi
function showAlert(message, type) {
    alertBox.classList.remove('hidden', 'bg-red-50', 'text-red-600', 'border-red-200', 'bg-green-50', 'text-green-600', 'border-green-200');
    alertText.innerText = message;
    if (type === 'error') {
        alertBox.classList.add('bg-red-50', 'text-red-600', 'border-red-200');
    } else {
        alertBox.classList.add('bg-green-50', 'text-green-600', 'border-green-200');
    }
}
function hideAlert() { alertBox.classList.add('hidden'); }
