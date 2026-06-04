import { supabase } from '../config/supabase.js'; // [PERBAIKAN 1] Huruf kecil 'import'

export function renderPengawasSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    
    // Ganti live-radar.html jadi monitor.html
    const sidebarHTML = `
        <div id="sidebar-overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden md:hidden transition-opacity"></div>
        <aside id="pengawas-sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform -translate-x-full md:relative md:translate-x-0 shadow-2xl md:shadow-none">
            <div class="p-5 border-b border-slate-100 flex justify-between items-center">
                <span class="font-black text-indigo-700 text-lg">PENGAWAS CBT</span>
                <button id="close-sidebar-btn" class="md:hidden text-slate-400 hover:text-rose-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <nav class="flex-1 p-3 space-y-2">
                <a href="dashboard.html" class="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors">Dashboard</a>
                <a href="monitor.html" class="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors">Monitor Live</a>
                <a href="profil.html" class="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold transition-colors">Profil</a>
            </nav>
            <div class="p-4 border-t border-slate-100">
                <button id="btn-logout-sidebar" class="w-full p-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Keluar
                </button>
            </div>
        </aside>
    `;
    container.innerHTML = sidebarHTML;
    
    // [PERBAIKAN 3] Logika penutup sidebar untuk mode HP
    const sidebar = document.getElementById('pengawas-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeBtn = document.getElementById('close-sidebar-btn');

    const closeSidebar = () => {
        sidebar?.classList.add('-translate-x-full');
        overlay?.classList.add('hidden');
    };

    overlay?.addEventListener('click', closeSidebar);
    closeBtn?.addEventListener('click', closeSidebar);

    // [PERBAIKAN 2] Fungsi Logout Supabase yang benar dan aman
    document.getElementById('btn-logout-sidebar').onclick = async () => { 
        const btn = document.getElementById('btn-logout-sidebar');
        btn.innerHTML = "Memproses...";
        btn.disabled = true;

        try {
            await supabase.auth.signOut(); // Putus sesi langsung dari server Supabase
            localStorage.clear(); // Bersihkan sisa memori di HP/Laptop
            window.location.href = '../auth/login.html'; 
        } catch (error) {
            console.error("Gagal logout:", error);
            btn.innerHTML = "Keluar";
            btn.disabled = false;
        }
    };
}
