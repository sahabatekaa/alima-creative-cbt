// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Activity, Database, FileText, MonitorPlay, 
  CheckCircle, ChevronRight, BookOpen, Layers, Zap, Check, X
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-blue-200 scroll-smooth">
      
      {/* ========================================== */}
      {/* HEADER / NAVBAR */}
      {/* ========================================== */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-blue-600 to-emerald-500 text-white p-2 rounded-xl shadow-md">
              <BookOpen size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tight text-slate-800 leading-none">ALIMA<span className="text-blue-600">CBT</span></h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Enterprise Edition</p>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 font-bold text-sm text-slate-600">
            <a href="#beranda" className="hover:text-blue-600 transition-colors">Beranda</a>
            <a href="#fitur" className="hover:text-blue-600 transition-colors">Fitur Unggulan</a>
            <a href="#harga" className="hover:text-blue-600 transition-colors">Paket Investasi</a>
          </nav>
          
          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:flex items-center justify-center px-5 py-2.5 text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
              Masuk
            </Link>
            <Link to="/login" className="flex items-center justify-center px-5 py-2.5 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 rounded-xl transition-all gap-2">
              Daftar Instansi <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* HERO SECTION */}
      {/* ========================================== */}
      <main className="flex-1 pt-28">
        <section id="beranda" className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto text-center flex flex-col items-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black mb-6 uppercase tracking-wider shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            Sistem Ujian Generasi Baru
          </div>
          
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-800 max-w-4xl tracking-tight leading-tight mb-6">
            Digitalisasi Ujian dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">Aman & Nyaman.</span>
          </h2>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl font-medium mb-10 leading-relaxed">
            Platform <i>Computer Based Test</i> terpadu untuk <b>SDIT dan PAUD/TK IT</b>. Tingkatkan integritas ujian sekolah Anda dengan teknologi Anti-Cheat tercanggih.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2">
              <MonitorPlay size={20} /> Mulai Sekarang
            </Link>
            <a href="#fitur" className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 px-8 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center">
              Pelajari Fitur
            </a>
          </div>
        </section>

        {/* ========================================== */}
        {/* FITUR UNGGULAN SECTION */}
        {/* ========================================== */}
        <section id="fitur" className="bg-white border-y border-slate-200 py-24 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">Keunggulan Utama Alima CBT</h3>
              <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">Sistem cerdas yang mengotomatiskan pekerjaan Tata Usaha dan mengamankan lembar jawaban siswa dalam satu ekosistem terpadu.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-6"><ShieldCheck size={28} /></div>
                <h4 className="text-xl font-black text-slate-800 mb-3">Anti-Cheat Engine</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">Deteksi pindah tab, gembok layar, dan sensor buram otomatis untuk menjamin kejujuran siswa saat ujian.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6"><Activity size={28} /></div>
                <h4 className="text-xl font-black text-slate-800 mb-3">Real-time Radar</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">Pantau progres ujian dan status koneksi (online/offline) seluruh siswa secara langsung dari satu dashboard komando.</p>
              </div>

              <div className="bg-blue-600 border border-blue-500 p-8 rounded-[2rem] hover:shadow-lg transition-all hover:-translate-y-1 shadow-blue-600/20 shadow-xl">
                <div className="w-14 h-14 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6"><FileText size={28} /></div>
                <h4 className="text-xl font-black text-white mb-3">Smart Admin / Cetak</h4>
                <p className="text-blue-100 font-medium leading-relaxed text-sm">Cetak daftar nilai, berita acara, dan daftar hadir otomatis lengkap dengan kop surat resmi sekolah hanya dengan satu klik.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-6"><Layers size={28} /></div>
                <h4 className="text-xl font-black text-slate-800 mb-3">Format Soal Kompleks</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">Mendukung Pilihan Ganda (PG), PG Kompleks (Centang banyak), hingga Soal Esai. Terintegrasi dengan LaTeX untuk Matematika & Arab.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-6"><Database size={28} /></div>
                <h4 className="text-xl font-black text-slate-800 mb-3">Multi-Tenant (SaaS)</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">Satu database terpusat yang memisahkan data antarsekolah secara aman. Privasi data sekolah Anda terjamin 100%.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2rem] hover:shadow-lg transition-all hover:-translate-y-1">
                <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6"><Zap size={28} /></div>
                <h4 className="text-xl font-black text-slate-800 mb-3">Offline Resilient</h4>
                <p className="text-slate-500 font-medium leading-relaxed text-sm">Internet putus di tengah ujian? Jawaban siswa otomatis tersimpan di memori perangkat dan dikirim saat koneksi kembali stabil.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================== */}
        {/* PRICING SECTION */}
        {/* ========================================== */}
        <section id="harga" className="py-24 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tight">Paket Investasi Instansi</h3>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto text-lg">Pilih paket operasional yang sesuai dengan kapasitas dan kebutuhan sekolah Anda.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Paket LITE */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm text-center">
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-2">Paket Lite</h4>
              <div className="text-4xl font-black text-blue-600 mb-2">Rp 1,5 Juta<span className="text-sm text-slate-400 font-bold">/tahun</span></div>
              <p className="text-slate-500 text-sm font-medium mb-8">Cocok untuk institusi kecil (PAUD/TK IT).</p>
              
              <ul className="space-y-4 text-left mb-8">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={18} className="text-emerald-500"/> Maksimal 50 Siswa</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={18} className="text-emerald-500"/> Anti-Cheat Engine</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={18} className="text-emerald-500"/> Real-time Radar Monitor</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-400"><X size={18} className="text-slate-300"/> Cetak Laporan Otomatis</li>
              </ul>
              <Link to="/login" className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-4 rounded-xl font-black transition-colors">Pilih Paket Lite</Link>
            </div>

            {/* Paket PREMIUM (Highlighted) */}
            <div className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl shadow-slate-900/40 text-center transform md:-translate-y-4 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-md">Paling Populer</div>
              <h4 className="text-xl font-black text-white uppercase tracking-widest mb-2 mt-2">Paket Premium</h4>
              <div className="text-4xl font-black text-blue-400 mb-2">Rp 3,5 Juta<span className="text-sm text-slate-400 font-bold">/tahun</span></div>
              <p className="text-slate-400 text-sm font-medium mb-8">Ideal untuk SDIT & SMP dengan operasional penuh.</p>
              
              <ul className="space-y-4 text-left mb-8">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-200"><CheckCircle size={18} className="text-blue-400"/> Maksimal 500 Siswa</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-200"><CheckCircle size={18} className="text-blue-400"/> Semua Fitur Paket Lite</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-200"><CheckCircle size={18} className="text-blue-400"/> Cetak Laporan & Berita Acara</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-200"><CheckCircle size={18} className="text-blue-400"/> Database PostgreSQL Mandiri</li>
              </ul>
              <Link to="/login" className="block w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black transition-colors shadow-lg shadow-blue-600/20">Pilih Paket Premium</Link>
            </div>

            {/* Paket ENTERPRISE */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm text-center">
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-2">Enterprise</h4>
              <div className="text-4xl font-black text-slate-800 mb-2">Custom</div>
              <p className="text-slate-500 text-sm font-medium mb-8">Untuk yayasan besar dengan banyak cabang sekolah.</p>
              
              <ul className="space-y-4 text-left mb-8">
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={18} className="text-emerald-500"/> Kapasitas Siswa Tak Terbatas</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={18} className="text-emerald-500"/> Semua Fitur Premium</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={18} className="text-emerald-500"/> Server Dedicated (Prioritas)</li>
                <li className="flex items-center gap-3 text-sm font-bold text-slate-700"><CheckCircle size={18} className="text-emerald-500"/> Pendampingan Operator 24/7</li>
              </ul>
              <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-4 rounded-xl font-black transition-colors">Hubungi Kami</a>
            </div>

          </div>
        </section>

        {/* ========================================== */}
        {/* TESTIMONIAL & CTA */}
        {/* ========================================== */}
        <section className="bg-blue-600 relative overflow-hidden py-24 px-6 text-white text-center">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="max-w-4xl mx-auto relative z-10">
            <h3 className="text-3xl md:text-5xl font-black mb-8 tracking-tight leading-tight">Siap Mendigitalisasi Ujian Sekolah Anda?</h3>
            
            <div className="bg-white/10 border border-white/20 p-8 md:p-10 rounded-[2rem] backdrop-blur-sm mb-10 text-left md:text-center">
              <p className="text-xl md:text-2xl font-medium leading-relaxed italic mb-6">"Sejak menggunakan Alima CBT, penghematan biaya kertas kami mencapai 90%. Guru-guru sangat terbantu dengan sistem rekap nilai otomatis."</p>
              <div className="font-black text-lg">Dr. Ahmad Mansur, M.Pd</div>
              <div className="text-blue-200 text-sm font-bold uppercase tracking-widest mt-1">Kepala Sekolah SDIT Nurul Iman</div>
            </div>

            <Link to="/login" className="inline-flex items-center justify-center bg-white hover:bg-slate-50 text-blue-700 px-10 py-5 rounded-2xl font-black text-lg shadow-2xl transition-all gap-2 transform hover:-translate-y-1">
              Daftarkan Instansi Sekarang <ChevronRight size={20} />
            </Link>
          </div>
        </section>
      </main>

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}
      <footer className="bg-white border-t border-slate-200 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-80">
            <BookOpen size={20} className="text-blue-600" />
            <span className="font-black text-slate-800 text-sm tracking-widest">ALIMA CREATIVE CBT</span>
          </div>
          <p className="text-sm font-bold text-slate-400 text-center md:text-left">
            &copy; {new Date().getFullYear()} Alima Creative Studio. Hak Cipta Dilindungi.
          </p>
          <div className="flex gap-4 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Bantuan Support</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
