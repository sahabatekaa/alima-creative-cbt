// src/pages/student/ExamRoom.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../config/supabase'; // 100% SUPABASE
import { Timer, AlertTriangle, Book, ChevronLeft, ChevronRight, HelpCircle, Maximize, ShieldAlert, Landmark, Bell, Wifi, WifiOff, Check, LayoutGrid } from 'lucide-react';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

export default function ExamRoom({ studentData: propStudentData, onFinish }) {
  const studentData = propStudentData || JSON.parse(localStorage.getItem('studentData')) || {};
  const sid = studentData?.id || 'guest';
  const storageKey = `cbt_exam_${sid}`;

  const schoolIdRef = useRef(null); 

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [answers, setAnswers] = useState(() => JSON.parse(localStorage.getItem(`${storageKey}_ans`)) || {});
  const [ragu, setRagu] = useState(() => JSON.parse(localStorage.getItem(`${storageKey}_ragu`)) || {});
  
  const [timeLeft, setTimeLeft] = useState(() => { const t = localStorage.getItem(`${storageKey}_time`); return t ? parseInt(t) : 5400; });
  const [warnings, setWarnings] = useState(() => parseInt(localStorage.getItem(`${storageKey}_warn`)) || 0);
  const [isLocked, setIsLocked] = useState(() => localStorage.getItem(`${storageKey}_lock`) === 'true');
  
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [forceAllowFullscreen, setForceAllowFullscreen] = useState(false); 
  
  const [shouldForceSubmit, setShouldForceSubmit] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);
  
  const [lastBroadcast, setLastBroadcast] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const answersRef = useRef(answers);
  const isLockedRef = useRef(isLocked);
  const isSubmitting = useRef(false); // GEMBOK ANTI-SPAM

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { isLockedRef.current = isLocked; }, [isLocked]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ==========================================
  // TARIK NASKAH SOAL & INFO SESI
  // ==========================================
  useEffect(() => {
    if (!studentData?.token) return;

    const loadExamData = async () => {
      const { data: sessionInfo } = await supabase.from('exam_sessions').select('*').eq('token', studentData.token).single();

      if (sessionInfo) {
        schoolIdRef.current = sessionInfo.school_id;

        if (sessionInfo.jam_selesai) {
          const now = new Date();
          const [h, m] = sessionInfo.jam_selesai.split(':');
          const target = new Date();
          target.setHours(parseInt(h, 10), parseInt(m, 10), 0);
          
          const diffSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);
          const remaining = diffSeconds > 0 ? diffSeconds : 0;
          setTimeLeft(remaining);
          
          if (remaining <= 0) {
             alert("Waktu ujian telah berakhir berdasarkan Jendela Waktu Sesi!");
             submitExam();
             return;
          }
        }

        const kPG = sessionInfo.kuota_pg || 0;
        const kPGK = sessionInfo.kuota_pgk || 0;
        const kEsai = sessionInfo.kuota_esai || 0;
        const hasQuota = kPG > 0 || kPGK > 0 || kEsai > 0; 

        const { data: qData } = await supabase.from('bank_soal').select('*').eq('mapel', studentData.mapel).eq('kelas', studentData.class).eq('teacher_email', studentData.teacherEmail);

        if (qData) {
          const filtered = qData.map(q => ({
             id: q.id, jenisSoal: q.jenis_soal, kodeWacana: q.kode_wacana, teksWacana: q.teks_wacana,
             pertanyaan: q.pertanyaan, gambar: q.gambar,
             opsiA: q.opsi_a, opsiB: q.opsi_b, opsiC: q.opsi_c, opsiD: q.opsi_d,
             kunci: q.kunci, mapel: q.mapel, kelas: q.kelas, teacherEmail: q.teacher_email
          }));

          const savedOrder = localStorage.getItem(`${storageKey}_order`);

          if (savedOrder) {
            const orderIds = JSON.parse(savedOrder);
            const finalQuestions = orderIds.map(id => filtered.find(q => q.id === id)).filter(Boolean);
            setQuestions(finalQuestions);
          } else {
            const groups = {};
            filtered.forEach(q => {
              const kw = q.kodeWacana || `single_${q.id}`;
              if (!groups[kw]) groups[kw] = [];
              groups[kw].push(q);
            });

            Object.keys(groups).forEach(kw => {
              if (kw.startsWith('single_')) return;
              let groupText = '';
              groups[kw].forEach(q => { if (q.teksWacana) groupText = q.teksWacana; });
              if (groupText) { groups[kw].forEach(q => { q.teksWacana = groupText; }); }
            });

            const groupKeys = Object.keys(groups).sort(() => Math.random() - 0.5);
            let selectedGroups = [];

            if (!hasQuota) {
               selectedGroups = groupKeys.map(k => groups[k]);
            } else {
               let pulledPG = 0, pulledPGK = 0, pulledEsai = 0;
               for (let key of groupKeys) {
                  const grp = groups[key];
                  let countPG = 0, countPGK = 0, countEsai = 0;
                  
                  grp.forEach(q => {
                     const t = q.jenisSoal || 'PG';
                     if (t === 'PG') countPG++; else if (t === 'PGK') countPGK++; else if (t === 'ESAI') countEsai++;
                  });

                  if (pulledPG + countPG <= kPG && pulledPGK + countPGK <= kPGK && pulledEsai + countEsai <= kEsai) {
                     selectedGroups.push(grp);
                     pulledPG += countPG; pulledPGK += countPGK; pulledEsai += countEsai;
                  }
               }
            }

            selectedGroups.sort(() => Math.random() - 0.5);
            let finalQuestions = [];
            selectedGroups.forEach(grp => { finalQuestions = finalQuestions.concat(grp); });

            const orderIds = finalQuestions.map(q => q.id);
            localStorage.setItem(`${storageKey}_order`, JSON.stringify(orderIds));
            setQuestions(finalQuestions);
          }
        }
      }
    };
    loadExamData();
  }, [studentData, storageKey]);

  // ==========================================
  // PANTAU INSTRUKSI PENGAWAS (REALTIME)
  // ==========================================
  useEffect(() => {
    if (!sid || sid === 'guest') return;
    const processLiveData = (data) => {
      if (data.warnings === 0 && isLockedRef.current) {
        setWarnings(0); setIsLocked(false);
        localStorage.setItem(`${storageKey}_warn`, 0); localStorage.setItem(`${storageKey}_lock`, 'false');
        alert("PEMBERITAHUAN!\nPengawas telah memberikan dispensasi. Layar Anda telah dibuka.");
      }
      if (data.force_submit === true) setShouldForceSubmit(true);
      if (data.broadcast && data.broadcast !== lastBroadcast) {
        setLastBroadcast(data.broadcast);
        setShowBroadcast(true);
      }
    };

    supabase.from('live_students').select('*').eq('id', sid).single().then(({ data }) => { if (data) processLiveData(data); });
    const channel = supabase.channel(`public:live_students:id=${sid}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_students', filter: `id=eq.${sid}` }, payload => { processLiveData(payload.new); }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [sid, storageKey, lastBroadcast]);

  // ==========================================
  // SENSOR ANTI-CHEAT (V3.1)
  // ==========================================
  const triggerWarning = async (reason) => {
    if (!isFullscreen && !forceAllowFullscreen) return;
    const newWarn = warnings + 1;
    setWarnings(newWarn);
    localStorage.setItem(`${storageKey}_warn`, newWarn);
    await supabase.from('live_students').update({ warnings: newWarn, status: reason }).eq('id', sid);
    if(newWarn >= 3) { setIsLocked(true); localStorage.setItem(`${storageKey}_lock`, 'true'); } 
    alert(`PERINGATAN KECURANGAN ${newWarn}/3!\nPelanggaran: ${reason}`);
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handleVisibilityChange = () => { if(document.hidden && !isLocked && (isFullscreen || forceAllowFullscreen)) { triggerWarning("Meninggalkan Halaman/Aplikasi"); } };
    const handleBlur = () => { if(!isLocked && !document.hidden) setIsBlurred(true); };
    const handleFocus = () => { setIsBlurred(false); };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    setIsFullscreen(!!document.fullscreenElement); 

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [warnings, isLocked, isFullscreen, forceAllowFullscreen]);

  const enterFullscreen = () => { 
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(e => { setForceAllowFullscreen(true); });
    } else { setForceAllowFullscreen(true); }
  };

  useEffect(() => {
    if (timeLeft > 0 && !isLocked && questions.length > 0 && (isFullscreen || forceAllowFullscreen) && !shouldForceSubmit) { 
      const t = setTimeout(() => { setTimeLeft(timeLeft - 1); localStorage.setItem(`${storageKey}_time`, timeLeft - 1); }, 1000); 
      return () => clearTimeout(t); 
    } 
    else if ((timeLeft <= 0 || shouldForceSubmit) && questions.length > 0) submitExam();
  }, [timeLeft, isLocked, questions, isFullscreen, forceAllowFullscreen, shouldForceSubmit, storageKey]);

  // ==========================================
  // JAWAB & SUBMIT UJIAN
  // ==========================================
  const updateAnswer = async (qId, value) => {
    const newAns = { ...answers, [qId]: value }; 
    setAnswers(newAns); 
    localStorage.setItem(`${storageKey}_ans`, JSON.stringify(newAns));
    
    if (isOnline && sid && sid !== 'guest') {
      try {
        const prog = Math.round((Object.keys(newAns).length / questions.length) * 100);
        await supabase.from('live_students').update({ progress: prog }).eq('id', sid);
      } catch (err) { console.error("Gagal sinkronisasi progress:", err); }
    }
  };

  const handleSelectPG = (qId, opt) => updateAnswer(qId, opt);
  const handleSelectPGK = (qId, opt) => {
    const currentAns = answers[qId] ? answers[qId].split(',') : [];
    let newAnsArray = currentAns.includes(opt) ? currentAns.filter(item => item !== opt) : [...currentAns, opt];
    updateAnswer(qId, newAnsArray.sort().join(','));
  };
  const handleEsaiChange = (qId, text) => updateAnswer(qId, text);
  const toggleRagu = (qId) => {
    const newRagu = { ...ragu, [qId]: !ragu[qId] };
    setRagu(newRagu); localStorage.setItem(`${storageKey}_ragu`, JSON.stringify(newRagu));
  };

  const submitExam = async () => {
    if (isSubmitting.current) return; 
    isSubmitting.current = true;

    if (!isOnline) {
      alert("🚨 KONEKSI TERPUTUS!\nSistem tidak dapat mengumpulkan jawaban karena offline. Jawaban Anda aman tersimpan di perangkat.");
      isSubmitting.current = false; return;
    }
    if (!schoolIdRef.current) {
      alert("⚠️ Gagal menyimpan data sesi! Mohon refresh halaman dan coba kumpulkan lagi.");
      isSubmitting.current = false; return;
    }

    const finalAnswers = answersRef.current;
    let earnedPoints = 0; let totalObjective = 0;

    questions.forEach(q => {
        const type = q.jenisSoal || 'PG';
        if (type === 'ESAI') return; 
        totalObjective++;
        const studentAns = finalAnswers[q.id] || '';
        if (type === 'PG') {
            if (studentAns === q.kunci) earnedPoints++;
        } else if (type === 'PGK') {
            const keys = q.kunci ? q.kunci.split(',') : [];
            const ans = studentAns ? studentAns.split(',') : [];
            if (keys.length === 0) return;
            let correctCount = 0; let wrongCount = 0;
            ans.forEach(a => { if (keys.includes(a)) correctCount++; else wrongCount++; });
            let point = (correctCount / keys.length) - (wrongCount / keys.length);
            if (point < 0) point = 0;
            earnedPoints += point;
        }
    });

    const finalScore = totalObjective > 0 ? Math.round((earnedPoints / totalObjective) * 100) : 0;
    
    try {
      await supabase.from('leaderboard').insert([{
         school_id: schoolIdRef.current, student_name: studentData.name, token: studentData.token, mapel: studentData.mapel,
         kelas: studentData.class, sub_kelas: studentData.subKelas, teacher_email: studentData.teacherEmail,
         score: finalScore, objective_score: finalScore, essay_scores: {}, is_essay_graded: false, answers: finalAnswers
      }]);
      await supabase.from('live_students').update({ status: 'Selesai' }).eq('id', sid);
      
      localStorage.removeItem(`${storageKey}_ans`); localStorage.removeItem(`${storageKey}_ragu`);
      localStorage.removeItem(`${storageKey}_time`); localStorage.removeItem(`${storageKey}_warn`);
      localStorage.removeItem(`${storageKey}_lock`); localStorage.removeItem(`${storageKey}_order`); 
      
      if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
      if(onFinish) onFinish(finalScore);
    } catch (error) {
      alert("Gagal mengumpulkan ujian. Pastikan koneksi stabil dan coba lagi.");
      isSubmitting.current = false; 
    }
  };

  // ==========================================
  // RENDER TAMPILAN (REVISI UI KOMPAK & SIDEBAR)
  // ==========================================
  if (isLocked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 p-6 text-center select-none relative overflow-hidden">
        <div className="absolute inset-0 bg-red-900/20 animate-pulse"></div>
        <ShieldAlert size={100} className="text-red-500 mb-6 animate-bounce relative z-10" />
        <h1 className="text-4xl font-black text-white tracking-widest relative z-10 mb-2">UJIAN DIBLOKIR!</h1>
        <p className="mt-2 text-red-400 font-bold text-xl relative z-10 max-w-lg">Anda telah melanggar aturan keamanan (Keluar Aplikasi) sebanyak 3 kali.</p>
        <div className="mt-8 bg-white/10 p-6 rounded-2xl border border-white/20 backdrop-blur-sm relative z-10 max-w-md">
           <p className="text-white font-medium">Silakan membawa perangkat Anda dan menghadap ke Pengawas Ruangan untuk membuka kunci layar.</p>
        </div>
      </div>
    );
  }

  if (!isFullscreen && !forceAllowFullscreen && questions.length > 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center select-none relative">
        <Landmark size={80} className="mb-6 text-emerald-500 opacity-20 absolute top-10" />
        <Maximize size={80} className="mb-6 text-emerald-400 animate-pulse relative z-10" />
        <h1 className="text-3xl font-black mb-4 tracking-wider relative z-10">Sistem Keamanan Aktif</h1>
        <p className="text-slate-400 mb-10 max-w-md text-lg relative z-10">Harap gunakan layar penuh untuk memulai. Jika Anda menggunakan Exambro, klik tombol di bawah untuk melanjutkan.</p>
        <button onClick={enterFullscreen} className="bg-emerald-600 hover:bg-emerald-500 px-10 py-5 rounded-2xl font-black text-xl active:scale-95 transition-all shadow-[0_0_20px_rgba(5,150,105,0.4)] relative z-10 tracking-widest">MASUK UJIAN SEKARANG</button>
      </div>
    );
  }

  if (questions.length === 0) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-400 font-bold">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      Menyiapkan Naskah Soal & Mengacak...
    </div>
  );

  const q = questions[currentIndex];
  const qType = q.jenisSoal || 'PG';

  return (
    <div 
      translate="no"
      onCopy={(e) => { e.preventDefault(); alert("Tindakan disalin telah diblokir!"); }} 
      onPaste={(e) => e.preventDefault()} 
      onContextMenu={(e) => e.preventDefault()} 
      className="notranslate min-h-screen bg-[#f1f5f9] font-sans pb-10 select-none relative overflow-x-hidden"
    >
      {/* Watermark Anti-Foto */}
      <div className="pointer-events-none fixed inset-0 z-0 flex flex-col items-center justify-center opacity-[0.03] rotate-[-30deg] text-black font-black text-2xl whitespace-nowrap overflow-hidden">
        {Array(15).fill(`${studentData?.name} - ${studentData?.class} `).map((text, i) => (
          <div key={i} className="mb-8">{text.repeat(8)}</div>
        ))}
      </div>

      <div className={`relative z-10 transition-all duration-300 min-h-screen flex flex-col ${isBlurred ? 'blur-2xl grayscale brightness-50' : ''}`}>
        
        {/* HEADER KOMPAK */}
        <header className="sticky top-0 z-40 bg-white w-full shadow-sm border-b-[3px] border-emerald-500">
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 hidden sm:flex"><Book size={18}/></div>
              <div>
                <h1 className="font-black text-sm sm:text-base tracking-widest text-slate-800 leading-tight">YASPENDIK PTPN IV</h1>
                <h2 className="font-bold text-[9px] sm:text-[10px] tracking-widest text-slate-500 uppercase">SMP/MTS DARMA PERTIWI</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block border-r border-slate-200 pr-4 mr-1">
                <p className="font-black text-sm text-slate-800 truncate max-w-[200px]">{studentData?.name}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{studentData?.mapel} • Kls {studentData?.class}</p>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-800 font-mono font-black text-base">
                  <Timer size={16} className="text-emerald-500" />
                  {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}
                </div>
                {isOnline ? (
                   <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5"><Wifi size={10} /> ONLINE</span>
                ) : (
                   <span className="text-[9px] font-bold text-red-500 flex items-center gap-1 mt-0.5 animate-pulse"><WifiOff size={10} /> OFFLINE</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {!isOnline && (
          <div className="bg-red-50 border-b border-red-200 p-1.5 text-center text-red-600 text-[11px] font-bold shadow-inner z-30 relative">
              ⚠️ KONEKSI TERPUTUS! Anda masih bisa menjawab. Jawaban tersimpan di perangkat.
          </div>
        )}

        {/* LAYOUT UTAMA GRID (KIRI: SOAL, KANAN: NAVIGASI) */}
        <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 mt-1 items-start">
          
          {/* KOLOM KIRI (AREA SOAL) - 75% Lebar */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Card Pertanyaan */}
            <div className="bg-white p-5 sm:p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${qType === 'PG' ? 'bg-blue-500' : qType === 'PGK' ? 'bg-orange-500' : 'bg-purple-500'}`}></div>
              
              <div className="flex flex-wrap justify-between items-center mb-5 gap-2 border-b border-slate-100 pb-3">
                 <span className="text-[11px] font-black bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 tracking-wider">
                    SOAL NO. {currentIndex+1} / {questions.length}
                 </span>
                 
                 {qType === 'PG' && <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 tracking-wider">PILIHAN GANDA</span>}
                 {qType === 'PGK' && <span className="text-[10px] font-black bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-200 tracking-wider flex items-center gap-1.5"><Check size={12}/> PILIHAN GANDA KOMPLEKS</span>}
                 {qType === 'ESAI' && <span className="text-[10px] font-black bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 tracking-wider">SOAL URAIAN (ESAI)</span>}
              </div>

              {/* Wacana Teks Panjang */}
              {q.teksWacana && (
                <div className="mb-5 p-4 sm:p-5 bg-slate-50 border-l-[3px] border-slate-400 rounded-r-xl text-sm sm:text-base font-medium text-slate-700 whitespace-pre-wrap">
                   <Latex>{String(q.teksWacana)}</Latex>
                </div>
              )}
              
              {/* Gambar Soal */}
              {q.gambar && (
                <div className="mb-5 flex justify-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <img src={q.gambar} alt="Gambar Soal Ujian" className="max-w-full max-h-72 object-contain rounded-lg" />
                </div>
              )}
              
              {/* Teks Pertanyaan Utama */}
              <div className="text-base sm:text-lg font-semibold mb-6 text-slate-800 leading-relaxed whitespace-pre-wrap">
                <Latex>{String(q.pertanyaan || ' ')}</Latex>
              </div>
              
              {/* Opsi Pilihan Ganda (Lebih Kompak) */}
              {qType === 'PG' && (
                  <div className="space-y-2.5">
                  {['A','B','C','D'].map(opt => (
                      <button key={opt} onClick={() => handleSelectPG(q.id, opt)} className={`w-full text-left p-3 sm:p-4 rounded-xl border-[1.5px] transition-all flex items-start gap-3 break-words ${answers[q.id]===opt ? 'bg-blue-50 border-blue-500 shadow-sm text-blue-900 font-bold':'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                      <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm shrink-0 transition-colors ${answers[q.id]===opt?'bg-blue-500 text-white':'bg-slate-100 text-slate-500 border border-slate-200'}`}>{opt}</span>
                      <div className="flex-1 text-sm sm:text-base pt-1 whitespace-pre-wrap"><Latex>{String(q[`opsi${opt}`] || ' ')}</Latex></div>
                      </button>
                  ))}
                  </div>
              )}

              {/* Opsi Pilihan Ganda Kompleks */}
              {qType === 'PGK' && (
                  <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-orange-600 mb-2">* Centang semua pilihan yang benar (Bisa lebih dari 1).</p>
                  {['A','B','C','D'].map(opt => {
                      const isSelected = answers[q.id] && answers[q.id].split(',').includes(opt);
                      return (
                      <button key={opt} onClick={() => handleSelectPGK(q.id, opt)} className={`w-full text-left p-3 sm:p-4 rounded-xl border-[1.5px] transition-all flex items-start gap-3 break-words ${isSelected ? 'bg-orange-50 border-orange-500 shadow-sm text-orange-900 font-bold':'bg-white border-slate-200 hover:border-orange-300 hover:bg-slate-50'}`}>
                      <div className={`w-7 h-7 flex flex-shrink-0 items-center justify-center rounded-lg border-[1.5px] mt-0.5 transition-colors ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'bg-slate-100 border-slate-300'}`}>
                          {isSelected && <Check size={16} strokeWidth={4} />}
                      </div>
                      <div className="flex-1 text-sm sm:text-base pt-0.5 whitespace-pre-wrap">
                          <span className="font-black mr-2 opacity-50">{opt}.</span>
                          <Latex>{String(q[`opsi${opt}`] || ' ')}</Latex>
                      </div>
                      </button>
                  )})}
                  </div>
              )}

              {/* Input Uraian / Esai */}
              {qType === 'ESAI' && (
                  <div className="space-y-2">
                      <p className="text-[11px] font-bold text-purple-600 mb-2">* Ketik uraian jawaban Anda di bawah ini.</p>
                      <textarea 
                          value={answers[q.id] || ''} 
                          onChange={(e) => handleEsaiChange(q.id, e.target.value)}
                          placeholder="Ketik jawaban Anda di sini..."
                          className="w-full min-h-[160px] p-4 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none text-sm sm:text-base text-slate-800 transition-all bg-slate-50 focus:bg-white resize-y"
                      />
                  </div>
              )}
            </div>

            {/* Tombol Aksi Bawah Soal */}
            <div className="flex flex-wrap gap-3">
              <button disabled={currentIndex===0} onClick={() => setCurrentIndex(currentIndex-1)} className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-black disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all hover:bg-slate-50 text-xs sm:text-sm"><ChevronLeft size={18}/> <span className="hidden sm:inline tracking-wider">SEBELUMNYA</span></button>
              <button onClick={() => toggleRagu(q.id)} className={`flex-1 py-3 px-4 rounded-xl font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-xs sm:text-sm ${ragu[q.id] ? 'bg-amber-400 text-white border border-amber-500' : 'bg-white border border-slate-200 text-amber-500 hover:bg-amber-50'}`}><HelpCircle size={18}/> <span className="tracking-wider">RAGU-RAGU</span></button>
              <button disabled={currentIndex===questions.length-1} onClick={() => setCurrentIndex(currentIndex+1)} className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-xl font-black disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all hover:bg-emerald-500 text-xs sm:text-sm"><span className="hidden sm:inline tracking-wider">SELANJUTNYA</span> <ChevronRight size={18}/></button>
            </div>

          </div>

          {/* KOLOM KANAN (SIDEBAR NAVIGASI) - 25% Lebar, Sticky */}
          <div className="lg:col-span-1 flex flex-col gap-4 lg:sticky lg:top-20 pb-10">
            
            {/* Box Identitas HP (Hanya Muncul di Mobile) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 md:hidden flex justify-between items-center">
              <div>
                 <p className="font-black text-sm text-slate-800">{studentData?.name}</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase">{studentData?.mapel}</p>
              </div>
              <div className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200 uppercase">Kls {studentData?.class}-{studentData?.subKelas}</div>
            </div>

            {/* Kotak Navigasi Soal */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-black text-sm text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide border-b border-slate-100 pb-3"><LayoutGrid size={16} className="text-emerald-500"/> Navigasi Soal</h3>
              
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-5 gap-2 max-h-[300px] lg:max-h-[45vh] overflow-y-auto pr-1 pb-1 custom-scrollbar">
                {questions.map((quest, idx) => {
                  let btnClass = 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100';
                  
                  if (ragu[quest.id]) {
                      btnClass = 'bg-amber-400 border-amber-500 text-white';
                  } else if (answers[quest.id] && answers[quest.id].trim() !== '') {
                      btnClass = 'bg-slate-800 border-slate-900 text-white';
                  }
                  
                  if (currentIndex === idx) btnClass += ' ring-[3px] ring-emerald-400/50 scale-105 z-10';
                  
                  return (<button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-10 w-full rounded-lg flex items-center justify-center text-sm font-black border transition-all ${btnClass}`}>{idx + 1}</button>);
                })}
              </div>

              {/* Keterangan Warna */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[9px] font-bold text-slate-500">
                 <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-800"></div> Sudah Dijawab</div>
                 <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-400"></div> Ragu-ragu</div>
                 <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-slate-50 border border-slate-200"></div> Belum Dijawab</div>
                 <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-emerald-400"></div> Posisi Saat Ini</div>
              </div>
            </div>

            {/* Kotak Submit Ujian */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200">
               {timeLeft <= 600 ? (
                 <div>
                   <p className="text-[10px] font-bold text-red-500 mb-2 text-center uppercase animate-pulse">Waktu &lt; 10 Menit!</p>
                   <button onClick={() => { if(window.confirm("Peringatan!\nAnda yakin ingin mengakhiri ujian dan mengumpulkan jawaban secara permanen?")) submitExam() }} className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all tracking-wider text-xs sm:text-sm animate-in zoom-in duration-300"><ShieldAlert size={18}/> KUMPULKAN</button>
                 </div>
               ) : (
                 <div className="w-full p-4 bg-slate-50 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl flex flex-col items-center justify-center gap-1.5 text-center select-none">
                    <ShieldAlert size={20} className="opacity-50" />
                    <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Tombol Kumpul Dikunci</span>
                    <span className="text-[9px] font-bold text-slate-400">Terbuka di 10 Menit Terakhir</span>
                 </div>
               )}
            </div>

          </div>
        </main>
      </div>

      {showBroadcast && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl border-4 border-blue-500 transform transition-all animate-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 border border-blue-200">
                <Bell size={32} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">PENGUMUMAN!</h3>
                <p className="text-sm font-bold text-blue-600 tracking-widest uppercase mt-1">Pesan dari Pengawas</p>
              </div>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8 shadow-inner">
              <p className="text-slate-800 font-bold text-lg leading-relaxed text-center">"{lastBroadcast}"</p>
            </div>
            <button onClick={() => setShowBroadcast(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl font-black active:scale-95 transition-all shadow-lg shadow-blue-600/30 tracking-widest text-lg">SAYA MENGERTI</button>
          </div>
        </div>
      )}

      {isBlurred && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md pointer-events-none transition-all">
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-pulse border-4 border-red-500 text-center max-w-sm mx-4">
            <ShieldAlert size={60} className="text-red-600"/> 
            <div>
              <h2 className="font-black text-2xl text-red-600 mb-1">FOKUS HILANG!</h2>
              <p className="font-bold text-slate-700">Layar diblur untuk mencegah kecurangan. Segera kembali ke layar penuh.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}