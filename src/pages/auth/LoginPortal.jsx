// src/pages/auth/LoginPortal.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { ShieldCheck, Lock, Mail, Loader2, AlertTriangle, BookOpen } from 'lucide-react';

const APP_VERSION = "3.1.0 Enterprise";

export default function LoginPortal() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ==========================================
  // LOGIKA LOGIN ADMIN / GURU / PENGAWAS
  // ==========================================
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // 1. Coba Auth via Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      const user = authData.user;

      // 2. Jalur Khusus Founder (Bypass Cek Tabel Users)
      if (email === 'admin@alima.com' || email === 'admin@sekolah.com') {
         window.location.href = '/master';
         return;
      } 
      
      // 3. Deteksi Hak Akses User di Tabel Users
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError || !userData) {
          await supabase.auth.signOut();
          setErrorMsg("Data profil Anda tidak ditemukan di sistem database!");
          setLoading(false);
          return;
      }

      // 4. Pengalihan Rute Berdasarkan Peran (Role)
      if (userData.status === 'pending') { 
          await supabase.auth.signOut(); 
          setErrorMsg("AKUN BELUM AKTIF! Menunggu persetujuan Admin Tata Usaha Sekolah."); 
      } else if (userData.role === 'admin_sekolah') {
          navigate('/school-admin');
      } else if (userData.role === 'proctor') {
          navigate('/proctor');
      } else {
          navigate('/teacher');
      }
      
    } catch (err) { 
      setErrorMsg("Login Gagal! Periksa kembali email dan password Anda."); 
      console.error("Supabase Login Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-200">
      
      {/* HEADER SIMPEL */}
      <header className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg shadow-sm">
              <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <h1 className="font-black text-lg tracking-tight text-slate-800 leading-none">ALIMA<span className="text-blue-600">CBT</span></h1>
        </div>
        <div className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-widest shadow-sm">
          V {APP_VERSION}
        </div>
      </header>

      {/* AREA LOGIN */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="w-full max-w-[420px] bg-white rounded-[2rem] p-8 md:p-10 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300 relative z-10">
          
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-100 shadow-sm">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Portal Staf Instansi</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">Masuk untuk mengelola sistem ujian.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl flex items-start gap-3 shadow-inner">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Email Terdaftar</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Mail size={18} /></div>
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sekolah.com" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold text-slate-800 transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Lock size={18} /></div>
                <input 
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold text-slate-800 transition-all placeholder-slate-400"
                />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl text-sm font-black tracking-widest transition-all shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'MASUK SISTEM'}
              </button>
            </div>
            
            {/* TAUTAN REGISTRASI */}
            <div className="text-center pt-2 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500">
                Belum mendaftarkan instansi Anda?{' '}
                <button type="button" onClick={() => navigate('/registrasi')} className="text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest transition-colors">
                  Daftar Sekarang
                </button>
              </p>
            </div>

          </form>

        </div>
      </div>
      
    </div>
  );
}
