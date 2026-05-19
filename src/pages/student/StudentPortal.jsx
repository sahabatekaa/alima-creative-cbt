// src/pages/student/StudentPortal.jsx
import React, { useState } from 'react';
import { supabase } from '../../config/supabase';
import { KeyRound, User, Loader2, AlertTriangle, BookOpen, ChevronRight } from 'lucide-react';

export default function StudentPortal() {
  const [form, setForm] = useState({ token: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');

    try {
      const upperToken = form.token.trim().toUpperCase();
      
      const { data: session, error: err } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('token', upperToken)
        .single();

      if (err || !session) throw new Error("Token Ujian tidak valid atau tidak ditemukan!");
      if (session.status !== 'open') throw new Error("Sesi ujian belum dibuka oleh Guru/Pengawas!");

      const studentId = 'std_' + Math.random().toString(36).substr(2, 9);
      const upperName = form.name.trim().toUpperCase();

      const studentData = {
        id: studentId,
        name: upperName,
        token: session.token,
        mapel: session.mapel,
        class: session.kelas,
        subKelas: session.sub_kelas,
        teacherEmail: session.teacher_email
      };

      // Simpan izin masuk
      localStorage.setItem('studentData', JSON.stringify(studentData));

      // Laporkan ke Radar Pengawas
      await supabase.from('live_students').insert([{
        id: studentId,
        school_id: session.school_id,
        student_name: upperName,
        token: session.token,
        mapel: session.mapel,
        kelas: session.kelas,
        sub_kelas: session.sub_kelas,
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
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Portal Siswa</h1>
          <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">Masukkan Identitas Ujian</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold flex items-start gap-3">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Nama Lengkap</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
              <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" placeholder="NAMA ANDA" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Token Ujian</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><KeyRound size={18} /></div>
              <input type="text" required value={form.token} onChange={e => setForm({...form, token: e.target.value})} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-800 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" placeholder="XXXXXX" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mt-4">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <>MASUK RUANG UJIAN <ChevronRight size={18}/></>}
          </button>
        </form>
      </div>
    </div>
  );
}
