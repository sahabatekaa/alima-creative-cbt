// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase'; 
import { RefreshCw } from 'lucide-react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [tenantData, setTenantData] = useState(null); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async (user) => {
      if (!user) {
        setCurrentUser(null);
        setUserData(null);
        setTenantData(null);
        setLoading(false);
        return;
      }

      try {
        setCurrentUser(user);

        // 🌟 JALUR VIP FOUNDER: Mencegah terlempar ke login! 🌟
        if (user.email === 'admin@alima.com') {
            setUserData({
                id: user.id,
                email: user.email,
                name: 'Founder Alima CBT',
                role: 'superadmin',
                status: 'active'
            });
            setLoading(false);
            return; // Langsung berikan akses, hentikan pencarian ke tabel
        }

        // 1. Tarik data profil untuk user selain admin
        const { data: profileData, error: profileErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileErr || !profileData) {
          console.warn("Profil tidak ditemukan atau terblokir RLS");
          setUserData(null);
          setLoading(false);
          return;
        }

        const normalizedUser = {
          ...profileData,
          schoolId: profileData.school_id 
        };
        setUserData(normalizedUser);

        // 2. Tarik data institusi
        if (normalizedUser.schoolId && normalizedUser.role !== 'superadmin') {
          const { data: schoolData, error: schoolErr } = await supabase
            .from('schools')
            .select('*')
            .eq('id', normalizedUser.schoolId)
            .single();

          if (schoolData && !schoolErr) {
            setTenantData(schoolData);
          }
        }
      } catch (error) {
        console.error("🚨 FATAL: Gagal menarik data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Cek sesi aktif
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session?.user ?? null);
    });

    // Pantau perubahan
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
        setLoading(true);
        fetchUserProfile(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = { currentUser, userData, tenantData, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? (
        children
      ) : (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
          <RefreshCw className="animate-spin text-emerald-500 mb-4" size={48} />
          <h2 className="text-xl font-black tracking-widest animate-pulse">MENYIAPKAN SISTEM...</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">Melakukan verifikasi data institusi</p>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}