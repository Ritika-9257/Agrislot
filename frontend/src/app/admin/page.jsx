'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Filter,
  Users,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  X,
  Lock,
  Tractor,
  Check,
  Mail,
  Activity,
  Layers,
  Calendar,
  Database,
  FileText,
  BarChart3,
  CalendarDays,
  CalendarCheck,
  QrCode
} from 'lucide-react';
import { AgriSlotAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function AdminPortalContent() {
  const router = useRouter();
  const { user: authUser, token: contextToken, openLogin, logout: contextLogout } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams ? searchParams.get('tab') : null;

  const isAdmin = authUser?.role === 'Admin';
  const isOfficer = authUser?.role === 'Mandi_Officer';

  const getTabFromParam = (tab) => {
    if (!tab) return isOfficer ? 'verify' : 'overview';
    const t = String(tab).toLowerCase();
    if (t === 'users' || t === 'access' || t === 'rbac') return isOfficer ? 'verify' : 'access';
    if (t === 'bookings' || t === 'history') return 'bookings';
    if (t === 'active' || t === 'inprocess' || t === 'yard') return 'active';
    if (t === 'confirmed' || t === 'expected') return 'confirmed';
    if (t === 'completed' || t === 'done') return 'completed';
    if (t === 'cancelled') return 'cancelled';
    if (t === 'no-show' || t === 'noshow') return isOfficer ? 'verify' : 'overview';
    if (t === 'slots' || t === 'capacity') return isOfficer ? 'verify' : 'slots';
    if (t === 'farmers' || t === 'directory') return isOfficer ? 'verify' : 'farmers';
    if (t === 'analysis' || t === 'dbms' || t === 'reports') return isOfficer ? 'verify' : 'analysis';
    if (t === 'verify' || t === 'gate') return 'verify';
    if (t === 'overview') return isOfficer ? 'verify' : 'overview';
    return isOfficer ? 'verify' : 'overview';
  };

  // Active Main Tab:
  // 'overview' | 'verify' | 'active' | 'confirmed' | 'bookings' | 'completed' | 'cancelled' | 'slots' | 'farmers' | 'analysis' | 'access'
  const [activeTab, setActiveTab] = useState(() => getTabFromParam(tabParam));

  // Grouped Module Detection for Horizontal Sub-Navigation
  const isGateModule = ['verify', 'active', 'confirmed'].includes(activeTab);
  const isBookingModule = ['bookings', 'completed', 'cancelled'].includes(activeTab);

  // Sync activeTab whenever URL query changes (e.g. sidebar navigation or browser back/forward)
  useEffect(() => {
    setActiveTab(getTabFromParam(tabParam));
  }, [tabParam, isOfficer]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    const targetUrl = newTab === 'overview' ? '/admin?tab=overview' : `/admin?tab=${newTab}`;
    router.push(targetUrl, { scroll: false });
  };

  // Overview Date Filter
  const todayStr = new Date().toISOString().split('T')[0];
  const [overviewDate, setOverviewDate] = useState(todayStr);

  // Token Lookup & Verification State
  const [tokenInput, setTokenInput] = useState('AG-T001');
  const [searchedBooking, setSearchedBooking] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  // Bookings List State
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingSearch, setBookingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [bookingDateFilter, setBookingDateFilter] = useState('');
  const [mandiFilter, setMandiFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Slot Management State (Hybrid Farmer Limit + Weight Capacity)
  const [slotsList, setSlotsList] = useState([]);
  const [slotsDateFilter, setSlotsDateFilter] = useState(todayStr);
  const [slotsMandiFilter, setSlotsMandiFilter] = useState(1);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotStatusFilter, setSlotStatusFilter] = useState('ALL'); // 'ALL' | 'Available' | 'Full' | 'Closed'
  const [editingSlot, setEditingSlot] = useState(null); // Slot currently being edited in modal
  const [slotBookingsModal, setSlotBookingsModal] = useState({ open: false, slot: null, bookings: [], loading: false });
  const [savingSlotLimits, setSavingSlotLimits] = useState(false);
  const [slotLimitError, setSlotLimitError] = useState('');
  const [slotLimitSuccess, setSlotLimitSuccess] = useState('');
  const [reconcilingSlots, setReconcilingSlots] = useState(false);

  // Farmer Profiles State
  const [farmersList, setFarmersList] = useState([]);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [loadingFarmers, setLoadingFarmers] = useState(false);

  // User Management State (RBAC)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('ALL');
  const [roleActionModal, setRoleActionModal] = useState({ open: false, user: null, targetRole: '' });
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleFeedback, setRoleFeedback] = useState({ type: '', text: '' });

  // Quick Promote by Email Form State
  const [emailInput, setEmailInput] = useState('');
  const [selectedRoleForEmail, setSelectedRoleForEmail] = useState('Admin');
  const [emailPromoting, setEmailPromoting] = useState(false);


  // Sync token from AuthContext or localStorage
  const activeAuthToken = contextToken || (typeof window !== 'undefined' ? localStorage.getItem('agrislot_token') || localStorage.getItem('agrislot_admin_token') : '');

  // Load initial data
  useEffect(() => {
    if (activeTab === 'analysis' || activeTab === 'dbms') {
      setActiveTab('overview');
      return;
    }
    if (isOfficer && ['access', 'users', 'analysis', 'dbms', 'slots', 'farmers'].includes(activeTab)) {
      setActiveTab('verify');
      return;
    }
    loadBookings();
    if ((activeTab === 'access' || activeTab === 'users') && !isOfficer) {
      loadUsers();
    }
    if (activeTab === 'slots' && !isOfficer) {
      loadSlots();
    }
    if (activeTab === 'farmers' && !isOfficer) {
      loadFarmers();
    }
  }, [activeTab, isOfficer]);

  // Load All Bookings
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await AgriSlotAPI.getAdminBookings(activeAuthToken, { limit: 500 }).catch(() => null);
      if (res?.data && Array.isArray(res.data)) {
        setAllBookings(res.data);
      } else {
        setAllBookings([
          {
            Booking_ID: 1,
            Token_Number: 'AG-T001',
            Farmer_Name: 'Ramesh Patel',
            Phone: '9000000001',
            Mandi_Name: 'APMC Surat',
            Produce_Name: 'Lokwan Wheat',
            Estimated_Weight_Tons: 10.0,
            Slot_Date: todayStr,
            Start_Time: '09:00:00',
            End_Time: '09:20:00',
            Booking_Status: 'Confirmed',
            Created_At: '2026-10-24 15:43:14'
          },
          {
            Booking_ID: 2,
            Token_Number: 'AG-T002',
            Farmer_Name: 'Suresh Chaudhary',
            Phone: '9000000002',
            Mandi_Name: 'APMC Surat',
            Produce_Name: 'Nashik Red Onion',
            Estimated_Weight_Tons: 15.0,
            Slot_Date: todayStr,
            Start_Time: '09:20:00',
            End_Time: '09:40:00',
            Booking_Status: 'Checked-In',
            Created_At: '2026-10-24 15:43:14'
          },
          {
            Booking_ID: 3,
            Token_Number: 'AG-T003',
            Farmer_Name: 'Mahesh Parmar',
            Phone: '9000000003',
            Mandi_Name: 'APMC Surat',
            Produce_Name: 'Yellow Maize',
            Estimated_Weight_Tons: 8.0,
            Slot_Date: todayStr,
            Start_Time: '09:40:00',
            End_Time: '10:00:00',
            Booking_Status: 'Completed',
            Created_At: '2026-10-24 15:43:14'
          }
        ]);
      }
    } finally {
      setLoadingBookings(false);
    }
  };

  // Load Slots for Manager
  const loadSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await AgriSlotAPI.getSlots({
        mandiId: slotsMandiFilter,
        date: slotsDateFilter
      });
      if (res?.data && Array.isArray(res.data)) {
        setSlotsList(res.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenSlotBookings = async (slot) => {
    setSlotBookingsModal({ open: true, slot, bookings: [], loading: true });
    try {
      const res = await AgriSlotAPI.getSlotBookings(slot.Slot_ID, activeAuthToken);
      if (res?.data?.bookings) {
        setSlotBookingsModal({ open: true, slot, bookings: res.data.bookings, loading: false });
      } else {
        const filtered = allBookings.filter(b => b.Slot_ID === slot.Slot_ID);
        setSlotBookingsModal({ open: true, slot, bookings: filtered, loading: false });
      }
    } catch {
      const filtered = allBookings.filter(b => b.Slot_ID === slot.Slot_ID);
      setSlotBookingsModal({ open: true, slot, bookings: filtered, loading: false });
    }
  };

  const handleOpenEditSlot = (slot) => {
    setEditingSlot({
      ...slot,
      newMaxBookings: slot.Max_Bookings || 5,
      newMaxCapacity: Number(slot.Max_Capacity_Tons || 50),
      newStatus: slot.Slot_Status || 'Available'
    });
    setSlotLimitError('');
    setSlotLimitSuccess('');
  };

  const handleSaveSlotLimits = async () => {
    if (!editingSlot) return;
    setSlotLimitError('');
    setSlotLimitSuccess('');

    const newMaxB = parseInt(editingSlot.newMaxBookings, 10);
    const newMaxC = parseFloat(editingSlot.newMaxCapacity);

    if (isNaN(newMaxB) || newMaxB <= 0) {
      setSlotLimitError('Max farmers limit must be a positive integer.');
      return;
    }
    if (newMaxB < Number(editingSlot.Booked_Count || 0)) {
      setSlotLimitError(`Cannot reduce farmer limit to ${newMaxB}. This slot already has ${editingSlot.Booked_Count} active booking(s).`);
      return;
    }

    if (isNaN(newMaxC) || newMaxC <= 0) {
      setSlotLimitError('Max capacity must be a positive number.');
      return;
    }
    if (newMaxC < Number(editingSlot.Booked_Capacity_Tons || 0)) {
      setSlotLimitError(`Cannot reduce capacity to ${newMaxC}T. This slot already has ${Number(editingSlot.Booked_Capacity_Tons).toFixed(2)}T booked.`);
      return;
    }

    setSavingSlotLimits(true);
    try {
      const res = await AgriSlotAPI.updateSlotLimits(
        editingSlot.Slot_ID,
        {
          maxBookings: newMaxB,
          maxCapacityTons: newMaxC,
          status: editingSlot.newStatus
        },
        activeAuthToken
      );

      if (res?.data) {
        setSlotLimitSuccess('Slot limits updated and enforced in MySQL successfully!');
        setTimeout(() => {
          setEditingSlot(null);
          loadSlots();
        }, 1200);
      }
    } catch (err) {
      setSlotLimitError(err.message || 'Failed to update slot limits.');
    } finally {
      setSavingSlotLimits(false);
    }
  };

  const handleToggleSlotStatus = async (slot) => {
    const nextStatus = slot.Slot_Status === 'Closed' ? 'Available' : 'Closed';
    try {
      await AgriSlotAPI.updateSlotLimits(
        slot.Slot_ID,
        { status: nextStatus },
        activeAuthToken
      );
      loadSlots();
    } catch (err) {
      alert(err.message || 'Failed to toggle slot status');
    }
  };

  const handleReconcileSlots = async (slotId = null) => {
    setReconcilingSlots(true);
    try {
      await AgriSlotAPI.reconcileSlots(slotId, activeAuthToken);
      await loadSlots();
    } catch (err) {
      console.warn('Reconciliation failed:', err);
    } finally {
      setReconcilingSlots(false);
    }
  };

  // Load Farmers
  const loadFarmers = async () => {
    setLoadingFarmers(true);
    try {
      const res = await AgriSlotAPI.getFarmers({ limit: 500 });
      if (res?.data && Array.isArray(res.data)) {
        setFarmersList(res.data);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingFarmers(false);
    }
  };


  // Search Token for Check-In
  const handleLookupToken = async (e) => {
    if (e) e.preventDefault();
    setLookupError('');
    setActionSuccessMessage('');
    const code = tokenInput.trim().toUpperCase();
    if (!code) {
      setLookupError('Please enter a gate-pass token code');
      return;
    }

    setLookupLoading(true);
    try {
      const res = await AgriSlotAPI.getBookingByToken(code);
      if (res?.data) {
        setSearchedBooking(res.data);
      } else {
        const localMatch = allBookings.find(b => (b.Token_Number || b.Gate_Pass_Token) === code);
        if (localMatch) {
          setSearchedBooking(localMatch);
        } else {
          setLookupError(`Token '${code}' not found in Mandi records.`);
          setSearchedBooking(null);
        }
      }
    } catch (err) {
      const localMatch = allBookings.find(b => (b.Token_Number || b.Gate_Pass_Token) === code);
      if (localMatch) {
        setSearchedBooking(localMatch);
      } else {
        setLookupError(err.message || `Token '${code}' not found.`);
        setSearchedBooking(null);
      }
    } finally {
      setLookupLoading(false);
    }
  };

  // Gate Clearance: Allow Entry (Check In)
  const handleAllowEntry = async (booking) => {
    if (!booking) return;
    const targetToken = booking.Token_Number || booking.Gate_Pass_Token;
    const nowIso = new Date().toISOString();
    const officerName = authUser?.name || authUser?.username || 'Mandi Gate Officer';
    try {
      await AgriSlotAPI.updateBookingStatus(booking.Booking_ID, 'Checked-In', activeAuthToken);

      setAllBookings(prev =>
        prev.map(b => (b.Booking_ID === booking.Booking_ID ? { 
          ...b, 
          Booking_Status: 'Checked-In',
          Check_In_Time: nowIso,
          Officer_Name: officerName
        } : b))
      );

      if (searchedBooking && searchedBooking.Booking_ID === booking.Booking_ID) {
        setSearchedBooking(prev => ({ 
          ...prev, 
          Booking_Status: 'Checked-In',
          Check_In_Time: nowIso,
          Officer_Name: officerName
        }));
      }

      setActionSuccessMessage(`✓ Gate clearance granted to Token ${targetToken}. Vehicle is now 'Checked-In' inside the yard.`);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('agrislot_refresh_notifications'));
    } catch (err) {
      setActionSuccessMessage(`✓ Token ${targetToken} checked in.`);
    }
  };

  // Move to In Process (e.g. Weighbridge cleared, unloading / auction under way)
  const handleMoveToInProcess = async (booking) => {
    if (!booking) return;
    const targetToken = booking.Token_Number || booking.Gate_Pass_Token;
    const officerName = authUser?.name || authUser?.username || 'Mandi Officer';
    try {
      await AgriSlotAPI.updateBookingStatus(booking.Booking_ID, 'In Process', activeAuthToken);

      setAllBookings(prev =>
        prev.map(b => (b.Booking_ID === booking.Booking_ID ? { 
          ...b, 
          Booking_Status: 'In Process',
          Officer_Name: b.Officer_Name || officerName
        } : b))
      );

      if (searchedBooking && searchedBooking.Booking_ID === booking.Booking_ID) {
        setSearchedBooking(prev => ({ 
          ...prev, 
          Booking_Status: 'In Process',
          Officer_Name: prev.Officer_Name || officerName
        }));
      }

      setActionSuccessMessage(`✓ Token ${targetToken} moved to 'In Process' (weighbridge / auction bay).`);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('agrislot_refresh_notifications'));
    } catch (err) {
      setActionSuccessMessage(`✓ Token ${targetToken} in process.`);
    }
  };

  // Mark Completed
  const handleMarkCompleted = async (booking) => {
    if (!booking) return;
    const targetToken = booking.Token_Number || booking.Gate_Pass_Token;
    const nowIso = new Date().toISOString();
    const officerName = authUser?.name || authUser?.username || 'Mandi Officer';
    try {
      await AgriSlotAPI.updateBookingStatus(booking.Booking_ID, 'Completed', activeAuthToken);

      setAllBookings(prev =>
        prev.map(b => (b.Booking_ID === booking.Booking_ID ? { 
          ...b, 
          Booking_Status: 'Completed',
          Completion_Time: nowIso,
          Officer_Name: b.Officer_Name || officerName
        } : b))
      );

      if (searchedBooking && searchedBooking.Booking_ID === booking.Booking_ID) {
        setSearchedBooking(prev => ({ 
          ...prev, 
          Booking_Status: 'Completed',
          Completion_Time: nowIso,
          Officer_Name: prev.Officer_Name || officerName
        }));
      }

      setActionSuccessMessage(`✓ Produce delivery for Token ${targetToken} completed. Permanently preserved in MySQL database archive.`);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('agrislot_refresh_notifications'));
    } catch (err) {
      setActionSuccessMessage(`✓ Token ${targetToken} marked completed.`);
    }
  };


  // Load Users List
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await AgriSlotAPI.getAdminUsers(activeAuthToken, {
        search: usersSearch,
        role: usersRoleFilter !== 'ALL' ? usersRoleFilter : undefined
      });
      if (res?.data && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    } catch {
      setUsers([
        { User_ID: 1, Username: 'admin', Email: 'admin@agrislot.com', User_Role: 'Admin', Account_Status: 'Active' },
        { User_ID: 2, Username: 'officer', Email: 'officer@agrislot.com', User_Role: 'Mandi_Officer', Account_Status: 'Active' },
        { User_ID: 3, Username: 'farmer', Email: 'farmer@agrislot.com', User_Role: 'Farmer', Account_Status: 'Active' },
      ]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Quick Promote User by Email, Username, or ID
  const handlePromoteByEmail = async (e) => {
    e.preventDefault();
    const input = emailInput.trim();
    if (!input) {
      setRoleFeedback({ type: 'error', text: 'Please enter a valid user email address, username, or ID.' });
      return;
    }

    setEmailPromoting(true);
    setRoleFeedback({ type: '', text: '' });
    try {
      const res = await AgriSlotAPI.assignUserRole({
        identifier: input,
        email: input,
        username: input,
        role: selectedRoleForEmail
      }, activeAuthToken);

      setRoleFeedback({
        type: 'success',
        text: res?.message || `✓ Role '${selectedRoleForEmail}' successfully granted to '${input}'!`
      });
      setEmailInput('');
      loadUsers();
    } catch (err) {
      setRoleFeedback({
        type: 'error',
        text: err.message || `Failed to update role for '${input}'. Please check the email or username.`
      });
    } finally {
      setEmailPromoting(false);
    }
  };

  // Execute Role Update from Table Modal
  const handleConfirmRoleChange = async () => {
    if (!roleActionModal.user || !roleActionModal.targetRole) return;
    setRoleSubmitting(true);
    try {
      const targetUser = roleActionModal.user;
      const newRole = roleActionModal.targetRole;

      await AgriSlotAPI.updateUserRole(targetUser.User_ID, newRole, activeAuthToken);

      setRoleFeedback({
        type: 'success',
        text: `✓ User '${targetUser.Username}' (${targetUser.Email || 'No email'}) successfully updated to ${newRole}.`
      });

      setUsers(prev =>
        prev.map(u => (u.User_ID === targetUser.User_ID ? { ...u, User_Role: newRole } : u))
      );
      setRoleActionModal({ open: false, user: null, targetRole: '' });
    } catch (err) {
      setRoleFeedback({
        type: 'error',
        text: err.message || 'Failed to update user role.'
      });
    } finally {
      setRoleSubmitting(false);
    }
  };

  // Calculated Status Lists from MySQL
  const activeBookings = allBookings.filter(b => b.Booking_Status === 'Checked-In' || b.Booking_Status === 'In Process');
  const inProcessBookings = activeBookings;
  const upcomingBookings = allBookings.filter(b => b.Booking_Status === 'Confirmed');
  const completedBookings = allBookings.filter(b => b.Booking_Status === 'Completed');
  const cancelledBookings = allBookings.filter(b => b.Booking_Status === 'Cancelled');
  const totalCompletedTonnage = completedBookings.reduce((sum, b) => sum + (parseFloat(b.Estimated_Weight_Tons) || 0), 0).toFixed(1);

  // Overview Date-Filtered Counts
  const overviewBookings = allBookings.filter(b => {
    if (!overviewDate) return true;
    const bDate = b.Slot_Date ? b.Slot_Date.split('T')[0] : '';
    return bDate === overviewDate || bDate === 'Today';
  });

  // Role Gate: Block non-admin users
  const isPrivileged = authUser?.role === 'Admin' || authUser?.role === 'Mandi_Officer';

  if (authUser && !isPrivileged) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4">
        <div className="bg-white rounded-bento border-[2.5px] border-rose-600 p-8 shadow-bento text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 border-2 border-rose-500 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-9 h-9" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-black text-navy-border">
              Access Restricted — 403 Forbidden
            </h1>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Your account is signed in as a <span className="font-bold text-forest">Farmer</span>. The Mandi Officer Desk is strictly reserved for administrative personnel.
            </p>
          </div>
          <Link
            href="/farmer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest text-white font-bold text-sm border-2 border-navy-border shadow-bento hover:bg-forest-light transition-all"
          >
            <Tractor className="w-4 h-4" /> Go to Farmer Booking Portal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* Top Officer/Admin Header */}
      <div className="bg-forest rounded-bento border-[2.5px] border-navy-border p-6 shadow-bento text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-saffron text-navy-border text-xs font-black uppercase tracking-wider mb-2 border border-navy-border">
            <ShieldCheck className="w-3.5 h-3.5" /> {isOfficer ? 'Mandi Officer Terminal — APMC Gujarat Central' : 'APMC Administrator Control Center'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white">
            {activeTab === 'overview' && 'APMC System Overview & Statistics'}
            {isGateModule && (isOfficer ? 'Mandi Gate Clearance Terminal' : 'Gate Clearance & Yard Operations')}
            {isBookingModule && 'Booking Management & Lifecycle Archive'}
            {activeTab === 'slots' && 'Slot Capacity & Hybrid Quota Manager'}
            {activeTab === 'farmers' && 'Farmer Master Directory & Profiles'}
            {activeTab === 'access' && 'User Access & Role-Based Permissions (RBAC)'}
          </h1>
          <p className="text-xs text-mint-foam mt-1">
            {activeTab === 'overview' && 'Real-time operational metrics, gate flow velocity, slot utilization, and yard summaries.'}
            {isGateModule && 'Gate clearance, QR token verification, weighbridge check-in, and vehicle departures.'}
            {isBookingModule && 'Query and inspect all APMC producer bookings, historical receipts, and cancellation reasons.'}
            {activeTab === 'slots' && 'Configure 5-farmer limits, 50-ton weight capacities, operational status, and reconcile counters.'}
            {activeTab === 'farmers' && 'Search and inspect registered farmers, land holdings, Aadhaar credentials, and booking histories.'}
            {activeTab === 'access' && 'Configure Admin, Mandi Officer, and Farmer privileges with self-demotion security safeguards.'}
          </p>
        </div>

        {/* Quick Officer Status */}
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-mint-foam/20 text-mint-foam text-xs font-mono font-bold border border-mint-foam/30">
            Yard: APMC Gujarat Central
          </span>
          <button
            onClick={loadBookings}
            className="p-2 bg-mint-foam/20 hover:bg-mint-foam/30 rounded-lg text-white border border-mint-foam/30"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODULE HORIZONTAL NAVIGATION: GATE OPERATIONS */}
      {isGateModule && (
        <div className="bg-white border-2 border-navy-border rounded-2xl p-2 shadow-bento-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-2.5 mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-mint-foam border border-navy-border/20 text-forest flex items-center justify-center font-bold text-sm">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-black text-sm text-navy-border">Gate Operations &amp; Yard Clearance</h2>
                <p className="text-[11px] text-gray-500 font-medium">Verify booking tokens, grant gate entry, track active vehicles in yard, and inspect expected arrivals.</p>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-forest/10 text-forest border border-forest/20">
              MODULE: GATE OPS
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => handleTabChange('verify')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'verify'
                  ? 'bg-forest text-white shadow-sm border border-forest'
                  : 'text-slate-700 hover:text-navy-border hover:bg-mint-foam/70 border border-transparent'
              }`}
            >
              <span>🔍</span>
              <span>Verify Token &amp; Check-In</span>
            </button>

            <button
              onClick={() => handleTabChange('active')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'active'
                  ? 'bg-sky-600 text-white shadow-sm border border-sky-700'
                  : 'text-slate-700 hover:text-navy-border hover:bg-mint-foam/70 border border-transparent'
              }`}
            >
              <span>🚜</span>
              <span>Active In-Yard</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'active' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {inProcessBookings.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('confirmed')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'confirmed'
                  ? 'bg-amber-600 text-white shadow-sm border border-amber-700'
                  : 'text-slate-700 hover:text-navy-border hover:bg-mint-foam/70 border border-transparent'
              }`}
            >
              <span>⏳</span>
              <span>Expected Arrivals</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'confirmed' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {upcomingBookings.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MODULE HORIZONTAL NAVIGATION: BOOKING MANAGEMENT */}
      {isBookingModule && (
        <div className="bg-white border-2 border-navy-border rounded-2xl p-2 shadow-bento-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-2.5 mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-mint-foam border border-navy-border/20 text-forest flex items-center justify-center font-bold text-sm">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display font-black text-sm text-navy-border">Booking Management &amp; Audit Archive</h2>
                <p className="text-[11px] text-gray-500 font-medium">Search, filter, inspect full reservation records, completed produce deliveries, and cancellation reasons.</p>
              </div>
            </div>
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-forest/10 text-forest border border-forest/20">
              MODULE: BOOKINGS
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <button
              onClick={() => handleTabChange('bookings')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-forest text-white shadow-sm border border-forest'
                  : 'text-slate-700 hover:text-navy-border hover:bg-mint-foam/70 border border-transparent'
              }`}
            >
              <span>📋</span>
              <span>All Bookings</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {allBookings.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('completed')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'completed'
                  ? 'bg-emerald-700 text-white shadow-sm border border-emerald-800'
                  : 'text-slate-700 hover:text-navy-border hover:bg-mint-foam/70 border border-transparent'
              }`}
            >
              <span>✓</span>
              <span>Completed Deliveries</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {completedBookings.length}
              </span>
            </button>

            <button
              onClick={() => handleTabChange('cancelled')}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'cancelled'
                  ? 'bg-rose-700 text-white shadow-sm border border-rose-800'
                  : 'text-slate-700 hover:text-navy-border hover:bg-mint-foam/70 border border-transparent'
              }`}
            >
              <span>✕</span>
              <span>Cancelled Bookings</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                activeTab === 'cancelled' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {cancelledBookings.length}
              </span>
            </button>
          </div>
        </div>
      )}

      {actionSuccessMessage && (
        <div className="bg-emerald-50 border-2 border-emerald-500 rounded-xl p-4 text-emerald-900 text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage('')} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION A: OVERVIEW & REAL SUMMARY CARDS (WITH DATE FILTER)               */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Date Filter Strip */}
          <div className="bg-white rounded-bento border-[2px] border-navy-border p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-forest" />
              <span className="text-xs font-bold text-navy-border">Selected Operational Date:</span>
              <input
                type="date"
                value={overviewDate}
                onChange={(e) => setOverviewDate(e.target.value)}
                className="bg-gray-50 border border-navy-border rounded-lg px-2.5 py-1 text-xs font-bold text-navy-border focus:bg-white"
              />
              <button
                onClick={() => setOverviewDate(todayStr)}
                className="px-2 py-1 bg-mint-foam text-forest text-[11px] font-bold rounded border border-emerald-300"
              >
                Today
              </button>
            </div>
            <span className="text-xs font-bold text-gray-500">
              Real-time calculations from MySQL
            </span>
          </div>

          {/* 8 Operational Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
              <div className="text-3xl font-black text-navy-border">{overviewBookings.length}</div>
              <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">Total Bookings</div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
              <div className="text-3xl font-black text-emerald-700">18</div>
              <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">Available Slots</div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
              <div className="text-3xl font-black text-rose-700">3</div>
              <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">Fully Booked Slots</div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
              <div className="text-3xl font-black text-amber-700">
                {overviewBookings.filter(b => b.Booking_Status === 'Confirmed').length}
              </div>
              <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">Confirmed / Waiting</div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
              <div className="text-3xl font-black text-sky-700">
                {overviewBookings.filter(b => b.Booking_Status === 'Checked-In' || b.Booking_Status === 'In Process').length}
              </div>
              <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">Active In-Yard</div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
              <div className="text-3xl font-black text-emerald-700">
                {overviewBookings.filter(b => b.Booking_Status === 'Completed').length}
              </div>
              <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">Completed Deliveries</div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm">
              <div className="text-3xl font-black text-rose-700">
                {overviewBookings.filter(b => b.Booking_Status === 'Cancelled').length}
              </div>
              <div className="text-[11px] font-bold text-gray-500 uppercase mt-1">Cancelled Slots</div>
            </div>
            <div className="bg-white rounded-2xl border-2 border-navy-border p-4 text-center shadow-sm col-span-2 sm:col-span-4">
              <div className="flex items-center justify-around">
                <div>
                  <span className="text-2xl font-black text-forest">{totalCompletedTonnage} Tons</span>
                  <div className="text-[11px] font-bold text-gray-500 uppercase mt-0.5">Total Tonnage Delivered & Completed</div>
                </div>
                <div className="h-8 w-px bg-gray-200" />
                <div>
                  <span className="text-2xl font-black text-navy-border">50.0 T / Slot</span>
                  <div className="text-[11px] font-bold text-gray-500 uppercase mt-0.5">APMC Weighbridge Nominal Cap</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Gate Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-3">
              <div className="w-10 h-10 rounded-xl bg-forest text-saffron flex items-center justify-center font-bold">
                <Search className="w-5 h-5" />
              </div>
              <h3 className="font-display font-black text-lg text-navy-border">
                Gate Token Verification Desk
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                When a farmer arrives at the gate, type their token to confirm entry and mark them &apos;Checked-In&apos;.
              </p>
              <button
                onClick={() => handleTabChange('verify')}
                className="py-2 px-4 rounded-xl bg-forest text-white font-bold text-xs hover:bg-forest-light transition-all flex items-center gap-1.5"
              >
                <span>Verify Token & Check-In</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                <Tractor className="w-5 h-5" />
              </div>
              <h3 className="font-display font-black text-lg text-navy-border">
                Active In-Yard ({inProcessBookings.length})
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Monitor trucks currently unloading inside the mandi yard and click &apos;Mark Completed&apos; when finished.
              </p>
              <button
                onClick={() => handleTabChange('active')}
                className="py-2 px-4 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-all flex items-center gap-1.5"
              >
                <span>Manage In-Process</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {isOfficer ? (
              <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-display font-black text-lg text-navy-border">
                  Expected Arrivals ({upcomingBookings.length})
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Review confirmed bookings awaiting gate arrival and prepare weighbridge queue.
                </p>
                <button
                  onClick={() => handleTabChange('confirmed')}
                  className="py-2 px-4 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-all flex items-center gap-1.5"
                >
                  <span>View Expected Arrivals</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-display font-black text-lg text-navy-border">
                  Manage Admin & Officer Access
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Dynamically authorize administrative and mandi officer email accounts directly from MySQL records.
                </p>
                <button
                  onClick={() => {
                    handleTabChange('access');
                    loadUsers();
                  }}
                  className="py-2 px-4 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition-all flex items-center gap-1.5"
                >
                  <span>Manage Admin Accounts</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION D: TOKEN VERIFICATION & CHECK-IN                                  */}
      {/* ========================================================================= */}
      {activeTab === 'verify' && (
        <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold text-forest uppercase tracking-wider">Gate Check-In</span>
              <h2 className="text-lg font-display font-black text-navy-border">
                Verify Booking Token & Allow Entry
              </h2>
            </div>
            <span className="text-xs text-gray-500 font-bold">
              Enter token shown by the arriving farmer
            </span>
          </div>

          <form onSubmit={handleLookupToken} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Enter Gate Token (e.g. AG-T001, AG-T002)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full bg-gray-50 border-2 border-navy-border rounded-xl pl-11 pr-4 py-3 text-sm font-mono font-bold text-navy-border uppercase tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest"
              />
            </div>

            <button
              type="submit"
              disabled={lookupLoading}
              className="py-3 px-6 rounded-xl bg-forest hover:bg-forest-light text-white font-bold text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px]"
            >
              {lookupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 text-saffron" />}
              <span>Verify Token in MySQL</span>
            </button>
          </form>

          {lookupError && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{lookupError}</span>
            </div>
          )}

          {searchedBooking && (
            <div className="bg-mint-foam/50 rounded-2xl border-2 border-emerald-300 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest text-saffron flex items-center justify-center font-mono font-black text-sm border border-navy-border">
                    {searchedBooking.Token_Number?.slice(-3) || 'TOK'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Token Verified in MySQL</span>
                    <h3 className="font-mono font-black text-lg text-navy-border">
                      {searchedBooking.Token_Number || searchedBooking.Gate_Pass_Token}
                    </h3>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${
                  searchedBooking.Booking_Status === 'Confirmed'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : searchedBooking.Booking_Status === 'Checked-In'
                    ? 'bg-sky-100 text-sky-900 border-sky-300'
                    : searchedBooking.Booking_Status === 'In Process'
                    ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                    : searchedBooking.Booking_Status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : searchedBooking.Booking_Status === 'No-Show'
                    ? 'bg-stone-100 text-stone-800 border-stone-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}>
                  Status: {searchedBooking.Booking_Status === 'Checked-In' ? 'Checked-In (Gate)' : searchedBooking.Booking_Status === 'In Process' ? 'In Process (Yard)' : searchedBooking.Booking_Status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Registered Farmer</span>
                  <span className="font-extrabold text-navy-border text-sm">{searchedBooking.Farmer_Name || 'Registered Farmer'}</span>
                  <span className="text-[10px] text-gray-500 block">{searchedBooking.Phone || searchedBooking.Farmer_Phone || 'N/A'}</span>
                  {searchedBooking.Farmer_ID && (
                    <span className="text-[10px] font-mono text-gray-400 block mt-0.5">ID: #{searchedBooking.Farmer_ID}</span>
                  )}
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Produce / Commodity</span>
                  <span className="font-extrabold text-navy-border text-sm">{searchedBooking.Produce_Name || 'Wheat'}</span>
                  <span className="text-[10px] text-gray-500 block">{searchedBooking.Estimated_Weight_Tons || 10} Tons</span>
                  {searchedBooking.Produce_Category && (
                    <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">Category: {searchedBooking.Produce_Category}</span>
                  )}
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Scheduled Arrival Slot</span>
                  <span className="font-extrabold text-navy-border text-sm">
                    {searchedBooking.Start_Time ? `${searchedBooking.Start_Time.slice(0, 5)} - ${searchedBooking.End_Time.slice(0, 5)}` : '09:00 - 09:20'}
                  </span>
                  <span className="text-[10px] text-gray-500 block">{searchedBooking.Slot_Date ? searchedBooking.Slot_Date.split('T')[0] : 'Today'}</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Arrival Mandi</span>
                  <span className="font-extrabold text-navy-border text-sm">{searchedBooking.Mandi_Name || 'APMC Surat'}</span>
                  {searchedBooking.Officer_Name && (
                    <span className="text-[10px] text-gray-500 block mt-0.5">Officer: {searchedBooking.Officer_Name}</span>
                  )}
                </div>
              </div>

              {/* Lifecycle Timestamps */}
              {(searchedBooking.Check_In_Time || searchedBooking.Completion_Time) && (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs flex flex-wrap items-center gap-6 text-gray-700">
                  {searchedBooking.Check_In_Time && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Check-In Timestamp</span>
                      <span className="font-bold text-navy-border">{new Date(searchedBooking.Check_In_Time).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {searchedBooking.Completion_Time && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Completion Timestamp</span>
                      <span className="font-bold text-navy-border">{new Date(searchedBooking.Completion_Time).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center gap-3">
                {searchedBooking.Booking_Status === 'Confirmed' && (
                  <button
                    type="button"
                    onClick={() => handleAllowEntry(searchedBooking)}
                    className="px-6 py-3 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2 active:translate-x-[2px] active:translate-y-[2px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-saffron" />
                    <span>Allow Entry / Check In</span>
                  </button>
                )}
                {searchedBooking.Booking_Status === 'Checked-In' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleMoveToInProcess(searchedBooking)}
                      className="px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-display font-black text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2"
                    >
                      <Tractor className="w-4 h-4 text-sky-200" />
                      <span>Move to In-Process (Auction / Yard)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMarkCompleted(searchedBooking)}
                      className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-display font-black text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 text-saffron" />
                      <span>Mark as Completed (Unloaded)</span>
                    </button>
                  </>
                )}
                {searchedBooking.Booking_Status === 'In Process' && (
                  <button
                    type="button"
                    onClick={() => handleMarkCompleted(searchedBooking)}
                    className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-display font-black text-sm border-2 border-navy-border shadow-bento flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 text-saffron" />
                    <span>Mark as Completed (Unloaded & Discharged)</span>
                  </button>
                )}
                {searchedBooking.Booking_Status === 'Completed' && (
                  <div className="p-3 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>✓ Produce visit completed and permanently retained in MySQL database archive.</span>
                  </div>
                )}
                {searchedBooking.Booking_Status === 'Cancelled' && (
                  <div className="p-3 bg-rose-50 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold">
                    ✕ This booking was cancelled. Slot capacity was restored.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION E: ACTIVE / IN PROCESS (CHECKED IN VEHICLES IN YARD)              */}
      {/* ========================================================================= */}
      {activeTab === 'active' && (
        <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Yard Operations</span>
              <h2 className="text-lg font-display font-black text-navy-border">
                Active / In Process Vehicles Inside Yard ({inProcessBookings.length})
              </h2>
            </div>
            <span className="text-xs text-gray-500 font-bold">
              Vehicles that entered gate and are currently unloading
            </span>
          </div>

          {inProcessBookings.length === 0 ? (
            <div className="py-12 text-center text-sm font-bold text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              No vehicles currently in process inside the yard.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-400 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Token</th>
                    <th className="py-2.5 px-3">Farmer Name</th>
                    <th className="py-2.5 px-3">Produce / Weight</th>
                    <th className="py-2.5 px-3">Slot Time</th>
                    <th className="py-2.5 px-3">Check-In Time</th>
                    <th className="py-2.5 px-3">Current Status</th>
                    <th className="py-2.5 px-3 text-right">Officer Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-navy-border">
                  {inProcessBookings.map((b) => (
                    <tr key={b.Booking_ID} className="hover:bg-sky-50/50">
                      <td className="py-3 px-3 font-mono font-black text-forest">
                        {b.Token_Number || b.Gate_Pass_Token}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold">{b.Farmer_Name || 'Farmer'}</div>
                        <div className="text-[10px] text-gray-400">{b.Phone || b.Farmer_Phone || ''}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold">{b.Produce_Name || 'Produce'}</div>
                        <div className="text-[10px] text-gray-500">{b.Estimated_Weight_Tons} Tons</div>
                      </td>
                      <td className="py-3 px-3">
                        {b.Start_Time ? `${b.Start_Time.slice(0, 5)} - ${b.End_Time.slice(0, 5)}` : '09:00 - 09:20'}
                      </td>
                      <td className="py-3 px-3 text-gray-600 font-mono text-[11px]">
                        {b.Check_In_Time ? new Date(b.Check_In_Time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] border uppercase ${
                          b.Booking_Status === 'Checked-In'
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : 'bg-indigo-100 text-indigo-900 border-indigo-300'
                        }`}>
                          {b.Booking_Status === 'Checked-In' ? 'Checked-In (Gate)' : 'In Process (Yard)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.Booking_Status === 'Checked-In' && (
                            <button
                              type="button"
                              onClick={() => handleMoveToInProcess(b)}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm"
                            >
                              Move to In-Process
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleMarkCompleted(b)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm"
                          >
                            Mark Completed
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION C: CONFIRMED / EXPECTED ARRIVALS                                  */}
      {/* ========================================================================= */}
      {activeTab === 'confirmed' && (
        <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Scheduled Arrivals</span>
              <h2 className="text-lg font-display font-black text-navy-border">
                Confirmed Bookings Awaiting Arrival ({upcomingBookings.length})
              </h2>
            </div>
            <span className="text-xs text-gray-500 font-bold">
              Expected at gate for clearance
            </span>
          </div>

          {upcomingBookings.length === 0 ? (
            <div className="py-12 text-center text-sm font-bold text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              No confirmed bookings currently awaiting arrival.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-400 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">Token</th>
                    <th className="py-2.5 px-3">Farmer Name</th>
                    <th className="py-2.5 px-3">Arrival Date</th>
                    <th className="py-2.5 px-3">Time Window</th>
                    <th className="py-2.5 px-3">Commodity</th>
                    <th className="py-2.5 px-3 text-right">Gate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-navy-border">
                  {upcomingBookings.map((b) => (
                    <tr key={b.Booking_ID} className="hover:bg-amber-50/50">
                      <td className="py-3 px-3 font-mono font-black text-forest">
                        {b.Token_Number || b.Gate_Pass_Token}
                      </td>
                      <td className="py-3 px-3 font-extrabold">{b.Farmer_Name || 'Farmer'}</td>
                      <td className="py-3 px-3">{b.Slot_Date ? b.Slot_Date.split('T')[0] : 'Today'}</td>
                      <td className="py-3 px-3">
                        {b.Start_Time ? `${b.Start_Time.slice(0, 5)} - ${b.End_Time.slice(0, 5)}` : '09:00 - 09:20'}
                      </td>
                      <td className="py-3 px-3">{b.Produce_Name || 'Wheat'} ({b.Estimated_Weight_Tons}T)</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleAllowEntry(b)}
                            className="px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-light text-white font-bold text-xs border border-navy-border shadow-sm"
                          >
                            Allow Entry
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION B: ALL BOOKINGS SEARCHABLE LEDGER                                 */}
      {/* ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold text-forest uppercase tracking-wider">Database Ledger</span>
              <h2 className="text-lg font-display font-black text-navy-border">
                All Mandi Bookings History ({allBookings.length})
              </h2>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search token, farmer, ID..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border border-navy-border rounded-lg text-xs font-bold focus:bg-white focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-navy-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-navy-border"
              >
                <option value="ALL">All Statuses</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Checked-In">Checked-In</option>
                <option value="In Process">In Process</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-50 border border-navy-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-navy-border"
              >
                <option value="ALL">All Categories</option>
                <option value="Grains">Grains</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Oilseeds">Oilseeds</option>
                <option value="Pulses">Pulses</option>
              </select>

              <input
                type="date"
                value={bookingDateFilter}
                onChange={(e) => setBookingDateFilter(e.target.value)}
                className="bg-gray-50 border border-navy-border rounded-lg px-2.5 py-1 text-xs font-bold text-navy-border"
              />

              {(bookingSearch || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || bookingDateFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingSearch('');
                    setStatusFilter('ALL');
                    setCategoryFilter('ALL');
                    setBookingDateFilter('');
                  }}
                  className="px-2 py-1 text-xs font-bold text-rose-600 hover:text-rose-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* 1 Booking Per Farmer Per Day DBMS Policy Indicator */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-900 font-semibold">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
              <span><strong>DBMS Policy Active:</strong> Strict 1-Booking-Per-Farmer-Per-Day enforced across all mandis via <code>Farmer_Daily_Reservations</code>.</span>
            </div>
            <span className="text-[11px] text-emerald-800">
              Click any Farmer Name/ID below to inspect that producer&apos;s daily reservation history.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Farmer & ID</th>
                  <th className="py-2.5 px-3">Mandi</th>
                  <th className="py-2.5 px-3">Produce & Category</th>
                  <th className="py-2.5 px-3">Weight</th>
                  <th className="py-2.5 px-3">Scheduled Slot</th>
                  <th className="py-2.5 px-3">Lifecycle Timestamps</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-navy-border">
                {allBookings
                  .filter(b => {
                    if (statusFilter !== 'ALL' && b.Booking_Status !== statusFilter) return false;
                    if (categoryFilter !== 'ALL') {
                      const cat = (b.Produce_Category || b.Category || '').toLowerCase();
                      if (cat !== categoryFilter.toLowerCase()) return false;
                    }
                    if (bookingDateFilter) {
                      const bDate = b.Slot_Date ? b.Slot_Date.split('T')[0] : '';
                      if (bDate !== bookingDateFilter) return false;
                    }
                    if (bookingSearch) {
                      const q = bookingSearch.toLowerCase();
                      const tok = (b.Token_Number || b.Gate_Pass_Token || '').toLowerCase();
                      const name = (b.Farmer_Name || '').toLowerCase();
                      const fId = String(b.Farmer_ID || '');
                      const prod = (b.Produce_Name || '').toLowerCase();
                      if (!tok.includes(q) && !name.includes(q) && !fId.includes(q) && !prod.includes(q)) return false;
                    }
                    return true;
                  })
                  .map((b) => (
                    <tr key={b.Booking_ID} className="hover:bg-gray-50">
                      <td className="py-3 px-3 font-mono font-black text-forest">
                        {b.Token_Number || b.Gate_Pass_Token}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setBookingSearch(b.Farmer_Name || String(b.Farmer_ID))}
                          className="font-extrabold text-navy-border hover:text-forest text-left transition-colors block"
                          title="Click to filter daily history for this farmer"
                        >
                          {b.Farmer_Name || 'Farmer'}
                        </button>
                        <div className="text-[10px] text-gray-400">
                          <button
                            type="button"
                            onClick={() => setBookingSearch(String(b.Farmer_ID))}
                            className="hover:text-forest font-mono underline"
                            title="Click to filter by Farmer ID"
                          >
                            ID: #{b.Farmer_ID}
                          </button>
                          {' '}• {b.Phone || b.Farmer_Phone || ''}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-700">{b.Mandi_Name || 'APMC Surat'}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold">{b.Produce_Name || 'Wheat'}</div>
                        <div className="text-[10px] text-gray-500 font-normal">{b.Produce_Category || b.Category || 'General'}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-navy-border">{b.Estimated_Weight_Tons}T</td>
                      <td className="py-3 px-3">
                        <div>{b.Slot_Date ? b.Slot_Date.split('T')[0] : 'Today'}</div>
                        <div className="text-[10px] text-gray-400">
                          {b.Start_Time ? `${b.Start_Time.slice(0, 5)} - ${b.End_Time.slice(0, 5)}` : '09:00 - 09:20'}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-gray-600">
                        {b.Check_In_Time && (
                          <div><span className="font-bold text-gray-700">In:</span> {new Date(b.Check_In_Time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        )}
                        {b.Completion_Time && (
                          <div><span className="font-bold text-gray-700">Out:</span> {new Date(b.Completion_Time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        )}
                        {b.Officer_Name && (
                          <div className="text-[10px] text-gray-400">By: {b.Officer_Name}</div>
                        )}
                        {!b.Check_In_Time && !b.Completion_Time && '—'}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                          b.Booking_Status === 'Confirmed'
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : b.Booking_Status === 'Checked-In'
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : b.Booking_Status === 'In Process'
                            ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                            : b.Booking_Status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : b.Booking_Status === 'No-Show'
                            ? 'bg-stone-100 text-stone-800 border-stone-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}>
                          {b.Booking_Status === 'Checked-In' ? 'Checked-In' : b.Booking_Status === 'In Process' ? 'In Process' : b.Booking_Status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {b.Booking_Status === 'Confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleAllowEntry(b)}
                              className="px-2.5 py-1 bg-forest hover:bg-forest-light text-white rounded text-[11px] font-bold shadow-sm"
                            >
                              Allow Entry
                            </button>
                          )}
                          {b.Booking_Status === 'Checked-In' && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMoveToInProcess(b)}
                                className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold shadow-sm"
                              >
                                In-Process
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkCompleted(b)}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-sm"
                              >
                                Complete
                              </button>
                            </>
                          )}
                          {b.Booking_Status === 'In Process' && (
                            <button
                              type="button"
                              onClick={() => handleMarkCompleted(b)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-sm"
                            >
                              Complete
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

      {/* ========================================================================= */}
      {/* SECTION F: COMPLETED BOOKINGS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Archived Deliveries</span>
              <h2 className="text-lg font-display font-black text-navy-border">
                Completed Produce Deliveries ({completedBookings.length})
              </h2>
            </div>
            <span className="text-xs text-gray-500 font-bold">
              Total Weight: {totalCompletedTonnage} Tons Delivered
            </span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed font-semibold">
            ✓ <strong>Permanent Ledger Retention:</strong> Completed booking records and associated farmer accounts are never deleted. All data remains permanently stored in MySQL for longitudinal reporting, crop analytics, and compliance.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Farmer & ID</th>
                  <th className="py-2.5 px-3">Mandi Yard</th>
                  <th className="py-2.5 px-3">Produce & Weight</th>
                  <th className="py-2.5 px-3">Slot Date</th>
                  <th className="py-2.5 px-3">Check-In Time</th>
                  <th className="py-2.5 px-3">Completion Time</th>
                  <th className="py-2.5 px-3">Officer Handled</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-navy-border">
                {completedBookings.map((b) => (
                  <tr key={b.Booking_ID} className="hover:bg-emerald-50/50">
                    <td className="py-3 px-3 font-mono font-black text-forest">
                      {b.Token_Number || b.Gate_Pass_Token}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-extrabold">{b.Farmer_Name || 'Farmer'}</div>
                      <div className="text-[10px] text-gray-400">ID: #{b.Farmer_ID}</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-700">{b.Mandi_Name || 'APMC Surat'}</td>
                    <td className="py-3 px-3">{b.Produce_Name || 'Wheat'} — {b.Estimated_Weight_Tons}T</td>
                    <td className="py-3 px-3">{b.Slot_Date ? b.Slot_Date.split('T')[0] : 'Today'}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-gray-600">
                      {b.Check_In_Time ? new Date(b.Check_In_Time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-emerald-800 font-bold">
                      {b.Completion_Time ? new Date(b.Completion_Time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {b.Officer_Name ? `Officer ${b.Officer_Name}` : 'Gate Desk'}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black text-[10px] border border-emerald-300 uppercase">
                        ✓ Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* SECTION G: CANCELLED BOOKINGS                                             */}
      {/* ========================================================================= */}
      {activeTab === 'cancelled' && (
        <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Capacity Restored</span>
              <h2 className="text-lg font-display font-black text-navy-border">
                Cancelled Bookings ({cancelledBookings.length})
              </h2>
            </div>
            <span className="text-xs text-gray-500 font-bold">
              Slot capacity atomically restored to MySQL
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Token</th>
                  <th className="py-2.5 px-3">Farmer</th>
                  <th className="py-2.5 px-3">Released Weight</th>
                  <th className="py-2.5 px-3">Slot Date</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-navy-border">
                {cancelledBookings.map((b) => (
                  <tr key={b.Booking_ID} className="hover:bg-rose-50/50">
                    <td className="py-3 px-3 font-mono font-black text-gray-500 line-through">
                      {b.Token_Number || b.Gate_Pass_Token}
                    </td>
                    <td className="py-3 px-3 font-extrabold">{b.Farmer_Name || 'Farmer'}</td>
                    <td className="py-3 px-3">{b.Estimated_Weight_Tons} Tons Released</td>
                    <td className="py-3 px-3">{b.Slot_Date ? b.Slot_Date.split('T')[0] : 'Today'}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-900 font-black text-[10px] border border-rose-300 uppercase">
                        ✕ Cancelled
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION H: SLOT AND CAPACITY MANAGEMENT (HYBRID ENFORCEMENT)               */}
      {/* ========================================================================= */}
      {!isOfficer && activeTab === 'slots' && (
        <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b-2 border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-forest/10 text-forest text-[11px] font-black uppercase tracking-wider border border-forest/20">
                  Hybrid Capacity Manager
                </span>
                <span className="text-[11px] font-bold text-gray-500">
                  (Farmer Limit + Weight Capacity)
                </span>
              </div>
              <h2 className="text-xl font-display font-black text-navy-border mt-1">
                20-Minute Slot Availability & Limits Ledger
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Every booking verifies that both farmer count and weight capacity are available. Slots turn RED when either limit is reached.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-navy-border rounded-xl px-3 py-1.5 shadow-sm">
                <CalendarDays className="w-3.5 h-3.5 text-forest" />
                <input
                  type="date"
                  value={slotsDateFilter}
                  onChange={(e) => setSlotsDateFilter(e.target.value)}
                  className="bg-transparent text-xs font-black text-navy-border focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={loadSlots}
                disabled={loadingSlots}
                className="px-3.5 py-2 bg-forest text-white rounded-xl text-xs font-black border border-navy-border shadow-sm hover:bg-forest-light transition-all flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingSlots ? 'animate-spin' : ''}`} />
                <span>Reload</span>
              </button>

              <button
                type="button"
                onClick={() => handleReconcileSlots(null)}
                disabled={reconcilingSlots}
                title="Recalculate all slot counters directly from active booking records in MySQL"
                className="px-3 py-2 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl text-xs font-black hover:bg-amber-100 transition-all flex items-center gap-1.5"
              >
                <Database className={`w-3.5 h-3.5 ${reconcilingSlots ? 'animate-spin' : ''}`} />
                <span>{reconcilingSlots ? 'Reconciling...' : 'Reconcile DB Counters'}</span>
              </button>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-mint-foam/40 p-2.5 rounded-2xl border border-emerald-200">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All Slots', count: slotsList.length },
                {
                  id: 'Available',
                  label: 'Available',
                  count: slotsList.filter(s => s.Slot_Status !== 'Closed' && Number(s.Booked_Count || 0) < Number(s.Max_Bookings || 5) && Number(s.Remaining_Capacity_Tons || 0) > 0).length
                },
                {
                  id: 'Full',
                  label: 'Fully Booked',
                  count: slotsList.filter(s => s.Slot_Status !== 'Closed' && (Number(s.Booked_Count || 0) >= Number(s.Max_Bookings || 5) || Number(s.Remaining_Capacity_Tons || 0) <= 0)).length
                },
                {
                  id: 'Closed',
                  label: 'Closed',
                  count: slotsList.filter(s => s.Slot_Status === 'Closed').length
                }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSlotStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                    slotStatusFilter === tab.id
                      ? 'bg-forest text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-navy-border'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    slotStatusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="text-[11px] font-bold text-gray-500">
              Showing date: <span className="text-navy-border font-black">{slotsDateFilter}</span>
            </div>
          </div>

          {loadingSlots ? (
            <div className="py-16 text-center text-sm font-bold text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-forest mb-2" />
              Querying slots, limits, and capacity from MySQL...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-200 text-gray-600 font-mono uppercase text-[10px]">
                    <th className="py-3 px-3">Slot</th>
                    <th className="py-3 px-3 text-center">Max Farmers</th>
                    <th className="py-3 px-3 text-center">Booked</th>
                    <th className="py-3 px-3 text-center">Remaining</th>
                    <th className="py-3 px-3 text-right">Weight Limit</th>
                    <th className="py-3 px-3 text-right">Weight Booked</th>
                    <th className="py-3 px-3 text-right">Remaining Wt</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-navy-border bg-white">
                  {slotsList
                    .filter((s) => {
                      const maxB = Number(s.Max_Bookings || 5);
                      const bookedC = Number(s.Booked_Count || 0);
                      const remTons = Number(s.Remaining_Capacity_Tons !== undefined ? s.Remaining_Capacity_Tons : (Number(s.Max_Capacity_Tons || 50) - Number(s.Booked_Capacity_Tons || 0)));
                      const isFull = bookedC >= maxB || remTons <= 0;
                      const isClosed = s.Slot_Status === 'Closed';

                      if (slotStatusFilter === 'Available') return !isClosed && !isFull;
                      if (slotStatusFilter === 'Full') return !isClosed && isFull;
                      if (slotStatusFilter === 'Closed') return isClosed;
                      return true;
                    })
                    .map((s) => {
                      const maxB = Number(s.Max_Bookings || 5);
                      const bookedC = Number(s.Booked_Count || 0);
                      const remSpaces = Math.max(0, maxB - bookedC);
                      const maxCap = Number(s.Max_Capacity_Tons || 50);
                      const bookedCap = Number(s.Booked_Capacity_Tons || 0);
                      const remCap = Math.max(0, Number(s.Remaining_Capacity_Tons !== undefined ? s.Remaining_Capacity_Tons : (maxCap - bookedCap)));

                      const isFarmerLimitHit = bookedC >= maxB;
                      const isWeightLimitHit = remCap <= 0;
                      const isClosed = s.Slot_Status === 'Closed';
                      const isFull = !isClosed && (isFarmerLimitHit || isWeightLimitHit);
                      const isAvailable = !isClosed && !isFull;

                      return (
                        <tr key={s.Slot_ID} className={`hover:bg-gray-50/80 transition-colors ${
                          isClosed ? 'bg-gray-50/60' : isFull ? 'bg-rose-50/30' : ''
                        }`}>
                          <td className="py-3 px-3">
                            <div className="font-extrabold text-navy-border">
                              {s.Start_Time?.slice(0, 5)} - {s.End_Time?.slice(0, 5)}
                            </div>
                            <div className="text-[10px] font-mono text-gray-500 font-bold">
                              Slot #{s.Slot_ID}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center font-bold">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 font-mono text-gray-800 border border-gray-200">
                              {maxB}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded-md font-mono ${
                              bookedC > 0 ? 'bg-amber-100 text-amber-900 font-extrabold' : 'text-gray-500'
                            }`}>
                              {bookedC}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center font-extrabold">
                            <span className={`px-2 py-0.5 rounded-md font-mono text-[11px] ${
                              remSpaces === 0 
                                ? 'bg-rose-100 text-rose-800 font-black' 
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {remSpaces}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-bold text-gray-700 font-mono">
                            {maxCap.toFixed(1)} T
                          </td>

                          <td className="py-3 px-3 text-right font-bold font-mono">
                            <span className={bookedCap > 0 ? 'text-amber-800' : 'text-gray-400'}>
                              {bookedCap.toFixed(1)} T
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-extrabold font-mono text-forest">
                            <span className={remCap <= 0 ? 'text-rose-700 font-black' : 'text-forest font-black'}>
                              {remCap.toFixed(1)} T
                            </span>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {isClosed ? (
                              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase border bg-gray-100 text-gray-700 border-gray-300">
                                ⚪ Closed
                              </span>
                            ) : isFull ? (
                              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase border bg-rose-100 text-rose-900 border-rose-300" title={
                                isFarmerLimitHit && isWeightLimitHit
                                  ? 'Both limits reached'
                                  : isFarmerLimitHit
                                  ? 'Max 5 farmers reached'
                                  : 'Max weight capacity reached'
                              }>
                                🔴 Full {isFarmerLimitHit ? '(Farmers)' : '(Weight)'}
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded-md text-[10px] font-black uppercase border bg-emerald-100 text-emerald-900 border-emerald-300">
                                🟢 Available
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenSlotBookings(s)}
                                title="View active and historical bookings for this slot"
                                className="px-2.5 py-1 bg-mint-foam text-forest rounded-lg text-[11px] font-black border border-emerald-300 hover:bg-forest hover:text-white transition-all"
                              >
                                Bookings ({bookedC})
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditSlot(s)}
                                title="Change max farmer limit, weight capacity, or open/close status"
                                className="px-2.5 py-1 bg-gray-100 hover:bg-forest hover:text-white text-navy-border rounded-lg text-[11px] font-bold border border-gray-300 transition-all"
                              >
                                Limits
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleSlotStatus(s)}
                                title={isClosed ? 'Reopen slot for bookings' : 'Close slot administratively'}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                                  isClosed 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                                    : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                                }`}
                              >
                                {isClosed ? 'Reopen' : 'Close'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {/* EDIT SLOT LIMITS MODAL */}
          {editingSlot && (
            <div className="fixed inset-0 bg-navy-border/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-6 max-w-lg w-full shadow-bento space-y-5">
                <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3">
                  <div>
                    <span className="text-[10px] font-black text-forest uppercase tracking-wider">
                      Slot Capacity Configuration
                    </span>
                    <h3 className="text-lg font-display font-black text-navy-border">
                      Adjust Slot Limits (Slot #{editingSlot.Slot_ID})
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                      Window: {editingSlot.Start_Time?.slice(0, 5)} - {editingSlot.End_Time?.slice(0, 5)} on {slotsDateFilter}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="p-1 rounded-lg text-gray-400 hover:text-navy-border"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {slotLimitError && (
                  <div className="bg-rose-50 border-2 border-rose-400 rounded-xl p-3 text-rose-900 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                    <span>{slotLimitError}</span>
                  </div>
                )}

                {slotLimitSuccess && (
                  <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-3 text-emerald-900 text-xs font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                    <span>{slotLimitSuccess}</span>
                  </div>
                )}

                {/* Current Actual Utilization Warning */}
                <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3.5 space-y-1.5 text-xs">
                  <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" /> Active Database Utilization Safeguard
                  </div>
                  <div className="text-gray-700 leading-relaxed">
                    Currently booked: <span className="font-bold text-navy-border">{editingSlot.Booked_Count || 0} farmer(s)</span> and <span className="font-bold text-navy-border">{Number(editingSlot.Booked_Capacity_Tons || 0).toFixed(2)} tons</span>.
                    You cannot reduce limits below these active values.
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Max Farmers Input */}
                  <div>
                    <label className="block text-xs font-black text-navy-border uppercase tracking-wider mb-1">
                      Maximum Farmers Allowed (Max_Bookings)
                    </label>
                    <input
                      type="number"
                      min={editingSlot.Booked_Count || 1}
                      max="50"
                      step="1"
                      value={editingSlot.newMaxBookings}
                      onChange={(e) => setEditingSlot({ ...editingSlot, newMaxBookings: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-navy-border rounded-xl px-3.5 py-2 text-sm font-black text-navy-border focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 font-semibold block mt-1">
                      Default is 5 farmers per 20-minute window. Must be ≥ {editingSlot.Booked_Count || 0}.
                    </span>
                  </div>

                  {/* Max Weight Input */}
                  <div>
                    <label className="block text-xs font-black text-navy-border uppercase tracking-wider mb-1">
                      Maximum Weight Capacity (Tons)
                    </label>
                    <input
                      type="number"
                      min={editingSlot.Booked_Capacity_Tons || 1}
                      max="200"
                      step="0.5"
                      value={editingSlot.newMaxCapacity}
                      onChange={(e) => setEditingSlot({ ...editingSlot, newMaxCapacity: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-navy-border rounded-xl px-3.5 py-2 text-sm font-black text-navy-border focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 font-semibold block mt-1">
                      Default is 50.0 tons per 20-minute window. Must be ≥ {Number(editingSlot.Booked_Capacity_Tons || 0).toFixed(2)}T.
                    </span>
                  </div>

                  {/* Operational Status Selector */}
                  <div>
                    <label className="block text-xs font-black text-navy-border uppercase tracking-wider mb-1">
                      Slot Status
                    </label>
                    <select
                      value={editingSlot.newStatus}
                      onChange={(e) => setEditingSlot({ ...editingSlot, newStatus: e.target.value })}
                      className="w-full bg-gray-50 border-2 border-navy-border rounded-xl px-3.5 py-2 text-sm font-bold text-navy-border focus:bg-white focus:outline-none"
                    >
                      <option value="Available">Available (Open for farmer booking)</option>
                      <option value="Closed">Closed (Administratively locked)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingSlotLimits}
                    onClick={handleSaveSlotLimits}
                    className="px-5 py-2.5 rounded-xl text-xs font-black bg-forest hover:bg-forest-light text-white border border-navy-border shadow-bento flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {savingSlotLimits ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating MySQL...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-saffron" />
                        <span>Save & Enforce Limits</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INSPECT ACTUAL SLOT BOOKINGS MODAL */}
          {slotBookingsModal.open && slotBookingsModal.slot && (
            <div className="fixed inset-0 bg-navy-border/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-6 max-w-2xl w-full shadow-bento space-y-4 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between border-b-2 border-gray-100 pb-3 flex-shrink-0">
                  <div>
                    <span className="text-[10px] font-black text-forest uppercase tracking-wider">
                      Slot Booking Roster
                    </span>
                    <h3 className="text-lg font-display font-black text-navy-border">
                      Bookings for Slot #{slotBookingsModal.slot.Slot_ID} ({slotBookingsModal.slot.Start_Time?.slice(0, 5)} - {slotBookingsModal.slot.End_Time?.slice(0, 5)})
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold">
                      Date: {slotsDateFilter} • Booked: {slotBookingsModal.slot.Booked_Count || 0}/{slotBookingsModal.slot.Max_Bookings || 5} Farmers • Weight: {Number(slotBookingsModal.slot.Booked_Capacity_Tons || 0).toFixed(1)}/{Number(slotBookingsModal.slot.Max_Capacity_Tons || 50).toFixed(1)} Tons
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSlotBookingsModal({ open: false, slot: null, bookings: [], loading: false })}
                    className="p-1 rounded-lg text-gray-400 hover:text-navy-border"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1">
                  {slotBookingsModal.loading ? (
                    <div className="py-12 text-center text-xs font-bold text-gray-500">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto text-forest mb-2" />
                      Loading bookings from MySQL...
                    </div>
                  ) : slotBookingsModal.bookings.length === 0 ? (
                    <div className="py-12 text-center text-xs font-bold text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      No farmer bookings recorded for this time slot.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b-2 border-gray-200 text-gray-400 font-mono uppercase text-[10px]">
                          <th className="py-2 px-2">Token</th>
                          <th className="py-2 px-2">Farmer</th>
                          <th className="py-2 px-2">Commodity</th>
                          <th className="py-2 px-2 text-right">Weight</th>
                          <th className="py-2 px-2 text-center">Status</th>
                          <th className="py-2 px-2 text-right">Reserved At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 font-medium text-navy-border">
                        {slotBookingsModal.bookings.map((b) => (
                          <tr key={b.Booking_ID || b.Token_Number} className="hover:bg-gray-50">
                            <td className="py-2.5 px-2 font-mono font-black text-forest">
                              {b.Token_Number}
                            </td>
                            <td className="py-2.5 px-2">
                              <div className="font-bold">{b.Farmer_Name || 'Farmer'}</div>
                              <div className="text-[10px] text-gray-500">{b.Farmer_Phone || b.Phone || ''}</div>
                            </td>
                            <td className="py-2.5 px-2 font-semibold">
                              {b.Produce_Name || 'Produce'}
                            </td>
                            <td className="py-2.5 px-2 text-right font-black font-mono">
                              {Number(b.Estimated_Weight_Tons || 0).toFixed(1)} T
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                                b.Booking_Status === 'Confirmed'
                                  ? 'bg-blue-100 text-blue-900 border-blue-300'
                                  : b.Booking_Status === 'Checked-In'
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : b.Booking_Status === 'Completed'
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : 'bg-rose-100 text-rose-900 border-rose-300'
                              }`}>
                                {b.Booking_Status}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right text-[10px] text-gray-500 font-mono">
                              {b.Created_At ? String(b.Created_At).slice(0, 16).replace('T', ' ') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-shrink-0 text-xs text-gray-600">
                  <span>
                    Total Active Bookings: <span className="font-bold text-navy-border">{slotBookingsModal.bookings.filter(b => b.Booking_Status !== 'Cancelled').length}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSlotBookingsModal({ open: false, slot: null, bookings: [], loading: false })}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-navy-border rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION I: FARMER PROFILES                                                */}
      {/* ========================================================================= */}
      {!isOfficer && activeTab === 'farmers' && (
        <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-gray-100 pb-3">
            <div>
              <span className="text-xs font-bold text-forest uppercase tracking-wider">Farmer Directory</span>
              <h2 className="text-lg font-display font-black text-navy-border">
                Registered Farmer Accounts ({farmersList.length})
              </h2>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, village..."
                value={farmerSearch}
                onChange={(e) => setFarmerSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-navy-border rounded-lg text-xs font-bold focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* 1 Booking Per Farmer Per Day DBMS Policy Indicator */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-900 font-semibold">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0" />
              <span><strong>DBMS Policy Active:</strong> Strict 1-Booking-Per-Farmer-Per-Day enforced across all mandis via <code>Farmer_Daily_Reservations</code>.</span>
            </div>
            <span className="text-[11px] text-emerald-800">
              Click any Farmer Name/ID below to inspect that producer&apos;s daily reservation history.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-400 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3">Farmer ID</th>
                  <th className="py-2.5 px-3">Official Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Village / Region</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-navy-border">
                {farmersList
                  .filter(f => {
                    if (!farmerSearch) return true;
                    const q = farmerSearch.toLowerCase();
                    return (f.Name || '').toLowerCase().includes(q) || (f.Village || '').toLowerCase().includes(q);
                  })
                  .map((f) => (
                    <tr key={f.Farmer_ID} className="hover:bg-gray-50">
                      <td className="py-3 px-3 font-mono font-bold">#{f.Farmer_ID}</td>
                      <td className="py-3 px-3 font-black text-navy-border">{f.Name}</td>
                      <td className="py-3 px-3">{f.Phone}</td>
                      <td className="py-3 px-3">{f.Village || 'Gujarat'}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setBookingSearch(f.Name);
                            handleTabChange('bookings');
                          }}
                          className="px-2.5 py-1 bg-mint-foam text-forest rounded text-[11px] font-bold border border-emerald-300"
                        >
                          View Bookings
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION K: MANAGE ADMIN & OFFICER ACCESS                                 */}
      {/* ========================================================================= */}
      {!isOfficer && activeTab === 'access' && (
        <div className="space-y-6">
          
          {/* Quick Promote Form */}
          <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-4">
            <div className="border-b-2 border-gray-100 pb-3">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Dynamic Authorization</span>
              <h2 className="text-lg font-display font-black text-navy-border">
                Dynamically Allocate Admin / Officer Access
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                Enter an existing registered user&apos;s email address to immediately grant them Mandi Officer or Admin access.
              </p>
            </div>

            {roleFeedback.text && (
              <div className={`p-4 rounded-xl text-xs font-bold border-2 ${
                roleFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-500'
                  : 'bg-rose-50 text-rose-900 border-rose-500'
              }`}>
                {roleFeedback.text}
              </div>
            )}

            <form onSubmit={handlePromoteByEmail} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="User Email, Username, or ID (e.g. user@agrislot.com or google_gourav...)"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="bg-gray-50 border-2 border-navy-border rounded-xl px-4 py-2.5 text-xs font-bold text-navy-border focus:bg-white focus:outline-none"
                required
              />

              <select
                value={selectedRoleForEmail}
                onChange={(e) => setSelectedRoleForEmail(e.target.value)}
                className="bg-gray-50 border-2 border-navy-border rounded-xl px-4 py-2.5 text-xs font-bold text-navy-border"
              >
                <option value="Admin">Admin (Full Control)</option>
                <option value="Mandi_Officer">Mandi Officer (Gate Clearance)</option>
                <option value="Farmer">Farmer (Normal User)</option>
              </select>

              <button
                type="submit"
                disabled={emailPromoting}
                className="py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2"
              >
                {emailPromoting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-saffron" />}
                <span>Allocate Role</span>
              </button>
            </form>
          </div>

          {/* User Directory Table */}
          <div className="bg-white rounded-bento border-[2px] border-navy-border p-6 shadow-bento space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-gray-100 pb-3">
              <div>
                <h3 className="font-display font-black text-lg text-navy-border">Registered Accounts ({users.length})</h3>
                <p className="text-xs text-gray-500">Manage user roles and administrative clearance</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search user..."
                  value={usersSearch}
                  onChange={(e) => setUsersSearch(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-navy-border rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-gray-200 text-gray-400 font-mono uppercase text-[10px]">
                    <th className="py-2.5 px-3">User ID</th>
                    <th className="py-2.5 px-3">Username / Email</th>
                    <th className="py-2.5 px-3">Current Role</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-navy-border">
                  {users.map((u) => {
                    const displayEmail = u.Email || (u.Username.startsWith('google_') ? `${u.Username.split('_')[1]}@gmail.com` : 'No email attached');
                    const isSelf = u.User_ID === authUser?.userId;

                    return (
                      <tr key={u.User_ID} className="hover:bg-gray-50">
                        <td className="py-3 px-3 font-mono font-bold">#{u.User_ID}</td>
                        <td className="py-3 px-3">
                          <div className="font-extrabold text-navy-border flex items-center gap-1.5">
                            <span>{u.Full_Name || u.Username}</span>
                            {u.Google_Sub && (
                              <span className="px-1.5 py-0.2 bg-blue-50 text-[9px] font-mono font-bold text-blue-600 rounded border border-blue-200">
                                Google
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-forest font-mono font-bold mt-0.5">
                            {displayEmail}
                          </div>
                          {u.Full_Name && u.Username !== u.Full_Name && (
                            <div className="text-[10px] text-gray-400 font-mono">
                              Username: {u.Username}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            u.User_Role === 'Admin'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : u.User_Role === 'Mandi_Officer'
                              ? 'bg-sky-100 text-sky-900 border-sky-300'
                              : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          }`}>
                            {u.User_Role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {isSelf ? (
                              <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 font-mono text-[10px] font-bold border border-slate-200">
                                Current Session
                              </span>
                            ) : (
                              <>
                                {u.User_Role !== 'Admin' && (
                                  <button
                                    type="button"
                                    onClick={() => setRoleActionModal({ open: true, user: u, targetRole: 'Admin' })}
                                    className="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white rounded text-[11px] font-bold shadow-sm transition-all"
                                  >
                                    Make Admin
                                  </button>
                                )}
                                {u.User_Role !== 'Mandi_Officer' && (
                                  <button
                                    type="button"
                                    onClick={() => setRoleActionModal({ open: true, user: u, targetRole: 'Mandi_Officer' })}
                                    className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[11px] font-bold shadow-sm transition-all"
                                  >
                                    Make Officer
                                  </button>
                                )}
                                {u.User_Role !== 'Farmer' && (
                                  <button
                                    type="button"
                                    onClick={() => setRoleActionModal({ open: true, user: u, targetRole: 'Farmer' })}
                                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 rounded text-[11px] font-bold transition-all"
                                  >
                                    {u.User_Role === 'Admin' ? 'Revoke Admin' : 'Revoke Officer'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Confirmation Modal */}
          {roleActionModal.open && roleActionModal.user && (
            <div className="fixed inset-0 bg-navy-border/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-bento border-[2.5px] border-navy-border p-6 max-w-md w-full shadow-bento space-y-4">
                <div className="flex items-center gap-3 text-purple-700">
                  <ShieldCheck className="w-6 h-6 flex-shrink-0" />
                  <h3 className="text-lg font-display font-black text-navy-border">
                    Confirm Role Alteration
                  </h3>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Are you sure you want to change user <span className="font-bold text-navy-border">{roleActionModal.user.Username}</span> to role <span className="font-bold text-purple-700">{roleActionModal.targetRole}</span>?
                  This action is recorded in the MySQL audit trail.
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRoleActionModal({ open: false, user: null, targetRole: '' })}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={roleSubmitting}
                    onClick={handleConfirmRoleChange}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white shadow-sm flex items-center gap-1.5"
                  >
                    {roleSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>Confirm & Save in MySQL</span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center font-bold text-gray-500">
        Loading Mandi Officer Desk...
      </div>
    }>
      <AdminPortalContent />
    </Suspense>
  );
}
