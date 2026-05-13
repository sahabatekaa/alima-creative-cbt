// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../config/supabase'; // 100% SUPABASE
import { RefreshCw } from 'lucide-react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [tenantData, setTenantData] = useState(null); // Menyimpan profil spesifik sekolah klien
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fungsi untuk mengambil detail profil user dan institusi dari PostgreSQL
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

        // 1. Tarik data profil dari tabel 'users'
        const { data: profileData, error: profileErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileErr || !profileData) {
          setUserData(null);
          setLoading(false);
          return;
        }

        // Normalisasi snake_case (SQL) ke camelCase (React) agar komponen UI tidak rusak
        const normalizedUser = {
          ...profileData,
          schoolId: profileData.school_id 
        };
        setUserData(normalizedUser);

        // 2. Tarik data institusi/yayasan jika user terkait sekolah
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
        console.error("🚨 FATAL: Gagal menarik data otentikasi SaaS dari Supabase:", error);
      } finally {
        setLoading(false);
      }
    };

    // Cek sesi aktif saat aplikasi pertama kali dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserProfile(session?.user ?? null);
    });

    // Pantau perubahan status login (Login, Logout, Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Hanya set loading true jika benar-benar ganti user/login (mencegah kedip saat refresh token di background)
      if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT') {
        setLoading(true);
        fetchUserProfile(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Paket data yang akan disebar ke seluruh komponen aplikasi
  const value = {
    currentUser,
    userData,
    tenantData,
    loading
  };

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

// Custom Hook untuk memudahkan pemanggilan di komponen lain
export function useAuth() {
  return useContext(AuthContext);
}