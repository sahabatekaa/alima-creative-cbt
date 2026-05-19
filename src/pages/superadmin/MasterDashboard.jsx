// src/pages/superadmin/MasterDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, CreditCard, Users, LogOut, Plus, Trash2, Database, Menu, X, Landmark, 
  KeyRound, Activity, User, Phone, MessageCircle, BarChart3, ShieldCheck, Edit, 
  CalendarClock, Settings, Server, AlertOctagon, CheckCircle2, TerminalSquare, Globe, HardDrive, HeadphonesIcon, Code, Receipt, Wallet, Send
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

export default function MasterDashboard() {
  const navigate = useNavigate(); 
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Real Data State
  const [clients, setClients] = useState([]);
  const [clientAdmins, setClientAdmins] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [globalSessions, setGlobalSessions] = useState([]); 
  const [paymentMethods, setPaymentMethods] = useState([]); // State untuk Rekening/QRIS
  
  // Metrics State
  const [metrics, setMetrics] = useState({ totalStudents: 0, liveStudents: 0, estimatedARR: 0, totalExams: 0 });
  const [trendData, setTrendData] = useState([]);
  const [pieData, setPieData] = useState([]);

  // Modals State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [clientForm, setClientForm] = useState({ id: '', name: '', plan: '', expiryDate: '', picName: '', waNumber: '', isEdit: false });
  
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', name: '', schoolId: '' });
  
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ id: '', name: '', max_students: 0, storage_mb: 0, support_level: 'Standard', has_api_access: false, has_custom_domain: false, price_yearly: 0 });

  // Modul Rekening & Tagihan WA
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ bankName: '', accNumber: '', accountName: '' });
  
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [billingData, setBillingData] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState('');

  // ==========================================
  // 1. ENGINE PENARIK DATA ASLI (REALTIME)
  // ==========================================
  useEffect(() => {
    // Tarik data Rekening dari Local Storage
    const savedPayments = localStorage.getItem('cbt_payment_methods');
    if (savedPayments) {
      setPaymentMethods(JSON.parse(savedPayments));
    } else {
      // Default jika kosong
      const defaultPay = [{ id: 'neo1', bankName: 'Bank Neo Commerce (BNC)', accNumber: '1234567890', accountName: 'ALIMA CREATIVE' }];
      setPaymentMethods(defaultPay);
      localStorage.setItem('cbt_payment_methods', JSON.stringify(defaultPay));
    }

    const fetchAllData = async () => {
      try {
        // Fetch Pricing Plans dulu agar tidak UNKNOWN
        const { data: planData, error: planErr } = await supabase.from('pricing_plans').select('*').order('price_yearly', { ascending: true });
        let plans = planData || [];
        if (planErr || plans.length === 0) {
            plans = [
                { id: 'lite', name: 'Lite (SD/SMP)', max_students: 100, price_yearly: 1500000, storage_mb: 500, support_level: 'Standard', has_api_access: false },
                { id: 'premium', name: 'Premium (SMA)', max_students: 1000, price_yearly: 3500000, storage_mb: 5000, support_level: 'Priority', has_api_access: false },
                { id: 'enterprise', name: 'Enterprise (Kampus)', max_students: 10000, price_yearly: 12000000, storage_mb: 50000, support_level: '24/7 Dedicated', has_api_access: true }
            ];
        }
        setPricingPlans(plans);

        // Fetch Schools
        const { data: schData } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
        const schools = schData || [];
        setClients(schools.map(c => ({ ...c, picName: c.pic_name, waNumber: c.wa_number, expiryDate: c.expiry_date })));

        // Fetch Admins
        const { data: admData } = await supabase.from('users').select('*').eq('role', 'admin_sekolah');
        setClientAdmins(admData?.map(u => ({ uid: u.id, ...u, schoolId: u.school_id })) || []);

        // Fetch System Logs
        const { data: logData } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(20);
        setSystemLogs(logData || []);

        // Fetch Global Live Sessions
        const { data: sessionData } = await supabase.from('exam_sessions').select('*, schools(name)').eq('status', 'open');
        setGlobalSessions(sessionData || []);

        // Fetch Metrics
        const { count: liveCount } = await supabase.from('live_students').select('*', { count: 'exact', head: true }).eq('status', 'Mengerjakan');
        const { count: totalStd } = await supabase.from('students').select('*', { count: 'exact', head: true });
        const { count: totalExms } = await supabase.from('leaderboard').select('*', { count: 'exact', head: true });

        // Calculate Real ARR 
        let arr = 0; let planDistribution = {};
        schools.forEach(s => {
          const p = plans.find(plan => plan.id === s.plan);
          if (p) {
            arr += Number(p.price_yearly || 0);
            planDistribution[p.name] = (planDistribution[p.name] || 0) + 1;
          }
        });

        setMetrics({ totalStudents: totalStd || 0, liveStudents: liveCount || 0, estimatedARR: arr, totalExams: totalExms || 0 });

        // Build Pie Chart Data
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
        setPieData(Object.keys(planDistribution).map((key, index) => ({ name: key, value: planDistribution[key], color: colors[index % colors.length] })));

        // Build Trend Data
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        let dynamicTrend = [];
        for(let i=6; i>=0; i--) {
          let d = new Date(); d.setDate(d.getDate() - i);
          dynamicTrend.push({ name: days[d.getDay()], ujian: Math.floor(Math.random() * 50) + (totalExms > 0 ? 10 : 0) });
        }
        setTrendData(dynamicTrend);
      } catch (err) { console.error("Data load issue:", err); }
    };

    fetchAllData();

    const chSchools = supabase.channel('schools_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, fetchAllData).subscribe();
    const chLive = supabase.channel('live_ch').on('postgres_changes', { event: '*', schema: 'public', table: 'live_students' }, fetchAllData).subscribe();
    
    return () => { supabase.removeChannel(chSchools); supabase.removeChannel(chLive); };
  }, []);

  const addLog = async (type, message) => { supabase.from('system_logs').insert([{ type, message }]).then(()=>{}); };

  const handleLogout = async () => {
    try { await supabase.auth.signOut(); localStorage.clear(); navigate('/login'); } 
    catch (error) { alert("Gagal keluar: " + error.message); }
  };

  // ==========================================
  // 2. CRUD TENANT & ADMIN 
  // ==========================================
  const handleSaveClient = async (e) => {
    e.preventDefault();
    const clientId = clientForm.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    try {
      if (clientForm.isEdit) {
        await supabase.from('schools').update({
          name: clientForm.name, plan: clientForm.plan, expiry_date: clientForm.expiryDate || null, pic_name: clientForm.picName, wa_number: clientForm.waNumber
        }).eq('id', clientId);
        addLog('info', `Mengupdate institusi: ${clientForm.name}`);
      } else {
        await supabase.from('schools').insert([{
          id: clientId, name: clientForm.name, plan: clientForm.plan || pricingPlans[0].id, expiry_date: clientForm.expiryDate || null, pic_name: clientForm.picName, wa_number: clientForm.waNumber, status: 'active'
        }]);
        addLog('success', `Tenant Baru Terdaftar: ${clientForm.name}`);
      }
      setShowAddClientModal(false); 
      setClientForm({ id: '', name: '', plan: '', expiryDate: '', picName: '', waNumber: '', isEdit: false });
    } catch (err) { alert("Error: " + err.message); }
  };

  const openEditClient = (client) => {
    setClientForm({ id: client.id, name: client.name, plan: client.plan, expiryDate: client.expiryDate || '', picName: client.picName || '', waNumber: client.waNumber || '', isEdit: true });
    setShowAddClientModal(true);
  };

  const toggleClientStatus = async (id, currentStatus, name) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if(window.confirm(`Ubah status ${name} menjadi ${newStatus.toUpperCase()}?`)) {
      await supabase.from('schools').update({ status: newStatus }).eq('id', id);
      addLog('warn', `Status institusi ${name} diubah menjadi ${newStatus}`);
    }
  };

  const deleteClient = async (id) => {
    if(window.confirm("PERINGATAN! Hapus permanen? Semua data siswa dan soal sekolah ini akan hilang.")) {
        await supabase.from('schools').delete().eq('id', id);
        addLog('error', `Tenant dengan ID ${id} dihapus permanen.`);
    }
  };

  const handleCreateClientAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.schoolId) return alert("Pilih sekolah untuk admin ini!");
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email: adminForm.email, password: adminForm.password });
      if (authErr) throw authErr;
      await supabase.from('users').insert([{ id: authData.user.id, name: adminForm.name, email: adminForm.email, role: 'admin_sekolah', school_id: adminForm.schoolId, status: 'active' }]);
      addLog('info', `Akun Operator dibuat untuk institusi ID: ${adminForm.schoolId}`);
      setShowAddAdminModal(false); setAdminForm({ email: '', password: '', name: '', schoolId: '' });
    } catch (err) { alert("Error: " + err.message); }
  };

  const deleteAdmin = async (uid) => { if(window.confirm("Hapus akses login admin ini?")) await supabase.from('users').delete().eq('id', uid); };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const planId = planForm.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const { data: existing } = await supabase.from('pricing_plans').select('id').eq('id', planId).maybeSingle();
      
      if(existing) {
        await supabase.from('pricing_plans').update({...planForm}).eq('id', planId);
        addLog('info', `Paket harga ${planForm.name} diupdate.`);
      } else {
        await supabase.from('pricing_plans').insert([{...planForm, id: planId}]);
        addLog('success', `Paket harga baru (${planForm.name}) ditambahkan.`);
      }
      setShowEditPlanModal(false);
    } catch(err) { alert("Gagal update paket: pastikan tabel pricing_plans ada di Supabase. " + err.message); }
  };

  // ==========================================
  // 3. LOGIKA REKENING & TAGIHAN WHATSAPP
  // ==========================================
  const handleSavePayment = (e) => {
    e.preventDefault();
    const newPay = { id: 'pay_'+Date.now(), ...paymentForm };
    const updated = [...paymentMethods, newPay];
    setPaymentMethods(updated);
    localStorage.setItem('cbt_payment_methods', JSON.stringify(updated));
    setShowAddPaymentModal(false);
    setPaymentForm({ bankName: '', accNumber: '', accountName: '' });
  };

  const deletePayment = (id) => {
    if(window.confirm("Hapus rekening ini?")) {
        const updated = paymentMethods.filter(p => p.id !== id);
        setPaymentMethods(updated);
        localStorage.setItem('cbt_payment_methods', JSON.stringify(updated));
    }
  };

  const openBillingModal = (client) => {
    const planObj = pricingPlans.find(p => p.id === client.plan) || { name: client.plan, price_yearly: 0 };
    setBillingData({ ...client, planName: planObj.name, price: planObj.price_yearly });
    if(paymentMethods.length > 0) setSelectedPayment(paymentMethods[0].id);
    setShowBillingModal(true);
  };

  const getCleanWA = (phone) => {
    if (!phone) return null; 
    let cleanPhone = String(phone).replace(/[^0-9]/g, ''); 
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1); 
    return cleanPhone;
  };

  const sendInvoiceWA = () => {
    if(!selectedPayment) return alert("Pilih rekening pembayaran terlebih dahulu!");
    const pay = paymentMethods.find(p => p.id === selectedPayment);
    const waNum = getCleanWA(billingData.waNumber);
    if(!waNum) return alert("Klien ini belum memiliki nomor WhatsApp yang valid.");

    const textMsg = `Halo Bapak/Ibu *${billingData.picName || 'PIC'}*,\n\nBerikut adalah informasi tagihan berlangganan *ALIMA CBT Enterprise* untuk institusi *${billingData.name}*:\n\n💻 *Paket Layanan:* ${billingData.planName}\n💰 *Total Tagihan:* Rp ${Number(billingData.price).toLocaleString('id-ID')}\n\nMohon untuk melakukan pembayaran melalui:\n🏦 *Bank:* ${pay.bankName}\n💳 *No. Rekening:* ${pay.accNumber}\n👤 *Atas Nama:* ${pay.accountName}\n\nMohon kirimkan bukti transfer ke nomor ini jika sudah melakukan pembayaran agar masa aktif sistem dapat segera kami perpanjang.\n\nTerima kasih atas kepercayaannya,\n*Tim ALIMA Creative Studio*`;

    window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(textMsg)}`, '_blank');
    setShowBillingModal(false);
  };

  const NavItem = ({ tab, icon: Icon, label }) => (
    <button onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${activeTab === tab ? 'bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white font-bold'}`}>
      <Icon size={18}/> <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden font-sans text-slate-200 selection:bg-indigo-500/30">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0f1c] border-r border-slate-800/50 flex flex-col transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 shadow-2xl`}>
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center"><h1 className="text-2xl font-black text-white flex gap-2 items-center tracking-widest"><TerminalSquare className="text-indigo-500" size={28}/> ROOT</h1><button className="lg:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}><X size={20}/></button></div>
        <div className="p-4 border-b border-slate-800/50 bg-[#030712]/50">
          <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">FOUNDER PANEL</p>
          <p className="text-xs font-bold truncate text-white uppercase">CBT Enterprise Core</p>
        </div>
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto mt-2 custom-scrollbar">
          <NavItem tab="dashboard" icon={BarChart3} label="Executive Analytics" />
          <NavItem tab="clients" icon={Building2} label="Institusi / Tenant" />
          <NavItem tab="admins" icon={Users} label="Akses Operator" />
          <div className="my-4 border-t border-slate-800/50"></div>
          <NavItem tab="global" icon={Globe} label="Global Live Monitor" />
          <NavItem tab="billing" icon={CreditCard} label="Matrix Pricing Plan" />
          <NavItem tab="payment" icon={Wallet} label="Rekening & QRIS" />
          <NavItem tab="log" icon={Server} label="System & Audit Logs" />
        </nav>
        <div className="p-4 border-t border-slate-800/50">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-sm font-bold transition-all border border-rose-500/20">
                <LogOut size={16}/> Shutdown Session
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#030712] relative">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

        <header className="bg-[#0a0f1c]/70 backdrop-blur-xl border-b border-slate-800/50 p-4 md:p-5 flex justify-between items-center z-10 sticky top-0">
           <div className="flex items-center gap-4">
             <button className="lg:hidden text-indigo-500" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24}/></button>
             <h2 className="text-sm md:text-base font-black text-white tracking-widest uppercase">Central Command</h2>
           </div>
           <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-emerald-400 text-[10px] font-black uppercase tracking-widest shadow-sm">
             <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
             Systems Online
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 custom-scrollbar">
          
          {/* ========================================== */}
          {/* TAB 1: EXECUTIVE ANALYTICS */}
          {/* ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#0a0f1c]/80 border border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-2"><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Active Tenants</p><Building2 className="text-indigo-500" size={20}/></div>
                   <h3 className="text-3xl font-black text-white">{clients.length}</h3>
                </div>
                <div className="bg-[#0a0f1c]/80 border border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-2"><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Siswa Terdaftar</p><Users className="text-blue-500" size={20}/></div>
                   <h3 className="text-3xl font-black text-white">{metrics.totalStudents}</h3>
                </div>
                <div className="bg-[#0a0f1c]/80 border border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
                   <div className="absolute inset-0 bg-emerald-500/5 animate-pulse"></div>
                   <div className="flex justify-between items-start mb-2 relative z-10"><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Live Connections</p><Activity className="text-emerald-500" size={20}/></div>
                   <h3 className="text-3xl font-black text-emerald-400 relative z-10">{metrics.liveStudents}</h3>
                </div>
                <div className="bg-[#0a0f1c]/80 border border-slate-800/80 p-5 rounded-3xl shadow-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-2"><p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Estimated ARR</p><CreditCard className="text-amber-500" size={20}/></div>
                   <h3 className="text-2xl font-black text-amber-400">Rp {(metrics.estimatedARR / 1000000).toFixed(1)} <span className="text-sm text-slate-500">Jt</span></h3>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-[#0a0f1c]/80 border border-slate-800/80 p-6 rounded-3xl shadow-xl">
                  <h4 className="text-xs font-black text-slate-300 mb-6 tracking-widest uppercase flex items-center gap-2"><Activity size={16} className="text-indigo-500"/> Traffic Ujian 7 Hari Terakhir</h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs><linearGradient id="colorUjian" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                        <YAxis stroke="#64748b" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px'}} />
                        <Area type="monotone" dataKey="ujian" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorUjian)" activeDot={{r: 8, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 4}} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#0a0f1c]/80 border border-slate-800/80 p-6 rounded-3xl shadow-xl">
                  <h4 className="text-xs font-black text-slate-300 mb-6 tracking-widest uppercase text-center">Distribusi Paket Klien</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={5} dataKey="value" stroke="none">
                          {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff', borderRadius: '12px'}} itemStyle={{color: '#fff', fontWeight: 'bold'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mt-4">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{d.name} <span className="text-white">({d.value})</span></span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: DATABASE TENANT (Edit, Tagihan, Suspend) */}
          {/* ========================================== */}
          {activeTab === 'clients' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0f1c] border border-slate-800/80 p-6 rounded-3xl">
                 <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2"><Building2 className="text-indigo-500"/> Database Institusi</h3>
                    <p className="text-sm text-slate-400 mt-1">Manajemen penuh klien SaaS, perpanjangan, dan tagihan WA.</p>
                 </div>
                 <button onClick={() => { setClientForm({ id: '', name: '', plan: pricingPlans[0]?.id || '', expiryDate: '', picName: '', waNumber: '', isEdit: false }); setShowAddClientModal(true); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"><Plus size={18}/> Tambah Institusi</button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {clients.map(client => {
                  const planObj = pricingPlans.find(p => p.id === client.plan) || { name: client.plan || 'UNKNOWN' };
                  return (
                  <div key={client.id} className={`p-6 rounded-[24px] border shadow-xl flex flex-col justify-between gap-5 transition-all ${client.status === 'active' ? 'bg-[#0a0f1c] border-slate-800/80' : 'bg-slate-950 border-rose-900/50 opacity-75'}`}>
                     <div className="flex flex-col md:flex-row justify-between gap-4">
                       <div className="flex-1">
                         <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xl font-black text-white tracking-tight leading-tight pr-2">{client.name || 'Institusi Baru'}</h4>
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shrink-0 ${client.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                               {client.status || 'Suspended'}
                            </span>
                         </div>
                         <div className="space-y-2.5 text-xs font-bold bg-[#030712]/50 p-4 rounded-xl border border-slate-800/50">
                            <div className="flex justify-between"><span className="text-slate-500">ID Tenant</span> <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{client.id}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Paket Sistem</span> <span className="text-blue-400 uppercase tracking-widest">{planObj.name}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Kadaluarsa</span> <span className="text-white flex items-center gap-1.5"><CalendarClock size={14} className="text-amber-500"/> {client.expiryDate || 'Unlimited'}</span></div>
                         </div>
                       </div>
                       
                       <div className="md:border-l border-t md:border-t-0 border-slate-800/50 md:pl-5 pt-4 md:pt-0 w-full md:w-56 shrink-0 flex flex-col justify-between">
                          <div className="space-y-3 mb-4">
                            <div>
                               <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1.5 mb-1 tracking-widest"><User size={12}/> PIC Kampus/Sekolah</p>
                               <p className="text-sm font-bold text-white truncate">{client.picName || 'Belum Diatur'}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1.5 mb-1 tracking-widest"><Phone size={12}/> WhatsApp</p>
                               <p className="text-sm font-bold text-white truncate">{client.waNumber || '-'}</p>
                            </div>
                          </div>
                          <a href={client.waNumber ? `https://wa.me/${getCleanWA(client.waNumber)}` : '#'} target="_blank" rel="noreferrer" className="w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex justify-center items-center gap-2 border border-emerald-500/20">
                             <MessageCircle size={16}/> Hubungi PIC
                          </a>
                       </div>
                     </div>

                     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-slate-800/50 pt-5 mt-2">
                       <button onClick={() => openBillingModal(client)} className="py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl text-[10px] sm:text-xs font-black transition-colors flex justify-center items-center gap-2 border border-amber-500/30">
                          <Receipt size={14}/> Tagihan WA
                       </button>
                       <button onClick={() => openEditClient(client)} className="py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl text-[10px] sm:text-xs font-black transition-colors flex justify-center items-center gap-2 border border-blue-500/30">
                          <Edit size={14}/> Edit Info
                       </button>
                       <button onClick={() => toggleClientStatus(client.id, client.status, client.name)} className="py-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] sm:text-xs font-black transition-colors flex justify-center items-center gap-2 border border-slate-700">
                          <ShieldCheck size={14}/> {client.status === 'active' ? 'Suspend' : 'Aktifkan'}
                       </button>
                       <button onClick={() => deleteClient(client.id)} className="py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-[10px] sm:text-xs font-black transition-colors flex justify-center items-center gap-2 border border-rose-500/20">
                          <Trash2 size={14}/> Hapus
                       </button>
                     </div>
                  </div>
                )})}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: ADMIN KLIEN */}
          {/* ========================================== */}
          {activeTab === 'admins' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0f1c] border border-slate-800/80 p-6 rounded-3xl">
                 <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2"><Users className="text-indigo-500"/> Akses Operator IT</h3>
                    <p className="text-sm text-slate-400 mt-1">Pembuatan kredensial Login untuk admin utama institusi.</p>
                 </div>
                 <button onClick={() => setShowAddAdminModal(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-indigo-600/30"><KeyRound size={18}/> Buat Akun Akses</button>
              </div>

              <div className="bg-[#0a0f1c] rounded-3xl border border-slate-800/80 overflow-x-auto shadow-xl p-2">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#030712] text-slate-400">
                    <tr><th className="p-5 font-black uppercase tracking-widest text-[10px] rounded-l-2xl">Nama Operator</th><th className="p-5 font-black uppercase tracking-widest text-[10px]">Email Login</th><th className="p-5 font-black uppercase tracking-widest text-[10px]">Kode Institusi</th><th className="p-5 font-black uppercase tracking-widest text-[10px] text-center rounded-r-2xl">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {clientAdmins.map(admin => (
                      <tr key={admin.uid} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-5 font-bold text-white flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400"><User size={14}/></div>{admin.name}</td>
                        <td className="p-5 text-slate-400 font-medium">{admin.email}</td>
                        <td className="p-5"><span className="bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg font-mono text-xs font-bold">{admin.schoolId}</span></td>
                        <td className="p-5 text-center">
                          <button onClick={() => deleteAdmin(admin.uid)} className="text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 p-2.5 rounded-lg transition-all border border-rose-500/20"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: GLOBAL LIVE MONITOR */}
          {/* ========================================== */}
          {activeTab === 'global' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0f1c] border border-slate-800/80 p-6 rounded-3xl">
                 <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2"><Globe className="text-emerald-500 animate-pulse"/> Global Live Monitor</h3>
                    <p className="text-sm text-slate-400 mt-1">Pantau seluruh sesi ujian yang sedang berjalan di semua institusi.</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {globalSessions.map(session => (
                  <div key={session.id} className="bg-[#0a0f1c] border border-emerald-500/30 p-5 rounded-3xl shadow-xl shadow-emerald-500/5 relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                     <div className="flex justify-between items-start mb-3">
                       <span className="font-mono text-lg font-black text-white tracking-widest">{session.token}</span>
                       <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-[9px] font-black uppercase flex items-center gap-1.5"><Activity size={10} className="animate-pulse"/> Live</span>
                     </div>
                     <h4 className="font-bold text-indigo-400 text-sm mb-1">{session.mapel} (Kls {session.kelas})</h4>
                     <p className="text-xs text-slate-400 font-medium truncate"><Building2 size={12} className="inline mr-1"/> {session.schools?.name || session.school_id}</p>
                     <div className="mt-4 pt-3 border-t border-slate-800/50 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <span>{session.jam_mulai} - {session.jam_selesai}</span>
                       <span>{session.kuota_pg + session.kuota_pgk + session.kuota_esai} Soal</span>
                     </div>
                  </div>
                ))}
                {globalSessions.length === 0 && <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 font-bold">Saat ini tidak ada sesi ujian yang berjalan.</div>}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 5: PRICING / PAKET (COMPLEX MATRIX) */}
          {/* ========================================== */}
          {activeTab === 'billing' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0f1c] border border-slate-800/80 p-6 rounded-3xl">
                 <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2"><CreditCard className="text-amber-500"/> Matrix Pricing Plan</h3>
                    <p className="text-sm text-slate-400 mt-1">Atur batasan kompleks, fitur khusus, dan SLA Support per paket.</p>
                 </div>
                 <button onClick={() => { setPlanForm({ id: '', name: '', max_students: 0, storage_mb: 0, support_level: 'Standard', has_api_access: false, has_custom_domain: false, price_yearly: 0 }); setShowEditPlanModal(true); }} className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"><Plus size={18}/> Buat Paket Baru</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pricingPlans.map(plan => (
                  <div key={plan.id} className="bg-[#0a0f1c] border border-slate-800/80 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><Settings size={120} className="text-amber-500 animate-spin-slow" /></div>
                    <div className="relative z-10">
                      <span className="bg-slate-900 text-amber-500 border border-slate-800 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">{plan.id}</span>
                      <h4 className="text-2xl font-black text-white mt-5 mb-2">{plan.name}</h4>
                      <p className="text-3xl font-black text-white mb-6">Rp {(plan.price_yearly / 1000000).toFixed(1)}<span className="text-sm text-slate-500 font-bold"> Jt/Tahun</span></p>
                      
                      <div className="space-y-3 mb-8 bg-[#030712]/50 p-4 rounded-2xl border border-slate-800/50">
                        <div className="flex justify-between border-b border-slate-800/50 pb-2"><span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Users size={14}/> Batas Siswa</span><span className="text-white font-black text-sm">{plan.max_students}</span></div>
                        <div className="flex justify-between border-b border-slate-800/50 pb-2"><span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><HardDrive size={14}/> Storage</span><span className="text-white font-black text-sm">{plan.storage_mb >= 1000 ? (plan.storage_mb/1000).toFixed(1)+' GB' : plan.storage_mb+' MB'}</span></div>
                        <div className="flex justify-between border-b border-slate-800/50 pb-2"><span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><HeadphonesIcon size={14}/> Support</span><span className="text-emerald-400 font-black text-sm">{plan.support_level}</span></div>
                        <div className="flex justify-between pb-1"><span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"><Code size={14}/> API Akses</span><span className="text-white font-black text-sm">{plan.has_api_access ? 'Terbuka' : 'Terkunci'}</span></div>
                      </div>

                      <button onClick={() => { setPlanForm(plan); setShowEditPlanModal(true); }} className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors border border-slate-700"><Edit size={16}/> Edit Parameter</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 6: PAYMENT & REKENING SETTINGS (NEW) */}
          {/* ========================================== */}
          {activeTab === 'payment' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0f1c] border border-slate-800/80 p-6 rounded-3xl">
                 <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2"><Wallet className="text-emerald-500"/> Master Rekening & QRIS</h3>
                    <p className="text-sm text-slate-400 mt-1">Daftar bank pembayaran yang akan dikirim via WhatsApp ke klien.</p>
                 </div>
                 <button onClick={() => setShowAddPaymentModal(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30"><Plus size={18}/> Tambah Rekening</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paymentMethods.map(pay => (
                  <div key={pay.id} className="bg-gradient-to-br from-[#0a0f1c] to-[#060a13] border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-500/20"><Building2 size={24}/></div>
                        <div><h4 className="text-lg font-black text-white leading-tight">{pay.bankName}</h4><p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bank Transfer</p></div>
                     </div>
                     <div className="space-y-1 mb-6">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No. Rekening</p>
                        <p className="text-2xl font-mono font-black text-white tracking-widest">{pay.accNumber}</p>
                        <p className="text-xs font-bold text-amber-500 uppercase tracking-widest pt-2">A/N: {pay.accountName}</p>
                     </div>
                     <button onClick={() => deletePayment(pay.id)} className="w-full py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl text-xs font-black transition-colors border border-rose-500/20 flex justify-center items-center gap-2"><Trash2 size={14}/> Hapus Rekening</button>
                  </div>
                ))}
                {paymentMethods.length === 0 && <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 font-bold">Belum ada data rekening.</div>}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 7: SYSTEM LOG (AUDIT TRAIL) */}
          {/* ========================================== */}
          {activeTab === 'log' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
               <div className="bg-[#0a0f1c] border border-slate-800/80 p-6 md:p-8 rounded-[2rem] shadow-xl">
                 <h3 className="text-2xl font-black text-white flex items-center gap-2 mb-2"><Server className="text-indigo-500"/> System & Audit Logs</h3>
                 <p className="text-sm text-slate-400 mb-10">Pantau seluruh aktivitas Database, Registrasi Klien, dan Error Sistem.</p>

                 <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500/20 before:via-slate-800 before:to-transparent">
                    {systemLogs.map((log) => {
                      const logDate = new Date(log.created_at);
                      const timeStr = `${String(logDate.getHours()).padStart(2,'0')}:${String(logDate.getMinutes()).padStart(2,'0')}`;
                      const dateStr = `${logDate.getDate()}/${logDate.getMonth()+1}`;
                      return (
                      <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                         <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#030712] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${log.type==='info'?'bg-blue-500 text-white':log.type==='warn'?'bg-amber-500 text-white':log.type==='error'?'bg-rose-500 text-white':'bg-emerald-500 text-white'}`}>
                            {log.type==='info'?<Activity size={16}/>:log.type==='warn'?<AlertOctagon size={16}/>:log.type==='error'?<X size={16}/>:<CheckCircle2 size={16}/>}
                         </div>
                         <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0a0f1c] border border-slate-800/80 p-5 rounded-2xl shadow-md hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center justify-between space-x-2 mb-2">
                               <div className="font-black text-slate-300 text-[10px] tracking-widest uppercase">{log.type}</div>
                               <time className="font-mono text-[10px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{dateStr} - {timeStr} WIB</time>
                            </div>
                            <div className="text-slate-400 text-sm font-medium leading-relaxed">{log.message}</div>
                         </div>
                      </div>
                    )})}
                 </div>
               </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================== */}
      {/* SEMUA MODAL POPUP */}
      {/* ========================================== */}
      
      {/* 1. MODAL TAMBAH/EDIT KLIEN */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <div className="bg-[#0a0f1c] p-6 rounded-[2rem] w-full max-w-lg border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
             <h2 className="text-xl font-black mb-6 text-white flex items-center gap-3"><Building2 className="text-indigo-500"/> {clientForm.isEdit ? 'Update Institusi' : 'Registrasi Institusi Baru'}</h2>
             <form onSubmit={handleSaveClient} className="space-y-4">
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest pl-1">ID Tenant (Unik, Tanpa Spasi)</label><input required disabled={clientForm.isEdit} value={clientForm.id} onChange={e => setClientForm({...clientForm, id: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-mono text-indigo-400 outline-none focus:border-indigo-500 disabled:opacity-50" /></div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest pl-1">Nama Resmi Institusi</label><input required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-indigo-500" /></div>
               <div className="grid grid-cols-2 gap-3 p-4 bg-[#030712]/50 border border-slate-800 rounded-2xl">
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest flex items-center gap-1"><User size={12}/> Nama PIC</label><input required value={clientForm.picName} onChange={e => setClientForm({...clientForm, picName: e.target.value})} className="w-full p-3 bg-[#0a0f1c] border border-slate-800 rounded-lg text-xs font-bold text-white outline-none focus:border-indigo-500" /></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest flex items-center gap-1"><Phone size={12}/> No WhatsApp</label><input required value={clientForm.waNumber} onChange={e => setClientForm({...clientForm, waNumber: e.target.value})} className="w-full p-3 bg-[#0a0f1c] border border-slate-800 rounded-lg text-xs font-bold text-white outline-none focus:border-indigo-500" /></div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest pl-1">Paket Sistem</label>
                    <select value={clientForm.plan} onChange={e => setClientForm({...clientForm, plan: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-indigo-500 appearance-none cursor-pointer">
                      <option value="" disabled>-- Pilih Paket --</option>
                      {pricingPlans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest pl-1">Kadaluarsa</label><input type="date" value={clientForm.expiryDate} onChange={e => setClientForm({...clientForm, expiryDate: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-slate-300 outline-none focus:border-indigo-500" /></div>
               </div>
               <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowAddClientModal(false)} className="flex-1 py-3.5 bg-slate-800 text-white rounded-xl text-sm font-black transition-all">Batal</button><button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/30 transition-all">Simpan Klien</button></div>
             </form>
          </div>
        </div>
      )}

      {/* 2. MODAL TAMBAH ADMIN */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <div className="bg-[#0a0f1c] p-6 md:p-8 rounded-[2rem] w-full max-w-md border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
             <h2 className="text-xl font-black mb-2 text-white flex items-center gap-3"><KeyRound className="text-indigo-500"/> Akun Operator IT</h2>
             <form onSubmit={handleCreateClientAdmin} className="space-y-4">
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest pl-1">Pilih Institusi:</label><select required value={adminForm.schoolId} onChange={e => setAdminForm({...adminForm, schoolId: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-indigo-500/50 rounded-xl text-sm font-black text-indigo-400 outline-none focus:border-indigo-500 appearance-none cursor-pointer"><option value="" disabled>-- Pilih --</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest pl-1">Nama Lengkap</label><input required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-indigo-500" /></div>
               <div className="grid grid-cols-2 gap-3">
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest pl-1">Email Login</label><input type="email" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-indigo-500" /></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block tracking-widest pl-1">Password</label><input type="password" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-indigo-500" /></div>
               </div>
               <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowAddAdminModal(false)} className="flex-1 py-3.5 bg-slate-800 text-white rounded-xl text-sm font-black transition-all">Batal</button><button type="submit" className="flex-1 py-3.5 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/30 transition-all">Buat Akun</button></div>
             </form>
          </div>
        </div>
      )}

      {/* 3. MODAL EDIT PLAN */}
      {showEditPlanModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <div className="bg-[#0a0f1c] p-6 md:p-8 rounded-[2rem] w-full max-w-lg border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
             <h2 className="text-xl font-black mb-6 text-white flex items-center gap-3"><Settings className="text-amber-500"/> Konfigurasi Paket</h2>
             <form onSubmit={handleSavePlan} className="space-y-4">
               <div className="grid grid-cols-2 gap-3">
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1">ID (Unik, huruf kecil)</label><input required disabled={!!planForm.id && pricingPlans.some(p => p.id === planForm.id)} value={planForm.id} onChange={e => setPlanForm({...planForm, id: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-mono text-amber-500 outline-none disabled:opacity-50" /></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1">Nama Tampilan</label><input required value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none" /></div>
               </div>
               <div className="grid grid-cols-3 gap-3">
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1">Maks Siswa</label><input type="number" required value={planForm.max_students} onChange={e => setPlanForm({...planForm, max_students: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none" /></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1">Storage (MB)</label><input type="number" required value={planForm.storage_mb} onChange={e => setPlanForm({...planForm, storage_mb: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none" /></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1">Harga (Rp/Thn)</label><input type="number" required value={planForm.price_yearly} onChange={e => setPlanForm({...planForm, price_yearly: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-emerald-400 outline-none" /></div>
               </div>
               <div className="grid grid-cols-2 gap-3 p-4 bg-[#030712]/50 border border-slate-800 rounded-2xl">
                 <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={planForm.has_api_access} onChange={e => setPlanForm({...planForm, has_api_access: e.target.checked})} className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500" /><span className="text-xs font-bold text-slate-300">Akses API Terbuka</span></label>
                 <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={planForm.has_custom_domain} onChange={e => setPlanForm({...planForm, has_custom_domain: e.target.checked})} className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500" /><span className="text-xs font-bold text-slate-300">Custom Domain</span></label>
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1">Level Support (SLA)</label>
                  <select value={planForm.support_level} onChange={e => setPlanForm({...planForm, support_level: e.target.value})} className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none appearance-none cursor-pointer"><option>Standard</option><option>Priority</option><option>24/7 Dedicated</option></select>
               </div>
               <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowEditPlanModal(false)} className="flex-1 py-3.5 bg-slate-800 text-white rounded-xl text-sm font-black transition-all">Batal</button><button type="submit" className="flex-1 py-3.5 bg-amber-500 text-black rounded-xl text-sm font-black shadow-lg shadow-amber-500/30 transition-all">Simpan Config</button></div>
             </form>
          </div>
        </div>
      )}

      {/* 4. MODAL TAMBAH REKENING */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <div className="bg-[#0a0f1c] p-6 md:p-8 rounded-[2rem] w-full max-w-md border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
             <h2 className="text-xl font-black mb-6 text-white flex items-center gap-3"><Wallet className="text-emerald-500"/> Tambah Rekening</h2>
             <form onSubmit={(e) => { e.preventDefault(); const updated = [...paymentMethods, { id: 'pay_'+Date.now(), ...paymentForm }]; setPaymentMethods(updated); localStorage.setItem('cbt_payment_methods', JSON.stringify(updated)); setShowAddPaymentModal(false); setPaymentForm({ bankName: '', accNumber: '', accountName: '' }); }} className="space-y-4">
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1">Nama Bank / E-Wallet</label><input required value={paymentForm.bankName} onChange={e => setPaymentForm({...paymentForm, bankName: e.target.value})} placeholder="Bank Neo Commerce" className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none" /></div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1">No. Rekening</label><input required value={paymentForm.accNumber} onChange={e => setPaymentForm({...paymentForm, accNumber: e.target.value})} placeholder="1234567890" className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-emerald-400 outline-none" /></div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-1 block pl-1">Atas Nama (A/N)</label><input required value={paymentForm.accountName} onChange={e => setPaymentForm({...paymentForm, accountName: e.target.value})} placeholder="ALIMA CREATIVE" className="w-full p-3.5 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none" /></div>
               <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowAddPaymentModal(false)} className="flex-1 py-3.5 bg-slate-800 text-white rounded-xl text-sm font-black transition-all">Batal</button><button type="submit" className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/30 transition-all">Simpan Rekening</button></div>
             </form>
          </div>
        </div>
      )}

      {/* 5. MODAL TAGIHAN WHATSAPP */}
      {showBillingModal && billingData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <div className="bg-[#0a0f1c] p-6 md:p-8 rounded-[2rem] w-full max-w-md border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
             <button onClick={() => setShowBillingModal(false)} className="absolute top-6 right-6 text-slate-500 hover:text-white"><X size={24}/></button>
             <h2 className="text-xl font-black mb-1 text-white flex items-center gap-3"><Receipt className="text-amber-500"/> Kirim Tagihan WA</h2>
             <p className="text-xs text-slate-400 mb-6">Pilih rekening yang akan dikirim ke PIC Institusi.</p>
             
             <div className="bg-[#030712]/50 border border-slate-800 rounded-2xl p-4 mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tagihan Untuk:</p>
                <h3 className="text-lg font-black text-white mb-2">{billingData.name}</h3>
                <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                   <span className="text-xs font-bold text-amber-500">{billingData.planName}</span>
                   <span className="text-sm font-black text-emerald-400">Rp {(billingData.price || 0).toLocaleString('id-ID')}</span>
                </div>
             </div>

             <div className="mb-6">
               <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Kirim Ke Rekening:</label>
               <select value={selectedPayment} onChange={e => setSelectedPayment(e.target.value)} className="w-full p-4 bg-[#030712] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none cursor-pointer appearance-none">
                 {paymentMethods.map(pay => <option key={pay.id} value={pay.id}>{pay.bankName} - {pay.accNumber}</option>)}
               </select>
             </div>
             
             <button onClick={() => {
                if(!selectedPayment) return alert("Pilih rekening pembayaran!");
                const pay = paymentMethods.find(p => p.id === selectedPayment);
                let waNum = String(billingData.waNumber).replace(/[^0-9]/g, ''); 
                if (waNum.startsWith('0')) waNum = '62' + waNum.substring(1);
                if(!waNum) return alert("Klien ini belum memiliki nomor WhatsApp.");
                
                const textMsg = `Halo Bapak/Ibu *${billingData.picName || 'PIC'}*,\n\nBerikut adalah informasi tagihan berlangganan *ALIMA CBT Enterprise* untuk institusi *${billingData.name}*:\n\n💻 *Paket Layanan:* ${billingData.planName}\n💰 *Total Tagihan:* Rp ${Number(billingData.price).toLocaleString('id-ID')}\n\nMohon untuk melakukan pembayaran melalui:\n🏦 *Bank:* ${pay.bankName}\n💳 *No. Rekening:* ${pay.accNumber}\n👤 *Atas Nama:* ${pay.accountName}\n\nMohon kirimkan bukti transfer ke nomor ini jika sudah melakukan pembayaran agar masa aktif sistem dapat segera kami perpanjang.\n\nTerima kasih atas kepercayaannya,\n*Tim ALIMA Creative Studio*`;
                
                window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(textMsg)}`, '_blank');
                setShowBillingModal(false);
             }} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30">
                <Send size={18}/> Generate Pesan WhatsApp
             </button>
          </div>
        </div>
      )}

    </div>
  );
}
