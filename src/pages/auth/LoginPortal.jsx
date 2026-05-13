// src/pages/auth/LoginPortal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../config/supabase'; // 100% SUPABASE, NO FIREBASE!
import { GraduationCap, User, Lock, Key, LayoutGrid, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';

const APP_VERSION = "3.0.0 PostgreSQL";

export default function LoginPortal() {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentView, setCurrentView] = useState('login'); 
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [logoClicks, setLogoClicks] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  
  // State Form Admin/Staf
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);

  // Data Ujian Siswa dari Supabase
  const [activeSessions, setActiveSessions] = useState([]);
  const [scannedToken, setScannedToken] = useState('');

  // Blokir Tombol Back
  useEffect(() => {
    window.history.pushState(null, null, window.location.href);
    const handleBackButton = () => {
      window.history.pushState(null, null, window.location.href);
    };
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) document.documentElement.classList.add('dark'); 
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // ==========================================
  // TARIK SESI UJIAN AKTIF (SUPABASE REALTIME)
  // ==========================================
  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .eq('status', 'open');
        
      if (data && !error) {
         // Transformasi snake_case (SQL) ke camelCase (React) agar UI tidak rusak
         const mappedSessions = data.map(s => ({
            ...s,
            subKelas: s.sub_kelas,
            jamMulai: s.jam_mulai,
            jamSelesai: s.jam_selesai,
            teacherEmail: s.teacher_email
         }));
         setActiveSessions(mappedSessions);
      }
    };

    fetchSessions(); // Panggilan pertama

    // Pantau perubahan sesi jika guru buka/tutup sesi secara live
    const channel = supabase.channel('public:exam_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_sessions' }, payload => {
         fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Tangkap Token QR
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setScannedToken(tokenFromUrl.toUpperCase());
    }
  }, [location]);

  const availableClasses = [...new Set(activeSessions.map(s => s.kelas).filter(Boolean))];

  // ==========================================
  // LOGIKA LOGIN SISWA (SUPABASE 100%)
  // ==========================================
  const handleStudentStart = async (e) => {
    e.preventDefault();
    if (isStarting) return; 
    setIsStarting(true); 

    const studentNameInput = e.target.studentName.value.trim();
    const sClass = e.target.studentClass.value;
    const tokenInput = e.target.token.value.toUpperCase();
    
    // 1. Validasi Token & Kelas
    const validSession = activeSessions.find(s => s.token === tokenInput && s.kelas === sClass);
    if (!validSession) {
       setIsStarting(false);
       return alert("❌ AKSES DITOLAK: Token tidak ditemukan atau Kelas Anda salah!");
    }

    const autoSubKelas = validSession.subKelas || '-';
    const now = new Date();
    const timeNow = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    // 2. Validasi Waktu
    if (validSession.jamMulai && timeNow < validSession.jamMulai) {
       setIsStarting(false);
       return alert(`🚫 BELUM MULAI!\nUjian baru akan dibuka pada jam ${validSession.jamMulai} WIB.`);
    }

    if (validSession.jamSelesai && timeNow >= validSession.jamSelesai) {
       setIsStarting(false);
       return alert(`🚫 WAKTU HABIS!\nSesi ujian ini sudah ditutup sejak jam ${validSession.jamSelesai} WIB.`);
    }

    try {
      // 3. ID Perangkat Anti-Joki
      let deviceId = localStorage.getItem('cbt_device_id');
      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('cbt_device_id', deviceId);
      }

      // 4. Cek apakah siswa sudah terdaftar di sesi ini (Case Insensitive pencarian nama)
      const { data: existingStudent, error: fetchErr } = await supabase
        .from('live_students')
        .select('*')
        .ilike('name', studentNameInput)
        .eq('token', tokenInput)
        .maybeSingle();

      let finalData;

      if (existingStudent) {
          // Siswa Ditemukan
          if (existingStudent.status === 'Selesai') {
              setIsStarting(false);
              return alert("⚠️ Ujian untuk nama ini sudah diselesaikan dan dikumpulkan.");
          }
          if (existingStudent.device_id && existingStudent.device_id !== deviceId) {
              setIsStarting(false);
              return alert("🚨 ANTI-JOKI AKTIF!\nNama ini sedang mengerjakan ujian di perangkat/HP lain.");
          }
          
          // Update status kembali Online
          const { data: updatedData, error: updateErr } = await supabase
              .from('live_students')
              .update({ status: 'Online', device_id: deviceId })
              .eq('id', existingStudent.id)
              .select()
              .single();
              
          if (updateErr) throw updateErr;
          finalData = updatedData;

      } else {
          // Siswa Baru (Pertama kali login ujian)
          const { data: insertedData, error: insertErr } = await supabase
              .from('live_students')
              .insert([{
                  name: studentNameInput,
                  class: sClass,
                  sub_kelas: autoSubKelas,
                  token: tokenInput,
                  mapel: validSession.mapel,
                  teacher_email: validSession.teacherEmail, 
                  status: 'Online',
                  progress: 0,
                  warnings: 0,
                  device_id: deviceId
              }])
              .select()
              .single();
              
          if (insertErr) throw insertErr;
          finalData = insertedData;
      }

      // Format data agar kompatibel dengan Layar Ujian (Halaman /exam)
      const mappedStudentData = {
         id: finalData.id,
         name: finalData.name,
         class: finalData.class,
         subKelas: finalData.sub_kelas,
         token: finalData.token,
         mapel: finalData.mapel,
         teacherEmail: finalData.teacher_email,
         status: finalData.status,
         progress: finalData.progress,
         warnings: finalData.warnings,
         deviceId: finalData.device_id,
         broadcast: finalData.broadcast,
         forceSubmit: finalData.force_submit
      };

      localStorage.setItem('studentData', JSON.stringify(mappedStudentData));
      setIsStarting(false);
      navigate('/exam');

    } catch (error) { 
      alert("Koneksi bermasalah: " + error.message); 
      setIsStarting(false);
    }
  };

  // ==========================================
  // LOGIKA LOGIN ADMIN / GURU / PENGAWAS
  // ==========================================
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoadingAdmin(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (authError) throw authError;

      const user = authData.user;

      if (user.email === 'admin@sekolah.com') {
          navigate('/master');
          return;
      } 
      
      const { data: userData, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (dbError || !userData) {
          await supabase.auth.signOut();
          setErrorMsg("Data user tidak ditemukan di sistem SQL!");
          setIsLoadingAdmin(false);
          return;
      }

      if (userData.status === 'pending') { 
          await supabase.auth.signOut(); 
          alert("AKUN BELUM AKTIF!\nMenunggu persetujuan Admin Tata Usaha Sekolah."); 
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
      setIsLoadingAdmin(false);
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
        
        {/* ==========================================
            TAMPILAN PORTAL SISWA
        ========================================== */}
        {currentView === 'login' && (
          <div className="flex items-center justify-center min-h-screen p-4 md:p-6 relative animate-in fade-in duration-500">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700">
              <div className="flex flex-col items-center mb-8">
                {/* SENSOR RAHASIA: KLIK LOGO 5X */}
                <div onClick={() => { setLogoClicks(c => c + 1); if (logoClicks + 1 >= 5) { setCurrentView('admin-login'); setLogoClicks(0); setEmail(''); setPassword(''); } }} className="bg-emerald-500 p-4 rounded-2xl text-white mb-4 cursor-pointer shadow-lg shadow-emerald-500/30 transition-transform active:scale-90">
                    <GraduationCap size={40} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Alima CBT</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">V {APP_VERSION}</span>
                  <p className="text-slate-500 dark:text-slate-400 font-medium text-xs">Portal Resmi Siswa</p>
                </div>
              </div>

              {scannedToken && (
                <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded-xl text-center flex items-center justify-center gap-2 animate-pulse shadow-inner">
                  <CheckCircle size={18} /> Token QR Terdeteksi!
                </div>
              )}

              <form onSubmit={handleStudentStart} className="space-y-4">
                <div className="relative">
                    <User className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input name="studentName" required placeholder="Nama Lengkap Siswa" className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-emerald-400 font-bold" />
                </div>
                
                <div className="relative w-full">
                    <LayoutGrid className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <select name="studentClass" required className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-emerald-400 appearance-none font-bold">
                        <option value="">Pilih Tingkat Kelas...</option>
                        {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="relative">
                  <Key className="absolute left-4 top-3.5 text-gray-400" size={20} />
                  <input 
                    name="token" 
                    value={scannedToken}
                    onChange={e => setScannedToken(e.target.value.toUpperCase())}
                    required 
                    placeholder="Kode Token Ujian" 
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-slate-900 dark:text-white border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 ring-emerald-400 font-mono uppercase tracking-widest font-black text-center" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={isStarting}
                  className={`w-full text-white font-black py-4 rounded-xl mt-4 transition-all tracking-widest text-lg ${isStarting ? 'bg-slate-400 cursor-not-allowed animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-500/30'}`}
                >
                  {isStarting ? 'MEMPROSES DATA...' : 'MULAI UJIAN'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ==========================================
            HALAMAN RAHASIA: LOGIN ADMIN & STAF
        ========================================== */}
        {currentView === 'admin-login' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center min-h-screen p-4 md:p-6 bg-[#0f172a] animate-in fade-in duration-300">
            <div className="w-full max-w-[400px] bg-white rounded-[24px] p-8 shadow-2xl">
              
              <div className="flex items-center gap-2 mb-8">
                <Lock className="text-emerald-500" size={24} />
                <h2 className="text-[22px] font-black text-slate-800 tracking-tight">Akses Sistem</h2>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl animate-pulse">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <input 
                    type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Terdaftar" 
                    className="w-full px-4 py-3.5 border border-emerald-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all bg-emerald-50/30"
                  />
                </div>
                <div>
                  <input 
                    type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password" 
                    className="w-full px-4 py-3.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-400 text-sm font-semibold text-slate-800 placeholder-slate-400 transition-all"
                  />
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={isLoadingAdmin} className="w-full bg-[#0f172a] hover:bg-slate-800 text-white py-3.5 rounded-xl text-sm font-black tracking-widest transition-all shadow-md active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2">
                    {isLoadingAdmin ? <Loader2 size={18} className="animate-spin" /> : 'LOGIN SISTEM'}
                  </button>
                </div>

                <div className="pt-2 space-y-3 text-center">
                  <button type="button" onClick={() => navigate('/register')} className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors block w-full pt-2">
                    Belum punya akun? Daftar Guru Baru
                  </button>
                  
                  <button type="button" onClick={() => setCurrentView('login')} className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors block w-full pt-1">
                    Batal, Kembali ke Portal Siswa
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}