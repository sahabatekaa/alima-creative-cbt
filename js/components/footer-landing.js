export function renderLandingFooter() {
    const container = document.getElementById('footer-container');
    if (!container) return;
    
    container.innerHTML = `
        <footer id="kontak" class="bg-[#0a0f1c] pt-16 pb-8 border-t border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
                <div>
                    <div class="flex items-center gap-2 sm:gap-2.5 mb-5">
                        <div class="bg-gradient-to-tr from-blue-600 to-emerald-500 text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-md shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                        </div>
                        <div>
                            <h1 class="font-black text-lg sm:text-xl tracking-tight text-white leading-none">ALIMA<span class="text-blue-500">CBT</span></h1>
                            <p class="text-[8px] sm:text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Enterprise</p>
                        </div>
                    </div>
                    <p class="text-slate-400 text-sm leading-relaxed max-w-xs">Penyedia infrastruktur ujian digital B2B terpercaya untuk pendidikan dasar dan menengah atas.</p>
                </div>
                
                <div>
                    <h4 class="text-white font-bold mb-4 uppercase tracking-widest text-[10px]">Tautan Pintas</h4>
                    <ul class="space-y-2 text-sm text-slate-400 font-medium">
                        <li><a href="pages/auth/login.html" class="hover:text-blue-400 transition-colors">Login Admin & Guru</a></li>
                        <li><a href="pages/auth/daftar-instansi.html" class="hover:text-blue-400 transition-colors">Daftar Instansi Baru</a></li>
                        <li><a href="pages/master/dashboard.html" class="hover:text-blue-400 transition-colors">Founder Panel</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="text-white font-bold mb-4 uppercase tracking-widest text-[10px]">Hubungi Kami</h4>
                    <ul class="space-y-3 text-sm text-slate-400 font-medium">
                        <li class="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-blue-400"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            <span id="footer-email">Memuat info...</span>
                        </li>
                        <li class="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-emerald-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                            <span id="footer-phone">Memuat info...</span>
                        </li>
                    </ul>
                </div>
            </div>
            <div class="border-t border-slate-800/50 pt-8 text-center text-xs font-bold text-slate-600">
                &copy; 2026 Alima Creative Studio Enterprise. Hak Cipta Dilindungi.
            </div>
        </footer>
    `;
}
