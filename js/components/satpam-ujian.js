// --- SATPAM CBT ENTERPRISE ---
console.log("🛡️ Satpam Ujian Aktif!");

// 1. Blokir Klik Kanan
document.addEventListener('contextmenu', event => event.preventDefault());

// 2. Blokir Copy, Cut, Paste
['copy', 'cut', 'paste'].forEach(evt => {
    document.addEventListener(evt, e => {
        e.preventDefault();
        alert("⚠️ PELANGGARAN: Aksi menyalin teks dilarang keras!");
    });
});

// 3. Blokir Tombol Pintasan Keyboard (F12, Ctrl+U, Ctrl+C)
document.addEventListener('keydown', (e) => {
    if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') || 
        (e.ctrlKey && e.shiftKey && e.key === 'C') ||
        (e.ctrlKey && e.shiftKey && e.key === 'J') ||
        (e.ctrlKey && e.key === 'U') ||
        (e.ctrlKey && e.key === 'C') 
    ) {
        e.preventDefault();
        alert("⚠️ PELANGGARAN: Akses developer diblokir!");
    }
});

// 4. Sensor Pindah Tab / Keluar Aplikasi
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Logika mencatat pelanggaran ke database Supabase ada di file exam.html
        // Event ini hanya memicu peringatan keras di layar siswa.
        const warning = document.createElement('div');
        warning.innerHTML = `
            <div style="position:fixed; inset:0; background:rgba(220, 38, 38, 0.95); z-index:9999; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; font-family:sans-serif; text-align:center; padding:20px;">
                <h1 style="font-size:3rem; font-weight:900; margin-bottom:10px;">🛑 PELANGGARAN!</h1>
                <p style="font-size:1.2rem; font-weight:bold;">Anda terdeteksi keluar dari halaman ujian.</p>
                <p style="font-size:1rem; margin-top:20px;">Aktivitas ini telah dicatat ke layar Pengawas.</p>
                <button onclick="this.parentElement.remove()" style="margin-top:30px; padding:15px 30px; background:white; color:red; border:none; border-radius:10px; font-weight:bold; font-size:1rem; cursor:pointer;">SAYA MENGERTI</button>
            </div>
        `;
        document.body.appendChild(warning);
    }
});
