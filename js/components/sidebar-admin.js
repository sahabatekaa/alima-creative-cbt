// Lokasi file: js/components/sidebar-admin.js
import { supabase } from '../config/supabase.js';

export function renderAdminSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    const currentPath = window.location.pathname;
    
    const isActive = (path) => currentPath.includes(path) 
        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-blue-600 font-medium border border-transparent';

    const iconColor = (path) => currentPath.includes(path) ? 'text-white' : 'text-slate-400 group-hover:text-blue-600';

    const sidebarHTML = `
        <div id="sidebar-overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden md:hidden transition-opacity"></div>

        <aside id="admin-sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform -translate-x-full md:relative md:translate-x-0">
            
            <div class="h-20 flex items-center gap-3 px-6 border-b border-slate-100 bg-white">
                <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-md shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                </div>
                <div>
                    <h1 class="text-base font-black tracking-tight text-slate-800 leading-none uppercase">Admin<span class="text-blue-600">TU</span></h1>
                    <p class="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5" id="sidebar-school-id">Memuat ID...</p>
                </div>
                <button id="close-sidebar" class="md:hidden ml-auto text-slate-400 hover:text-rose-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar py-6 px-4 space-y-1.5 bg-slate-50/50">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Menu Utama</p>
                
                <a href="dashboard.html" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group ${isActive('dashboard.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('dashboard.html')}"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
                    Dashboard Ringkasan
                </a>
                
                <a href="sekolah.html" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group ${isActive('sekolah.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('sekolah.html')}"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Profil Sekolah
                </a>
                
                <div class="my-4 border-t border-slate-200/60"></div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Data Induk (Master)</p>

                <a href="siswa.html" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group ${isActive('siswa.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('siswa.html')}"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    Database Siswa
                </a>
                <a href="guru.html" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group ${isActive('guru.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('guru.html')}"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    Data Guru & Staf
                </a>
                <a href="master-data.html" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group ${isActive('master-data.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('master-data.html')}"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    Kelas & Mata Pelajaran
                </a>

                <div class="my-4 border-t border-slate-200/60"></div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Manajemen Ujian</p>

                <a href="bank-soal.html" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group ${isActive('bank-soal.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('bank-soal.html')}"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    Master Bank Soal
                </a>
                <a href="jadwal.html" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group ${isActive('jadwal.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('jadwal.html')}"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    Sesi & Jadwal Ujian
                </a>
                <a href="rekap.html" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm group ${isActive('rekap.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('rekap.html')}"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                    Cetak Rekap Nilai
                </a>
            </div>

            <div class="p-4 border-t border-slate-200 bg-white">
                <button id="btn-logout-sidebar" class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-sm transition-colors border border-rose-100">
                    <svg xmlns="http://www.w3.org/2000/xl" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Keluar Sistem
                </button>
            </div>
        </aside>
    `;

    container.innerHTML = sidebarHTML;

    // Definisikan Event Listener Ulang (Sesuai kode sebelumnya)
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btnClose = document.getElementById('close-sidebar');

    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#open-sidebar')) {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        }
    });

    if (btnClose) btnClose.onclick = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };
    if (overlay) overlay.onclick = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };

    document.getElementById('btn-logout-sidebar').onclick = async () => {
        if(confirm("Yakin ingin keluar?")) { await supabase.auth.signOut(); window.location.href = '../auth/login.html'; }
    };

    async function fetchSidebarIdentity() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: profile } = await supabase.from('users').select('school_id').eq('id', session.user.id).single();
            if (profile) document.getElementById('sidebar-school-id').innerText = `ID: ${profile.school_id}`;
        }
    }
    fetchSidebarIdentity();
}