// src/pages/superadmin/MasterDashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useNavigate } from 'react-router-dom';
import { Building2, CreditCard, Users, LogOut, Plus, Trash2, Database, Menu, X, Landmark, KeyRound, Activity, User, Phone, MessageCircle, BarChart3, ShieldCheck, Edit, CalendarClock, Settings } from 'lucide-react';
// IMPORT RECHARTS UNTUK GRAFIK
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function MasterDashboard() {
  const navigate = useNavigate(); 
  const [activeTab, setActiveTab] = useState('dashboard'); // Default ke Dashboard Utama
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data State
  const [clients, setClients] = useState([]);
  const [clientAdmins, setClientAdmins] = useState([]);
  const [pricingPlans, setPricingPlans] = useState([]);
  const [liveStudentsCount, setLiveStudentsCount] = useState(0);

  // Modals State
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [clientForm, setClientForm] = useState({ id: '', name: '', plan: 'Premium', expiryDate: '', picName: '', waNumber: '', isEdit: false });

  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', name: '', schoolId: '' });

  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ id: '', name: '', max_students: 0, price_yearly: 0, features: '' });

  // ==========================================
  // TARIK DATA REALTIME DARI POSTGRESQL
  // ==========================================
  useEffect(() => {
    const fetchSchools = async () => {
      const { data, error } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
      if (data && !error) {
        setClients(data.map(c => ({
          ...c, picName: c.pic_name, waNumber: c.wa_number, expiryDate: c.expiry_date
        })));
      }
    };

    const fetchAdmins = async () => {
      const { data, error } = await supabase.from('users').select('*').eq('role', 'admin_sekolah');
      if (data && !error) setClientAdmins(data.map(u => ({ uid: u.id, ...u, schoolId: u.school_id })));
    };

    const fetchLiveStudents = async () => {
      const { count, error } = await supabase.from('live_students').select('*', { count: 'exact', head: true }).eq('status', 'Mengerjakan');
      if (!error) setLiveStudentsCount(count || 0);
    };

    // (Opsional) Jika Bos sudah membuat tabel 'pricing_plans' di Supabase
    // const fetchPricing = async () => {
    //   const { data } = await supabase.from('pricing_plans').select('*');
    //   if (data) setPricingPlans(data);
    // };
    
    // Data Dummy Pricing Jika Tabel Belum Ada
    setPricingPlans([
      { id: 'p1', name: 'Premium (SMP/SMA)', max_students: 500, price_yearly: 3500000, features: 'Anti-Cheat, Cetak Laporan' },
      { id: 'p2', name: 'Enterprise (Kampus)', max_students: 5000, price_yearly: 10000000, features: 'Prioritas Server, API Access' }
    ]);

    fetchSchools(); fetchAdmins(); fetchLiveStudents();

    // Berlangganan Realtime
    const schoolsChannel = supabase.channel('public:schools').on('postgres_changes', { event: '*', schema: 'public', table: 'schools' }, fetchSchools).subscribe();
    const usersChannel = supabase.channel('public:users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchAdmins).subscribe();
    const liveChannel = supabase.channel('public:live_students').on('postgres_changes', { event: '*', schema: 'public', table: 'live_students' }, fetchLiveStudents).subscribe();

    return () => { supabase.removeChannel(schoolsChannel); supabase.removeChannel(usersChannel); supabase.removeChannel(liveChannel); };
  }, []);

  // --- FUNGSI LOGOUT ---
  const handleLogout = async () => {
    try { await supabase.auth.signOut(); localStorage.clear(); navigate('/login'); } 
    catch (error) { alert("Gagal keluar: " + error.message); }
  };

  // --- MANAJEMEN KLIEN (SEKOLAH) ---
  const handleSaveClient = async (e) => {
    e.preventDefault();
    const clientId = clientForm.id.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    
    try {
      if (clientForm.isEdit) {
        // Mode Update / Upgrade
        const { error } = await supabase.from('schools').update({
          name: clientForm.name, plan: clientForm.plan, expiry_date: clientForm.expiryDate || null,
          pic_name: clientForm.picName, wa_number: clientForm.waNumber
        }).eq('id', clientId);
        if (error) throw error;
        alert("Data Klien Diperbarui!");
      } else {
        // Mode Insert
        const { error } = await supabase.from('schools').insert([{
          id: clientId, name: clientForm.name, plan: clientForm.plan, expiry_date: clientForm.expiryDate || null,
          pic_name: clientForm.picName, wa_number: clientForm.waNumber, status: 'active'
        }]);
        if (error) throw error;
        alert("Klien baru berhasil didaftarkan!");
      }

      setShowAddClientModal(false);
      setClientForm({ id: '', name: '', plan: 'Premium', expiryDate: '', picName: '', waNumber: '', isEdit: false });
    } catch (err) { alert("Gagal: " + err.message); }
  };

  const openEditClient = (client) => {
    setClientForm({
      id: client.id, name: client.name, plan: client.plan, expiryDate: client.expiryDate || '',
      picName: client.picName || '', waNumber: client.waNumber || '', isEdit: true
    });
    setShowAddClientModal(true);
  };

  const toggleClientStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    if(window.confirm(`Yakin ingin ubah status menjadi ${newStatus.toUpperCase()}?`)) {
      await supabase.from('schools').update({ status: newStatus }).eq('id', id);
    }
  };

  const deleteClient = async (id) => {
    if(window.confirm("PERINGATAN! Hapus permanen? Seluruh data milik sekolah ini akan IKUT TERHAPUS (CASCADE PostgreSQL).")) {
      await supabase.from('schools').delete().eq('id', id);
    }
  };

  // --- MANAJEMEN AKUN ADMIN SEKOLAH ---
  const handleCreateClientAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.schoolId) return alert("Pilih sekolah untuk admin ini!");
    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({ email: adminForm.email, password: adminForm.password });
      if (authErr) throw authErr;
      const { error: dbErr } = await supabase.from('users').insert([{
        id: authData.user.id, name: adminForm.name, email: adminForm.email, role: 'admin_sekolah', school_id: adminForm.schoolId, status: 'active' 
      }]);
      if (dbErr) throw dbErr;
      alert("Akun Admin Sekolah berhasil dibuat!");
      setShowAddAdminModal(false); setAdminForm({ email: '', password: '', name: '', schoolId: '' });
    } catch (err) { alert(err.message.includes('already registered') ? "Email sudah terdaftar!" : "Gagal: " + err.message); }
  };

  const deleteAdmin = async (uid) => {
    if(window.confirm("Hapus akses admin ini?")) await supabase.from('users').delete().eq('id', uid);
  };

  const generateWALink = (phone) => {
    if (!phone) return '#';
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);
    return `https://wa.me/${cleanPhone}`;
  };

  // --- DATA DUMMY UNTUK GRAFIK (Diganti query DB sungguhan nanti) ---
  const trendData = [
    { name: 'Sen', ujian: 120 }, { name: 'Sel', ujian: 300 }, { name: 'Rab', ujian: 450 }, 
    { name: 'Kam', ujian: 320 }, { name: 'Jum', ujian: 500 }, { name: 'Sab', ujian: 100 }, { name: 'Min', ujian: 50 }
  ];
  
  const pieData = [
    { name: 'Premium', value: clients.filter(c => c.plan === 'Premium').length || 1, color: '#3b82f6' },
    { name: 'Enterprise', value: clients.filter(c => c.plan === 'Enterprise').length || 1, color: '#f59e0b' }
  ];

  const NavItem = ({ tab, icon: Icon, label }) => (
    <button onClick={() => { setActiveTab(tab); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all ${activeTab === tab ? 'bg-amber-500 text-black font-black shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white font-bold'}`}>
      <Icon size={18}/> <span className="text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-[#060a13] overflow-hidden font-sans text-slate-200">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0f1c] border-r border-slate-800 flex flex-col transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-2xl`}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center"><h1 className="text-2xl font-black text-white flex gap-2 items-center tracking-widest"><Building2 className="text-amber-500" size={28}/> ROOT</h1><button className="md:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}><X size={20}/></button></div>
        <div className="p-4 border-b border-slate-800 bg-[#060a13]">
          <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">FOUNDER PANEL</p>
          <p className="text-xs font-bold truncate text-white uppercase">Sistem Evaluasi Skala Besar</p>
        </div>
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto mt-2">
          <NavItem tab="dashboard" icon={BarChart3} label="Analisis Strategis" />
          <NavItem tab="clients" icon={Landmark} label="Database Tenant" />
          <NavItem tab="admins" icon={Users} label="Akses Admin Sekolah" />
          <div className="my-4 border-t border-slate-800"></div>
          <NavItem tab="billing" icon={CreditCard} label="Matrix Paket Harga" />
          <NavItem tab="database" icon={Database} label="System Log Server" />
        </nav>
        <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-red-950/40 hover:bg-red-900 border border-red-900/50 text-red-500 hover:text-white rounded-xl text-sm font-bold transition-all">
                <LogOut size={16}/> Keluar Sistem
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#060a13] relative">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <header className="bg-[#0a0f1c]/80 backdrop-blur-md border-b border-slate-800 p-5 flex justify-between items-center z-10">
           <div className="flex items-center gap-4">
             <button className="md:hidden text-amber-500" onClick={() => setIsMobileMenuOpen(true)}><Menu size={24}/></button>
             <h2 className="text-lg font-black text-white tracking-widest uppercase">Master Control Center</h2>
           </div>
           <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded-lg text-emerald-500 text-xs font-bold uppercase tracking-wider">
               <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
               Server Optimal
             </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 custom-scrollbar">
          
          {/* ========================================== */}
          {/* TAB 1: DASHBOARD ANALISIS (Recharts) */}
          {/* ========================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#0a0f1c] border border-slate-800 p-6 rounded-[24px] shadow-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-2"><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Siswa Ujian Aktif</p><Activity className="text-emerald-500" size={20}/></div>
                   <h3 className="text-4xl font-black text-white">{liveStudentsCount} <span className="text-sm font-medium text-slate-500">Koneksi Live</span></h3>
                </div>
                <div className="bg-[#0a0f1c] border border-slate-800 p-6 rounded-[24px] shadow-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-2"><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Tenant/Kampus</p><Landmark className="text-blue-500" size={20}/></div>
                   <h3 className="text-4xl font-black text-white">{clients.length} <span className="text-sm font-medium text-slate-500">Institusi</span></h3>
                </div>
                <div className="bg-[#0a0f1c] border border-slate-800 p-6 rounded-[24px] shadow-xl flex flex-col justify-between">
                   <div className="flex justify-between items-start mb-2"><p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Estimasi ARR</p><CreditCard className="text-amber-500" size={20}/></div>
                   <h3 className="text-4xl font-black text-white">Rp {(clients.length * 3.5).toFixed(1)} <span className="text-sm font-medium text-slate-500">Juta/Thn</span></h3>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0a0f1c] border border-slate-800 p-6 rounded-[24px] shadow-xl">
                  <h4 className="text-sm font-black text-white mb-6 tracking-widest uppercase">Tren Penggunaan CBT (Mingguan)</h4>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} />
                        <YAxis stroke="#64748b" tick={{fontSize: 12}} />
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff'}} />
                        <Line type="monotone" dataKey="ujian" stroke="#f59e0b" strokeWidth={3} dot={{r: 4, fill: '#f59e0b', strokeWidth: 2}} activeDot={{r: 6}} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#0a0f1c] border border-slate-800 p-6 rounded-[24px] shadow-xl">
                  <h4 className="text-sm font-black text-white mb-6 tracking-widest uppercase text-center">Komposisi Paket Institusi</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-2">
                    {pieData.map(d => (
                      <div key={d.name} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{backgroundColor: d.color}}></div><span className="text-xs font-bold text-slate-400">{d.name} ({d.value})</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: DATABASE TENANT (Edit & Upgrade) */}
          {/* ========================================== */}
          {activeTab === 'clients' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0f1c] border border-slate-800 p-6 rounded-[24px]">
                 <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Building2 className="text-amber-500"/> Database Institusi (Tenant)</h3>
                    <p className="text-sm text-slate-400 mt-1">Kelola klien SaaS, perpanjang langganan, dan upgrade paket sekolah/kampus.</p>
                 </div>
                 <button onClick={() => { setClientForm({ id: '', name: '', plan: 'Premium', expiryDate: '', picName: '', waNumber: '', isEdit: false }); setShowAddClientModal(true); }} className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 active:scale-95 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"><Plus size={18}/> Daftarkan Tenant Baru</button>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {clients.map(client => (
                  <div key={client.id} className={`p-6 rounded-[24px] border shadow-xl flex flex-col justify-between gap-5 transition-all ${client.status === 'active' ? 'bg-[#0a0f1c] border-slate-800' : 'bg-slate-950 border-red-900/50 opacity-75'}`}>
                     <div className="flex flex-col md:flex-row justify-between gap-4">
                       <div className="flex-1">
                         <div className="flex justify-between items-start mb-4">
                            <h4 className="text-xl font-black text-white tracking-tight leading-tight">{client.name}</h4>
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider ${client.status === 'active' ? 'bg-emerald-950/50 text-emerald-500 border border-emerald-900/50' : 'bg-red-950/50 text-red-500 border border-red-900/50'}`}>
                               {client.status}
                            </span>
                         </div>
                         <div className="space-y-2.5 text-sm font-bold bg-[#060a13] p-4 rounded-xl border border-slate-800/50">
                            <div className="flex justify-between"><span className="text-slate-500">ID Tenant</span> <span className="text-amber-500 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{client.id}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Paket Langganan</span> <span className="text-blue-400 bg-blue-950/30 px-2 py-0.5 rounded border border-blue-900/30 uppercase text-[10px] tracking-widest">{client.plan}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Tgl Kadaluarsa</span> <span className="text-white flex items-center gap-1.5"><CalendarClock size={14} className="text-amber-500"/> {client.expiryDate || 'Lifetime'}</span></div>
                         </div>
                       </div>
                       
                       <div className="md:border-l border-t md:border-t-0 border-slate-800 md:pl-5 pt-4 md:pt-0 w-full md:w-56 shrink-0 flex flex-col justify-between">
                          <div className="space-y-3 mb-4">
                            <div className="bg-[#060a13] p-2.5 rounded-lg border border-slate-800/50">
                               <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1.5 mb-1 tracking-widest"><User size={12}/> PIC Sekolah/Kampus</p>
                               <p className="text-sm font-bold text-white truncate">{client.picName || 'Belum Diatur'}</p>
                            </div>
                            <div className="bg-[#060a13] p-2.5 rounded-lg border border-slate-800/50">
                               <p className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1.5 mb-1 tracking-widest"><Phone size={12}/> Nomor WhatsApp</p>
                               <p className="text-sm font-bold text-white truncate">{client.waNumber || '-'}</p>
                            </div>
                          </div>
                          <a href={generateWALink(client.waNumber)} target="_blank" rel="noreferrer" className="w-full py-2.5 bg-[#060a13] hover:bg-emerald-600/20 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex justify-center items-center gap-2 border border-emerald-900/30">
                             <MessageCircle size={16}/> Hubungi PIC
                          </a>
                       </div>
                     </div>

                     <div className="grid grid-cols-3 gap-3 border-t border-slate-800 pt-5 mt-2">
                       <button onClick={() => openEditClient(client)} className="py-2.5 bg-blue-950/30 hover:bg-blue-900/50 text-blue-400 rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-2 border border-blue-900/50">
                          <Edit size={14}/> Upgrade / Edit
                       </button>
                       <button onClick={() => toggleClientStatus(client.id, client.status)} className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-2 border border-slate-700">
                          <ShieldCheck size={14}/> {client.status === 'active' ? 'Suspend' : 'Aktifkan'}
                       </button>
                       <button onClick={() => deleteClient(client.id)} className="py-2.5 bg-red-950/20 hover:bg-red-900/40 text-red-500 rounded-xl text-xs font-black transition-colors flex justify-center items-center gap-2 border border-red-900/30">
                          <Trash2 size={14}/> Hapus Data
                       </button>
                     </div>
                  </div>
                ))}
                {clients.length === 0 && <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-800 rounded-[2rem] text-slate-500 font-bold">Belum ada institusi yang berlangganan.</div>}
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 3: ADMIN KLIEN */}
          {/* ========================================== */}
          {activeTab === 'admins' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0f1c] border border-slate-800 p-6 rounded-[24px]">
                 <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><Users className="text-amber-500"/> Akses Operator Sekolah</h3>
                    <p className="text-sm text-slate-400 mt-1">Berikan akses Login kepada TU/Operator sekolah klien.</p>
                 </div>
                 <button onClick={() => setShowAddAdminModal(true)} className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 active:scale-95 transition-all"><KeyRound size={18}/> Buat Akun Akses</button>
              </div>

              <div className="bg-[#0a0f1c] rounded-[24px] border border-slate-800 overflow-x-auto shadow-xl p-2">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#060a13] text-slate-400">
                    <tr><th className="p-5 font-black uppercase tracking-widest text-[10px] rounded-l-xl">Nama Operator</th><th className="p-5 font-black uppercase tracking-widest text-[10px]">Email Login</th><th className="p-5 font-black uppercase tracking-widest text-[10px]">Kode Institusi</th><th className="p-5 font-black uppercase tracking-widest text-[10px] text-center rounded-r-xl">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {clientAdmins.map(admin => (
                      <tr key={admin.uid} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-5 font-bold text-white flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400"><User size={14}/></div>{admin.name}</td>
                        <td className="p-5 text-slate-400 font-medium">{admin.email}</td>
                        <td className="p-5"><span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg font-mono text-xs font-bold">{admin.schoolId}</span></td>
                        <td className="p-5 text-center">
                          <button onClick={() => deleteAdmin(admin.uid)} className="text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 p-2.5 rounded-lg transition-all"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                    {clientAdmins.length === 0 && <tr><td colSpan="4" className="p-12 text-center text-slate-500 font-bold">Belum ada akun Admin Sekolah yang dibuat.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 4: PRICING / PAKET (CRUD Matrix) */}
          {/* ========================================== */}
          {activeTab === 'billing' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0f1c] border border-slate-800 p-6 rounded-[24px]">
                 <div>
                    <h3 className="text-2xl font-black text-white flex items-center gap-2"><CreditCard className="text-amber-500"/> Konfigurasi Paket & Harga</h3>
                    <p className="text-sm text-slate-400 mt-1">Atur batasan siswa dan harga langganan untuk fitur Multi-Tenant.</p>
                 </div>
                 <button onClick={() => { setPlanForm({ id: '', name: '', max_students: 0, price_yearly: 0, features: '' }); setShowEditPlanModal(true); }} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl text-sm font-black flex items-center gap-2 active:scale-95 transition-all"><Plus size={18}/> Tambah Paket</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pricingPlans.map(plan => (
                  <div key={plan.id} className="bg-[#0a0f1c] border border-slate-800 rounded-[24px] p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Settings size={100} className="text-amber-500 animate-spin-slow" /></div>
                    <div className="relative z-10">
                      <span className="bg-slate-900 text-amber-500 border border-slate-800 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{plan.id}</span>
                      <h4 className="text-2xl font-black text-white mt-4 mb-2">{plan.name}</h4>
                      <p className="text-3xl font-black text-blue-400 mb-6">Rp {plan.price_yearly.toLocaleString('id-ID')}<span className="text-sm text-slate-500 font-bold">/Tahun</span></p>
                      
                      <div className="space-y-3 mb-8">
                        <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400 text-sm">Batas Siswa</span><span className="text-white font-bold">{plan.max_students} Akun</span></div>
                        <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400 text-sm">Fitur Khusus</span><span className="text-white font-bold text-right text-xs max-w-[150px]">{plan.features}</span></div>
                      </div>

                      <button onClick={() => { setPlanForm(plan); setShowEditPlanModal(true); }} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-colors border border-slate-700"><Edit size={16}/> Konfigurasi Paket</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="p-16 text-center bg-[#0a0f1c] border border-dashed border-slate-800 rounded-[2rem] mt-4">
               <Database size={60} className="mx-auto text-slate-600 mb-6" />
               <h3 className="text-2xl font-black text-slate-400">Log Query Database</h3>
               <p className="text-slate-500 mt-2 max-w-md mx-auto">Fitur monitoring performa PostgreSQL dan pelacakan Error Log sedang dalam pengembangan untuk versi Enterprise.</p>
            </div>
          )}

        </div>
      </main>

      {/* ========================================== */}
      {/* SEMUA MODAL POPUP */}
      {/* ========================================== */}

      {/* MODAL TAMBAH/EDIT KLIEN */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <div className="bg-[#0a0f1c] p-8 rounded-[2rem] w-full max-w-lg border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
             <h2 className="text-2xl font-black mb-6 text-white flex items-center gap-3"><Building2 className="text-amber-500"/> {clientForm.isEdit ? 'Update Institusi' : 'Registrasi Institusi Baru'}</h2>
             <form onSubmit={handleSaveClient} className="space-y-5">
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">ID Tenant (Unik, Tanpa Spasi)</label><input required disabled={clientForm.isEdit} value={clientForm.id} onChange={e => setClientForm({...clientForm, id: e.target.value})} placeholder="cth: smp-teladan" className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-mono text-amber-500 outline-none focus:border-amber-500 disabled:opacity-50" /></div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Nama Resmi Institusi / Kampus</label><input required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} placeholder="Universitas Teladan" className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-amber-500" /></div>
               
               <div className="grid grid-cols-2 gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1"><User size={12}/> Nama PIC</label>
                   <input required value={clientForm.picName} onChange={e => setClientForm({...clientForm, picName: e.target.value})} placeholder="Bpk. Rektor" className="w-full p-3.5 bg-[#060a13] border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500" />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest flex items-center gap-1"><Phone size={12}/> No WhatsApp</label>
                   <input required value={clientForm.waNumber} onChange={e => setClientForm({...clientForm, waNumber: e.target.value})} placeholder="08123456789" className="w-full p-3.5 bg-[#060a13] border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-blue-500" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Paket Sistem</label>
                    <select value={clientForm.plan} onChange={e => setClientForm({...clientForm, plan: e.target.value})} className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-amber-500 cursor-pointer appearance-none">
                        {pricingPlans.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                 </div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Kadaluarsa (Kosongkan=Selamanya)</label><input type="date" value={clientForm.expiryDate} onChange={e => setClientForm({...clientForm, expiryDate: e.target.value})} className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-bold text-slate-300 outline-none focus:border-amber-500" /></div>
               </div>
               
               <div className="flex gap-3 pt-6"><button type="button" onClick={() => setShowAddClientModal(false)} className="flex-1 py-4 bg-slate-800 text-white rounded-xl text-sm font-black active:scale-95 transition-all">Batal</button><button type="submit" className="flex-1 py-4 bg-amber-500 text-black rounded-xl text-sm font-black active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all">Simpan Klien</button></div>
             </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH ADMIN KLIEN */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <div className="bg-[#0a0f1c] p-8 rounded-[2rem] w-full max-w-md border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
             <h2 className="text-2xl font-black mb-2 text-white flex items-center gap-3"><KeyRound className="text-amber-500"/> Akun Operator Tenant</h2>
             <p className="text-sm font-medium text-slate-400 mb-8">Berikan akses ke administrator kampus/sekolah untuk mengelola guru & siswa.</p>
             <form onSubmit={handleCreateClientAdmin} className="space-y-5">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Beri Akses ke Database Institusi:</label>
                  <select required value={adminForm.schoolId} onChange={e => setAdminForm({...adminForm, schoolId: e.target.value})} className="w-full p-4 bg-[#060a13] border border-amber-500/50 rounded-xl text-sm font-black text-amber-500 outline-none focus:border-amber-500 appearance-none cursor-pointer">
                     <option value="" disabled>-- Pilih Institusi --</option>
                     {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.id})</option>)}
                  </select>
               </div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Nama Lengkap Admin</label><input required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} placeholder="Bpk. Admin" className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-amber-500" /></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Email Login</label><input type="email" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} placeholder="admin@kampus.ac.id" className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-amber-500" /></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Password</label><input type="password" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} placeholder="min. 6 karakter" className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-amber-500" /></div>
               </div>
               <div className="flex gap-3 pt-6"><button type="button" onClick={() => setShowAddAdminModal(false)} className="flex-1 py-4 bg-slate-800 text-white rounded-xl text-sm font-black active:scale-95 transition-all">Batal</button><button type="submit" className="flex-1 py-4 bg-amber-500 text-black rounded-xl text-sm font-black active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all">Buat Akun</button></div>
             </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT PRICING PLAN */}
      {showEditPlanModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <div className="bg-[#0a0f1c] p-8 rounded-[2rem] w-full max-w-md border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200">
             <h2 className="text-2xl font-black mb-2 text-white flex items-center gap-3"><Settings className="text-amber-500"/> Konfigurasi Paket</h2>
             <p className="text-sm font-medium text-slate-400 mb-8">Atur harga dan limitasi kapasitas server untuk paket ini.</p>
             <form onSubmit={(e) => { e.preventDefault(); alert("Di lingkungan produksi nyata, simpan konfigurasi ini ke tabel 'pricing_plans' Supabase!"); setShowEditPlanModal(false); }} className="space-y-5">
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Nama Paket</label><input required value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-bold text-white outline-none focus:border-amber-500" /></div>
               <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Batas Siswa</label><input type="number" required value={planForm.max_students} onChange={e => setPlanForm({...planForm, max_students: e.target.value})} className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-bold text-amber-500 outline-none focus:border-amber-500" /></div>
                 <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Harga per Tahun (Rp)</label><input type="number" required value={planForm.price_yearly} onChange={e => setPlanForm({...planForm, price_yearly: e.target.value})} className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-bold text-emerald-500 outline-none focus:border-amber-500" /></div>
               </div>
               <div><label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest pl-1">Fitur Khusus Terbuka (Opsional)</label><textarea rows="2" value={planForm.features} onChange={e => setPlanForm({...planForm, features: e.target.value})} className="w-full p-4 bg-[#060a13] border border-slate-800 rounded-xl text-sm font-medium text-white outline-none focus:border-amber-500 placeholder-slate-600" placeholder="Misal: Cetak Laporan, Akses API"></textarea></div>
               <div className="flex gap-3 pt-6"><button type="button" onClick={() => setShowEditPlanModal(false)} className="flex-1 py-4 bg-slate-800 text-white rounded-xl text-sm font-black active:scale-95 transition-all">Batal</button><button type="submit" className="flex-1 py-4 bg-amber-500 text-black rounded-xl text-sm font-black active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all">Simpan Konfigurasi</button></div>
             </form>
          </div>
        </div>
      )}

    </div>
  );
}
