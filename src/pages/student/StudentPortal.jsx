// src/pages/student/StudentPortal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { KeyRound, User, Loader2, AlertTriangle, BookOpen, ChevronRight, LayoutGrid } from 'lucide-react';

export default function StudentPortal() {
  const [form, setForm] = useState({ token: '', name: '', kelas: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data sesi ujian dari Supabase untuk mengisi Dropdown Kelas
  const [activeSessions, setActiveSessions] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);

  // Tarik data kelas dari sesi yang statusnya 'open'
  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('status', 'open');
        
      if (data && !error) {
         setActiveSessions(data);
         // Ambil daftar kelas unik dari sesi yang aktif
         const classes = [...new Set(data.map(s => s.kelas).filter(Boolean))];
         setAvailableClasses(classes);
      }
    };
    fetchSessions();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    try {
      const upperToken = form.token.trim().toUpperCase();
      const upperName = form.name.trim().toUpperCase(); // Pastikan nama kapital
      const selectedClass = form.kelas;

      // 1. Cari sesi yang Token DAN Kelasnya cocok
      const session = activeSessions.find(s => s.token === upperToken && s.kelas === selectedClass);

      if (!session) {
        throw new Error("Token Ujian tidak valid atau Kelas yang Anda pilih salah!");
      }

      const studentId = 'std_' + Math.random().toString(36).substr(2, 9);

      const studentData = {
        id: studentId,
        name: upperName,
        token: session.token,
        mapel: session.mapel,
        class: session.kelas,
        subKelas: session.sub_kelas || '-',
        teacherEmail: session.teacher_email
      };

      // Simpan izin masuk ke LocalStorage
      localStorage.setItem('studentData', JSON.stringify(studentData));

      // Laporkan ke Radar Pengawas
      await supabase.from('live_students').insert([{
        id: studentId,
        school_id: session.school_id,
        student_name: upperName,
        token: session.token,
        mapel: session.mapel,
        kelas: session.kelas,
        sub_kelas: session.sub_kelas || '-',
        status: 'Mengerjakan',
        progress: 0,
        warnings: 0
      }]);

      // Buka Gerbang Ruang Ujian
      window.location.href = '/exam'; 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 selection:bg-emerald-500 selection:text-white">
      <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-xl border border-slate-200 w-full max-w-md animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Portal Siswa</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Masukkan Identitas Ujian</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-3 shadow-inner">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* NAMA LENGKAP (Otomatis Kapital) */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
              <input 
                type="text" required 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value.toUpperCase()})} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-slate-400" 
                placeholder="NAMA ANDA" 
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* DROPDOWN KELAS */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Tingkat Kelas</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><LayoutGrid size={18} /></div>
              <select 
                required 
                value={form.kelas} 
                onChange={e => setForm({...form, kelas: e.target.value})} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                <option value="" disabled>Pilih Kelas Anda...</option>
                {availableClasses.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {/* Panah Dropdown Custom */}
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
              </div>
            </div>
          </div>

          {/* TOKEN UJIAN */}
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">Token Ujian</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><KeyRound size={18} /></div>
              <input 
                type="text" required 
                value={form.token} 
                onChange={e => setForm({...form, token: e.target.value.toUpperCase()})} 
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder-slate-400" 
                placeholder="XXXXXX" 
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-sm tracking-widest transition-all shadow-lg shadow-emerald-600/30 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>MASUK RUANG UJIAN <ChevronRight size={18}/></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
