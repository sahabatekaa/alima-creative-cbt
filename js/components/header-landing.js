export function renderLandingHeader() {
    const container = document.getElementById('header-container');
    if (!container) return;
    
    container.innerHTML = `
        <header class="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                <div class="flex items-center gap-2 sm:gap-2.5">
                    <div class="bg-gradient-to-tr from-blue-600 to-emerald-500 text-white p-1.5 sm:p-2 rounded-lg sm:rounded-xl shadow-md shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                    </div>
                    <div>
                        <h1 class="font-black text-lg sm:text-xl tracking-tight text-slate-800 leading-none">ALIMA<span class="text-blue-600">CBT</span></h1>
                        <p class="text-[8px] sm:text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-0.5">Enterprise</p>
                    </div>
                </div>
                
                <nav class="hidden lg:flex items-center gap-8 font-bold text-sm text-slate-600">
                    <a href="#beranda" class="hover:text-blue-600 transition-colors">Beranda</a>
                    <a href="#fitur" class="hover:text-blue-600 transition-colors">Fitur Unggulan</a>
                    <a href="#klien" class="hover:text-blue-600 transition-colors">Testimoni</a>
                    <a href="#harga" class="hover:text-blue-600 transition-colors">Paket Investasi</a>
                </nav>
                
                <div class="flex items-center gap-2 sm:gap-3">
                    <a href="pages/auth/login.html" class="hidden md:flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg sm:rounded-xl transition-all">
                        Masuk
                    </a>
                    <a href="pages/auth/daftar-instansi.html" class="flex items-center justify-center px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-black text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 rounded-lg sm:rounded-xl transition-all gap-1.5 sm:gap-2">
                        <span>Daftar</span> <span class="hidden sm:inline">Instansi</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </a>
                </div>
            </div>
        </header>
    `;
}
