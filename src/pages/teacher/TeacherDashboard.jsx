// src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { 
  Users, BookOpen, BarChart, Settings, LogOut, Plus, Trash2, 
  Download, Upload, Monitor, Dices, Menu, X, Lock, Unlock, 
  Eye, Filter, GraduationCap, Edit, Activity, User, MessageSquare, 
  Send, FileText, ClipboardList, ShieldAlert, QrCode, Zap, 
  ShieldCheck, CheckSquare, Check, Percent, Clock, AlertTriangle, Loader2,
  LayoutDashboard, Radio, KeyRound, ChevronLeft, ChevronRight, CheckCircle2, XCircle
} from 'lucide-react';

export default function TeacherDashboard() {
  const APP_VERSION = "3.1.0 Enterprise";
  const navigate = useNavigate();
  
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingSchool, setIsLoadingSchool] = useState(true);

  const [tempProfileName, setTempProfileName] = useState('');
  const [newPassword, setNewPassword] = useState(''); 

  const [activeTab, setActiveTab] = useState(localStorage.getItem('teacherTab') || 'dashboard'); 
  useEffect(() => { localStorage.setItem('teacherTab', activeTab); }, [activeTab]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data Global 
  const [data, setData] = useState({ live: [], bank: [], lead: [], sessions: [], classes: [], subjects: [] });
  const [schoolInfo, setSchoolInfo] = useState(null); 

  const [showModal, setShowModal] = useState(false);
  const [activeMonitorToken, setActiveMonitorToken] = useState(localStorage.getItem('activeMonitorToken') || '');
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [activeQRToken, setActiveQRToken] = useState('');
  
  // === STATE MODAL KOREKSI ESAI MANUAL (ENTERPRISE) ===
  const [showKoreksiModal, setShowKoreksiModal] = useState(false);
  const [koreksiSession, setKoreksiSession] = useState(null);
  const [essayStudents, setEssayStudents] = useState([]);
  const [essayQuestions, setEssayQuestions] = useState([]);
  const [essayScores, setEssayScores] = useState({}); // Menyimpan state "BENAR" (100) atau "SALAH" (0)
  const [activeStudentIndex, setActiveStudentIndex] = useState(0); // Fokus 1 per 1

  const fileInputRef = useRef(null);

  // === STATE SESI & BOBOT V3 & WAKTU ===
  const [selectedMapelSesi, setSelectedMapelSesi] = useState('');
  const [selectedKelasSesi, setSelectedKelasSesi] = useState('');
  const [kuotaPG, setKuotaPG] = useState(0);
  const [kuotaPGK, setKuotaPGK] = useState(0);
  const [kuotaEsai, setKuotaEsai] = useState(0);
  const [bobotPG, setBobotPG] = useState(70);
  const [bobotEsai, setBobotEsai] = useState(30);
  const [jamMulai, setJamMulai] = useState("07:30");
  const [jamSelesai, setJamSelesai] = useState("09:00");

  const [showEditSesiModal, setShowEditSesiModal] = useState(false);
  const [editSesiData, setEditSesiData] = useState({ id: '', bobotPG: 70, bobotEsai: 30, jamMulai: '07:30', jamSelesai: '09:00', mapel: '', token: '' });

  // State Rekap & Filter
  const [bankMapel, setBankMapel] = useState('');
  const [bankKelas, setBankKelas] = useState('');
  const [recapMapel, setRecapMapel] = useState('');
  const [recapKelas, setRecapKelas] = useState('');
  const [recapToken, setRecapToken] = useState(''); 
  
  const [broadcastText, setBroadcastText] = useState(''); 
  const [printMode, setPrintMode] = useState('rekap'); 

  const defaultForm = { 
    jenisSoal: 'PG', kodeWacana: '', teksWacana: '', 
    mapel: '', kelas: '', pertanyaan: ' ', gambar: '', 
    opsiA: ' ', opsiB: ' ', opsiC: ' ', opsiD: ' ', kunci: 'A' 
  };
  const [formData, setFormData] = useState(defaultForm);
  const [editSoalId, setEditSoalId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // ==========================================
  // TARIK DATA PROFIL AUTH & GLOBAL (SUPABASE)
  // ==========================================
  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: profile, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        if (profile && !error) {
           setTeacherProfile({ ...profile, schoolId: profile.school_id });
           setTempProfileName(profile.name || '');
        } else setTeacherProfile(null);
      } else {
        setTeacherProfile(null);
        setIsLoadingSchool(false);
      }
      setIsLoadingProfile(false);
    };

    fetchSessionAndProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_OUT') setTeacherProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const currentUserEmail = teacherProfile?.email || '';
  const schoolId = teacherProfile?.schoolId || '';

  useEffect(() => {
    if (!schoolId) { setIsLoadingSchool(false); return; }

    const fetchSchoolData = async () => {
      const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId.toLowerCase()).single();
      if (data && !error) setSchoolInfo({ ...data, picName: data.pic_name, waNumber: data.wa_number, expiryDate: data.expiry_date });
      else setSchoolInfo(null);
      setIsLoadingSchool(false);
    };

    const fetchAllData = async () => {
      try {
        const sID = schoolId.toLowerCase();
        const [liveReq, bankReq, leadReq, sessionsReq, classesReq, subjectsReq] = await Promise.all([
           supabase.from('live_students').select('*').eq('teacher_email', currentUserEmail),
           supabase.from('bank_soal').select('*').eq('teacher_email', currentUserEmail).order('created_at', { ascending: false }),
           supabase.from('leaderboard').select('*').eq('teacher_email', currentUserEmail).order('score', { ascending: false }),
           supabase.from('exam_sessions').select('*').eq('teacher_email', currentUserEmail).order('created_at', { ascending: false }),
           supabase.from('master_classes').select('*').eq('school_id', sID),
           supabase.from('master_subjects').select('*').eq('school_id', sID)
        ]);

        setData({
           live: liveReq.data?.map(s => ({ ...s, subKelas: s.sub_kelas })) || [],
           bank: bankReq.data?.map(q => ({ ...q, jenisSoal: q.jenis_soal, kodeWacana: q.kode_wacana, teksWacana: q.teks_wacana, opsiA: q.opsi_a, opsiB: q.opsi_b, opsiC: q.opsi_c, opsiD: q.opsi_d })) || [],
           lead: leadReq.data?.map(l => ({ ...l, class: l.kelas, subKelas: l.sub_kelas, teacherEmail: l.teacher_email, studentName: l.student_name, objectiveScore: l.objective_score, essayScores: l.essay_scores, isEssayGraded: l.is_essay_graded })) || [],
           sessions: sessionsReq.data?.map(s => ({ ...s, subKelas: s.sub_kelas, jamMulai: s.jam_mulai, jamSelesai: s.jam_selesai, teacherEmail: s.teacher_email, kuotaPG: s.kuota_pg, kuotaPGK: s.kuota_pgk, kuotaEsai: s.kuota_esai, bobotPG: s.bobot_pg, bobotEsai: s.bobot_esai })) || [],
           classes: classesReq.data || [],
           subjects: subjectsReq.data || []
        });
      } catch (err) { console.error("Gagal menarik data", err); }
    };

    fetchSchoolData();
    if(currentUserEmail) fetchAllData();
  }, [schoolId, currentUserEmail]);

  // --- FILTERING DATA ---
  const myQuestions = Array.isArray(data.bank) ? data.bank : [];
  const mySessions = Array.isArray(data.sessions) ? data.sessions : [];
  const myLeaderboard = Array.isArray(data.lead) ? data.lead : [];
  const monitoredStudents = (Array.isArray(data.live) ? data.live : []).filter(s => s.token === activeMonitorToken);
  const schoolClasses = Array.isArray(data.classes) ? data.classes : [];
  const schoolSubjects = Array.isArray(data.subjects) ? data.subjects : [];

  const availableBankMapel = [...new Set(myQuestions.map(q => q?.mapel).filter(Boolean))];
  const availableBankKelas = [...new Set(myQuestions.map(q => q?.kelas).filter(Boolean))];
  const filteredQuestions = myQuestions.filter(q => (bankMapel === '' || q?.mapel === bankMapel) && (bankKelas === '' || q?.kelas === bankKelas));

  const availableRecapMapel = [...new Set(myLeaderboard.map(s => s?.mapel).filter(Boolean))];
  const availableRecapKelas = [...new Set(myLeaderboard.map(s => s?.class).filter(Boolean))];
  const availableRecapTokens = [...new Set(myLeaderboard.map(s => s?.token).filter(Boolean))];
  const filteredLeaderboard = myLeaderboard.filter(s => (recapMapel === '' || s?.mapel === recapMapel) && (recapKelas === '' || s?.class === recapKelas) && (recapToken === '' || s?.token === recapToken));

  const handleLogout = async () => { try { await supabase.auth.signOut(); localStorage.clear(); navigate('/login'); } catch (error) { alert("Gagal: " + error.message); } };

  // ==========================================
  // KOREKSI ESAI (MANUAL - BENAR / SALAH)
  // ==========================================
  const openKoreksiModal = (session) => {
    setKoreksiSession(session);
    const eQs = myQuestions.filter(q => q.mapel === session.mapel && q.kelas === session.kelas && q.jenisSoal === 'ESAI');
    setEssayQuestions(eQs);

    const students = myLeaderboard.filter(s => s.token === session.token);
    setEssayStudents(students);

    // Tarik nilai esai jika sudah ada sebelumnya
    const initScores = {};
    students.forEach(s => { 
        if(s.essayScores) { Object.assign(initScores, s.essayScores); } 
    });
    setEssayScores(initScores);
    
    setActiveStudentIndex(0); // Mulai dari siswa pertama
    setShowKoreksiModal(true);
  };

  const setJawaban = (studentId, questionId, statusBenar) => {
      // Jika Benar = 100 poin. Jika Salah = 0 poin.
      const poin = statusBenar ? 100 : 0;
      setEssayScores(prev => ({...prev, [`${studentId}_${questionId}`]: poin}));
  };

  const handleSaveKoreksi = async () => {
    if(window.confirm(`Simpan seluruh nilai esai dan kalkulasi Skor Akhir untuk ${essayStudents.length} siswa ini?`)) {
        const bPG = koreksiSession?.bobotPG !== undefined ? parseInt(koreksiSession.bobotPG) : 70;
        const bEsai = koreksiSession?.bobotEsai !== undefined ? parseInt(koreksiSession.bobotEsai) : 30;

        const promises = essayStudents.map(student => {
            let totalEssayScore = 0;
            const studentEssayScores = {};
            
            essayQuestions.forEach(q => {
                const s = parseFloat(essayScores[`${student.id}_${q.id}`]) || 0;
                totalEssayScore += s;
                studentEssayScores[`${student.id}_${q.id}`] = s;
            });
            
            // Rata-rata dari skor esai siswa (karena max 100 per soal)
            const avgEssayScore = essayQuestions.length > 0 ? (totalEssayScore / essayQuestions.length) : 0;
            const objectiveScore = student.objectiveScore !== undefined ? student.objectiveScore : student.score;
            const finalScore = Math.round((objectiveScore * bPG / 100) + (avgEssayScore * bEsai / 100));

            return supabase.from('leaderboard').update({
                score: finalScore,
                objective_score: objectiveScore,
                essay_scores: studentEssayScores,
                is_essay_graded: true
            }).eq('id', student.id);
        });

        try {
            await Promise.all(promises);
            alert(`✅ Koreksi Berhasil!\nNilai Akhir telah disinkronkan ke Database Rekap.`);
            setShowKoreksiModal(false);
            window.location.reload();
        } catch (error) { alert("Gagal menyimpan data: " + error.message); }
    }
  };

  // --- KOMPONEN LAINNYA ---
  const sendBroadcast = async () => { if(!broadcastText) return; await supabase.from('live_students').update({ broadcast: broadcastText }).eq('token', activeMonitorToken); setBroadcastText(''); alert("Terkirim!"); window.location.reload(); };
  const forceSubmitAll = async () => { if(window.confirm("Tarik paksa semua?")) { await supabase.from('live_students').update({ force_submit: true }).eq('token', activeMonitorToken).neq('status', 'Selesai'); alert("Terkirim!"); window.location.reload(); } };
  const handleDeleteSingleRecap = async (id, name) => { if(window.confirm(`Hapus ${name}?`)) { await supabase.from('leaderboard').delete().eq('id', id); window.location.reload(); } };

  // --- BANK SOAL ---
  const handlePGKKeyToggle = (opt) => {
    let currentKeys = formData.kunci ? formData.kunci.split(',') : [];
    if (currentKeys.includes(opt)) currentKeys = currentKeys.filter(k => k !== opt); else currentKeys.push(opt);
    setFormData({ ...formData, kunci: currentKeys.sort().join(',') });
  };

  const handleAddOrEditSoal = async (e) => { 
    e.preventDefault(); 
    const finalData = { ...formData };
    if(finalData.jenisSoal === 'ESAI') { finalData.opsiA = ''; finalData.opsiB = ''; finalData.opsiC = ''; finalData.opsiD = ''; finalData.kunci = ''; }
    const payload = { school_id: schoolId.toLowerCase(), teacher_email: currentUserEmail, mapel: finalData.mapel, kelas: finalData.kelas, jenis_soal: finalData.jenisSoal, kode_wacana: finalData.kodeWacana, teks_wacana: finalData.teksWacana, pertanyaan: finalData.pertanyaan, gambar: finalData.gambar, opsi_a: finalData.opsiA, opsi_b: finalData.opsiB, opsi_c: finalData.opsiC, opsi_d: finalData.opsiD, kunci: finalData.kunci };
    if (editSoalId) { await supabase.from('bank_soal').update(payload).eq('id', editSoalId); alert("Diperbarui!"); } else { await supabase.from('bank_soal').insert([payload]); alert("Ditambahkan!"); }
    setShowModal(false); setEditSoalId(null); setFormData(defaultForm); setPreviewMode(false); window.location.reload();
  };

  // --- SESI UJIAN ---
  const handleCreateSession = async (e) => { 
    e.preventDefault(); 
    const t = document.getElementById('token_input').value; 
    const sk = document.getElementById('subkelas_session').value.toUpperCase(); 
    if(!t || !selectedMapelSesi || !selectedKelasSesi || !sk) return alert("Lengkapi data!"); 
    const bPG = parseInt(bobotPG) || 0; const bEsai = parseInt(bobotEsai) || 0;
    if (bPG + bEsai !== 100) return alert("Total Bobot harus 100%!");
    
    await supabase.from('exam_sessions').insert([{ school_id: schoolId.toLowerCase(), token: t, mapel: selectedMapelSesi, kelas: selectedKelasSesi, sub_kelas: sk, status: 'open', kuota_pg: parseInt(kuotaPG) || 0, kuota_pgk: parseInt(kuotaPGK) || 0, kuota_esai: parseInt(kuotaEsai) || 0, bobot_pg: bPG, bobot_esai: bEsai, jam_mulai: jamMulai, jam_selesai: jamSelesai, teacher_email: currentUserEmail }]);
    alert("Sesi Ujian Dibuka!"); window.location.reload();
  };

  const NavItem = ({ tab, icon: Icon, label }) => (
    <button onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${activeTab === tab ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' : 'text-slate-500 hover:bg-slate-100 font-bold'}`}>
      <Icon size={18}/> <span className="text-sm">{label}</span>
    </button>
  );

  if (isLoadingProfile || isLoadingSchool) {
    return <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4"><Loader2 size={40} className="text-emerald-500 animate-spin" /></div>;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans animate-in fade-in duration-500">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}
      
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-2xl md:shadow-none`}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h1 className="text-lg font-black text-emerald-700 flex gap-2 items-center tracking-tight"><GraduationCap size={24} className="text-emerald-500"/> CBT GURU</h1>
            <button className="md:hidden text-slate-400" onClick={() => setIsMobileMenuOpen(false)}><X size={20}/></button>
        </div>
        <div className="p-4 mx-3 mt-3 mb-1 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-black text-xl uppercase shadow-inner shrink-0">{teacherProfile?.name?.charAt(0) || 'G'}</div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">INST: {schoolId}</p>
            <p className="text-xs font-bold truncate text-slate-800">{teacherProfile?.name}</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <NavItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem tab="settings" icon={Settings} label="Sesi Ujian" />
          <NavItem tab="proctor" icon={Monitor} label="Monitor Live" />
          <NavItem tab="bank" icon={BookOpen} label="Bank Soal (V2)" />
          <NavItem tab="recap" icon={BarChart} label="Rekap & Penilaian" />
        </nav>
        <div className="p-4 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl font-bold text-sm"><LogOut size={16}/> Keluar</button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-3 lg:p-4 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 bg-slate-100 rounded-lg text-emerald-600" onClick={() => setIsMobileMenuOpen(true)}><Menu size={20}/></button>
            <h2 className="text-lg font-black text-slate-800 hidden sm:flex tracking-wide">Teacher Center</h2>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* TAB DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto">
               <div className="bg-emerald-600 rounded-[24px] p-8 md:p-10 text-white shadow-lg mb-6"><h2 className="text-3xl font-black mb-3">Selamat Datang, {teacherProfile?.name}!</h2><p className="text-emerald-100 font-medium text-lg">Kelola bank soal, ujian, dan rekap nilai siswa Anda di sini.</p></div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="bg-white p-6 rounded-[20px] shadow-sm flex flex-col justify-between h-32"><div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><BookOpen size={16}/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Total Soal</p><p className="text-3xl font-black">{myQuestions.length}</p></div></div>
                  <div className="bg-white p-6 rounded-[20px] shadow-sm flex flex-col justify-between h-32"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Radio size={16}/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Sesi Aktif</p><p className="text-3xl font-black">{mySessions.filter(s => s.status === 'open').length}</p></div></div>
               </div>
            </div>
          )}
          
          {/* TAB SESI & KOREKSI (DIPANGKAS UTK FOKUS) */}
          {activeTab === 'settings' && (
             <div className="max-w-7xl mx-auto text-center p-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
                 <h2 className="text-xl font-bold text-slate-500">Gunakan Menu Bank Soal & Monitor</h2>
             </div>
          )}

          {/* TAB REKAP NILAI & KOREKSI ESAI MANUAL */}
          {activeTab === 'recap' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 mb-4"><ClipboardList className="text-emerald-500" size={20}/> Rekapitulasi & Penilaian</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={recapToken} onChange={e => setRecapToken(e.target.value)} className="w-full p-3 border border-emerald-200 rounded-xl bg-emerald-50 outline-none text-sm font-bold text-emerald-800 cursor-pointer">
                      <option value="">-- Pilih Token Sesi untuk Rekap/Dinilai --</option>
                      {availableRecapTokens.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  
                  {recapToken && (
                     <button onClick={() => {
                        const targetSession = mySessions.find(s => s.token === recapToken);
                        if(targetSession) openKoreksiModal(targetSession);
                        else alert("Sesi ini sudah ditutup dari pendaftaran.");
                     }} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"><CheckSquare size={16}/> Mulaik Koreksi Esai Manual</button>
                  )}
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs min-w-[700px] whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-center">No</th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Identitas Siswa</th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-center">Kelas</th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-center">Status Esai</th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-center">Skor Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeaderboard.map((s, i) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 text-center font-bold text-slate-500">{i+1}</td>
                          <td className="py-3 px-4"><p className="font-black text-slate-800 text-sm">{s?.studentName || s?.name || '-'}</p></td>
                          <td className="py-3 px-4 text-center font-bold text-slate-600">{s.class}-{s.subKelas}</td>
                          <td className="py-3 px-4 text-center">
                            {s.isEssayGraded 
                                ? <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded border border-emerald-200 font-bold text-[10px]">Telah Dikoreksi</span> 
                                : <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded border border-amber-200 font-bold text-[10px]">Menunggu Koreksi</span>
                            }
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="text-lg font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">{s.score}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL KOREKSI ESAI MANUAL (TINDER-STYLE UX) - MODE BENAR/SALAH              */}
      {/* ========================================================================= */}
      {showKoreksiModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
            <div className="bg-slate-50 p-0 rounded-[2rem] w-full max-w-4xl h-[90vh] md:h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
                
                {/* Header Modal */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><CheckSquare className="text-emerald-500" size={20}/> Mode Koreksi Cepat (Manual)</h2>
                        <p className="text-[10px] font-bold text-slate-500 mt-0.5">Sesi: {koreksiSession?.token} | Bobot: PG ({koreksiSession?.bobotPG}%) + Esai ({koreksiSession?.bobotEsai}%)</p>
                    </div>
                    <button onClick={() => setShowKoreksiModal(false)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition-colors"><X size={20}/></button>
                </div>

                {essayQuestions.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-8"><div className="bg-white p-8 border border-slate-200 rounded-2xl text-center shadow-sm"><p className="font-bold text-slate-500">Tidak ada soal esai untuk sesi ini.</p></div></div>
                ) : essayStudents.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-8"><div className="bg-white p-8 border border-slate-200 rounded-2xl text-center shadow-sm"><p className="font-bold text-slate-500">Belum ada siswa yang menyelesaikan ujian.</p></div></div>
                ) : (
                    <>
                        {/* Area Fokus 1 Siswa */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-100">
                           
                           {/* Indikator Siswa Aktif */}
                           <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-emerald-100 text-emerald-700 font-black text-xl rounded-full flex items-center justify-center">
                                     {activeStudentIndex + 1}
                                 </div>
                                 <div>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lembar Jawaban Siswa</p>
                                     <h3 className="text-xl font-black text-slate-800">{essayStudents[activeStudentIndex]?.studentName || essayStudents[activeStudentIndex]?.name}</h3>
                                     <p className="text-xs font-bold text-emerald-600">Skor Objektif (PG): {essayStudents[activeStudentIndex]?.objectiveScore !== undefined ? essayStudents[activeStudentIndex]?.objectiveScore : essayStudents[activeStudentIndex]?.score}</p>
                                 </div>
                              </div>
                              <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                  Progres: {activeStudentIndex + 1} dari {essayStudents.length} Siswa
                              </div>
                           </div>

                           {/* Render Pertanyaan & Jawaban */}
                           <div className="space-y-6">
                              {essayQuestions.map((q, qIdx) => {
                                  // Cek apakah nilai soal ini 100 (Benar) atau 0 (Salah)
                                  const currentScore = essayScores[`${essayStudents[activeStudentIndex].id}_${q.id}`];
                                  const isBenar = currentScore === 100;
                                  const isSalah = currentScore === 0;

                                  return (
                                  <div key={q.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
                                      {/* Kiri: Soal & Jawaban */}
                                      <div className="flex-1 p-5 md:p-6">
                                         <div className="flex items-start gap-3 mb-4 border-b border-slate-100 pb-4">
                                            <span className="text-sm font-black text-emerald-500 bg-emerald-50 p-2 rounded-lg">Q{qIdx+1}</span>
                                            <div className="text-slate-800 font-medium text-sm leading-relaxed pt-1"><Latex>{String(q.pertanyaan || '')}</Latex></div>
                                         </div>
                                         
                                         <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><MessageSquare size={14}/> Teks Jawaban Siswa:</p>
                                         <div className="bg-blue-50/50 p-4 rounded-xl text-slate-800 text-sm font-medium border border-blue-100 min-h-[80px] whitespace-pre-wrap">
                                            {essayStudents[activeStudentIndex].essayAnswers && essayStudents[activeStudentIndex].essayAnswers[q.id] 
                                                ? essayStudents[activeStudentIndex].essayAnswers[q.id] 
                                                : <span className="text-slate-400 italic">Tidak Dijawab</span>
                                            }
                                         </div>
                                      </div>
                                      
                                      {/* Kanan: Tombol Fast Grading */}
                                      <div className="w-full md:w-48 bg-slate-50 p-5 border-t md:border-t-0 md:border-l border-slate-200 flex flex-row md:flex-col gap-3 justify-center">
                                          <button 
                                              onClick={() => setJawaban(essayStudents[activeStudentIndex].id, q.id, true)}
                                              className={`flex-1 py-4 md:py-6 rounded-xl border-2 flex flex-col justify-center items-center gap-1 transition-all ${isBenar ? 'bg-emerald-100 border-emerald-500 text-emerald-700 shadow-inner' : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-400 hover:text-emerald-500'}`}
                                          >
                                              <CheckCircle2 size={32} />
                                              <span className="text-xs font-black tracking-widest uppercase mt-1">BENAR</span>
                                          </button>
                                          <button 
                                              onClick={() => setJawaban(essayStudents[activeStudentIndex].id, q.id, false)}
                                              className={`flex-1 py-4 md:py-6 rounded-xl border-2 flex flex-col justify-center items-center gap-1 transition-all ${isSalah ? 'bg-red-100 border-red-500 text-red-700 shadow-inner' : 'bg-white border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-500'}`}
                                          >
                                              <XCircle size={32} />
                                              <span className="text-xs font-black tracking-widest uppercase mt-1">SALAH</span>
                                          </button>
                                      </div>
                                  </div>
                              )})}
                           </div>
                        </div>

                        {/* Footer Navigasi Cepat */}
                        <div className="bg-white border-t border-slate-200 p-4 md:p-6 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button 
                                   disabled={activeStudentIndex === 0} 
                                   onClick={() => setActiveStudentIndex(prev => prev - 1)}
                                   className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                   <ChevronLeft size={18}/> SEBELUMNYA
                                </button>
                                <button 
                                   disabled={activeStudentIndex === essayStudents.length - 1} 
                                   onClick={() => setActiveStudentIndex(prev => prev + 1)}
                                   className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                                >
                                   SELANJUTNYA <ChevronRight size={18}/>
                                </button>
                            </div>
                            
                            <button onClick={handleSaveKoreksi} className="w-full sm:w-auto px-10 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/30 active:scale-95 transition-all flex items-center justify-center gap-2 tracking-widest">
                                <CheckSquare size={18}/> SIMPAN & REKAP SEMUA
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}

    </div>
  );
}
