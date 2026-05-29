import { supabase } from '../config/supabase.js';

export function renderGuruSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    const currentPath = window.location.pathname;
    const isActive = (path) => currentPath.includes(path) 
        ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' 
        : 'text-slate-500 hover:bg-slate-100 font-bold';
    const iconColor = (path) => currentPath.includes(path) ? 'text-white' : 'text-slate-400';

    const sidebarHTML = `
        <div id="sidebar-overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 hidden md:hidden transition-opacity"></div>
        
        <aside id="guru-sidebar" class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform -translate-x-full md:relative md:translate-x-0 shadow-2xl md:shadow-none">
            
            <div class="shrink-0">
                <div class="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h1 class="text-lg font-black text-emerald-700 flex gap-2 items-center tracking-tight">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-emerald-500"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg> CBT GURU
                    </h1>
                    <button id="close-sidebar" class="md:hidden text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
                
                <div class="p-4 mx-3 mt-3 mb-1 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-black text-xl uppercase shadow-inner shrink-0" id="sidebar-initial">G</div>
                  <div class="min-w-0">
                    <p class="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5" id="sidebar-role">GURU MAPEL</p>
                    <p class="text-xs font-bold truncate text-slate-800" id="sidebar-name">Memuat...</p>
                  </div>
                </div>
            </div>

            <nav class="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
                <a href="dashboard.html" class="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-sm ${isActive('dashboard.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('dashboard.html')}"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg> Dashboard
                </a>
                <a href="jadwal.html" class="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-sm ${isActive('jadwal.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('jadwal.html')}"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg> Sesi Ujian
                </a>
                <a href="monitor.html" class="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-sm ${isActive('monitor.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('monitor.html')}"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg> Monitor Live
                </a>
                <a href="bank-soal.html" class="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-sm ${isActive('bank-soal.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('bank-soal.html')}"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg> Bank Soal (V2)
                </a>
                <a href="rekap.html" class="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-sm ${isActive('rekap.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('rekap.html')}"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Rekap Nilai
                </a>
                <div class="my-3 border-t border-slate-100"></div>
                <a href="profil.html" class="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-sm ${isActive('profil.html')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="${iconColor('profil.html')}"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> Profil Saya
                </a>
            </nav>
            
            <div class="shrink-0 p-4 border-t border-slate-100 bg-white">
                <button id="btn-logout-sidebar" class="w-full flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg> Keluar Akun</button>
            </div>
        </aside>
    `;
    container.innerHTML = sidebarHTML;

    const sidebar = document.getElementById('guru-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    document.body.addEventListener('click', (e) => {
        if (e.target.closest('#open-sidebar')) { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); }
        if (e.target.closest('#close-sidebar') || e.target.closest('#sidebar-overlay')) { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); }
        if (e.target.closest('#btn-logout-sidebar')) { 
            if(confirm("Yakin ingin keluar?")) { localStorage.clear(); supabase.auth.signOut().then(()=> window.location.href = '../auth/login.html'); }
        }
    });

    async function fetchSidebarIdentity() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { data: profile } = await supabase.from('users').select('name, role').eq('id', session.user.id).single();
            if (profile) {
                document.getElementById('sidebar-name').innerText = profile.name;
                document.getElementById('sidebar-initial').innerText = profile.name.charAt(0).toUpperCase();
                document.getElementById('sidebar-role').innerText = profile.role === 'proctor' ? 'PENGAWAS UJIAN' : 'GURU MAPEL';
            }
        }
    }
    fetchSidebarIdentity();
}
