// js/components/sidebar.js

const sidebarHTML = `
<aside id="main-sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0f1c] border-r border-slate-800/50 flex flex-col transition-transform -translate-x-full lg:translate-x-0 lg:relative shadow-2xl">
    
    <div class="p-6 border-b border-slate-800/50 flex justify-between items-center">
        <h1 class="text-2xl font-black text-white flex gap-2 items-center tracking-widest">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><polyline points="11 3 11 11 14 8 17 11 17 3"></polyline></svg>
            ROOT
        </h1>
        <button id="close-sidebar" class="lg:hidden text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    </div>

    <div class="p-4 border-b border-slate-800/50 bg-[#030712]/50">
        <p class="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">FOUNDER PANEL</p>
        <p class="text-xs font-bold truncate text-white uppercase" id="sidebar-user-email">Memuat...</p>
    </div>

    <nav class="flex-1 p-3 space-y-1.5 overflow-y-auto mt-2 custom-scrollbar">
        <a href="dashboard.html" data-page="dashboard.html" class="nav-link w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg> 
            <span class="text-sm">Executive Analytics</span>
        </a>
        <a href="leads.html" data-page="leads.html" class="nav-link w-full flex items-center justify-between p-3.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white font-bold">
            <div class="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg> 
                <span class="text-sm">Prospek (Leads)</span>
            </div>
            <span id="badge-leads" class="hidden bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">New</span>
        </a>
        <a href="tenant.html" data-page="tenant.html" class="nav-link w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg> 
            <span class="text-sm">Database Tenant</span>
        </a>
        <a href="operator.html" data-page="operator.html" class="nav-link w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg> 
            <span class="text-sm">Akses Operator IT</span>
        </a>

        <div class="my-3 border-t border-slate-800/50"></div>
        
        <a href="live.html" data-page="live.html" class="nav-link w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> 
            <span class="text-sm">Global Live Monitor</span>
        </a>
        <a href="pricing.html" data-page="pricing.html" class="nav-link w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg> 
            <span class="text-sm">Pricing Matrix</span>
        </a>
        <a href="rekening.html" data-page="rekening.html" class="nav-link w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> 
            <span class="text-sm">Rekening Pembayaran</span>
        </a>
        <a href="cms.html" data-page="cms.html" class="nav-link w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> 
            <span class="text-sm">CMS Front Page</span>
        </a>
        <a href="logs.html" data-page="logs.html" class="nav-link w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-slate-400 hover:bg-slate-800 hover:text-white font-bold">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg> 
            <span class="text-sm">System Logs</span>
        </a>
    </nav>

    <div class="p-4 border-t border-slate-800/50">
        <button id="btn-logout" class="w-full flex items-center justify-center gap-2 p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-sm font-bold transition-all border border-rose-500/20 active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> 
            Shutdown Session
        </button>
    </div>
</aside>

<div id="sidebar-overlay" class="fixed inset-0 bg-black/80 z-40 hidden lg:hidden backdrop-blur-sm transition-opacity"></div>
`;

// Fungsi untuk melempar HTML Sidebar ke dalam elemen <div id="sidebar-container">
export function renderSidebar() {
    const container = document.getElementById('sidebar-container');
    if (container) {
        container.innerHTML = sidebarHTML;
        setupSidebarLogic();
    }
}

// Fungsi Logika Sidebar (Aktif, Toggle HP, Ambil Email)
function setupSidebarLogic() {
    const sidebar = document.getElementById('main-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btnClose = document.getElementById('close-sidebar');
    const btnOpen = document.getElementById('open-sidebar'); // Harus ada di Header HTML utama

    // 1. Highlight Menu Aktif Berdasarkan URL
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        if (link.getAttribute('data-page') === currentPage) {
            // Beri warna indigo untuk menu yang sedang terbuka
            link.classList.remove('text-slate-400', 'hover:bg-slate-800', 'hover:text-white');
            link.classList.add('bg-indigo-500', 'text-white', 'font-black', 'shadow-lg', 'shadow-indigo-500/20');
        }
    });

    // 2. Toggle Mobile Menu
    if (btnOpen) {
        btnOpen.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        });
    }
}
