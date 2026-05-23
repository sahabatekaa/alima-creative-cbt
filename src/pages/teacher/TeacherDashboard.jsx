// src/pages/teacher/TeacherDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase'; // 100% SUPABASE
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
  
  // === STATE MODAL KOREKSI ESAI MANUAL ===
  const [showKoreksiModal, setShowKoreksiModal] = useState(false);
  const [koreksiSession, setKoreksiSession] = useState(null);
  const [essayStudents, setEssayStudents] = useState([]);
  const [essayQuestions, setEssayQuestions] = useState([]);
  const [essayScores, setEssayScores] = useState({});
  const [activeStudentIndex, setActiveStudentIndex] = useState(0); 

  const fileInputRef = useRef(null);

  // === STATE SESI & BOBOT ===
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
  // TARIK DATA PROFIL AUTH (SUPABASE)
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

  // ==========================================
  // TARIK DATA GLOBAL & SEKOLAH (SUPABASE)
  // ==========================================
  useEffect(() => {
    if (!schoolId) { setIsLoadingSchool(false); return; }

    const fetchSchoolData = async () => {
      const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId.toLowerCase()).single();
      if (data && !error) setSchoolInfo({ ...data, picName: data.pic_name, waNumber: data.wa_number, expiryDate: data.expiry_date, kepalaSekolah: data.kepala_sekolah, nipKepalaSekolah: data.nip_kepala_sekolah, logoUrl: data.logo_url });
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

  // --- FUNGSI LOGOUT ---
  const handleLogout = async () => { try { await supabase.auth.signOut(); localStorage.clear(); navigate('/login'); } catch (error) { alert("Gagal keluar: " + error.message); } };

  // --- FILTERING DATA ---
  const safeLive = Array.isArray(data.live) ? data.live : [];
  const safeBank = Array.isArray(data.bank) ? data.bank : [];
  const safeLead = Array.isArray(data.lead) ? data.lead : [];
  const safeSessions = Array.isArray(data.sessions) ? data.sessions : [];
  const safeClasses = Array.isArray(data.classes) ? data.classes : [];
  const safeSubjects = Array.isArray(data.subjects) ? data.subjects : [];

  const myQuestions = safeBank;
  const mySessions = safeSessions;
  const myLeaderboard = safeLead;
  const monitoredStudents = safeLive.filter(s => s.token === activeMonitorToken);

  const schoolClasses = safeClasses;
  const schoolSubjects = safeSubjects;

  const availableBankMapel = [...new Set(myQuestions.map(q => q?.mapel).filter(Boolean))];
  const availableBankKelas = [...new Set(myQuestions.map(q => q?.kelas).filter(Boolean))];
  const filteredQuestions = myQuestions.filter(q => (bankMapel === '' || q?.mapel === bankMapel) && (bankKelas === '' || q?.kelas === bankKelas));

  const availableRecapMapel = [...new Set(myLeaderboard.map(s => s?.mapel).filter(Boolean))];
  const availableRecapKelas = [...new Set(myLeaderboard.map(s => s?.class).filter(Boolean))];
  const availableRecapTokens = [...new Set(myLeaderboard.map(s => s?.token).filter(Boolean))];
  const filteredLeaderboard = myLeaderboard.filter(s => (recapMapel === '' || s?.mapel === recapMapel) && (recapKelas === '' || s?.class === recapKelas) && (recapToken === '' || s?.token === recapToken));

  // --- EKSEKUSI GURU PROFIL ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if(teacherProfile?.id) {
      const { error } = await supabase.from('users').update({ name: tempProfileName }).eq('id', teacherProfile.id);
      if (!error) { setTeacherProfile(prev => ({ ...prev, name: tempProfileName })); alert("Profil diperbarui!"); } 
      else { alert("Gagal update profil: " + error.message); }
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return alert("Password minimal 6 karakter!");
    if (window.confirm("Yakin ubah sandi?")) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) { alert("Sandi diperbarui!"); setNewPassword(''); } else { alert("Gagal: " + error.message); }
    }
  };

  const sendBroadcast = async () => {
    if(!broadcastText) return;
    if(window.confirm(`Kirim pengumuman?`)) {
      await supabase.from('live_students').update({ broadcast: broadcastText }).eq('token', activeMonitorToken);
      setBroadcastText(''); alert("Terkirim!"); window.location.reload(); 
    }
  };

  const forceSubmitAll = async () => {
    if(window.confirm("Tarik paksa semua lembar jawaban?")) {
      await supabase.from('live_students').update({ force_submit: true }).eq('token', activeMonitorToken).neq('status', 'Selesai');
      alert("Perintah terkirim!"); window.location.reload();
    }
  };

  const handleDeleteMyRecap = async () => {
    if (myLeaderboard.length === 0) return alert("Belum ada data.");
    const konfirmasi = window.prompt("Ketik 'HAPUS' untuk membersihkan permanen:");
    if (konfirmasi === "HAPUS") { try { await supabase.from('leaderboard').delete().eq('teacher_email', currentUserEmail); alert("Bersih."); window.location.reload(); } catch (error) { alert("Gagal: " + error.message); } }
  };

  const handleDeleteSingleRecap = async (id, studentName) => { if (window.confirm(`Hapus data "${studentName}"?`)) { await supabase.from('leaderboard').delete().eq('id', id); window.location.reload(); } };

  // ==========================================
  // KOREKSI ESAI (MANUAL - BENAR / SALAH)
  // ==========================================
  const openKoreksiModal = (session) => {
    setKoreksiSession(session);
    const eQs = myQuestions.filter(q => q.mapel === session.mapel && q.kelas === session.kelas && q.jenisSoal === 'ESAI');
    setEssayQuestions(eQs);

    const students = myLeaderboard.filter(s => s.token === session.token);
    setEssayStudents(students);

    const initScores = {};
    students.forEach(s => { if(s.essayScores) { Object.assign(initScores, s.essayScores); } });
    setEssayScores(initScores);
    
    setActiveStudentIndex(0); 
    setShowKoreksiModal(true);
  };

  const setJawaban = (studentId, questionId, statusBenar) => {
      const poin = statusBenar ? 100 : 0;
      setEssayScores(prev => ({...prev, [`${studentId}_${questionId}`]: poin}));
  };

  const handleSaveKoreksi = async () => {
    if(window.confirm(`Simpan nilai esai dan kalkulasi Skor Akhir untuk ${essayStudents.length} siswa ini?`)) {
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
            
            const avgEssayScore = essayQuestions.length > 0 ? (totalEssayScore / essayQuestions.length) : 0;
            const objectiveScore = student.objectiveScore !== undefined ? student.objectiveScore : student.score;
            const finalScore = Math.round((objectiveScore * bPG / 100) + (avgEssayScore * bEsai / 100));

            return supabase.from('leaderboard').update({
                score: finalScore, objective_score: objectiveScore, essay_scores: studentEssayScores, is_essay_graded: true
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

  const openEditModal = (q) => { 
    setFormData({ jenisSoal: q.jenisSoal || 'PG', kodeWacana: q.kodeWacana || '', teksWacana: q.teksWacana || '', mapel: q.mapel||'', kelas: q.kelas||'', pertanyaan: q.pertanyaan||' ', gambar: q.gambar || '', opsiA: q.opsiA||' ', opsiB: q.opsiB||' ', opsiC: q.opsiC||' ', opsiD: q.opsiD||' ', kunci: q.kunci||'A' }); 
    setEditSoalId(q.id); setShowModal(true); setPreviewMode(false);
  };
  
  const downloadTemplate = () => { 
    try {
      const wsData = [ { No: 1, Kode_Wacana: "", Jenis_Soal: "PG", Teks_Wacana: "", mapel: "Matematika", kelas: "10", pertanyaan: "Soal", opsiA: "A", opsiB: "B", opsiC: "C", opsiD: "D", Kunci_Jawaban: "A" } ];
      const ws = XLSX.utils.json_to_sheet(wsData); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Format"); XLSX.writeFile(wb, "Template_CBT.xlsx"); 
    } catch(err) { alert(err.message); } 
  };
  
  const triggerImport = () => { if(fileInputRef.current) fileInputRef.current.click(); };
  
  const handleFileUpload = (e) => { 
    try { 
      const file = e.target.files[0]; if (!file) return; 
      const reader = new FileReader(); 
      reader.onload = async (evt) => { 
        const d = XLSX.utils.sheet_to_json(XLSX.read(evt.target.result, { type: 'binary' }).Sheets[XLSX.read(evt.target.result, { type: 'binary' }).SheetNames[0]]); 
        const bulkData = [];
        d.forEach(i => { 
          if (i.pertanyaan) { 
            bulkData.push({ school_id: schoolId.toLowerCase(), teacher_email: currentUserEmail, mapel: String(i.mapel), kelas: String(i.kelas), pertanyaan: String(i.pertanyaan), opsi_a: String(i.opsiA || ''), opsi_b: String(i.opsiB || ''), opsi_c: String(i.opsiC || ''), opsi_d: String(i.opsiD || ''), jenis_soal: (i.Jenis_Soal || 'PG').toUpperCase(), kode_wacana: String(i.Kode_Wacana || ''), teks_wacana: String(i.Teks_Wacana || ''), kunci: i.Kunci_Jawaban ? String(i.Kunci_Jawaban).replace(/\s/g, '').toUpperCase() : '' });
          } 
        }); 
        if (bulkData.length > 0) { const { error } = await supabase.from('bank_soal').insert(bulkData); if (!error) { alert("Di-import!"); window.location.reload(); } else alert(error.message); }
      }; 
      reader.readAsBinaryString(file); 
    } catch(err) { alert("Gagal: " + err.message); } 
  };
  
  // --- SESI UJIAN ---
  const handleCreateSession = async (e) => { 
    e.preventDefault(); 
    const t = document.getElementById('token_input').value; const sk = document.getElementById('subkelas_session').value.toUpperCase(); 
    if(!t || !selectedMapelSesi || !selectedKelasSesi || !sk) return alert("Lengkapi data sesi!"); 
    const bPG = parseInt(bobotPG) || 0; const bEsai = parseInt(bobotEsai) || 0;
    if (bPG + bEsai !== 100) return alert("Total Bobot harus 100%!");
    const { error } = await supabase.from('exam_sessions').insert([{ school_id: schoolId.toLowerCase(), token: t, mapel: selectedMapelSesi, kelas: selectedKelasSesi, sub_kelas: sk, status: 'open', kuota_pg: parseInt(kuotaPG) || 0, kuota_pgk: parseInt(kuotaPGK) || 0, kuota_esai: parseInt(kuotaEsai) || 0, bobot_pg: bPG, bobot_esai: bEsai, jam_mulai: jamMulai, jam_selesai: jamSelesai, teacher_email: currentUserEmail }]);
    if (!error) { alert("Dibuka!"); window.location.reload(); } else alert(error.message);
  };

  const toggleSession = async (id, s) => { await supabase.from('exam_sessions').update({ status: s === 'open' ? 'closed' : 'open' }).eq('id', id); window.location.reload(); };
  const delSession = async (id) => { if(window.confirm("Hapus?")) { await supabase.from('exam_sessions').delete().eq('id', id); window.location.reload(); } };
  const setMonitor = (t) => { setActiveMonitorToken(t); localStorage.setItem('activeMonitorToken', t); setActiveTab('proctor'); };
  const openQR = (token) => { setActiveQRToken(token); setShowQRModal(true); };

  const openEditSesi = (s) => { setEditSesiData({ id: s.id, token: s.token, mapel: s.mapel, bobotPG: s.bobotPG !== undefined ? s.bobotPG : 70, bobotEsai: s.bobotEsai !== undefined ? s.bobotEsai : 30, jamMulai: s.jamMulai || "07:30", jamSelesai: s.jamSelesai || "09:00" }); setShowEditSesiModal(true); };

  const handleSaveEditSesi = async (e) => {
    e.preventDefault();
    const bPG = parseInt(editSesiData.bobotPG) || 0; const bEsai = parseInt(editSesiData.bobotEsai) || 0;
    if (bPG + bEsai !== 100) return alert("Bobot harus 100%!");
    try {
        await supabase.from('exam_sessions').update({ bobot_pg: bPG, bobot_esai: bEsai, jam_mulai: editSesiData.jamMulai, jam_selesai: editSesiData.jamSelesai }).eq('id', editSesiData.id);
        const studentsInSession = myLeaderboard.filter(s => s.token === editSesiData.token);
        if (studentsInSession.length > 0) {
            const eQs = myQuestions.filter(q => q.mapel === editSesiData.mapel && q.jenisSoal === 'ESAI');
            const promises = studentsInSession.map(student => {
                let totalEssayScore = 0; eQs.forEach(q => { totalEssayScore += (student.essayScores ? (parseFloat(student.essayScores[`${student.id}_${q.id}`]) || 0) : 0); });
                const avgEssayScore = eQs.length > 0 ? (totalEssayScore / eQs.length) : 0;
                const objectiveScore = student.objectiveScore !== undefined ? student.objectiveScore : student.score;
                return supabase.from('leaderboard').update({ score: Math.round((objectiveScore * bPG / 100) + (avgEssayScore * bEsai / 100)), objective_score: objectiveScore }).eq('id', student.id);
            });
            await Promise.all(promises);
        }
        setShowEditSesiModal(false); alert("Sesi Diperbarui!"); window.location.reload();
    } catch (err) { alert("Gagal: " + err.message); }
  };

  const NavItem = ({ tab, icon: Icon, label }) => (
    <button onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${activeTab === tab ? 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/30' : 'text-slate-500 hover:bg-slate-100 font-bold'}`}>
      <Icon size={18}/> <span className="text-sm">{label}</span>
    </button>
  );

  const OfficialHeader = () => (
    <div className="hidden print:block text-center mb-8 border-b-4 border-double border-black pb-4">
      <h1 className="text-2xl font-black uppercase tracking-widest text-black">ADMINISTRASI UJIAN</h1>
      <h2 className="text-xl font-black uppercase tracking-widest text-black mt-1">ID INSTANSI: {schoolId || 'TIDAK TERDAFTAR'}</h2>
      <p className="mt-2 text-sm font-bold text-gray-800">Dokumen Resmi Administrasi Ujian Berbasis Komputer (CBT)</p>
    </div>
  );

  if (isLoadingProfile || isLoadingSchool) {
    return <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4"><Loader2 size={40} className="text-emerald-500 animate-spin" /><p className="text-sm font-bold tracking-widest uppercase animate-pulse">Memuat...</p></div>;
  }

  if (!teacherProfile) {
     return ( <div className="h-screen flex flex-col items-center justify-center"><AlertTriangle size={60} className="text-red-500 mb-4" /><p className="text-xl font-black mb-2">Sesi Terputus</p><button onClick={() => navigate('/login')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Login Kembali</button></div> );
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans animate-in fade-in duration-500">
      <style>{`
        @media print { 
          @page { margin: 1cm; size: portrait; } 
          html, body, #root { height: auto !important; overflow: visible !important; background: white !important; -webkit-print-color-adjust: exact; margin: 0; }
          .h-screen, .min-h-screen, .overflow-hidden, .overflow-y-auto, main, .flex-1 { height: auto !important; min-height: auto !important; overflow: visible !important; display: block !important; position: static !important; } 
          aside, header, button, select, input, .print\\:hidden { display: none !important; } 
          .print\\:block { display: block !important; } 
          table { width: 100% !important; border-collapse: collapse; margin-top: 10px; border: 1.5px solid black !important; page-break-inside: auto; } 
          thead { display: table-header-group; } 
          tr { page-break-inside: avoid; page-break-after: auto; } 
          th, td { border: 1px solid #000 !important; padding: 6px 8px !important; color: black !important; font-size: 11px !important; line-height: 1.3; } 
          th { background-color: #f0f0f0 !important; font-weight: bold; text-transform: uppercase; } 
          .flex.justify-end.mt-12, .flex.justify-between.mt-12 { page-break-inside: avoid; margin-top: 30px !important; display: flex !important; justify-content: flex-end !important; }
          .shadow-sm, .shadow-md, .shadow-xl { box-shadow: none !important; }
        }
      `}</style>
      
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
          <NavItem tab="recap" icon={BarChart} label="Rekap Nilai & Cetak" />
          <div className="my-3 border-t border-slate-100"></div>
          <NavItem tab="profile" icon={User} label="Profil Saya" />
        </nav>
        <div className="p-4 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors shadow-sm"><LogOut size={16}/> Keluar Akun</button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-3 lg:p-4 flex justify-between items-center z-10 print:hidden pr-16 md:pr-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 bg-slate-100 rounded-lg text-emerald-600" onClick={() => setIsMobileMenuOpen(true)}><Menu size={20}/></button>
            <h2 className="text-lg lg:text-xl font-black text-slate-800 hidden sm:flex items-center gap-2 tracking-wide">Teacher Center</h2>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* TAB DASHBOARD UTAMA */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto">
               <div className="bg-emerald-600 rounded-[24px] p-8 md:p-10 text-white shadow-lg relative overflow-hidden mb-6">
                  <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-5"><GraduationCap size={300} /></div>
                  <div className="relative z-10">
                      <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Selamat Datang, {teacherProfile?.name}!</h2>
                      <p className="text-emerald-100 font-medium text-base md:text-lg max-w-2xl leading-relaxed">Kelola soal, pantau ujian, dan rekap nilai siswa Anda.</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="bg-white p-6 rounded-[20px] shadow-sm flex flex-col justify-between h-32"><div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><BookOpen size={16}/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Soal</p><p className="text-3xl font-black text-slate-800">{myQuestions.length}</p></div></div>
                  <div className="bg-white p-6 rounded-[20px] shadow-sm flex flex-col justify-between h-32"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Radio size={16}/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sesi Aktif</p><p className="text-3xl font-black text-slate-800">{mySessions.filter(s => s.status === 'open').length}</p></div></div>
                  <div className="bg-white p-6 rounded-[20px] shadow-sm flex flex-col justify-between h-32"><div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Users size={16}/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siswa Ujian</p><p className="text-3xl font-black text-slate-800">{myLeaderboard.length}</p></div></div>
                  <div className="bg-white p-6 rounded-[20px] shadow-sm flex flex-col justify-between h-32"><div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><ClipboardList size={16}/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Sesi</p><p className="text-3xl font-black text-slate-800">{mySessions.length}</p></div></div>
               </div>
            </div>
          )}
          
          {/* TAB SESI UJIAN */}
          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 max-w-7xl mx-auto">
              <div className="bg-white p-5 md:p-6 rounded-[24px] shadow-sm border border-slate-200 h-fit">
                <h3 className="text-lg font-black mb-5 text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3"><Plus className="text-emerald-500" size={20}/> Buka Sesi Baru</h3>
                <form onSubmit={handleCreateSession} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Mata Pelajaran</label>
                    <select value={selectedMapelSesi} onChange={(e) => setSelectedMapelSesi(e.target.value)} required className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none text-sm font-bold focus:border-emerald-500">
                        <option value="">-- Pilih Mapel --</option>
                        {schoolSubjects.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Tingkat</label>
                         <select value={selectedKelasSesi} onChange={(e) => setSelectedKelasSesi(e.target.value)} required className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none text-sm font-bold">
                             <option value="">Pilih Kelas</option>
                             {schoolClasses.map(k => <option key={k.id} value={k.name}>{k.name}</option>)}
                         </select>
                     </div>
                     <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Ruang/Sub</label><input id="subkelas_session" placeholder="Cth: A" required className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl uppercase text-sm font-bold text-center outline-none focus:border-emerald-500" /></div>
                  </div>
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3">
                    <label className="text-[10px] font-black text-emerald-800 uppercase flex items-center gap-1.5"><Settings size={12}/> Kuota & Bobot Penilaian</label>
                    <div className="grid grid-cols-3 gap-2 pb-2 border-b border-emerald-200/50">
                        <div><label className="text-[9px] font-bold text-slate-500 mb-1 block">Jml PG</label><input type="number" min="0" value={kuotaPG} onChange={e => setKuotaPG(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs text-center font-bold outline-none" /></div>
                        <div><label className="text-[9px] font-bold text-slate-500 mb-1 block">Jml PGK</label><input type="number" min="0" value={kuotaPGK} onChange={e => setKuotaPGK(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs text-center font-bold outline-none" /></div>
                        <div><label className="text-[9px] font-bold text-slate-500 mb-1 block">Jml Esai</label><input type="number" min="0" value={kuotaEsai} onChange={e => setKuotaEsai(e.target.value)} className="w-full p-2 border border-slate-200 rounded-lg text-xs text-center font-bold outline-none" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1 border-b border-emerald-200/50 pb-2">
                        <div><label className="text-[9px] font-black text-emerald-700 mb-1 flex items-center gap-1"><Percent size={10}/> Bobot PG/PGK</label><input type="number" min="0" max="100" value={bobotPG} onChange={e => setBobotPG(e.target.value)} className="w-full p-2 border border-emerald-300 rounded-lg text-sm text-center font-black text-emerald-800 bg-emerald-100/50 outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-[9px] font-black text-emerald-700 mb-1 flex items-center gap-1"><Percent size={10}/> Bobot Esai</label><input type="number" min="0" max="100" value={bobotEsai} onChange={e => setBobotEsai(e.target.value)} className="w-full p-2 border border-emerald-300 rounded-lg text-sm text-center font-black text-emerald-800 bg-emerald-100/50 outline-none focus:border-emerald-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div><label className="text-[9px] font-black text-emerald-700 mb-1 flex items-center gap-1"><Clock size={10}/> Jam Mulai</label><input type="time" required value={jamMulai} onChange={e => setJamMulai(e.target.value)} className="w-full p-2 border border-emerald-300 rounded-lg text-xs text-center font-black bg-emerald-100/50 outline-none" /></div>
                        <div><label className="text-[9px] font-black text-emerald-700 mb-1 flex items-center gap-1"><Clock size={10}/> Jam Selesai</label><input type="time" required value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} className="w-full p-2 border border-emerald-300 rounded-lg text-xs text-center font-black bg-emerald-100/50 outline-none" /></div>
                    </div>
                  </div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Token Sesi</label><div className="flex gap-2"><input id="token_input" required placeholder="Generate..." className="w-full p-3 border border-emerald-200 bg-emerald-50 rounded-xl uppercase font-mono text-sm font-black tracking-widest text-emerald-800 outline-none" /><button type="button" onClick={() => document.getElementById('token_input').value = Math.random().toString(36).substring(2,7).toUpperCase()} className="p-3 bg-slate-800 text-white rounded-xl"><Dices size={20}/></button></div></div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 mt-2 rounded-xl text-sm font-black shadow-md shadow-emerald-600/30 tracking-widest">RILIS UJIAN</button>
                </form>
              </div>
              
              <div className="xl:col-span-2 space-y-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3"><Activity className="text-emerald-500" size={20}/> Manajemen Sesi Aktif</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mySessions.map((s) => (
                    <div key={s.id} className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${s.status==='open'?'bg-white border-emerald-200':'bg-slate-50 border-slate-200 opacity-90'}`}>
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-2xl font-black font-mono tracking-widest text-slate-800">{s.token}</h4>
                          <span className={`p-1.5 rounded-lg shadow-sm border ${s.status==='open'?'bg-emerald-50 text-emerald-600 border-emerald-200':'bg-red-50 text-red-600 border-red-200'}`}>{s.status==='open'?<Unlock size={16}/>:<Lock size={16}/>}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <span className="text-[10px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-md">{s.mapel}</span>
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">Kls: {s.kelas}-{s.subKelas}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                        <button onClick={() => openQR(s.token)} className="bg-blue-50 text-blue-600 py-2 rounded-lg text-[10px] font-bold flex flex-col items-center border border-blue-100"><QrCode size={14}/> QR</button>
                        <button onClick={() => setMonitor(s.token)} className="bg-slate-800 text-white py-2 rounded-lg text-[10px] font-bold flex flex-col items-center"><Eye size={14}/> Pantau</button>
                        <button onClick={() => openEditSesi(s)} className="bg-amber-50 text-amber-600 py-2 rounded-lg text-[10px] font-bold flex flex-col items-center border border-amber-100"><Edit size={14}/> Edit</button>
                        <button onClick={() => toggleSession(s.id, s.status)} className="col-span-2 bg-slate-50 text-slate-700 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1.5 border border-slate-200">{s.status==='open'?<Lock size={14}/>:<Unlock size={14}/>} Kunci Sesi</button>
                        <button onClick={() => delSession(s.id)} className="col-span-1 bg-red-50 text-red-600 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1.5 border border-red-100"><Trash2 size={14}/> Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB MONITOR LIVE */}
          {activeTab === 'proctor' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-2 font-black text-lg"><Monitor className="text-emerald-500" size={22}/> Live Proctoring</div>
                <select value={activeMonitorToken} onChange={(e) => setMonitor(e.target.value)} className="w-full sm:w-auto p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer font-bold">
                    <option value="">-- Pilih Sesi Token --</option>
                    {mySessions.map(s => <option key={s.token} value={s.token}>{s.token} ({s.kelas}-{s.subKelas})</option>)}
                </select>
              </div>

              {activeMonitorToken && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border-l-4 border-l-blue-500 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase">Terhubung</p><p className="text-3xl font-black">{monitoredStudents.length}</p></div>
                    <div className="bg-white p-4 rounded-2xl border-l-4 border-l-emerald-500 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase">Selesai</p><p className="text-3xl font-black text-emerald-600">{monitoredStudents.filter(s => s.status === 'Selesai').length}</p></div>
                    <div className="bg-white p-4 rounded-2xl border-l-4 border-l-red-500 shadow-sm"><p className="text-[10px] font-bold text-slate-500 uppercase">Curang</p><p className="text-3xl font-black text-red-600">{monitoredStudents.filter(s => (s?.warnings || 0) > 0).length}</p></div>
                    <button onClick={forceSubmitAll} className="bg-red-600 text-white rounded-2xl font-black flex flex-col items-center justify-center p-2 shadow-lg text-xs"><ShieldAlert size={20} className="mb-0.5" /> Tarik Semua</button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {monitoredStudents.map(s => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                          <div><p className="font-black truncate max-w-[150px]">{s?.name || '-'}</p><span className="inline-block mt-1 bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">{s?.class}-{s?.subKelas}</span></div>
                          {(s?.warnings || 0) > 0 && <span className="bg-red-50 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-200 animate-pulse">(!Tab {s.warnings}x)</span>}
                        </div>
                        <div className="mt-2 mb-2"><div className="w-full bg-slate-100 h-2 rounded-full"><div className="bg-emerald-500 h-full" style={{width:`${s?.progress || 0}%`}}></div></div></div>
                        <div className="flex gap-2 border-t border-slate-100 pt-2">
                          <button onClick={async () => { await supabase.from('live_students').update({ force_submit: true }).eq('id', s.id); window.location.reload(); }} disabled={s.status === 'Selesai'} className="flex-1 text-[10px] bg-slate-50 border border-slate-200 py-2 rounded-lg font-bold">Tarik</button>
                          {(s?.warnings || 0) >= 3 && s?.status !== 'Selesai' && <button onClick={async () => { await supabase.from('live_students').update({ warnings: 0, status: 'Online' }).eq('id', s.id); window.location.reload(); }} className="flex-1 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 py-2 rounded-lg font-bold">Buka Kunci</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB BANK SOAL */}
          {activeTab === 'bank' && (
            <div className="space-y-5 max-w-7xl mx-auto print:max-w-full">
              <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black flex items-center gap-2"><BookOpen className="text-emerald-500" size={20}/> Bank Soal V2</h3>
                  <div className="flex gap-2">
                    <button onClick={triggerImport} className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200"><Upload size={18}/></button>
                    <button onClick={() => { setEditSoalId(null); setFormData(defaultForm); setShowModal(true); setPreviewMode(false); }} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16}/> Ketik Baru</button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {filteredQuestions.map((q, i) => (
                  <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5">
                    <div className="flex-1">
                      <div className="flex gap-2 mb-3"><span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-1 rounded">{q?.mapel} - {q?.kelas}</span><span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2 py-1 rounded">Tipe: {q.jenisSoal || 'PG'}</span></div>
                      <div className="font-bold text-base mb-4 flex"><span className="text-emerald-600 mr-2">{i+1}.</span><div className="flex-1"><Latex>{String(q?.pertanyaan || ' ')}</Latex></div></div>
                    </div>
                    <div className="flex gap-2 self-start"><button onClick={() => openEditModal(q)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit size={16}/></button><button onClick={async () => {if(window.confirm("Hapus?")) { await supabase.from('bank_soal').delete().eq('id', q.id); window.location.reload(); } }} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={16}/></button></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB REKAP NILAI & CETAK */}
          {activeTab === 'recap' && (
            <div className="space-y-5 max-w-7xl mx-auto print:max-w-full">
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><ClipboardList className="text-emerald-500" size={20}/> Pusat Administrasi Ujian</h3>
                  <button onClick={handleDeleteMyRecap} className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex gap-2"><Trash2 size={16}/> Bersihkan</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={recapMapel} onChange={e => setRecapMapel(e.target.value)} className="p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold"><option value="">-- Semua Mapel --</option>{availableRecapMapel.map(m => <option key={m} value={m}>{m}</option>)}</select>
                  <select value={recapKelas} onChange={e => setRecapKelas(e.target.value)} className="p-3 border border-slate-200 rounded-xl bg-slate-50 font-bold"><option value="">-- Semua Tingkatan --</option>{availableRecapKelas.map(k => <option key={k} value={k}>{k}</option>)}</select>
                  <select value={recapToken} onChange={e => setRecapToken(e.target.value)} className="p-3 border border-emerald-200 rounded-xl bg-emerald-50 font-bold text-emerald-800"><option value="">-- Pilih Sesi (Token) --</option>{availableRecapTokens.map(t => <option key={t} value={t}>{t}</option>)}</select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                  <button onClick={() => { setPrintMode('rekap'); setTimeout(() => window.print(), 300); }} className="bg-slate-800 text-white py-3 rounded-xl text-sm font-black flex justify-center gap-2"><BarChart size={16}/> Cetak Nilai</button>
                  <button onClick={() => { setPrintMode('berita_acara'); setTimeout(() => window.print(), 300); }} className="bg-blue-600 text-white py-3 rounded-xl text-sm font-black flex justify-center gap-2"><FileText size={16}/> Berita Acara</button>
                  <button onClick={() => { setPrintMode('daftar_hadir'); setTimeout(() => window.print(), 300); }} className="bg-emerald-600 text-white py-3 rounded-xl text-sm font-black flex justify-center gap-2"><Users size={16}/> Daftar Hadir</button>
                  
                  {recapToken && (
                     <button onClick={() => { const targetSession = mySessions.find(s => s.token === recapToken); if(targetSession) openKoreksiModal(targetSession); else alert("Sesi ditutup."); }} className="bg-amber-500 text-slate-900 py-3 rounded-xl text-sm font-black flex justify-center gap-2"><CheckSquare size={16}/> Koreksi Esai</button>
                  )}
                </div>
              </div>
              
              <div className={`${printMode === 'rekap' ? 'hidden print:block' : 'hidden'}`}>
                <OfficialHeader />
                <h3 className="text-center font-black text-lg mb-6 underline">DAFTAR NILAI UJIAN</h3>
                <table className="w-full text-left text-sm">
                  <thead><tr><th className="py-2 px-3 text-center">No</th><th className="py-2 px-3">Nama Siswa</th><th className="py-2 px-3">Mapel</th><th className="py-2 px-3 text-center">Skor Akhir</th></tr></thead>
                  <tbody>{filteredLeaderboard.map((s, i) => (<tr key={s?.id}><td className="py-2 px-3 text-center">{i+1}</td><td className="py-2 px-3 uppercase">{s?.studentName || s?.name}</td><td className="py-2 px-3">{s?.mapel}</td><td className="py-2 px-3 text-center font-black">{s?.score || 0}</td></tr>))}</tbody>
                </table>
              </div>

              <div className="print:hidden bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs min-w-[700px] whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr><th className="py-2.5 px-4 text-center">No</th><th className="py-2.5 px-4">Siswa</th><th className="py-2.5 px-4 text-center">Kelas</th><th className="py-2.5 px-4 text-center">Status Esai</th><th className="py-2.5 px-4 text-center">Skor Akhir</th><th className="py-2.5 px-4 text-center">Aksi</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeaderboard.map((s, i) => (
                        <tr key={s.id}>
                          <td className="py-3 px-4 text-center font-bold text-slate-500">{i+1}</td>
                          <td className="py-3 px-4 font-black">{s?.studentName || s?.name}</td>
                          <td className="py-3 px-4 text-center font-bold text-slate-600">{s.class}-{s.subKelas}</td>
                          <td className="py-3 px-4 text-center">{s.isEssayGraded ? <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-1 rounded">Dikoreksi</span> : <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-1 rounded">Menunggu</span>}</td>
                          <td className="py-3 px-4 text-center"><span className="text-lg font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{s.score}</span></td>
                          <td className="py-3 px-4 text-center"><button onClick={() => handleDeleteSingleRecap(s.id, s.studentName || s.name)} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            </div>
          )}

          {/* TAB PROFIL */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-200">
                <form onSubmit={handleUpdateProfile}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Nama Lengkap</label>
                  <input required value={tempProfileName} onChange={(e) => setTempProfileName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl mb-4 font-bold" />
                  <button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black">SIMPAN NAMA</button>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL KOREKSI ESAI MANUAL (TINDER-STYLE UX) - MODE BENAR/SALAH              */}
      {/* ========================================================================= */}
      {showKoreksiModal && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex items-center justify-center z-[130] p-4 print:hidden">
            <div className="bg-slate-50 rounded-[2rem] w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
                
                {/* Header Modal */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><CheckSquare className="text-emerald-500" size={20}/> Mode Koreksi Cepat</h2>
                        <p className="text-[10px] font-bold text-slate-500">Sesi: {koreksiSession?.token} | Bobot: PG ({koreksiSession?.bobotPG}%) + Esai ({koreksiSession?.bobotEsai}%)</p>
                    </div>
                    <button onClick={() => setShowKoreksiModal(false)} className="p-2 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full"><X size={20}/></button>
                </div>

                {essayQuestions.length === 0 ? (
                    <div className="flex-1 flex justify-center p-8"><div className="bg-white p-8 border rounded-2xl"><p>Tidak ada soal esai.</p></div></div>
                ) : essayStudents.length === 0 ? (
                    <div className="flex-1 flex justify-center p-8"><div className="bg-white p-8 border rounded-2xl"><p>Belum ada siswa.</p></div></div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100">
                           <div className="bg-white rounded-2xl p-5 border border-slate-200 mb-6 flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-emerald-100 text-emerald-700 font-black text-xl rounded-full flex justify-center items-center">{activeStudentIndex + 1}</div>
                                 <div><h3 className="text-xl font-black">{essayStudents[activeStudentIndex]?.studentName || essayStudents[activeStudentIndex]?.name}</h3><p className="text-xs font-bold text-emerald-600">Skor PG: {essayStudents[activeStudentIndex]?.objectiveScore !== undefined ? essayStudents[activeStudentIndex]?.objectiveScore : essayStudents[activeStudentIndex]?.score}</p></div>
                              </div>
                              <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg">Progres: {activeStudentIndex + 1} / {essayStudents.length}</div>
                           </div>

                           <div className="space-y-6">
                              {essayQuestions.map((q, qIdx) => {
                                  const currentScore = essayScores[`${essayStudents[activeStudentIndex].id}_${q.id}`];
                                  const isBenar = currentScore === 100;
                                  const isSalah = currentScore === 0;

                                  return (
                                  <div key={q.id} className="bg-white border rounded-2xl flex flex-col md:flex-row">
                                      <div className="flex-1 p-5"><div className="flex gap-3 mb-4 border-b pb-4"><span className="font-black text-emerald-500 bg-emerald-50 p-2 rounded-lg">Q{qIdx+1}</span><div className="font-medium pt-1"><Latex>{String(q.pertanyaan || '')}</Latex></div></div><p className="text-[10px] font-black text-blue-500 mb-2">Jawaban Siswa:</p><div className="bg-blue-50 p-4 rounded-xl text-sm font-medium whitespace-pre-wrap">{essayStudents[activeStudentIndex].essayAnswers && essayStudents[activeStudentIndex].essayAnswers[q.id] ? essayStudents[activeStudentIndex].essayAnswers[q.id] : <span className="text-slate-400 italic">Tidak Dijawab</span>}</div></div>
                                      <div className="w-full md:w-48 bg-slate-50 p-5 flex md:flex-col gap-3 justify-center">
                                          <button onClick={() => setJawaban(essayStudents[activeStudentIndex].id, q.id, true)} className={`flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-1 ${isBenar ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white text-slate-400 hover:border-emerald-300'} `}><CheckCircle2 size={32} /><span className="text-xs font-black">BENAR</span></button>
                                          <button onClick={() => setJawaban(essayStudents[activeStudentIndex].id, q.id, false)} className={`flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-1 ${isSalah ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white text-slate-400 hover:border-red-300'}`}><XCircle size={32} /><span className="text-xs font-black">SALAH</span></button>
                                      </div>
                                  </div>
                              )})}
                           </div>
                        </div>
                        <div className="bg-white border-t p-4 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button disabled={activeStudentIndex === 0} onClick={() => setActiveStudentIndex(p => p - 1)} className="px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-black disabled:opacity-50 flex gap-2"><ChevronLeft size={18}/> SEBELUMNYA</button>
                                <button disabled={activeStudentIndex === essayStudents.length - 1} onClick={() => setActiveStudentIndex(p => p + 1)} className="px-6 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-black disabled:opacity-50 flex gap-2">SELANJUTNYA <ChevronRight size={18}/></button>
                            </div>
                            <button onClick={handleSaveKoreksi} className="w-full sm:w-auto px-10 py-3.5 bg-emerald-600 text-white rounded-xl font-black shadow-lg flex items-center gap-2"><CheckSquare size={18}/> SIMPAN & REKAP SEMUA</button>
                        </div>
                    </>
                )}
            </div>
        </div>
      )}
      
      {/* MODAL QR, EDIT SESI, DAN KETIK SOAL (Dari Versi Lama) */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-[120] print:hidden"><div className="bg-white p-8 rounded-[2rem] w-full max-w-sm flex flex-col items-center"><button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full"><X size={20}/></button><h2 className="text-2xl font-black mb-6">SCAN MASUK</h2><div className="bg-white p-3 rounded-2xl border-4 border-emerald-500 mb-6"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/?token=' + activeQRToken)}`} alt="QR" className="w-[250px] h-[250px] object-contain" /></div><div className="bg-slate-50 border px-6 py-3 rounded-xl w-full text-center"><p className="text-[10px] font-bold text-slate-400">KODE TOKEN</p><p className="text-3xl font-black font-mono text-emerald-600">{activeQRToken}</p></div></div></div>
      )}

      {showEditSesiModal && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-[140]"><div className="bg-white p-6 rounded-[2rem] w-full max-w-sm"><button onClick={() => setShowEditSesiModal(false)} className="absolute top-5 right-5 p-1.5 bg-slate-100 rounded-full"><X size={20}/></button><h2 className="text-lg font-black mb-5"><Edit size={20}/> Edit Sesi</h2><form onSubmit={handleSaveEditSesi} className="space-y-4"><div className="p-3 bg-amber-50 border rounded-xl"><label className="text-[10px] font-black uppercase"><Percent size={14}/> Bobot Nilai</label><div className="flex gap-3 mt-2"><input type="number" min="0" max="100" value={editSesiData.bobotPG} onChange={e => setEditSesiData({...editSesiData, bobotPG: e.target.value})} className="w-full p-2 border rounded-lg text-center font-black" placeholder="PG" /><input type="number" min="0" max="100" value={editSesiData.bobotEsai} onChange={e => setEditSesiData({...editSesiData, bobotEsai: e.target.value})} className="w-full p-2 border rounded-lg text-center font-black" placeholder="Esai" /></div></div><div className="p-3 bg-blue-50 border rounded-xl"><label className="text-[10px] font-black uppercase"><Clock size={14}/> Waktu</label><div className="flex gap-3 mt-2"><input type="time" value={editSesiData.jamMulai} onChange={e => setEditSesiData({...editSesiData, jamMulai: e.target.value})} className="w-full p-2 border rounded-lg text-center font-black" /><input type="time" value={editSesiData.jamSelesai} onChange={e => setEditSesiData({...editSesiData, jamSelesai: e.target.value})} className="w-full p-2 border rounded-lg text-center font-black" /></div></div><button type="submit" className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black">SIMPAN</button></form></div></div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 flex items-center justify-center p-4 z-[110]"><div className="bg-white p-6 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto"><div className="flex justify-between border-b pb-3 mb-5"><h2 className="text-lg font-black"><Edit size={20}/> {editSoalId ? 'Revisi Soal' : 'Ketik Soal Baru'}</h2><button type="button" onClick={() => setPreviewMode(!previewMode)} className="px-3 py-2 rounded-lg font-bold text-xs bg-slate-100">Pratinjau</button></div>{!previewMode ? (<form onSubmit={handleAddOrEditSoal} className="space-y-4"><div className="flex gap-3"><select value={formData.jenisSoal} onChange={e => setFormData({...formData, jenisSoal: e.target.value})} className="p-2.5 border rounded-lg text-xs font-bold"><option value="PG">PG</option><option value="PGK">PGK</option><option value="ESAI">ESAI</option></select><select value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="p-2.5 border rounded-lg text-xs font-bold"><option value="">Pilih Mapel...</option>{schoolSubjects.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}</select><select value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="p-2.5 border rounded-lg text-xs font-bold"><option value="">Pilih Kelas...</option>{schoolClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div><textarea required value={formData.pertanyaan} placeholder="Ketik soal..." className="w-full p-4 border rounded-xl min-h-[100px] text-sm" onChange={e => setFormData({...formData, pertanyaan: e.target.value})} />{formData.jenisSoal !== 'ESAI' && (<div className="grid grid-cols-2 gap-3">{['A','B','C','D'].map(opt => (<div key={opt} className="flex gap-2 items-center">{formData.jenisSoal === 'PGK' && <input type="checkbox" checked={formData.kunci && formData.kunci.includes(opt)} onChange={() => handlePGKKeyToggle(opt)} className="w-5 h-5 rounded" />}<input required value={formData[`opsi${opt}`]} className="w-full p-3 border rounded-xl text-sm" placeholder={`Opsi ${opt}`} onChange={e => setFormData({...formData, [`opsi${opt}`]: e.target.value})} /></div>))}</div>)}{formData.jenisSoal === 'PG' && <select className="w-full p-3 border rounded-xl mt-2" value={formData.kunci} onChange={e => setFormData({...formData, kunci: e.target.value})}><option value="A">Kunci A</option><option value="B">Kunci B</option><option value="C">Kunci C</option><option value="D">Kunci D</option></select>}<div className="flex gap-2 pt-4"><button type="button" onClick={() => { setShowModal(false); setEditSoalId(null); setFormData(defaultForm); }} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Batalkan</button><button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black">Simpan</button></div></form>) : (<div className="p-4 bg-slate-50"><p>Pratinjau tertutup untuk keringkasn kode, silakan kembali ke editor.</p></div>)}</div></div>
      )}

    </div>
  );
}
