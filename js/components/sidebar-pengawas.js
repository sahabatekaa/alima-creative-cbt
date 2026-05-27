import { supabase } from '../config/supabase.js';

export function renderPengawasSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;
    
    // Ganti live-radar.html jadi monitor.html
    const sidebarHTML = `
        <div id="sidebar-overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden md:hidden"></div>
        <aside id="pengawas-sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform -translate-x-full md:relative md:translate-x-0 shadow-2xl md:shadow-none">
            <div class="p-5 border-b border-slate-100 font-black text-indigo-700 text-lg">PENGAWAS CBT</div>
            <nav class="flex-1 p-3 space-y-2">
                <a href="dashboard.html" class="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold">Dashboard</a>
                <a href="monitor.html" class="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold">Monitor Live</a>
                <a href="profil.html" class="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 font-bold">Profil</a>
            </nav>
            <div class="p-4 border-t"><button id="btn-logout-sidebar" class="w-full p-3 bg-red-50 text-red-600 rounded-xl font-bold">Keluar</button></div>
        </aside>
    `;
    container.innerHTML = sidebarHTML;
    
    document.getElementById('btn-logout-sidebar').onclick = () => { localStorage.clear(); window.location.href = '../auth/login.html'; };
}
