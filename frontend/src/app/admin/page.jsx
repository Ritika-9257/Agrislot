'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  DollarSign, 
  Filter,
  Warehouse,
  Scale,
  Users,
  UserCheck,
  ShieldAlert,
  ArrowDownCircle,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  Lock,
  Tractor
} from 'lucide-react';
import { AgriSlotAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function AdminPortalContent() {
  const { user: authUser, token: contextToken, openLogin, logout: contextLogout } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;

  // Auth state
  const [authToken, setAuthToken] = useState('');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Sub-view: 'terminal' | 'bookings' | 'capacity' | 'transactions' | 'users' | 'audit'
  const [activeTab, setActiveTab] = useState('terminal');

  // Gate Check-in State
  const [gateToken, setGateToken] = useState('');
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInSuccess, setCheckInSuccess] = useState(null);
  const [checkInError, setCheckInError] = useState('');

  // Dashboard Data
  const [dashboardStats, setDashboardStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsFilter, setBookingsFilter] = useState('ALL');
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Mandi & Slots Utilization
  const [utilization, setUtilization] = useState([]);

  // Transactions State
  const [transactions, setTransactions] = useState([]);
  const [traders, setTraders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  // Settlement Form State
  const [selectedBookingForTx, setSelectedBookingForTx] = useState(null);
  const [actualWeight, setActualWeight] = useState('');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [pricePerTon, setPricePerTon] = useState(2600);
  const [selectedTraderId, setSelectedTraderId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [resettingDb, setResettingDb] = useState(false);
  const [resetToast, setResetToast] = useState('');

  // User Management State (P1 Admin RBAC)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('ALL');
  const [usersPage, setUsersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [roleModalTargetRole, setRoleModalTargetRole] = useState('Admin');
  const [roleModalLoading, setRoleModalLoading] = useState(false);
  const [roleModalError, setRoleModalError] = useState('');
  const [roleActionToast, setRoleActionToast] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Set active tab from query param if available
  useEffect(() => {
    if (tabParam && ['terminal', 'bookings', 'capacity', 'transactions', 'users', 'audit'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Check saved token on mount
  useEffect(() => {
    if (contextToken) {
      setAuthToken(contextToken);
    } else {
      const saved = localStorage.getItem('agrislot_admin_token') || localStorage.getItem('agrislot_token');
      if (saved) {
        setAuthToken(saved);
      }
    }
  }, [contextToken]);

  // When authenticated, load initial data
  useEffect(() => {
    if (!authToken) return;

    loadDashboardOverview();
    loadBookingsList();
    loadUtilizationData();
    loadTransactionsData();
  }, [authToken]);

  // Load users or audit logs on tab switch
  useEffect(() => {
    if (!authToken) return;
    if (activeTab === 'users') {
      loadUsersList();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    }
  }, [authToken, activeTab, usersPage, usersRoleFilter]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await AgriSlotAPI.login({ username, password });
      if (res.data?.token) {
        setAuthToken(res.data.token);
        localStorage.setItem('agrislot_admin_token', res.data.token);
      } else {
        setAuthError('Authentication succeeded but token missing');
      }
    } catch (err) {
      setAuthError(err.message || 'Invalid administrator credentials');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthToken('');
    localStorage.removeItem('agrislot_admin_token');
    if (contextLogout) contextLogout();
  };

  const loadDashboardOverview = async () => {
    try {
      const res = await AgriSlotAPI.getAdminDashboard(authToken);
      if (res.data) {
        setDashboardStats(res.data);
      }
    } catch (err) {
      console.warn('Dashboard load error:', err.message);
    }
  };

  const loadBookingsList = async (statusOverride) => {
    try {
      setLoadingBookings(true);
      const st = statusOverride !== undefined ? statusOverride : bookingsFilter;
      const filters = { limit: 50 };
      if (st && st !== 'ALL') {
        filters.status = st;
      }
      const res = await AgriSlotAPI.getAdminBookings(authToken, filters);
      if (res.data) {
        setBookings(res.data.bookings || res.data || []);
      }
    } catch (err) {
      console.warn('Bookings load error:', err.message);
    } finally {
      setLoadingBookings(false);
    }
  };

  const loadUtilizationData = async () => {
    try {
      const res = await AgriSlotAPI.getSlotUtilization();
      if (res.data) {
        setUtilization(res.data);
      }
    } catch (err) {
      console.warn('Utilization load error:', err.message);
    }
  };

  const loadTransactionsData = async () => {
    try {
      setLoadingTx(true);
      const [txRes, trRes, whRes] = await Promise.allSettled([
        AgriSlotAPI.getTransactions(),
        AgriSlotAPI.getTraders(),
        AgriSlotAPI.getWarehouses(),
      ]);

      if (txRes.status === 'fulfilled' && txRes.value?.data) {
        setTransactions(txRes.value.data);
      }
      if (trRes.status === 'fulfilled' && trRes.value?.data) {
        setTraders(trRes.value.data);
        if (trRes.value.data.length > 0) setSelectedTraderId(trRes.value.data[0].Trader_ID);
      }
      if (whRes.status === 'fulfilled' && whRes.value?.data) {
        setWarehouses(whRes.value.data);
        if (whRes.value.data.length > 0) setSelectedWarehouseId(whRes.value.data[0].Warehouse_ID);
      }
    } catch (err) {
      console.warn('Transactions load error:', err.message);
    } finally {
      setLoadingTx(false);
    }
  };

  const loadUsersList = async (page = usersPage, search = usersSearch, role = usersRoleFilter) => {
    if (!authToken) return;
    try {
      setLoadingUsers(true);
      const filters = { page, limit: 15 };
      if (search) filters.search = search;
      if (role && role !== 'ALL') filters.role = role;
      const res = await AgriSlotAPI.getAdminUsers(authToken, filters);
      if (res.data) {
        setUsers(res.data || []);
        if (res.pagination) setUsersPagination(res.pagination);
      }
    } catch (err) {
      console.warn('Users load error:', err.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAuditLogs = async () => {
    if (!authToken) return;
    try {
      setLoadingAudit(true);
      const res = await AgriSlotAPI.getAuditLogs(authToken, { limit: 50 });
      if (res.data) {
        setAuditLogs(res.data || []);
      }
    } catch (err) {
      console.warn('Audit logs load error:', err.message);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleRoleUpdate = async () => {
    if (!roleModalUser || !roleModalTargetRole) return;
    setRoleModalLoading(true);
    setRoleModalError('');
    try {
      await AgriSlotAPI.updateUserRole(roleModalUser.User_ID, roleModalTargetRole, authToken);
      setRoleActionToast(`Successfully updated ${roleModalUser.Username}'s role to ${roleModalTargetRole}!`);
      setTimeout(() => setRoleActionToast(''), 6000);
      setRoleModalUser(null);
      loadUsersList();
    } catch (err) {
      setRoleModalError(err.message || 'Failed to update user role');
    } finally {
      setRoleModalLoading(false);
    }
  };

  const handleGateCheckIn = async (e) => {
    e.preventDefault();
    setCheckInError('');
    setCheckInSuccess(null);
    setCheckInLoading(true);

    try {
      const tokenToSubmit = gateToken.trim().toUpperCase();
      const res = await AgriSlotAPI.checkInBooking({ gateToken: tokenToSubmit });
      setCheckInSuccess(res.data);
      setGateToken('');
      loadBookingsList();
      loadDashboardOverview();
    } catch (err) {
      setCheckInError(err.message || 'Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await AgriSlotAPI.updateBookingStatus(bookingId, newStatus, authToken);
      loadBookingsList();
      loadDashboardOverview();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleSettleTransaction = async (e) => {
    e.preventDefault();
    if (!selectedBookingForTx) return;
    setTxSubmitting(true);

    try {
      const data = {
        Booking_ID: selectedBookingForTx.Booking_ID,
        Trader_ID: Number(selectedTraderId),
        Warehouse_ID: Number(selectedWarehouseId),
        Actual_Weight: Number(actualWeight),
        Quality_Grade: qualityGrade,
        Price_Per_Ton: Number(pricePerTon),
      };

      await AgriSlotAPI.recordTransaction(data, authToken);
      setSelectedBookingForTx(null);
      setActualWeight('');
      loadTransactionsData();
      loadBookingsList();
      alert('Transaction settlement recorded successfully!');
    } catch (err) {
      alert(`Settlement failed: ${err.message}`);
    } finally {
      setTxSubmitting(false);
    }
  };

  const handleUpdatePayment = async (txId, newStatus) => {
    try {
      await AgriSlotAPI.updatePaymentStatus(txId, newStatus, authToken);
      loadTransactionsData();
    } catch (err) {
      alert(`Payment update failed: ${err.message}`);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('CAUTION: This will re-initialize the AgriSlot database with fresh seed data. Are you sure?')) {
      return;
    }
    setResettingDb(true);
    setResetToast('');
    try {
      const res = await AgriSlotAPI.resetDatabase(authToken);
      setResetToast(res.message || 'Database successfully re-seeded!');
      loadDashboardOverview();
      loadBookingsList();
      loadUtilizationData();
      loadTransactionsData();
      if (activeTab === 'users') loadUsersList();
      setTimeout(() => setResetToast(''), 6000);
    } catch (err) {
      alert(`Database reset failed: ${err.message}`);
    } finally {
      setResettingDb(false);
    }
  };

  // ACCESS RESTRICTION: Block normal users (Farmers) from viewing the admin terminal
  if (authUser && authUser.role === 'Farmer') {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="p-8 bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-coral/40 text-coral-dark border-[2px] border-navy-border flex items-center justify-center mx-auto shadow-bento-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-black text-navy-border tracking-tight">
            Access Restricted • 403 Forbidden
          </h2>
          <p className="text-xs font-mono text-slate-600 max-w-md mx-auto leading-relaxed">
            You are currently signed in as <strong>{authUser.name}</strong> ({authUser.role || 'Farmer'}).
            This operations desk is restricted exclusively to authorized APMC Mandi Officers and Administrators.
          </p>
          <div className="pt-2">
            <Link
              href="/farmer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all"
            >
              <Tractor className="w-4 h-4 text-saffron" />
              <span>Go to Farmer Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated as Admin/Officer, render the administrative login gate
  if (!authToken) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="p-8 bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg space-y-6">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-forest text-saffron border-[2px] border-navy-border flex items-center justify-center mx-auto mb-2 shadow-bento-sm font-display font-black text-xl">
              AS
            </div>
            <h1 className="text-2xl font-display font-black text-navy-border tracking-tight">
              Mandi Officer Desk
            </h1>
            <p className="text-xs font-mono text-slate-500 font-bold">
              Restricted APMC Gatekeeper &amp; Staff Login
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-coral/60 border border-navy-border rounded-xl text-coral-dark text-xs font-mono font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase">
                Officer Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin or officer"
                className="w-full h-11 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-bold text-navy-border shadow-bento-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase">
                Officer Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter officer passcode"
                className="w-full h-11 px-3 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-bold text-navy-border shadow-bento-sm"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full h-12 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {authLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4 text-saffron" />
                  <span>Access Control Desk</span>
                </>
              )}
            </button>
          </form>

          <div className="p-3 bg-canvas rounded-xl border border-navy-border/40 text-center font-mono text-[11px] text-slate-600">
            Default Officer: <code className="font-bold text-navy-border">admin / admin123</code>
          </div>
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED ADMINISTRATOR / MANDI OFFICER WORKSPACE ---
  return (
    <div className="space-y-6">
      {/* Visual Command Header for Admin Dashboard */}
      <div className="bg-navy-border text-white p-3.5 rounded-2xl border-[2.5px] border-saffron shadow-bento flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest text-saffron border border-saffron flex items-center justify-center font-display font-black text-sm">
            🛡️
          </div>
          <div>
            <div className="font-display font-black text-sm tracking-wide text-saffron uppercase">
              APMC Mandi Administrative Control Room
            </div>
            <div className="font-mono text-[10.5px] text-slate-300">
              Restricted Clearance Operations • RBAC Privileges Active • Authorized Personnel Only
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-saffron text-navy-border font-black text-[10px] uppercase shadow-sm">
            ROLE: {authUser?.role || 'ADMINISTRATOR'}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold">
            ● VERIFIED SESSION
          </span>
        </div>
      </div>

      {/* Top Header & Subview Navigation Strip */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] font-black text-forest-light uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></span>
            <span>MANDI GATEKEEPER COMMAND</span>
          </div>
          <h1 className="text-3xl font-display font-black text-navy-border tracking-tight">
            Gate &amp; Operations Terminal
          </h1>
          <p className="text-xs font-mono text-slate-500 font-bold mt-0.5">
            Operator: <span className="text-forest font-black">{authUser?.name || username}</span> • Role: {authUser?.role || 'Admin'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Subview Nav Switcher */}
          <div className="flex flex-wrap items-center gap-1 bg-mint-foam p-1 rounded-2xl border-[2px] border-navy-border shadow-bento-sm text-xs font-display font-black uppercase">
            <button
              onClick={() => setActiveTab('terminal')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'terminal' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Gate Inbound
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'bookings' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => setActiveTab('capacity')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'capacity' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Yard Capacity
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'transactions' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Settlements
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-saffron" />
              <span>User Roles</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'audit' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Audit Trail
            </button>
          </div>

          <a
            href={AgriSlotAPI.getExportCsvUrl(activeTab === 'transactions' ? 'transactions' : (activeTab === 'capacity' ? 'utilization' : 'bookings'))}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex px-3 py-2 rounded-xl bg-saffron hover:bg-saffron-dark text-navy-border border-[2px] border-navy-border shadow-bento-sm font-display font-black text-xs uppercase items-center gap-1.5 active:translate-y-0.5 transition-all"
            title="Download safe RFC 4180 CSV report"
          >
            <span>Export CSV</span>
          </a>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white hover:bg-coral/40 text-navy-border hover:text-coral-dark border-[2px] border-navy-border shadow-bento-sm active:translate-y-0.5 transition-all"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Success / Reset Toast Alert */}
      {(roleActionToast || resetToast) && (
        <div className="p-4 bg-emerald-50 border-[2px] border-emerald-600 rounded-xl text-emerald-900 font-mono text-xs font-bold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{roleActionToast || resetToast}</span>
        </div>
      )}

      {/* Overview Stat Bento Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-400 block">Total Passes</span>
          <div className="font-display font-black text-3xl text-navy-border mt-1">
            {dashboardStats?.summary?.totalBookings ?? bookings.length}
          </div>
          <span className="font-mono text-[11px] text-forest font-bold">Issued Tickets</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-400 block">Admitted Today</span>
          <div className="font-display font-black text-3xl text-indigo-700 mt-1">
            {bookings.filter((b) => String(b.Booking_Status || '').toUpperCase().includes('CHECK')).length}
          </div>
          <span className="font-mono text-[11px] text-indigo-700 font-bold">Checked-In Trucks</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-400 block">Completed</span>
          <div className="font-display font-black text-3xl text-forest mt-1">
            {bookings.filter((b) => String(b.Booking_Status || '').toUpperCase() === 'COMPLETED').length}
          </div>
          <span className="font-mono text-[11px] text-forest font-bold">Unloaded &amp; Paid</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border-[2px] border-navy-border shadow-bento-sm">
          <span className="font-mono text-[10px] font-bold uppercase text-slate-400 block">MSP Turnover</span>
          <div className="font-display font-black text-3xl text-forest mt-1">
            ₹{dashboardStats?.financials?.totalTurnoverCrores ? `${dashboardStats.financials.totalTurnoverCrores} Cr` : '₹1.8 Cr'}
          </div>
          <span className="font-mono text-[11px] text-slate-500 font-bold">Daily APMC Volume</span>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: WEIGHBRIDGE GATE INBOUND TERMINAL
          ========================================================================= */}
      {activeTab === 'terminal' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold text-forest uppercase">
                <Truck className="w-4 h-4" />
                <span>Weighbridge Camera Inbound</span>
              </div>
              <h2 className="text-xl font-display font-black text-navy-border mt-1">
                Admit Vehicle Entry
              </h2>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                Scan arrival gate ticket barcode or manually enter token
              </p>
            </div>

            <form onSubmit={handleGateCheckIn} className="space-y-4">
              <div>
                <label className="block font-mono text-xs font-bold text-slate-700 uppercase mb-1">
                  Gate-Pass Token (AG-T******)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. AG-T001"
                    value={gateToken}
                    onChange={(e) => setGateToken(e.target.value.toUpperCase())}
                    className="w-full h-12 px-3.5 bg-mint-light/40 border-[2px] border-navy-border rounded-xl font-mono font-black text-lg text-forest tracking-wider uppercase focus:ring-0 shadow-bento-sm"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-400 font-bold">
                    ANPR AUTO
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkInLoading || !gateToken.trim()}
                className="w-full h-12 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                {checkInLoading ? (
                  <span>Validating Gate-Pass...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-saffron" />
                    <span>Approve Gate Admittance</span>
                  </>
                )}
              </button>
            </form>

            {checkInError && (
              <div className="p-3 bg-coral/60 border border-navy-border rounded-xl text-coral-dark font-mono text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{checkInError}</span>
              </div>
            )}

            {checkInSuccess && (
              <div className="p-4 bg-mint-foam border-[2px] border-forest rounded-xl space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-forest font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-forest" />
                  <span>Entry Admitted Successfully!</span>
                </div>
                <div className="font-mono text-xs text-navy-border space-y-1">
                  <div>Token: <strong>{checkInSuccess.Token_Number}</strong></div>
                  <div>Bay: <strong className="text-forest">{checkInSuccess.Assigned_Bay || 'BAY-04 UNLOADING'}</strong></div>
                  <div>Gross Weight: <strong>{checkInSuccess.Calculated_Tare_Net_Weight || '10.5'} MT</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Trucks in Yard */}
          <div className="lg:col-span-2 p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-black text-navy-border">
                  Currently Admitted in Yard
                </h3>
                <p className="text-xs font-mono text-slate-500">
                  Vehicles on platform waiting for weighment or unloading
                </p>
              </div>
              <span className="px-2.5 py-1 bg-mint-foam text-forest font-mono text-xs font-bold rounded-lg border border-navy-border">
                {bookings.filter(b => b.Booking_Status === 'Checked-In').length} Active
              </span>
            </div>

            <div className="divide-y divide-slate-100 font-mono text-xs">
              {bookings.filter(b => b.Booking_Status === 'Checked-In').length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No trucks currently waiting in yard.
                </div>
              ) : (
                bookings.filter(b => b.Booking_Status === 'Checked-In').map(b => (
                  <div key={b.Booking_ID} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-navy-border flex items-center gap-2">
                        <span className="text-forest font-black">{b.Token_Number}</span>
                        <span>•</span>
                        <span>{b.Farmer_Name || `Farmer #${b.Farmer_ID}`}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {b.Produce_Name || 'Wheat'} • {b.Estimated_Weight_Tons} MT • {b.Mandi_Name || 'Surat APMC'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpdateStatus(b.Booking_ID, 'Completed')}
                      className="px-3 py-1.5 rounded-lg bg-mint-light hover:bg-forest hover:text-white text-forest border border-navy-border font-bold text-[11px] transition-colors"
                    >
                      Mark Unloaded
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BOOKING LEDGER & PASS MANAGEMENT
          ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-black text-navy-border">
                APMC Arrival Booking Ledger
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Filter and verify incoming farmer arrival time slots
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-500 font-bold">Filter:</span>
              <select
                value={bookingsFilter}
                onChange={(e) => {
                  setBookingsFilter(e.target.value);
                  loadBookingsList(e.target.value);
                }}
                className="h-9 px-3 bg-white border border-navy-border rounded-xl font-mono text-xs font-bold"
              >
                <option value="ALL">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Checked-In">Checked-In</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                <tr>
                  <th className="py-3 px-4">Token Ref</th>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4">Mandi Hub</th>
                  <th className="py-3 px-4">Produce</th>
                  <th className="py-3 px-4">Weight</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-navy-border">
                {bookings.map((b) => (
                  <tr key={b.Booking_ID} className="hover:bg-mint-light/20">
                    <td className="py-3 px-4 font-bold text-forest">{b.Token_Number}</td>
                    <td className="py-3 px-4 font-bold">{b.Farmer_Name || `Farmer #${b.Farmer_ID}`}</td>
                    <td className="py-3 px-4">{b.Mandi_Name || 'Surat APMC'}</td>
                    <td className="py-3 px-4">{b.Produce_Name || 'Wheat'}</td>
                    <td className="py-3 px-4 font-bold">{b.Estimated_Weight_Tons} MT</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                        b.Booking_Status === 'Completed' ? 'bg-mint-foam text-forest border-navy-border' :
                        b.Booking_Status === 'Checked-In' ? 'bg-indigo-100 text-indigo-800 border-indigo-400' :
                        b.Booking_Status === 'Cancelled' ? 'bg-coral/30 text-coral-dark border-coral' :
                        'bg-saffron text-navy-border border-navy-border'
                      }`}>
                        {b.Booking_Status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {b.Booking_Status === 'Confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(b.Booking_ID, 'Checked-In')}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded border border-indigo-300 text-[10px] font-bold"
                          >
                            Admit
                          </button>
                        )}
                        {b.Booking_Status === 'Checked-In' && (
                          <button
                            onClick={() => handleUpdateStatus(b.Booking_ID, 'Completed')}
                            className="px-2 py-1 bg-mint-light hover:bg-forest hover:text-white text-forest rounded border border-navy-border text-[10px] font-bold"
                          >
                            Unload
                          </button>
                        )}
                        {b.Booking_Status !== 'Cancelled' && b.Booking_Status !== 'Completed' && (
                          <button
                            onClick={() => handleUpdateStatus(b.Booking_ID, 'Cancelled')}
                            className="px-2 py-1 bg-coral/30 hover:bg-coral-dark hover:text-white text-coral-dark rounded border border-coral text-[10px] font-bold"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MANDI DAILY CAPACITY & UTILIZATION
          ========================================================================= */}
      {activeTab === 'capacity' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
          <div>
            <h2 className="text-xl font-display font-black text-navy-border">
              Mandi Operational Capacity &amp; Slot Allocation
            </h2>
            <p className="text-xs font-mono text-slate-500">
              Live capacity breakdown per mandi yard and scheduled time slot
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {utilization.map((u, i) => (
              <div key={i} className="p-4 bg-canvas rounded-xl border-[2px] border-navy-border shadow-bento-sm space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-forest">{u.Mandi_Name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-300 font-bold">
                    {u.District}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Slot Time:</span>
                    <span className="font-bold">{u.Start_Time} - {u.End_Time}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Max Capacity:</span>
                    <span className="font-bold">{u.Max_Capacity_Tons} MT</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Booked:</span>
                    <span className="font-bold text-forest">{u.Booked_Capacity_Tons} MT</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-navy-border/20">
                  <div
                    className="bg-forest h-full"
                    style={{ width: `${Math.min(100, Number(u.Utilization_Percentage || 0))}%` }}
                  />
                </div>
                <div className="text-right text-[10px] font-bold text-slate-500">
                  {u.Utilization_Percentage}% Utilized
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: TRADE SETTLEMENTS & FINANCIALS
          ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
            <div>
              <h2 className="text-xl font-display font-black text-navy-border">
                MSP Trade Settlement Ledger
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Direct mandi bank settlement transactions and trader accounts
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                  <tr>
                    <th className="py-3 px-4">Receipt ID</th>
                    <th className="py-3 px-4">Pass Ref</th>
                    <th className="py-3 px-4">Net Scale Weight</th>
                    <th className="py-3 px-4">Quality</th>
                    <th className="py-3 px-4">Auction Rate</th>
                    <th className="py-3 px-4">Gross Payout</th>
                    <th className="py-3 px-4">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-navy-border">
                  {transactions.map((t) => (
                    <tr key={t.Transaction_ID} className="hover:bg-mint-light/20">
                      <td className="py-3 px-4 font-bold">#TX-{t.Transaction_ID}</td>
                      <td className="py-3 px-4 font-bold text-forest">
                        {t.Gate_Pass_Token || `#BK-${t.Booking_ID}`}
                      </td>
                      <td className="py-3 px-4 font-bold">{t.Actual_Weight_Tons} MT</td>
                      <td className="py-3 px-4">{t.Quality_Grade}</td>
                      <td className="py-3 px-4">₹{Number(t.Price_Per_Ton).toLocaleString()}/T</td>
                      <td className="py-3 px-4 font-black text-forest">
                        ₹{Number(t.Total_Amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                            t.Payment_Status === 'Released' || t.Payment_Status === 'PAID'
                              ? 'bg-mint-foam text-forest border-navy-border'
                              : 'bg-saffron text-navy-border border-navy-border'
                          }`}
                        >
                          {t.Payment_Status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-500 font-semibold">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: USER & ROLE MANAGEMENT (P1 ADMIN RBAC)
          ========================================================================= */}
      {activeTab === 'users' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold text-forest uppercase">
                <Users className="w-4 h-4" />
                <span>RBAC Security Administration</span>
              </div>
              <h2 className="text-xl font-display font-black text-navy-border mt-0.5">
                User Accounts &amp; Access Controls
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Authorized administrators can promote eligible producers or demote admins with safeguards
              </p>
            </div>

            <button
              onClick={() => loadUsersList()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mint-foam hover:bg-mint-light text-navy-border border border-navy-border font-mono text-xs font-bold active:translate-y-0.5 transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-forest" />
              <span>Refresh Users</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name, username or email..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value);
                  setUsersPage(1);
                  loadUsersList(1, e.target.value, usersRoleFilter);
                }}
                className="w-full h-10 pl-9 pr-3 bg-white border border-navy-border rounded-xl font-mono text-xs font-bold text-navy-border shadow-sm focus:outline-none focus:border-forest"
              />
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500 font-bold">Role:</span>
              <select
                value={usersRoleFilter}
                onChange={(e) => {
                  setUsersRoleFilter(e.target.value);
                  setUsersPage(1);
                  loadUsersList(1, usersSearch, e.target.value);
                }}
                className="h-10 px-3 bg-white border border-navy-border rounded-xl font-mono text-xs font-bold shadow-sm"
              >
                <option value="ALL">All Roles</option>
                <option value="Admin">Administrators (Admin)</option>
                <option value="Mandi_Officer">Mandi Officers</option>
                <option value="Farmer">Producers / Farmers</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                <tr>
                  <th className="py-3 px-4">UID</th>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Current Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Privilege Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-navy-border">
                {loadingUsers ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading user accounts from database...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-semibold">
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = authUser?.userId && Number(u.User_ID) === Number(authUser.userId);
                    const isAdmin = u.User_Role === 'Admin';

                    return (
                      <tr key={u.User_ID} className="hover:bg-mint-light/20">
                        <td className="py-3 px-4 font-bold text-slate-500">#{u.User_ID}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-navy-border flex items-center gap-1.5">
                            <span>{u.Full_Name || u.Username}</span>
                            {u.Google_Sub && (
                              <span className="px-1.5 py-0.2 bg-blue-50 text-blue-600 text-[9px] font-bold rounded border border-blue-200">
                                Google
                              </span>
                            )}
                            {isSelf && (
                              <span className="px-1.5 py-0.2 bg-saffron text-navy-border text-[9px] font-black rounded border border-navy-border">
                                YOU
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">@{u.Username}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {u.Email || 'No email registered'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase border inline-flex items-center gap-1 ${
                            u.User_Role === 'Admin' ? 'bg-coral/30 text-coral-dark border-coral-dark' :
                            u.User_Role === 'Mandi_Officer' ? 'bg-indigo-100 text-indigo-800 border-indigo-400' :
                            'bg-mint-foam text-forest border-forest'
                          }`}>
                            {u.User_Role === 'Admin' && <ShieldCheck className="w-3 h-3" />}
                            <span>{u.User_Role}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{u.Account_Status || 'Active'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {u.Created_At ? new Date(u.Created_At).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isAdmin ? (
                            <button
                              onClick={() => {
                                setRoleModalUser(u);
                                setRoleModalTargetRole('Farmer');
                                setRoleModalError('');
                              }}
                              disabled={isSelf}
                              title={isSelf ? 'You cannot demote your own account' : 'Demote this administrator to Farmer'}
                              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${
                                isSelf
                                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                  : 'bg-white hover:bg-coral/30 text-coral-dark border-coral shadow-sm active:translate-y-0.5'
                              }`}
                            >
                              Demote to Farmer
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setRoleModalUser(u);
                                setRoleModalTargetRole('Admin');
                                setRoleModalError('');
                              }}
                              className="px-3 py-1 rounded-lg bg-saffron hover:bg-saffron-dark text-navy-border border border-navy-border text-xs font-black shadow-sm active:translate-y-0.5 transition-all inline-flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Promote to Admin</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {usersPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 font-mono text-xs">
              <span className="text-slate-500">
                Page {usersPagination.page} of {usersPagination.totalPages} ({usersPagination.total} total accounts)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={usersPage <= 1}
                  onClick={() => {
                    const next = Math.max(1, usersPage - 1);
                    setUsersPage(next);
                    loadUsersList(next);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-navy-border bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={usersPage >= usersPagination.totalPages}
                  onClick={() => {
                    const next = usersPage + 1;
                    setUsersPage(next);
                    loadUsersList(next);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-navy-border bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: SECURITY & AUDIT TRAIL
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold text-forest uppercase">
                <FileText className="w-4 h-4" />
                <span>Protected Audit Log</span>
              </div>
              <h2 className="text-xl font-display font-black text-navy-border mt-0.5">
                Administrative System Audit Trail
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Immutable records of user role updates, database resets, and administrative overrides
              </p>
            </div>

            <button
              onClick={() => loadAuditLogs()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-mint-foam hover:bg-mint-light text-navy-border border border-navy-border font-mono text-xs font-bold active:translate-y-0.5 transition-all shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5 text-forest" />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                <tr>
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Changed By</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-navy-border">
                {loadingAudit ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Loading audit records from database...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-semibold">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.Audit_ID} className="hover:bg-mint-light/20">
                      <td className="py-3 px-4 font-bold text-slate-500">#{log.Audit_ID}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {log.Changed_At ? new Date(log.Changed_At).toLocaleString() : 'Recent'}
                      </td>
                      <td className="py-3 px-4 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                          log.Operation_Type === 'ROLE_CHANGE' ? 'bg-saffron text-navy-border border border-navy-border' :
                          log.Operation_Type === 'DATABASE_RESET' ? 'bg-coral/30 text-coral-dark border border-coral' :
                          'bg-mint-foam text-forest border border-forest'
                        }`}>
                          {log.Operation_Type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{log.Table_Name} #{log.Record_ID}</td>
                      <td className="py-3 px-4 font-bold text-forest">{log.Changed_By}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                        {log.New_Data ? JSON.stringify(log.New_Data) : 'Completed'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONFIRMATION MODAL FOR ROLE PROMOTION / DEMOTION
          ========================================================================= */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`p-4 border-b-[2px] border-navy-border flex items-center justify-between ${
              roleModalTargetRole === 'Admin' ? 'bg-saffron-light' : 'bg-coral/30'
            }`}>
              <div className="flex items-center gap-2 font-display font-black text-sm uppercase text-navy-border">
                {roleModalTargetRole === 'Admin' ? (
                  <>
                    <ShieldCheck className="w-5 h-5 text-forest" />
                    <span>Confirm Promotion to Admin</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-coral-dark" />
                    <span>Confirm Demotion to Farmer</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="w-7 h-7 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-navy-border border border-navy-border"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 font-mono text-xs text-navy-border">
              {roleModalError && (
                <div className="p-3 bg-coral/60 border border-navy-border rounded-xl text-coral-dark font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{roleModalError}</span>
                </div>
              )}

              <div className="p-3.5 bg-canvas rounded-xl border border-navy-border/40 space-y-1.5">
                <div className="font-bold text-slate-500 uppercase text-[10px]">Target Account:</div>
                <div className="text-sm font-bold text-navy-border flex items-center justify-between">
                  <span>{roleModalUser.Full_Name || roleModalUser.Username}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-white border border-slate-300">
                    ID #{roleModalUser.User_ID}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] truncate">
                  Username: @{roleModalUser.Username} • Email: {roleModalUser.Email || 'None'}
                </div>
                <div className="text-[11px] font-bold text-forest">
                  Current Role: <span className="underline">{roleModalUser.User_Role}</span> → Target Role: <span className="underline">{roleModalTargetRole}</span>
                </div>
              </div>

              {roleModalTargetRole === 'Admin' ? (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-amber-900 text-[11px] leading-relaxed">
                  <strong>Administrative Permissions Granted:</strong> Promoting this user will grant them full access to all APMC mandis, slot quotas, financial settlements, database maintenance, and role promotions.
                </div>
              ) : (
                <div className="p-3.5 bg-coral/20 rounded-xl border border-coral text-coral-dark text-[11px] leading-relaxed">
                  <strong>Revocation Warning:</strong> Demoting this administrator will revoke all administrative capabilities and remove their access to the Mandi Officer Desk immediately.
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRoleModalUser(null)}
                  disabled={roleModalLoading}
                  className="flex-1 py-2.5 rounded-xl border-[2px] border-navy-border bg-white hover:bg-slate-100 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRoleUpdate}
                  disabled={roleModalLoading}
                  className={`flex-1 py-2.5 rounded-xl border-[2px] border-navy-border font-display font-black text-xs uppercase tracking-wider shadow-bento active:translate-y-0.5 transition-all text-white ${
                    roleModalTargetRole === 'Admin' ? 'bg-forest hover:bg-forest-light' : 'bg-coral-dark hover:bg-red-700'
                  }`}
                >
                  {roleModalLoading ? (
                    <span>Processing...</span>
                  ) : (
                    <span>Confirm {roleModalTargetRole === 'Admin' ? 'Promotion' : 'Demotion'}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Maintenance Section (Strictly restricted to Admin role) */}
      {authUser?.role === 'Admin' && (
        <div className="p-5 bg-canvas rounded-2xl border-[2px] border-dashed border-slate-300 space-y-3 font-mono text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-bold text-navy-border uppercase text-[11px]">System Maintenance Area</div>
              <div className="text-slate-500 text-[10.5px]">Reset test database to original 25+ seed records per table</div>
            </div>
            <button
              onClick={handleResetDatabase}
              disabled={resettingDb}
              className="px-4 py-2 rounded-xl bg-coral/40 hover:bg-coral-dark hover:text-white text-coral-dark border border-coral font-bold text-xs shadow-sm transition-colors"
            >
              {resettingDb ? 'Re-seeding database...' : 'Re-Seed Database'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPortalPage() {
  return (
    <Suspense fallback={
      <div className="py-16 text-center font-mono text-xs text-slate-500">
        Loading Mandi Operations Desk...
      </div>
    }>
      <AdminPortalContent />
    </Suspense>
  );
}
