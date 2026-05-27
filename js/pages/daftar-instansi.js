// js/pages/daftar-instansi.js
import { supabase } from '../config/supabase.js';

// NOMOR WHATSAPP FOUNDER (Ganti dengan nomor WA asli Bos)
const WHATSAPP_NUMBER = "6281234567890"; 

document.getElementById('form-kemitraan').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btn = document.getElementById('btn-submit-customer');
    const originalText = btn.innerHTML;
    btn.innerHTML = "MENYIMPAN DATA DATA...";
    btn.disabled = true;

    // Ambil Nilai Form
    const name = document.getElementById('cust-name').value;
    const role = document.getElementById('cust-role').value;
    const school = document.getElementById('cust-school').value;
    const pckg = document.getElementById('cust-package').value;
    const message = document.getElementById('cust-message').value || 'Tidak ada catatan tambahan.';

    try {
        // 1. INPUT KE DATABASE SUPABASE (Murni & Rapi)
        const { error } = await supabase
            .from('registrasi_instansi')
            .insert([{
                nama_pic: name,
                jabatan: role,
                nama_instansi: school,
                pilihan_paket: pckg,
                pesan_tambahan: message,
                status_prospek: 'Baru'
            }]);

        if (error) throw error;

        // 2. STRUKTURKAN PESAN OTOMATIS WHATSAPP
        const waText = `Halo Tim Alima CBT Enterprise! 👋\n\n` +
                       `Saya ingin mengajukan pendaftaran instansi baru:\n` +
                       `-----------------------------------------\n` +
                       `• *Nama PIC* : ${name}\n` +
                       `• *Jabatan* : ${role}\n` +
                       `• *Instansi* : ${school}\n` +
                       `• *Pilihan Paket* : ${pckg}\n` +
                       `• *Catatan* : ${message}\n` +
                       `-----------------------------------------\n` +
                       `Mohon dibantu untuk proses aktivasi dan pembuatan kode instansinya. Terima kasih!`;

        // Encode teks agar aman dibaca URL browser
        const encodedText = encodeURIComponent(waText);
        const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedText}`;

        // 3. SELESAI, REFRESH FORM & TERBANGKAN KE WHATSAPP
        btn.innerHTML = "MENYAMBUNGKAN KE WA...";
        document.getElementById('form-kemitraan').reset();
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
            window.open(waUrl, '_blank');
        }, 1000);

    } catch (err) {
        console.error("Gagal mendaftarkan Leads:", err.message);
        alert("Gagal memproses pendaftaran. Silakan periksa koneksi internet Anda.");
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
