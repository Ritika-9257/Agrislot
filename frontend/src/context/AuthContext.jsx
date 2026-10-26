'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgriSlotAPI } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login'); // 'login' | 'signup'

  // Refresh user profile directly from live database
  const refreshProfile = async (currentToken = token) => {
    const activeToken = currentToken || localStorage.getItem('agrislot_token');
    if (!activeToken) return null;

    try {
      const res = await AgriSlotAPI.getCurrentUser(activeToken);
      if (res && res.data) {
        const liveUser = {
          userId: res.data.userId,
          name: res.data.name || res.data.username,
          username: res.data.username,
          email: res.data.email,
          avatar: res.data.avatar,
          role: res.data.role || 'Farmer',
          status: res.data.status,
          farmerId: res.data.farmerId,
          token: activeToken
        };
        setUser(liveUser);
        localStorage.setItem('agrislot_user', JSON.stringify(liveUser));
        return liveUser;
      }
    } catch (err) {
      if (err.message && (err.message.includes('401') || err.message.includes('403') || err.message.includes('inactive'))) {
        logout();
      }
    }
    return null;
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('agrislot_user');
    const savedToken = localStorage.getItem('agrislot_token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        // Silently verify and synchronize current role with database
        refreshProfile(savedToken);
      } catch (e) {
        console.warn('Failed to parse saved user', e);
      }
    }
  }, []);

  const openLogin = () => {
    setModalMode('login');
    setModalOpen(true);
  };

  const openSignup = () => {
    setModalMode('signup');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const loginWithCredentials = async (username, password) => {
    try {
      const res = await AgriSlotAPI.login({ username, password });
      if (res.data?.token) {
        const liveRole = res.data.user?.role || res.data.user?.Role || res.data.user?.User_Role || 'Farmer';
        const userData = {
          userId: res.data.user?.userId || res.data.user?.User_ID,
          name: res.data.user?.Full_Name || res.data.user?.Username || username,
          username: res.data.user?.username || res.data.user?.Username || username,
          role: liveRole,
          token: res.data.token,
        };
        setUser(userData);
        setToken(res.data.token);
        localStorage.setItem('agrislot_user', JSON.stringify(userData));
        localStorage.setItem('agrislot_token', res.data.token);
        if (liveRole === 'Admin' || liveRole === 'Mandi_Officer') {
          localStorage.setItem('agrislot_admin_token', res.data.token);
        }
        closeModal();

        // Role-based destination redirect
        if (liveRole === 'Admin' || liveRole === 'Mandi_Officer') {
          router.push('/admin');
        } else {
          router.push('/farmer');
        }
        return { success: true };
      }
    } catch (err) {
      // Fallback for demo farmer credentials
      if (username === 'farmer' || username.startsWith('98')) {
        const userData = {
          name: 'Suresh Ramrao Patil',
          phone: username.startsWith('98') ? username : '9822014412',
          role: 'Farmer',
          village: 'Niphad',
          district: 'Nashik',
          token: 'demo_farmer_jwt_token',
        };
        setUser(userData);
        setToken('demo_farmer_jwt_token');
        localStorage.setItem('agrislot_user', JSON.stringify(userData));
        localStorage.setItem('agrislot_token', 'demo_farmer_jwt_token');
        closeModal();
        router.push('/farmer');
        return { success: true };
      }
      throw err;
    }
  };

  const loginWithGoogle = async (credential) => {
    if (!credential || typeof credential !== 'string') {
      throw new Error('Valid Google ID token credential is required.');
    }

    const res = await AgriSlotAPI.googleLogin({ credential });

    if (res && res.data && res.data.token) {
      const liveRole = res.data.user?.role || 'Farmer';
      const userData = {
        userId: res.data.user?.userId,
        username: res.data.user?.username,
        name: res.data.user?.name || res.data.user?.email?.split('@')[0],
        email: res.data.user?.email,
        avatar: res.data.user?.avatar,
        role: liveRole,
        token: res.data.token,
        provider: 'google'
      };
      setUser(userData);
      setToken(res.data.token);
      localStorage.setItem('agrislot_user', JSON.stringify(userData));
      localStorage.setItem('agrislot_token', res.data.token);
      if (liveRole === 'Admin' || liveRole === 'Mandi_Officer') {
        localStorage.setItem('agrislot_admin_token', res.data.token);
      }
      closeModal();

      // Role-based destination redirect
      if (liveRole === 'Admin' || liveRole === 'Mandi_Officer') {
        router.push('/admin');
      } else {
        router.push('/farmer');
      }
      return { success: true, user: userData };
    }

    throw new Error(res?.message || 'Google authentication failed on server');
  };

  const signupFarmer = async (formData) => {
    try {
      const res = await AgriSlotAPI.registerFarmer({
        Full_Name: formData.Full_Name,
        Phone_Number: formData.Phone_Number,
        Aadhaar_Number: formData.Aadhaar_Number || '123456789012',
        UPI_ID: formData.UPI_ID || `${formData.Phone_Number}@upi`,
        Village: formData.Village || 'Local Yard',
        District: formData.District || 'Surat',
        State: formData.State || 'Gujarat',
      });

      const newUserData = {
        name: formData.Full_Name,
        phone: formData.Phone_Number,
        village: formData.Village,
        district: formData.District,
        role: 'Farmer',
        farmerId: res.data?.Farmer_ID,
        token: 'registered_farmer_token',
      };
      setUser(newUserData);
      setToken('registered_farmer_token');
      localStorage.setItem('agrislot_user', JSON.stringify(newUserData));
      localStorage.setItem('agrislot_token', 'registered_farmer_token');
      closeModal();
      router.push('/farmer');
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('agrislot_user');
    localStorage.removeItem('agrislot_token');
    localStorage.removeItem('agrislot_admin_token');
    router.push('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        modalOpen,
        modalMode,
        openLogin,
        openSignup,
        closeModal,
        loginWithCredentials,
        loginWithGoogle,
        signupFarmer,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
