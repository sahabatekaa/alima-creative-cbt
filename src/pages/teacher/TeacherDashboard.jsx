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

  // === STATE MODAL EDIT SESI ===
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
        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profile && !error) {
           setTeacherProfile({ ...profile, schoolId: profile.school_id });
           setTempProfileName(profile.name || '');
        } else {
           setTeacherProfile(null);
        }
      } else {
        setTeacherProfile(null);
        setIsLoadingSchool(false); // Lepas barikade
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
  const isSuperAdmin = currentUserEmail === 'admin@sekolah.com';

  // ==========================================
  // TARIK DATA GLOBAL & SEKOLAH (SUPABASE)
  // ==========================================
  useEffect(() => {
    if (!schoolId) {
       setIsLoadingSchool(false);
       return;
    }

    const fetchSchoolData = async () => {
      const { data, error } = await supabase.from('schools').select('*').eq('id', schoolId.toLowerCase()).single();
      if (data && !error) setSchoolInfo({ ...data, picName: data.pic_name, waNumber: data.wa_number, expiryDate: data.expiry_date, kepalaSekolah: data.kepala_sekolah, nipKepalaSekolah: data.nip_kepala_sekolah, logoUrl: data.logo_url });
      else setSchoolInfo(null);
      setIsLoadingSchool(false);
    };

    const fetchAllData = async () => {
      try {
        const sID = schoolId.toLowerCase();
        
        // Parallel fetching untuk optimasi kecepatan
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
           bank: bankReq.data?.map(q => ({ 
               ...q, jenisSoal: q.jenis_soal, kodeWacana: q.kode_wacana, teksWacana: q.teks_wacana,
               opsiA: q.opsi_a, opsiB: q.opsi_b, opsiC: q.opsi_c, opsiD: q.opsi_d
           })) || [],
           lead: leadReq.data?.map(l => ({ 
               ...l, class: l.kelas, subKelas: l.sub_kelas, 
               teacherEmail: l.teacher_email, studentName: l.student_name,
               objectiveScore: l.objective_score, essayScores: l.essay_scores, isEssayGraded: l.is_essay_graded
           })) || [],
           sessions: sessionsReq.data?.map(s => ({ 
               ...s, subKelas: s.sub_kelas, jamMulai: s.jam_mulai, jamSelesai: s.jam_selesai, 
               teacherEmail: s.teacher_email, kuotaPG: s.kuota_pg, kuotaPGK: s.kuota_pgk, kuotaEsai: s.kuota_esai,
               bobotPG: s.bobot_pg, bobotEsai: s.bobot_esai
           })) || [],
           classes: classesReq.data || [],
           subjects: subjectsReq.data || []
        });
      } catch (err) {
        console.error("Gagal menarik data dari Supabase", err);
      }
    };

    fetchSchoolData();
    if(currentUserEmail) fetchAllData();

  }, [schoolId, currentUserEmail]);


  // --- FUNGSI LOGOUT ---
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      alert("Gagal keluar: " + error.message);
    }
  };

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

  // --- EKSEKUSI GURU ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if(teacherProfile?.id) {
      const { error } = await supabase.from('users').update({ name: tempProfileName }).eq('id', teacherProfile.id);
      if (!error) {
         setTeacherProfile(prev => ({ ...prev, name: tempProfileName }));
         alert("Profil Anda berhasil diperbarui!");
      } else { alert("Gagal update profil: " + error.message); }
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return alert("Password baru minimal 6 karakter!");
    if (window.confirm("Yakin ingin mengubah kata sandi Anda?")) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (!error) {
        alert("Kata sandi berhasil diperbarui!");
        setNewPassword('');
      } else {
        alert("Gagal mengubah kata sandi: " + error.message);
      }
    }
  };

  const sendBroadcast = async () => {
    if(!broadcastText) return;
    if(window.confirm(`Kirim pengumuman darurat ke semua siswa di Ruang Ujian (Token: ${activeMonitorToken})?`)) {
      await supabase.from('live_students').update({ broadcast: broadcastText }).eq('token', activeMonitorToken);
      setBroadcastText('');
      alert("Pengumuman berhasil disiarkan!");
      window.location.reload(); // Refresh lokal untuk tarik data terbaru (karena tidak pakai realtime listener penuh)
    }
  };

  const forceSubmitAll = async () => {
    if(window.confirm("🚨 PERINGATAN! Tarik paksa semua lembar jawaban siswa yang online di sesi ini?")) {
      await supabase.from('live_students').update({ force_submit: true }).eq('token', activeMonitorToken).neq('status', 'Selesai');
      alert("Perintah tarik paksa terkirim!");
      window.location.reload();
    }
  };

  const handleDeleteMyRecap = async () => {
    if (myLeaderboard.length === 0) return alert("Belum ada data nilai.");
    const konfirmasi = window.prompt("🚨 PERINGATAN BAHAYA!\nTindakan ini akan MENGHAPUS PERMANEN SEMUA NILAI Anda.\n\nKetik kata 'HAPUS' (huruf besar semua) di bawah ini untuk melanjutkan:");
    if (konfirmasi === "HAPUS") {
      try { 
        await supabase.from('leaderboard').delete().eq('teacher_email', currentUserEmail);
        alert("Data berhasil dibersihkan."); 
        window.location.reload();
      } catch (error) { alert("Gagal: " + error.message); }
    } else if (konfirmasi !== null) alert("❌ Dibatalkan: Kata konfirmasi salah.");
  };

  const handleDeleteSingleRecap = async (id, studentName) => {
    if (window.confirm(`Yakin hapus data ujian "${studentName}"?`)) {
      await supabase.from('leaderboard').delete().eq('id', id);
      alert("Data dihapus!"); window.location.reload();
    }
  };

  // --- KOREKSI ESAI MANUAL (TINDER-STYLE) ---
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
    if(window.confirm(`Simpan seluruh nilai esai dan kalkulasi Skor Akhir untuk ${essayStudents.length} siswa ini?`)) {
        const bPG = koreksiSession?.bobotPG !== undefined ? parseInt(koreksiSession.bobotPG) : (essayQuestions.length > 0 ? 70 : 100);
        const bEsai = koreksiSession?.bobotEsai !== undefined ? parseInt(koreksiSession.bobotEsai) : (essayQuestions.length > 0 ? 30 : 0);

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
        } catch (error) {
            alert("Gagal menyimpan data: " + error.message);
        }
    }
  };

  // --- BANK SOAL ---
  const handlePGKKeyToggle = (opt) => {
    let currentKeys = formData.kunci ? formData.kunci.split(',') : [];
    if (currentKeys.includes(opt)) currentKeys = currentKeys.filter(k => k !== opt);
    else currentKeys.push(opt);
    setFormData({ ...formData, kunci: currentKeys.sort().join(',') });
  };

  const handleAddOrEditSoal = async (e) => { 
    e.preventDefault(); 
    const finalData = { ...formData };
    if(finalData.jenisSoal === 'ESAI') {
        finalData.opsiA = ''; finalData.opsiB = ''; finalData.opsiC = ''; finalData.opsiD = ''; finalData.kunci = '';
    }

    const payload = {
        school_id: schoolId.toLowerCase(),
        teacher_email: currentUserEmail,
        mapel: finalData.mapel,
        kelas: finalData.kelas,
        jenis_soal: finalData.jenisSoal,
        kode_wacana: finalData.kodeWacana,
        teks_wacana: finalData.teksWacana,
        pertanyaan: finalData.pertanyaan,
        gambar: finalData.gambar,
        opsi_a: finalData.opsiA,
        opsi_b: finalData.opsiB,
        opsi_c: finalData.opsiC,
        opsi_d: finalData.opsiD,
        kunci: finalData.kunci
    };

    if (editSoalId) { 
        await supabase.from('bank_soal').update(payload).eq('id', editSoalId); 
        alert("Soal diperbarui!"); 
    } else { 
        await supabase.from('bank_soal').insert([payload]); 
        alert("Soal ditambahkan!"); 
    }

    setShowModal(false); 
    setEditSoalId(null); 
    setFormData(defaultForm); 
    setPreviewMode(false);
    window.location.reload();
  };

  const openEditModal = (q) => { 
    setFormData({ 
      jenisSoal: q.jenisSoal || 'PG', kodeWacana: q.kodeWacana || '', teksWacana: q.teksWacana || '',
      mapel: q.mapel||'', kelas: q.kelas||'', pertanyaan: q.pertanyaan||' ', gambar: q.gambar || '', 
      opsiA: q.opsiA||' ', opsiB: q.opsiB||' ', opsiC: q.opsiC||' ', opsiD: q.opsiD||' ', kunci: q.kunci||'A' 
    }); 
    setEditSoalId(q.id); 
    setShowModal(true); 
    setPreviewMode(false);
  };
  
  const downloadTemplate = () => { 
    try {
      const wsData = [
        { No: 1, Kode_Wacana: "", Jenis_Soal: "PG", Teks_Wacana: "", mapel: "Matematika", kelas: "10", pertanyaan: "Jika $x^2 = 4$, maka $x$ adalah?", opsiA: "2", opsiB: "3", opsiC: "4", opsiD: "5", Kunci_Jawaban: "A" },
        { No: 2, Kode_Wacana: "", Jenis_Soal: "PGK", Teks_Wacana: "", mapel: "Matematika", kelas: "10", pertanyaan: "Manakah bilangan genap?", opsiA: "2", opsiB: "3", opsiC: "4", opsiD: "5", Kunci_Jawaban: "A,C" },
        { No: 3, Kode_Wacana: "W-01", Jenis_Soal: "ESAI", Teks_Wacana: "Proses hujan terjadi karena...", mapel: "Matematika", kelas: "10", pertanyaan: "Jelaskan proses kondensasi!", opsiA: "", opsiB: "", opsiC: "", opsiD: "", Kunci_Jawaban: "" }
      ];
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Format_Soal_V2");
      XLSX.writeFile(wb, "Template_CBT_Soal_V2.xlsx"); 
    } catch(err) { alert("Gagal mendownload: " + err.message); } 
  };
  
  const triggerImport = () => { if(fileInputRef.current) fileInputRef.current.click(); };
  
  const handleFileUpload = (e) => { 
    try { 
      const file = e.target.files[0]; 
      if (!file) return; 
      const reader = new FileReader(); 
      reader.onload = async (evt) => { 
        const d = XLSX.utils.sheet_to_json(XLSX.read(evt.target.result, { type: 'binary' }).Sheets[XLSX.read(evt.target.result, { type: 'binary' }).SheetNames[0]]); 
        const bulkData = [];
        
        d.forEach(i => { 
          if (i.pertanyaan) { 
            const jenis = (i.Jenis_Soal || 'PG').toUpperCase();
            bulkData.push({
               school_id: schoolId.toLowerCase(),
               teacher_email: currentUserEmail,
               mapel: String(i.mapel),
               kelas: String(i.kelas),
               pertanyaan: String(i.pertanyaan),
               opsi_a: String(i.opsiA || ''), opsi_b: String(i.opsiB || ''), opsi_c: String(i.opsiC || ''), opsi_d: String(i.opsiD || ''),
               jenis_soal: jenis,
               kode_wacana: String(i.Kode_Wacana || ''), teks_wacana: String(i.Teks_Wacana || ''),
               kunci: i.Kunci_Jawaban ? String(i.Kunci_Jawaban).replace(/\s/g, '').toUpperCase() : ''
            });
          } 
        }); 

        if (bulkData.length > 0) {
            const { error } = await supabase.from('bank_soal').insert(bulkData);
            if (!error) {
                alert(`${bulkData.length} Soal berhasil di-import!`); 
                if(fileInputRef.current) fileInputRef.current.value = ''; 
                window.location.reload();
            } else alert(error.message);
        }
      }; 
      reader.readAsBinaryString(file); 
    } catch(err) { alert("Gagal: " + err.message); } 
  };
  
  // --- SESI UJIAN ---
  const handleCreateSession = async (e) => { 
    e.preventDefault(); 
    const t = document.getElementById('token_input').value; 
    const sk = document.getElementById('subkelas_session').value.toUpperCase(); 
    if(!t || !selectedMapelSesi || !selectedKelasSesi || !sk) return alert("Lengkapi data sesi!"); 

    const bPG = parseInt(bobotPG) || 0;
    const bEsai = parseInt(bobotEsai) || 0;
    if (bPG + bEsai !== 100) return alert("Peringatan: Total Bobot PG dan Esai harus tepat 100%!");
    
    const { error } = await supabase.from('exam_sessions').insert([{
       school_id: schoolId.toLowerCase(),
       token: t, mapel: selectedMapelSesi, kelas: selectedKelasSesi, sub_kelas: sk, status: 'open',
       kuota_pg: parseInt(kuotaPG) || 0, kuota_pgk: parseInt(kuotaPGK) || 0, kuota_esai: parseInt(kuotaEsai) || 0,
       bobot_pg: bPG, bobot_esai: bEsai, jam_mulai: jamMulai, jam_selesai: jamSelesai,
       teacher_email: currentUserEmail
    }]);

    if (!error) {
        document.getElementById('token_input').value = ''; 
        setKuotaPG(0); setKuotaPGK(0); setKuotaEsai(0);
        setBobotPG(70); setBobotEsai(30); setJamMulai("07:30"); setJamSelesai("09:00");
        alert("Sesi Ujian Resmi Dibuka!"); 
        window.location.reload();
    } else alert(error.message);
  };

  const toggleSession = async (id, s) => { await supabase.from('exam_sessions').update({ status: s === 'open' ? 'closed' : 'open' }).eq('id', id); window.location.reload(); };
  const delSession = async (id) => { if(window.confirm("Hapus sesi ini?")) { await supabase.from('exam_sessions').delete().eq('id', id); window.location.reload(); } };
  const setMonitor = (t) => { setActiveMonitorToken(t); localStorage.setItem('activeMonitorToken', t); setActiveTab('proctor'); };
  const openQR = (token) => { setActiveQRToken(token); setShowQRModal(true); };

  const openEditSesi = (s) => {
    setEditSesiData({
        id: s.id, token: s.token, mapel: s.mapel,
        bobotPG: s.bobotPG !== undefined ? s.bobotPG : 70,
        bobotEsai: s.bobotEsai !== undefined ? s.bobotEsai : 30,
        jamMulai: s.jamMulai || "07:30",
        jamSelesai: s.jamSelesai || "09:00"
    });
    setShowEditSesiModal(true);
  };

  const handleSaveEditSesi = async (e) => {
    e.preventDefault();
    const bPG = parseInt(editSesiData.bobotPG) || 0;
    const bEsai = parseInt(editSesiData.bobotEsai) || 0;
    if (bPG + bEsai !== 100) return alert("Peringatan: Total Bobot PG dan Esai harus tepat 100%!");

    try {
        await supabase.from('exam_sessions').update({
            bobot_pg: bPG,
            bobot_esai: bEsai,
            jam_mulai: editSesiData.jamMulai,
            jam_selesai: editSesiData.jamSelesai
        }).eq('id', editSesiData.id);

        const studentsInSession = myLeaderboard.filter(s => s.token === editSesiData.token);
        
        if (studentsInSession.length > 0) {
            const eQs = myQuestions.filter(q => q.mapel === editSesiData.mapel && q.jenisSoal === 'ESAI');
            
            const promises = studentsInSession.map(student => {
                let totalEssayScore = 0;
                eQs.forEach(q => {
                    const s = student.essayScores ? (parseFloat(student.essayScores[`${student.id}_${q.id}`]) || 0) : 0;
                    totalEssayScore += s;
                });
                
                const avgEssayScore = eQs.length > 0 ? (totalEssayScore / eQs.length) : 0;
                const objectiveScore = student.objectiveScore !== undefined ? student.objectiveScore : student.score;
                const finalScore = Math.round((objectiveScore * bPG / 100) + (avgEssayScore * bEsai / 100));

                return supabase.from('leaderboard').update({
                    score: finalScore,
                    objective_score: objectiveScore
                }).eq('id', student.id);
            });
            
            await Promise.all(promises);
        }

        setShowEditSesiModal(false);
        alert("✅ Ajaib! Sesi Diperbarui & Semua Nilai Siswa Otomatis Dihitung Ulang!");
        window.location.reload();
    } catch (err) {
        alert("Gagal menyimpan: " + err.message);
    }
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

  // --- LOADING DAN PENDING SCREEN ---
  if (isLoadingProfile || isLoadingSchool) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
         <Loader2 size={40} className="text-emerald-500 animate-spin" />
         <p className="text-sm font-bold text-slate-500 tracking-widest uppercase animate-pulse">Memverifikasi Akses Instansi...</p>
      </div>
    );
  }

  if (!teacherProfile) {
     return (
       <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <AlertTriangle size={60} className="text-red-500 mb-4" />
          <p className="text-xl font-black text-slate-700 mb-2">Sesi Terputus</p>
          <p className="text-sm font-bold text-slate-500 max-w-md mb-6">Silakan login kembali.</p>
          <button onClick={() => navigate('/login')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-sm">Kembali ke Login</button>
       </div>
     );
  }

  if (teacherProfile.status === 'pending') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
         <Clock size={60} className="text-amber-500 mb-4" />
         <p className="text-2xl font-black text-slate-700 mb-2">Menunggu Persetujuan</p>
         <p className="text-sm font-bold text-slate-500 max-w-md mb-6">Akun Anda sedang ditinjau oleh Admin Tata Usaha sekolah. Silakan hubungi admin sekolah Anda agar akun ini segera diaktifkan.</p>
         <button onClick={handleLogout} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm">Keluar</button>
      </div>
    );
  }

  if (schoolInfo && schoolInfo.status === 'suspended') {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center animate-in fade-in duration-500">
         <div className="bg-red-50 p-8 rounded-[32px] border-2 border-red-200 shadow-xl max-w-lg w-full flex flex-col items-center">
            <ShieldAlert size={80} className="text-red-600 mb-6 animate-pulse" />
            <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">Akses Ditangguhkan</h2>
            <p className="text-sm font-bold text-slate-600 mb-8 leading-relaxed">
              Layanan CBT untuk instansi <b>{schoolInfo?.name || schoolId}</b> saat ini sedang ditangguhkan oleh Master Administrator.
              Silakan hubungi <b>Admin Tata Usaha Sekolah</b> Anda untuk informasi lebih lanjut.
            </p>
            <button onClick={handleLogout} className="w-full bg-slate-800 hover:bg-slate-700 text-white px-6 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md transition-all">
               <LogOut size={18} /> Keluar Akun
            </button>
         </div>
      </div>
    );
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
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">{schoolId ? `INST: ${schoolId}` : `VERSI ${APP_VERSION}`}</p>
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
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 rounded-xl font-bold text-sm transition-colors shadow-sm">
                <LogOut size={16}/> Keluar Akun
            </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-3 lg:p-4 flex justify-between items-center z-10 print:hidden pr-16 md:pr-6 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 bg-slate-100 rounded-lg text-emerald-600" onClick={() => setIsMobileMenuOpen(true)}><Menu size={20}/></button>
            <h2 className="text-lg lg:text-xl font-black text-slate-800 hidden sm:flex items-center gap-2 tracking-wide">Teacher Center <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded uppercase font-black">V3 POSTGRES</span></h2>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Sistem Stabil</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* TAB DASHBOARD UTAMA */}
          {activeTab === 'dashboard' && (
            <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-emerald-600 rounded-[24px] p-8 md:p-10 text-white shadow-lg relative overflow-hidden mb-6">
                  <div className="absolute right-0 top-0 opacity-10 transform translate-x-10 -translate-y-5">
                     <GraduationCap size={300} />
                  </div>
                  <div className="relative z-10">
                      <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">Selamat Datang, {teacherProfile?.name || 'Guru'}!</h2>
                      <p className="text-emerald-100 font-medium text-base md:text-lg max-w-2xl leading-relaxed">Kelola soal, pantau ujian, dan rekap nilai siswa Anda dengan cepat dan mudah di Dashboard Guru.</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div className="bg-white p-6 rounded-[20px] border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                     <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><BookOpen size={16}/></div></div>
                     <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Soal</p><p className="text-3xl font-black text-slate-800">{myQuestions.length}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-[20px] border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                     <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Radio size={16}/></div></div>
                     <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sesi Aktif</p><p className="text-3xl font-black text-slate-800">{mySessions.filter(s => s.status === 'open').length}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-[20px] border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                     <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Users size={16}/></div></div>
                     <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Siswa Ujian</p><p className="text-3xl font-black text-slate-800">{myLeaderboard.length}</p></div>
                  </div>
                  <div className="bg-white p-6 rounded-[20px] border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                     <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><ClipboardList size={16}/></div></div>
                     <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Sesi</p><p className="text-3xl font-black text-slate-800">{mySessions.length}</p></div>
                  </div>
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Mata Pelajaran (Sesuai Data Sekolah)</label>
                    <select value={selectedMapelSesi} onChange={(e) => setSelectedMapelSesi(e.target.value)} required className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none text-sm font-bold text-slate-700 focus:border-emerald-500">
                        <option value="">-- Pilih Mapel --</option>
                        {schoolSubjects.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div>
                         <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Tingkat</label>
                         <select value={selectedKelasSesi} onChange={(e) => setSelectedKelasSesi(e.target.value)} required className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none text-sm font-bold text-slate-700">
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
                        <div><label className="text-[9px] font-black text-emerald-700 mb-1 flex items-center gap-1"><Percent size={10}/> Bobot PG/PGK</label><input type="number" min="0" max="100" value={bobotPG} onChange={e => setBobotPG(e.target.value)} className="w-full p-2 border border-emerald-300 rounded-lg text-sm text-center font-black text-emerald-800 bg-emerald-100/50 shadow-inner outline-none focus:border-emerald-500" /></div>
                        <div><label className="text-[9px] font-black text-emerald-700 mb-1 flex items-center gap-1"><Percent size={10}/> Bobot Esai</label><input type="number" min="0" max="100" value={bobotEsai} onChange={e => setBobotEsai(e.target.value)} className="w-full p-2 border border-emerald-300 rounded-lg text-sm text-center font-black text-emerald-800 bg-emerald-100/50 shadow-inner outline-none focus:border-emerald-500" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <div><label className="text-[9px] font-black text-emerald-700 mb-1 flex items-center gap-1"><Clock size={10}/> Jam Mulai</label><input type="time" required value={jamMulai} onChange={e => setJamMulai(e.target.value)} className="w-full p-2 border border-emerald-300 rounded-lg text-xs text-center font-black text-emerald-800 bg-emerald-100/50 outline-none" /></div>
                        <div><label className="text-[9px] font-black text-emerald-700 mb-1 flex items-center gap-1"><Clock size={10}/> Jam Selesai</label><input type="time" required value={jamSelesai} onChange={e => setJamSelesai(e.target.value)} className="w-full p-2 border border-emerald-300 rounded-lg text-xs text-center font-black text-emerald-800 bg-emerald-100/50 outline-none" /></div>
                    </div>
                  </div>

                  <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Token Sesi</label><div className="flex gap-2"><input id="token_input" required placeholder="Generate..." className="w-full p-3 border border-emerald-200 bg-emerald-50 rounded-xl uppercase font-mono text-sm font-black tracking-widest text-emerald-800 outline-none" /><button type="button" onClick={() => document.getElementById('token_input').value = Math.random().toString(36).substring(2,7).toUpperCase()} className="p-3 bg-slate-800 text-white rounded-xl active:scale-95 transition-all"><Dices size={20}/></button></div></div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 mt-2 rounded-xl text-sm font-black shadow-md shadow-emerald-600/30 active:scale-95 transition-all tracking-widest">RILIS UJIAN</button>
                </form>
              </div>
              
              <div className="xl:col-span-2 space-y-4">
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-3"><Activity className="text-emerald-500" size={20}/> Manajemen Sesi Aktif</h3>
                {mySessions.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl text-center border border-dashed border-slate-300 text-slate-400 text-sm font-bold">Belum ada sesi yang dirilis.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mySessions.map((s) => (
                      <div key={s.id} className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-colors ${s.status==='open'?'bg-white border-emerald-200':'bg-slate-50 border-slate-200 opacity-90'}`}>
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-2xl font-black font-mono tracking-widest text-slate-800">{s.token}</h4>
                            <span className={`p-1.5 rounded-lg shadow-sm border ${s.status==='open'?'bg-emerald-50 text-emerald-600 border-emerald-200':'bg-red-50 text-red-600 border-red-200'}`}>{s.status==='open'?<Unlock size={16}/>:<Lock size={16}/>}</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            <span className="text-[10px] font-black bg-emerald-500 text-white px-2.5 py-1 rounded-md shadow-sm">{s.mapel}</span>
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">Kls: {s.kelas}-{s.subKelas}</span>
                          </div>
                          <div className="flex flex-col gap-1 mb-4">
                             <div className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200 flex justify-between">
                                <span>PG: {s.kuotaPG || 0}</span> <span>PGK: {s.kuotaPGK || 0}</span> <span>Esai: {s.kuotaEsai || 0}</span>
                             </div>
                             <div className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 flex justify-between">
                                <span>BOBOT PG: {s.bobotPG || 70}%</span> <span>BOBOT ESAI: {s.bobotEsai || 30}%</span>
                             </div>
                             <div className="text-[9px] font-black text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 flex justify-between">
                                <span className="flex items-center gap-1"><Clock size={10}/> WAKTU: {s.jamMulai || '--:--'} s/d {s.jamSelesai || '--:--'}</span>
                             </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                          <button onClick={() => openQR(s.token)} className="bg-blue-50 hover:bg-blue-100 text-blue-600 py-2 rounded-lg text-[10px] font-bold flex flex-col justify-center items-center gap-0.5 border border-blue-100 transition-colors"><QrCode size={14}/> QR</button>
                          <button onClick={() => setMonitor(s.token)} className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-[10px] font-bold flex flex-col justify-center items-center gap-0.5 transition-colors"><Eye size={14}/> Pantau</button>
                          <button onClick={() => openEditSesi(s)} className="bg-amber-50 hover:bg-amber-100 text-amber-600 py-2 rounded-lg text-[10px] font-bold flex flex-col justify-center items-center gap-0.5 border border-amber-100 transition-colors"><Edit size={14}/> Edit</button>
                          
                          <button onClick={() => toggleSession(s.id, s.status)} className="col-span-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1.5 border border-slate-200 transition-colors">{s.status==='open'?<Lock size={14}/>:<Unlock size={14}/>} Kunci Sesi</button>
                          <button onClick={() => delSession(s.id)} className="col-span-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-[10px] font-bold flex justify-center items-center gap-1.5 border border-red-100 transition-colors"><Trash2 size={14}/> Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB MONITOR LIVE */}
          {activeTab === 'proctor' && (
            <div className="space-y-5 max-w-7xl mx-auto">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-2 font-black text-slate-800 text-lg"><Monitor className="text-emerald-500" size={22}/> Live Proctoring</div>
                <select value={activeMonitorToken} onChange={(e) => setMonitor(e.target.value)} className="w-full sm:w-auto p-3 rounded-xl border border-slate-200 outline-none text-sm font-bold text-slate-700 bg-slate-50 cursor-pointer shadow-sm focus:border-emerald-500">
                    <option value="">-- Pilih Sesi Token --</option>
                    {mySessions.map(s => <option key={s.token} value={s.token}>{s.token} ({s.kelas}-{s.subKelas})</option>)}
                </select>
              </div>

              {!activeMonitorToken ? (
                <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center text-slate-400"><Filter size={48} className="mb-4 opacity-30"/><h3 className="font-bold text-lg text-slate-500">Silakan Pilih Token Sesi untuk Memantau</h3></div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white p-4 rounded-2xl border-l-4 border-l-blue-500 shadow-sm"><p className="text-slate-500 text-[10px] font-bold mb-1 uppercase tracking-wider">Terhubung</p><p className="text-3xl font-black text-slate-800">{monitoredStudents.length}</p></div>
                    <div className="bg-white p-4 rounded-2xl border-l-4 border-l-emerald-500 shadow-sm"><p className="text-slate-500 text-[10px] font-bold mb-1 uppercase tracking-wider">Selesai</p><p className="text-3xl font-black text-emerald-600">{monitoredStudents.filter(s => s.status === 'Selesai').length}</p></div>
                    <div className="bg-white p-4 rounded-2xl border-l-4 border-l-red-500 shadow-sm"><p className="text-slate-500 text-[10px] font-bold mb-1 uppercase tracking-wider">Curang</p><p className="text-3xl font-black text-red-600">{monitoredStudents.filter(s => (s?.warnings || 0) > 0).length}</p></div>
                    <div className="bg-slate-900 p-4 rounded-2xl flex flex-col justify-center items-center shadow-lg border border-slate-800">
                       <button onClick={forceSubmitAll} className="w-full h-full bg-red-600 hover:bg-red-500 text-white rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all flex-col p-2 text-center shadow-lg shadow-red-600/30 text-xs">
                          <ShieldAlert size={20} className="mb-0.5" /> Tarik Paksa Semua
                       </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center">
                    <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600"><MessageSquare size={20}/></div>
                    <div className="flex-1 w-full"><input value={broadcastText} onChange={e => setBroadcastText(e.target.value)} placeholder="Tulis pengumuman darurat ke layar siswa di ruangan ini..." className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-sm font-bold text-slate-700" /></div>
                    <button onClick={sendBroadcast} className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-blue-600/30 tracking-widest"><Send size={16}/> SIARKAN</button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {monitoredStudents.map(s => (
                      <div key={s.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3 hover:border-emerald-300 transition-colors">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                          <div>
                            <p className="font-black text-slate-800 text-base leading-tight truncate max-w-[150px]">{s?.name || '-'}</p>
                            <span className="inline-block mt-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200">{s?.class}-{s?.subKelas}</span>
                          </div>
                          {(s?.warnings || 0) > 0 && <span className="bg-red-50 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-200 animate-pulse whitespace-nowrap">(!Tab {s.warnings}x)</span>}
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5"><span>Progress Ujian</span><span className="text-emerald-600">{s?.progress || 0}%</span></div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner"><div className="bg-emerald-500 h-full transition-all duration-500" style={{width:`${s?.progress || 0}%`}}></div></div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-100 mt-1">
                          <button onClick={async () => { await supabase.from('live_students').update({ force_submit: true }).eq('id', s.id); window.location.reload(); }} disabled={s.status === 'Selesai'} className="flex-1 text-[10px] bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 py-2 rounded-lg font-bold disabled:opacity-50 active:scale-95 transition-all shadow-sm">Tarik Mandiri</button>
                          {(s?.warnings || 0) >= 3 && s?.status !== 'Selesai' && (
                            <button onClick={async () => { await supabase.from('live_students').update({ warnings: 0, status: 'Online' }).eq('id', s.id); window.location.reload(); }} className="flex-1 text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 py-2 rounded-lg font-bold active:scale-95 transition-all shadow-sm">Buka Kunci</button>
                          )}
                        </div>
                      </div>
                    ))}
                    {monitoredStudents.length === 0 && <div className="col-span-full text-center p-10 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 text-sm font-bold">Belum ada peserta yang login dengan token ini.</div>}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB BANK SOAL */}
          {activeTab === 'bank' && (
            <div className="space-y-5 max-w-7xl mx-auto print:max-w-full">
              <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
              
              <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-200 print:hidden space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><BookOpen className="text-emerald-500" size={20}/> Bank Soal V2</h3>
                  <div className="flex gap-2">
                    <button onClick={downloadTemplate} className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors" title="Download Template Excel V2"><Download size={18}/></button>
                    <button onClick={triggerImport} className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors" title="Import Excel"><Upload size={18}/></button>
                    <button onClick={() => { setEditSoalId(null); setFormData(defaultForm); setShowModal(true); setPreviewMode(false); }} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 transition-colors text-white rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={16}/> Ketik Soal</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select value={bankMapel} onChange={e => setBankMapel(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500">
                      <option value="">-- Semua Mata Pelajaran --</option>
                      {availableBankMapel.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={bankKelas} onChange={e => setBankKelas(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-bold text-slate-700 outline-none focus:border-emerald-500">
                      <option value="">-- Semua Tingkatan Kelas --</option>
                      {availableBankKelas.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {filteredQuestions.map((q, i) => (
                  <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-5 justify-between break-inside-avoid">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-3 border-b border-slate-100 pb-3">
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">{q?.mapel} - Tk. {q?.kelas}</span>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border ${(!q.jenisSoal || q.jenisSoal === 'PG') ? 'bg-blue-50 text-blue-700 border-blue-200' : q.jenisSoal === 'PGK' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                           Tipe: {q.jenisSoal || 'PG'}
                        </span>
                        {q.kodeWacana && <span className="text-[10px] font-black bg-slate-800 text-white px-2.5 py-1 rounded-md">Wacana: {q.kodeWacana}</span>}
                      </div>
                      
                      {q?.gambar && <img src={q.gambar} alt="Gambar" className="mb-3 max-w-xs rounded-xl border border-slate-100" />}
                      {q?.teksWacana && (
                         <div className="mb-3 p-3 bg-slate-50 border-l-4 border-slate-400 rounded-r-lg text-xs font-medium text-slate-600 whitespace-pre-wrap">
                             <Latex>{String(q.teksWacana)}</Latex>
                         </div>
                      )}

                      <div className="font-bold text-base mb-4 text-slate-800 flex whitespace-pre-wrap">
                        <span className="text-emerald-600 mr-2">{i+1}.</span>
                        <div className="flex-1"><Latex>{String(q?.pertanyaan || ' ')}</Latex></div>
                      </div>

                      {(!q.jenisSoal || q.jenisSoal !== 'ESAI') && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 font-medium">
                            {['A','B','C','D'].map(opt => {
                              const isKey = q.jenisSoal === 'PGK' ? (q.kunci && q.kunci.includes(opt)) : q.kunci === opt;
                              return (
                              <div key={opt} className={`p-3 rounded-xl border flex break-words ${isKey ?'bg-emerald-50 border-emerald-300 font-bold text-emerald-900 shadow-sm':'bg-slate-50 border-slate-200'}`}>
                                 <span className="mr-2 font-black">{opt}.</span>
                                 <div className="flex-1 whitespace-pre-wrap"><Latex>{String(q[`opsi${opt}`] || ' ')}</Latex></div>
                              </div>
                            )})}
                          </div>
                      )}
                    </div>
                    <div className="flex gap-2 self-end md:self-start mt-3 md:mt-0 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-5 w-full md:w-auto">
                      <button onClick={() => openEditModal(q)} className="flex-1 md:flex-none flex justify-center items-center bg-blue-50 hover:bg-blue-100 text-blue-600 p-3 rounded-xl transition-colors"><Edit size={18}/></button>
                      <button onClick={async () => {if(window.confirm("Hapus soal ini?")) { await supabase.from('bank_soal').delete().eq('id', q.id); window.location.reload(); } }} className="flex-1 md:flex-none flex justify-center items-center bg-red-50 hover:bg-red-100 text-red-600 p-3 rounded-xl transition-colors"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
                {filteredQuestions.length === 0 && <div className="text-center p-10 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-300 text-sm font-bold">Belum ada soal untuk filter ini.</div>}
              </div>
            </div>
          )}

          {/* TAB REKAP NILAI & CETAK ADMINISTRASI */}
          {activeTab === 'recap' && (
            <div className="space-y-5 max-w-7xl mx-auto print:max-w-full">
              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-100 pb-3">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><ClipboardList className="text-emerald-500" size={20}/> Pusat Administrasi Ujian</h3>
                  <button onClick={handleDeleteMyRecap} className="w-full md:w-auto bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-colors shadow-sm"><Trash2 size={16}/> Bersihkan Nilai Saya</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select value={recapMapel} onChange={e => setRecapMapel(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none text-sm font-bold text-slate-700 cursor-pointer focus:border-emerald-500">
                      <option value="">-- Semua Mapel --</option>
                      {availableRecapMapel.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={recapKelas} onChange={e => setRecapKelas(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 outline-none text-sm font-bold text-slate-700 cursor-pointer focus:border-emerald-500">
                      <option value="">-- Semua Tingkatan --</option>
                      {availableRecapKelas.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <select value={recapToken} onChange={e => setRecapToken(e.target.value)} className="w-full p-3 border border-emerald-200 rounded-xl bg-emerald-50 outline-none text-sm font-bold text-emerald-800 cursor-pointer focus:border-emerald-500">
                      <option value="">-- Pilih Sesi (Token) --</option>
                      {availableRecapTokens.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
                  <button onClick={() => { setPrintMode('rekap'); setTimeout(() => window.print(), 300); }} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all tracking-wide"><BarChart size={16}/> Cetak Daftar Nilai</button>
                  <button onClick={() => { setPrintMode('berita_acara'); setTimeout(() => window.print(), 300); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"><FileText size={16}/> Berita Acara Ujian</button>
                  <button onClick={() => { setPrintMode('daftar_hadir'); setTimeout(() => window.print(), 300); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"><Users size={16}/> Daftar Hadir Siswa</button>

                  {/* TOMBOL KOREKSI ESAI HANYA MUNCUL JIKA ADA TOKEN YANG DIPILIH */}
                  {recapToken && (
                     <button onClick={() => {
                        const targetSession = mySessions.find(s => s.token === recapToken);
                        if(targetSession) openKoreksiModal(targetSession);
                        else alert("Sesi ini sudah ditutup dari pendaftaran.");
                     }} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-sm transition-all"><CheckSquare size={16}/> Koreksi Esai Manual</button>
                  )}
                </div>
              </div>
              
              <div className={`${printMode === 'rekap' ? 'hidden print:block' : 'hidden'}`}>
                <OfficialHeader />
                <h3 className="text-center font-black text-lg mb-6 underline">DAFTAR NILAI UJIAN SISWA</h3>
                <p className="mb-4 text-sm font-bold">Mata Pelajaran: {recapMapel || 'Semua'} <br/> Kelas: {recapKelas || 'Semua'} | Token Sesi: {recapToken || 'Semua'} <br/> Nama Guru: {teacherProfile?.name}</p>
                <table className="w-full text-left text-sm">
                  <thead><tr><th className="py-2 px-3 w-12 text-center">No</th><th className="py-2 px-3">Nama Lengkap Siswa</th><th className="py-2 px-3">Mapel</th><th className="py-2 px-3 text-center">Kelas</th><th className="py-2 px-3 text-center">Skor Akhir</th></tr></thead>
                  <tbody>
                    {filteredLeaderboard.map((s, i) => (
                      <tr key={s?.id || i}>
                        <td className="py-2 px-3 text-center">{i+1}</td>
                        <td className="py-2 px-3 font-bold uppercase">{s?.studentName || s?.name || 'Anonim'}</td>
                        <td className="py-2 px-3">{s?.mapel || '-'}</td>
                        <td className="py-2 px-3 text-center">{s?.class}-{s?.subKelas}</td>
                        <td className="py-2 px-3 text-center font-black">{s?.score || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end mt-12 text-center">
                   <div className="w-64">
                      <p>Simalungun, {new Date().toLocaleDateString('id-ID')}<br/>Guru Bidang Studi,</p><br/><br/><br/>
                      <p className="font-bold underline uppercase">{teacherProfile?.name}</p>
                   </div>
                </div>
              </div>

              <div className={`${printMode === 'berita_acara' ? 'hidden print:block' : 'hidden'}`}>
                <OfficialHeader />
                <h3 className="text-center font-black text-lg mb-8 underline tracking-wide">BERITA ACARA PELAKSANAAN UJIAN CBT</h3>
                <div className="text-justify leading-loose font-medium text-sm">
                  <p>Pada hari ini _________ tanggal ____ bulan ________________ tahun 20___, telah diselenggarakan Ujian Berbasis Komputer (CBT) untuk:</p>
                  <table className="w-full my-4 border-none !border-0">
                    <tbody className="border-none">
                      <tr className="border-none"><td className="w-48 py-1 border-none !p-0">Mata Pelajaran</td><td className="border-none !p-0">: {recapMapel || '_________________________'}</td></tr>
                      <tr className="border-none"><td className="w-48 py-1 border-none !p-0">Kelas / Token</td><td className="border-none !p-0">: {recapKelas || '____'} / {recapToken || '____'}</td></tr>
                      <tr className="border-none"><td className="w-48 py-1 border-none !p-0">Jumlah Peserta Terdaftar</td><td className="border-none !p-0">: {filteredLeaderboard.length} Orang</td></tr>
                      <tr className="border-none"><td className="w-48 py-1 border-none !p-0">Hadir / Mengikuti Ujian</td><td className="border-none !p-0">: ______ Orang</td></tr>
                      <tr className="border-none"><td className="w-48 py-1 border-none !p-0">Tidak Hadir (Absen)</td><td className="border-none !p-0">: ______ Orang</td></tr>
                    </tbody>
                  </table>
                  <p className="mt-4">Catatan selama pelaksanaan ujian:</p>
                  <div className="w-full h-24 border border-black mt-2 mb-8"></div>
                  <p>Demikian berita acara ini dibuat dengan sesungguhnya untuk dapat dipergunakan sebagaimana mestinya.</p>
                </div>
                <div className="flex justify-between mt-12 text-center">
                  <div className="w-64">
                     <p>Pengawas Ruangan,</p><br/><br/><br/>
                     <p className="font-bold uppercase border-b border-black pb-1">_________________________</p>
                     <p className="text-xs">NIP. </p>
                  </div>
                  <div className="w-64">
                     <p>Guru Mata Pelajaran,</p><br/><br/><br/>
                     <p className="font-bold uppercase border-b border-black pb-1">{teacherProfile?.name}</p>
                     <p className="text-xs">NIP. </p>
                  </div>
                </div>
              </div>

              <div className={`${printMode === 'daftar_hadir' ? 'hidden print:block' : 'hidden'}`}>
                <OfficialHeader />
                <h3 className="text-center font-black text-lg mb-6 underline">DAFTAR HADIR PESERTA UJIAN</h3>
                <p className="mb-4 text-sm font-bold">Mata Pelajaran: {recapMapel || '_________________'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Kelas: {recapKelas || '____'} | Token: {recapToken || '____'}</p>
                <table className="w-full text-left text-sm">
                  <thead><tr><th className="py-3 px-3 w-12 text-center">No</th><th className="py-3 px-3">Nama Lengkap Siswa</th><th className="py-3 px-3 text-center w-24">Kelas</th><th className="py-3 px-3 w-48 text-center">Tanda Tangan</th></tr></thead>
                  <tbody>
                    {filteredLeaderboard.map((s, i) => (
                      <tr key={s?.id || i}>
                         <td className="py-3 px-3 text-center">{i+1}</td>
                         <td className="py-3 px-3 font-bold uppercase">{s?.studentName || s?.name || 'Anonim'}</td>
                         <td className="py-3 px-3 text-center">{s?.class}-{s?.subKelas}</td>
                         <td className="py-3 px-3"><span className="text-xs text-gray-400">{i+1}. </span></td>
                      </tr>
                    ))}
                    {[...Array(Math.max(0, 15 - filteredLeaderboard.length))].map((_, i) => (
                      <tr key={`empty-${i}`}><td className="py-4"></td><td></td><td></td><td></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="print:hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded-t-xl border border-b-0 border-slate-200 gap-3">
                  <div className="text-xs font-bold text-slate-500">
                    Total Data: <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{filteredLeaderboard.length}</span> Siswa
                  </div>
                </div>

                <div className="bg-white rounded-b-xl border border-slate-200 overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-xs min-w-[700px] whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-center w-12">No</th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Identitas Siswa</th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-center">Kelas</th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Mata Pelajaran</th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-center">Skor Akhir</th>
                        <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-center w-24">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeaderboard.map((s, i) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-4 text-center font-bold text-slate-500">{i+1}</td>
                          <td className="py-2.5 px-4">
                            <p className="font-black text-slate-800 text-sm truncate max-w-[200px]">{s?.studentName || s?.name || '-'}</p>
                            {s.isEssayGraded && <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5 inline-block">ESAI DINILAI</span>}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-slate-600">{s.class}-{s.subKelas}</td>
                          <td className="py-2.5 px-4">
                            <p className="font-bold text-slate-600">{s.mapel}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Skor Objektif: {s.objectiveScore !== undefined ? s.objectiveScore : s.score}</p>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="text-lg font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 shadow-inner">{s.score}</span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <button onClick={() => handleDeleteSingleRecap(s.id, s.studentName || s.name)} title="Hapus Data Ini" className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors active:scale-95">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredLeaderboard.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center p-8 text-slate-400 text-xs font-medium">
                            Data rekap nilai belum tersedia untuk filter ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB PROFIL */}
          {activeTab === 'profile' && (
            <div className="max-w-4xl mx-auto print:hidden space-y-6 animate-in fade-in duration-300">
              
              {/* Form Profil Nama */}
              <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-200">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-5 mb-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-50 flex items-center justify-center text-emerald-700 font-black text-3xl uppercase shadow-inner shrink-0">{teacherProfile?.name?.charAt(0) || 'G'}</div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Pengaturan Profil</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Kelola identitas resmi Anda di sistem CBT.</p>
                  </div>
                </div>
                
                <form onSubmit={handleUpdateProfile}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Nama Lengkap beserta Gelar Akademik</label>
                      <input required value={tempProfileName} onChange={(e) => setTempProfileName(e.target.value)} placeholder="Contoh: Susi Susanti, S.Pd., M.Si." className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:border-emerald-500 focus:bg-white text-sm font-bold text-slate-800 transition-colors shadow-inner" />
                      <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Nama ini otomatis digunakan sebagai tanda tangan PDF.</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Email Akun (Login)</label>
                      <input disabled value={teacherProfile?.email || currentUserEmail} className="w-full p-3 border border-slate-200 bg-slate-100 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed" />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Instansi Sekolah</label>
                      <input disabled value={schoolId?.toUpperCase() || 'BELUM TERDAFTAR'} className="w-full p-3 border border-emerald-200 bg-emerald-50 rounded-xl text-sm font-black text-emerald-700 cursor-not-allowed uppercase" />
                      <p className="text-[9px] text-slate-400 mt-1.5 font-medium">*Instansi diatur oleh Admin Sekolah.</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Tugas / Jabatan</label>
                      <input disabled value="Guru Mata Pelajaran" className="w-full p-3 border border-slate-200 bg-slate-100 rounded-xl text-sm font-bold text-slate-500 cursor-not-allowed" />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 mt-2 rounded-xl text-sm font-black shadow-md shadow-emerald-600/30 active:scale-95 transition-all tracking-widest flex justify-center items-center gap-2"><User size={18}/> SIMPAN PERUBAHAN NAMA</button>
                </form>
              </div>

              {/* Form Ubah Password (Ganti Kata Sandi Mandiri) */}
              <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-200">
                 <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0"><KeyRound size={20}/></div>
                    <div>
                       <h3 className="text-lg font-black text-slate-800 tracking-tight">Ubah Kata Sandi</h3>
                       <p className="text-xs font-bold text-slate-500">Perbarui kata sandi Anda secara berkala demi keamanan akun.</p>
                    </div>
                 </div>
                 <form onSubmit={handleUpdatePassword}>
                    <div className="mb-5">
                       <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block tracking-widest">Kata Sandi Baru</label>
                       <input type="password" required minLength="6" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Masukkan minimal 6 karakter" className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl outline-none focus:border-amber-500 focus:bg-white text-sm font-bold text-slate-800 transition-colors shadow-inner" />
                    </div>
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 py-3.5 rounded-xl text-sm font-black shadow-md shadow-amber-500/30 active:scale-95 transition-all tracking-widest flex justify-center items-center gap-2">
                       <KeyRound size={18}/> UPDATE KATA SANDI
                    </button>
                 </form>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* MODAL POP-UP QR CODE */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-[120] print:hidden">
          <div className="bg-white p-8 rounded-[2rem] w-full max-w-sm shadow-2xl flex flex-col items-center text-center transform transition-all animate-in zoom-in duration-300">
            <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition-colors"><X size={20}/></button>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">SCAN MASUK</h2>
            <p className="text-sm text-slate-500 font-bold mb-6">Arahkan kamera HP ke QR ini.</p>
            <div className="bg-white p-3 rounded-2xl border-4 border-emerald-500 shadow-xl mb-6 flex justify-center items-center">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/?token=' + activeQRToken)}`} alt="QR Code Sesi Ujian" className="w-[250px] h-[250px] object-contain" />
            </div>
            <div className="bg-slate-50 border border-slate-200 px-6 py-3 rounded-xl w-full">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ATAU KODE TOKEN</p>
              <p className="text-3xl font-black font-mono text-emerald-600 tracking-[0.2em]">{activeQRToken}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* MODAL EDIT SESI AKTIF (BOBOT & JAM UJIAN) */}
      {showEditSesiModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[140] print:hidden">
          <div className="bg-white p-6 rounded-[2rem] w-full max-w-sm shadow-2xl relative animate-in fade-in zoom-in duration-300">
            <button onClick={() => setShowEditSesiModal(false)} className="absolute top-5 right-5 p-1.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-full transition-colors"><X size={20}/></button>
            <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 mb-1"><Edit className="text-amber-500" size={20}/> Edit Sesi</h2>
            <p className="text-xs font-bold text-slate-500 mb-5 pb-3 border-b border-slate-100">
              Token: <span className="font-mono text-emerald-600 font-black">{editSesiData.token}</span>
            </p>

            <form onSubmit={handleSaveEditSesi} className="space-y-4">
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                 <label className="text-[10px] font-black text-amber-800 uppercase flex items-center gap-1.5"><Percent size={14}/> Revisi Bobot Nilai</label>
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 mb-1 block">Persen PG</label>
                        <input type="number" min="0" max="100" value={editSesiData.bobotPG} onChange={e => setEditSesiData({...editSesiData, bobotPG: e.target.value})} className="w-full p-2 border border-amber-300 rounded-lg text-sm text-center font-black text-amber-800 bg-amber-100/50 outline-none focus:border-amber-500" />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 mb-1 block">Persen Esai</label>
                        <input type="number" min="0" max="100" value={editSesiData.bobotEsai} onChange={e => setEditSesiData({...editSesiData, bobotEsai: e.target.value})} className="w-full p-2 border border-amber-300 rounded-lg text-sm text-center font-black text-amber-800 bg-amber-100/50 outline-none focus:border-amber-500" />
                    </div>
                 </div>
              </div>

              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
                 <label className="text-[10px] font-black text-blue-800 uppercase flex items-center gap-1.5"><Clock size={14}/> Revisi Jendela Waktu</label>
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 mb-1 block">Jam Buka</label>
                        <input type="time" required value={editSesiData.jamMulai} onChange={e => setEditSesiData({...editSesiData, jamMulai: e.target.value})} className="w-full p-2 border border-blue-300 rounded-lg text-sm text-center font-black text-blue-800 bg-blue-100/50 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="text-[9px] font-bold text-slate-500 mb-1 block">Jam Tutup</label>
                        <input type="time" required value={editSesiData.jamSelesai} onChange={e => setEditSesiData({...editSesiData, jamSelesai: e.target.value})} className="w-full p-2 border border-blue-300 rounded-lg text-sm text-center font-black text-blue-800 bg-blue-100/50 outline-none focus:border-blue-500" />
                    </div>
                 </div>
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 mt-1 rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 active:scale-95 transition-all tracking-widest flex justify-center items-center gap-2"><Check size={16}/> SIMPAN PERUBAHAN</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT SOAL MANUAL (V2 PROPER EDITOR) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[110] print:hidden">
          <div className="bg-white p-5 md:p-6 rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 border-b border-slate-100 pb-3 gap-3">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Edit className="text-emerald-500" size={20}/> {editSoalId ? 'Revisi Soal' : 'Ketik Soal Baru'}
              </h2>
              <button type="button" onClick={() => setPreviewMode(!previewMode)} className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 ${previewMode ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600'}`}>
                {previewMode ? <Edit size={14}/> : <Eye size={14}/>} {previewMode ? 'Kembali ke Editor' : 'Pratinjau Soal'}
              </button>
            </div>

            {previewMode ? (
              <div className="p-4 sm:p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-5">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                  <div className="mb-3">
                     <span className="text-[10px] font-black bg-slate-800 text-white px-2 py-0.5 rounded">Format: {formData.jenisSoal}</span>
                  </div>
                  {formData.gambar && <img src={formData.gambar} alt="Preview" className="mb-4 rounded-lg max-h-48 border border-slate-100" />}
                  {formData.teksWacana && (
                      <div className="mb-3 p-3 bg-slate-50 border-l-4 border-slate-400 rounded-r-lg text-xs font-medium whitespace-pre-wrap">
                         <Latex>{String(formData.teksWacana)}</Latex>
                      </div>
                  )}
                  <div className="text-base font-bold text-slate-800 whitespace-pre-wrap">
                    <Latex>{String(formData.pertanyaan || 'Ketik pertanyaan...')}</Latex>
                  </div>
                </div>
                
                {formData.jenisSoal !== 'ESAI' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['A','B','C','D'].map(opt => {
                        const isKey = formData.jenisSoal === 'PGK' ? (formData.kunci && formData.kunci.includes(opt)) : formData.kunci === opt;
                        return (
                        <div key={opt} className={`p-4 rounded-xl border-2 bg-white flex text-sm ${isKey ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100'}`}>
                        <span className={`font-black mr-2 ${isKey ? 'text-emerald-600' : 'text-slate-400'}`}>{opt}.</span>
                        <div className="flex-1 font-medium text-slate-700 whitespace-pre-wrap"><Latex>{String(formData[`opsi${opt}`] || ' ')}</Latex></div>
                        </div>
                    )})}
                    </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAddOrEditSoal} className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="md:col-span-2"><label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Jenis Soal</label>
                     <select value={formData.jenisSoal} onChange={e => setFormData({...formData, jenisSoal: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-bold outline-none focus:border-emerald-500 cursor-pointer">
                        <option value="PG">Pilihan Ganda (PG) Biasa</option>
                        <option value="PGK">Pilihan Ganda Kompleks (PGK)</option>
                        <option value="ESAI">Soal Esai</option>
                     </select>
                  </div>
                  <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Mata Pelajaran</label>
                      <select required value={formData.mapel} onChange={e => setFormData({...formData, mapel: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold bg-white">
                         <option value="">Pilih Mapel...</option>
                         {schoolSubjects.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase mb-1 block">Tingkat / Kelas</label>
                      <select required value={formData.kelas} onChange={e => setFormData({...formData, kelas: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg text-xs font-bold text-center bg-white">
                         <option value="">Pilih Kelas...</option>
                         {schoolClasses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-blue-800 uppercase flex items-center gap-1.5"><FileText size={14}/> Pengikat Wacana / Teks Panjang</label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <input value={formData.kodeWacana} onChange={e => setFormData({...formData, kodeWacana: e.target.value})} placeholder="Kode (Cth: W-01)" className="w-full p-2.5 border border-blue-200 rounded-lg text-xs font-bold bg-white" />
                        </div>
                        <div className="md:col-span-3">
                            <textarea value={formData.teksWacana} onChange={e => setFormData({...formData, teksWacana: e.target.value})} placeholder="Ketik/Paste teks wacana bacaan di sini..." className="w-full p-2.5 border border-blue-200 rounded-lg text-xs font-medium bg-white h-10 min-h-[40px]" />
                        </div>
                    </div>
                </div>

                <div className="relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Link Gambar Soal (Opsional)</label>
                  <input value={formData.gambar} placeholder="URL Gambar..." className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium" onChange={e => setFormData({...formData, gambar: e.target.value})} />
                </div>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex justify-between">
                    <span>Teks Pertanyaan Utama</span><span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black">$...$ = Math</span>
                  </label>
                  <textarea required value={formData.pertanyaan} placeholder="Ketik soal di sini..." className="w-full p-4 border border-slate-200 rounded-xl min-h-[100px] text-sm" onChange={e => setFormData({...formData, pertanyaan: e.target.value})} />
                </div>
                
                {formData.jenisSoal !== 'ESAI' && (
                    <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Opsi Jawaban & Kunci</label>
                    {formData.jenisSoal === 'PGK' ? (
                        <div className="bg-orange-50 border border-orange-200 p-2.5 rounded-lg mb-2 text-[10px] font-bold text-orange-800">
                            Mode PGK Aktif: Centang kotak di samping kiri opsi untuk menjadikannya Kunci Jawaban.
                        </div>
                    ) : null}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {['A','B','C','D'].map(opt => {
                           const isChecked = formData.jenisSoal === 'PGK' ? (formData.kunci && formData.kunci.includes(opt)) : false;
                           return (
                        <div key={opt} className="flex gap-2 items-center">
                            {formData.jenisSoal === 'PGK' && (
                                <input type="checkbox" checked={isChecked} onChange={() => handlePGKKeyToggle(opt)} className="w-5 h-5 rounded cursor-pointer accent-emerald-500" />
                            )}
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-3 font-black text-emerald-500 text-sm">{opt}.</span>
                                <input required value={formData[`opsi${opt}`]} className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl text-sm" onChange={e => setFormData({...formData, [`opsi${opt}`]: e.target.value})} />
                            </div>
                        </div>
                        )})}
                    </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-3 border-t border-slate-100">
                  {formData.jenisSoal === 'PG' ? (
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Kunci Jawaban</label>
                        <select className="w-full p-3 border border-emerald-300 bg-emerald-50 text-emerald-800 text-sm font-black rounded-xl" value={formData.kunci} onChange={e => setFormData({...formData, kunci: e.target.value})}>
                        <option value="A">Opsi A</option><option value="B">Opsi B</option><option value="C">Opsi C</option><option value="D">Opsi D</option>
                        </select>
                    </div>
                  ) : <div></div>}

                  <div className="flex gap-2 pt-4">
                    <button type="button" onClick={() => { setShowModal(false); setEditSoalId(null); setFormData(defaultForm); setPreviewMode(false); }} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-600">Batalkan</button>
                    <button type="submit" className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-sm">{editSoalId ? 'Simpan Revisi' : 'Tambahkan Soal'}</button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
