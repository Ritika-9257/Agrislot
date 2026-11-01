'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AgriSlotAPI } from '@/lib/api';
import { normalizePhoneNumber, normalizeLoginIdentifier } from '@/lib/normalize';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login'); // 'login' | 'signup' | 'setup'

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
          phone: res.data.phone || res.data.farmerProfile?.Phone || res.data.username,
          village: res.data.village || res.data.farmerProfile?.Village || null,
          email: res.data.email,
          avatar: res.data.avatar,
          role: res.data.role || 'Farmer',
          status: res.data.status,
          farmerId: res.data.farmerId,
          farmerProfile: res.data.farmerProfile || null,
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

  const openSetupPassword = () => {
    setModalMode('setup');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const loginWithCredentials = async (username, password) => {
    try {
      const norm = normalizeLoginIdentifier(username);
      if (!norm.valid) {
        throw new Error(norm.error);
      }
      const cleanUsername = norm.value;

      const res = await AgriSlotAPI.login({ username: cleanUsername, password });
      if (res.data?.token) {
        const liveRole = res.data.user?.role || res.data.user?.Role || res.data.user?.User_Role || 'Farmer';
        const userData = {
          userId: res.data.user?.userId || res.data.user?.User_ID,
          name: res.data.user?.name || res.data.user?.Full_Name || res.data.user?.Username || cleanUsername,
          username: res.data.user?.username || res.data.user?.Username || cleanUsername,
          phone: res.data.user?.phone || res.data.user?.farmerProfile?.Phone || cleanUsername,
          village: res.data.user?.village || res.data.user?.farmerProfile?.Village || null,
          role: liveRole,
          farmerId: res.data.user?.farmerId !== undefined ? res.data.user.farmerId : (res.data.user?.Farmer_ID || null),
          farmerProfile: res.data.user?.farmerProfile || null,
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
        name: res.data.user?.name || res.data.user?.Full_Name || res.data.user?.email?.split('@')[0],
        phone: res.data.user?.phone || null,
        village: res.data.user?.village || null,
        email: res.data.user?.email,
        avatar: res.data.user?.avatar,
        role: liveRole,
        farmerId: res.data.user?.farmerId || null,
        farmerProfile: res.data.user?.farmerProfile || null,
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
      const phoneNorm = normalizePhoneNumber(formData.Phone_Number);
      if (!phoneNorm.valid) {
        throw new Error(phoneNorm.error);
      }
      const cleanPhone = phoneNorm.phone;

      const res = await AgriSlotAPI.registerFarmer({
        Full_Name: formData.Full_Name,
        Phone_Number: cleanPhone,
        Aadhaar_Number: formData.Aadhaar_Number || '123456789012',
        UPI_ID: formData.UPI_ID || `${cleanPhone}@upi`,
        Village: formData.Village || 'Local Yard',
        District: formData.District || 'Surat',
        State: formData.State || 'Gujarat',
        Password: formData.Password,
      });

      if (formData.Password) {
        // Authenticate immediately via real login endpoint to obtain genuine JWT token
        return await loginWithCredentials(cleanPhone, formData.Password);
      }

      return res;
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
        openSetupPassword,
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
