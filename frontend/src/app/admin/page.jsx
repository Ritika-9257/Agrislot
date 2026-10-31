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
  Tractor,
  Store,
  Plus,
  Trash2,
  Edit3,
  Database,
  Sparkles,
  Code2
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

  // Active Sub-view:
  // 'terminal' | 'bookings' | 'mandis' | 'slots' | 'produce' | 'farmers' | 'capacity' | 'transactions' | 'users' | 'audit' | 'viva'
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

  // Mandis Management State
  const [mandis, setMandis] = useState([]);
  const [loadingMandis, setLoadingMandis] = useState(false);
  const [mandiSearch, setMandiSearch] = useState('');
  const [mandiDistrictFilter, setMandiDistrictFilter] = useState('ALL');
  const [mandiModal, setMandiModal] = useState({ open: false, mode: 'create', data: null });
  const [mandiForm, setMandiForm] = useState({ Mandi_Name: '', Location: '', District: 'Surat', Total_Daily_Capacity_Tons: 500 });
  const [mandiSaving, setMandiSaving] = useState(false);

  // Slots Management State
  const [slotsList, setSlotsList] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedMandiForSlots, setSelectedMandiForSlots] = useState('1');
  const [slotDateFilter, setSlotDateFilter] = useState('');
  const [slotModal, setSlotModal] = useState({ open: false, mode: 'create', data: null });
  const [slotForm, setSlotForm] = useState({ Mandi_ID: 1, Slot_Date: '', Start_Time: '08:00:00', End_Time: '12:00:00', Max_Capacity_Tons: 50 });
  const [slotSaving, setSlotSaving] = useState(false);

  // Produce Management State
  const [produceList, setProduceList] = useState([]);
  const [loadingProduce, setLoadingProduce] = useState(false);
  const [produceCategoryFilter, setProduceCategoryFilter] = useState('ALL');
  const [produceModal, setProduceModal] = useState({ open: false, mode: 'create', data: null });
  const [produceForm, setProduceForm] = useState({ Produce_Name: '', Category: 'Grains', Storage_Type: 'Dry' });
  const [produceSaving, setProduceSaving] = useState(false);

  // Farmers Directory State (Using Stored Procedures Insert_Farmer, Update_Farmer, Delete_Farmer)
  const [farmersList, setFarmersList] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [farmerModal, setFarmerModal] = useState({ open: false, mode: 'create', data: null });
  const [farmerForm, setFarmerForm] = useState({ Name: '', Phone: '', Aadhar_No: '', UPI_ID: '', Village: '' });
  const [farmerSaving, setFarmerSaving] = useState(false);

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

  // Traders & Warehouses Quick Add
  const [newTraderForm, setNewTraderForm] = useState({ Name: '', License_No: '', Phone: '' });
  const [newWarehouseForm, setNewWarehouseForm] = useState({ Mandi_ID: 1, Warehouse_Type: 'Dry Storage', Total_Capacity: 1000 });
  const [addingLogistics, setAddingLogistics] = useState(false);

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

  // DBMS Showcase / Viva State
  const [vivaMode, setVivaMode] = useState('procedures'); // 'procedures' | 'views' | 'concepts'
  const [vivaTarget, setVivaTarget] = useState('Total_Weight_By_Farmer');
  const [vivaResult, setVivaResult] = useState(null);
  const [loadingViva, setLoadingViva] = useState(false);
  const [vivaExplanation, setVivaExplanation] = useState('');

  // Set active tab from query param if available
  useEffect(() => {
    const validTabs = ['terminal', 'bookings', 'mandis', 'slots', 'produce', 'farmers', 'capacity', 'transactions', 'users', 'audit', 'viva'];
    if (tabParam && validTabs.includes(tabParam)) {
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
    loadMandisList();
  }, [authToken]);

  // Load data on tab switch
  useEffect(() => {
    if (!authToken) return;
    if (activeTab === 'users') {
      loadUsersList();
    } else if (activeTab === 'audit') {
      loadAuditLogs();
    } else if (activeTab === 'mandis') {
      loadMandisList();
    } else if (activeTab === 'slots') {
      loadSlotsList();
    } else if (activeTab === 'produce') {
      loadProduceList();
    } else if (activeTab === 'farmers') {
      loadFarmersList();
    } else if (activeTab === 'viva') {
      runVivaQuery(vivaTarget);
    }
  }, [authToken, activeTab, usersPage, usersRoleFilter, selectedMandiForSlots, slotDateFilter, farmerSearch, produceCategoryFilter]);

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

  // --- MANDIS MODULE ---
  const loadMandisList = async () => {
    try {
      setLoadingMandis(true);
      const res = await AgriSlotAPI.getMandis();
      if (res.data) {
        setMandis(res.data);
      }
    } catch (err) {
      console.warn('Mandis load error:', err.message);
    } finally {
      setLoadingMandis(false);
    }
  };

  const handleOpenMandiModal = (mode = 'create', data = null) => {
    if (mode === 'edit' && data) {
      setMandiForm({
        Mandi_Name: data.Mandi_Name || '',
        Location: data.Location || '',
        District: data.District || 'Surat',
        Total_Daily_Capacity_Tons: Number(data.Total_Daily_Capacity_Tons) || 500
      });
      setMandiModal({ open: true, mode: 'edit', data });
    } else {
      setMandiForm({ Mandi_Name: '', Location: '', District: 'Surat', Total_Daily_Capacity_Tons: 500 });
      setMandiModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSaveMandi = async (e) => {
    e.preventDefault();
    setMandiSaving(true);
    try {
      if (mandiModal.mode === 'edit') {
        await AgriSlotAPI.updateMandi(mandiModal.data.Mandi_ID, mandiForm, authToken);
        setRoleActionToast(`Mandi #${mandiModal.data.Mandi_ID} updated successfully!`);
      } else {
        await AgriSlotAPI.createMandi(mandiForm, authToken);
        setRoleActionToast(`New Mandi "${mandiForm.Mandi_Name}" created successfully!`);
      }
      setMandiModal({ open: false, mode: 'create', data: null });
      loadMandisList();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Mandi save failed: ${err.message}`);
    } finally {
      setMandiSaving(false);
    }
  };

  const handleDeleteMandi = async (mandiId, mandiName) => {
    if (!confirm(`Are you sure you want to delete Mandi "${mandiName}" (#${mandiId})? This will delete the record from MySQL.`)) {
      return;
    }
    try {
      await AgriSlotAPI.deleteMandi(mandiId, authToken);
      setRoleActionToast(`Mandi #${mandiId} deleted successfully!`);
      loadMandisList();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // --- SLOTS MODULE ---
  const loadSlotsList = async () => {
    try {
      setLoadingSlots(true);
      const params = {};
      if (selectedMandiForSlots && selectedMandiForSlots !== 'ALL') {
        params.mandiId = selectedMandiForSlots;
      }
      if (slotDateFilter) {
        params.date = slotDateFilter;
      }
      const res = await AgriSlotAPI.getSlots(params);
      if (res.data) {
        setSlotsList(res.data);
      }
    } catch (err) {
      console.warn('Slots load error:', err.message);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenSlotModal = (mode = 'create', data = null) => {
    if (mode === 'edit' && data) {
      const rawDate = data.Slot_Date ? data.Slot_Date.split('T')[0] : '';
      setSlotForm({
        Mandi_ID: data.Mandi_ID,
        Slot_Date: rawDate,
        Start_Time: data.Start_Time || '08:00:00',
        End_Time: data.End_Time || '12:00:00',
        Max_Capacity_Tons: Number(data.Max_Capacity_Tons) || 50
      });
      setSlotModal({ open: true, mode: 'edit', data });
    } else {
      const today = new Date().toISOString().split('T')[0];
      setSlotForm({
        Mandi_ID: selectedMandiForSlots && selectedMandiForSlots !== 'ALL' ? Number(selectedMandiForSlots) : 1,
        Slot_Date: today,
        Start_Time: '08:00:00',
        End_Time: '12:00:00',
        Max_Capacity_Tons: 50
      });
      setSlotModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    setSlotSaving(true);
    try {
      if (slotModal.mode === 'edit') {
        await AgriSlotAPI.updateSlot(slotModal.data.Slot_ID, slotForm, authToken);
        setRoleActionToast(`Slot #${slotModal.data.Slot_ID} updated successfully!`);
      } else {
        await AgriSlotAPI.createSlot(slotForm, authToken);
        setRoleActionToast(`New Slot for Mandi #${slotForm.Mandi_ID} on ${slotForm.Slot_Date} created!`);
      }
      setSlotModal({ open: false, mode: 'create', data: null });
      loadSlotsList();
      loadUtilizationData();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Slot save failed: ${err.message}`);
    } finally {
      setSlotSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm(`Are you sure you want to delete Slot #${slotId}? Note: Slots with existing bookings cannot be deleted.`)) {
      return;
    }
    try {
      await AgriSlotAPI.deleteSlot(slotId, authToken);
      setRoleActionToast(`Slot #${slotId} deleted successfully!`);
      loadSlotsList();
      loadUtilizationData();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // --- PRODUCE CATALOG MODULE ---
  const loadProduceList = async () => {
    try {
      setLoadingProduce(true);
      const cat = produceCategoryFilter !== 'ALL' ? produceCategoryFilter : undefined;
      const res = await AgriSlotAPI.getProduce(cat);
      if (res.data) {
        setProduceList(res.data);
      }
    } catch (err) {
      console.warn('Produce load error:', err.message);
    } finally {
      setLoadingProduce(false);
    }
  };

  const handleOpenProduceModal = (mode = 'create', data = null) => {
    if (mode === 'edit' && data) {
      setProduceForm({
        Produce_Name: data.Produce_Name || '',
        Category: data.Category || 'Grains',
        Storage_Type: data.Storage_Type || 'Dry'
      });
      setProduceModal({ open: true, mode: 'edit', data });
    } else {
      setProduceForm({ Produce_Name: '', Category: 'Grains', Storage_Type: 'Dry' });
      setProduceModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSaveProduce = async (e) => {
    e.preventDefault();
    setProduceSaving(true);
    try {
      if (produceModal.mode === 'edit') {
        await AgriSlotAPI.updateProduce(produceModal.data.Produce_ID, produceForm, authToken);
        setRoleActionToast(`Produce #${produceModal.data.Produce_ID} updated successfully!`);
      } else {
        await AgriSlotAPI.createProduce(produceForm, authToken);
        setRoleActionToast(`New Produce "${produceForm.Produce_Name}" added to catalog!`);
      }
      setProduceModal({ open: false, mode: 'create', data: null });
      loadProduceList();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Produce save failed: ${err.message}`);
    } finally {
      setProduceSaving(false);
    }
  };

  const handleDeleteProduce = async (produceId, produceName) => {
    if (!confirm(`Are you sure you want to delete "${produceName}" (#${produceId})?`)) {
      return;
    }
    try {
      await AgriSlotAPI.deleteProduce(produceId, authToken);
      setRoleActionToast(`Produce item #${produceId} deleted successfully!`);
      loadProduceList();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // --- FARMERS DIRECTORY MODULE (Stored Procedures) ---
  const loadFarmersList = async () => {
    try {
      setLoadingFarmers(true);
      const res = await AgriSlotAPI.getFarmers({ search: farmerSearch, limit: 100 });
      if (res.data) {
        setFarmersList(res.data.items || res.data || []);
      }
    } catch (err) {
      console.warn('Farmers load error:', err.message);
    } finally {
      setLoadingFarmers(false);
    }
  };

  const handleOpenFarmerModal = (mode = 'create', data = null) => {
    if (mode === 'edit' && data) {
      setFarmerForm({
        Name: data.Name || data.Full_Name || '',
        Phone: data.Phone || data.Phone_Number || '',
        Aadhar_No: data.Aadhar_No || '',
        UPI_ID: data.UPI_ID || '',
        Village: data.Village || ''
      });
      setFarmerModal({ open: true, mode: 'edit', data });
    } else {
      setFarmerForm({ Name: '', Phone: '', Aadhar_No: '', UPI_ID: '', Village: '' });
      setFarmerModal({ open: true, mode: 'create', data: null });
    }
  };

  const handleSaveFarmer = async (e) => {
    e.preventDefault();
    setFarmerSaving(true);
    try {
      if (farmerModal.mode === 'edit') {
        await AgriSlotAPI.updateFarmerAdmin(farmerModal.data.Farmer_ID, farmerForm, authToken);
        setRoleActionToast(`Farmer #${farmerModal.data.Farmer_ID} updated via Stored Procedure Update_Farmer!`);
      } else {
        await AgriSlotAPI.createFarmerAdmin(farmerForm, authToken);
        setRoleActionToast(`Farmer "${farmerForm.Name}" inserted via Stored Procedure Insert_Farmer!`);
      }
      setFarmerModal({ open: false, mode: 'create', data: null });
      loadFarmersList();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Farmer operation failed: ${err.message}`);
    } finally {
      setFarmerSaving(false);
    }
  };

  const handleDeleteFarmer = async (farmerId, farmerName) => {
    if (!confirm(`Are you sure you want to delete Farmer "${farmerName}" (#${farmerId})? This executes MySQL Stored Procedure Delete_Farmer.`)) {
      return;
    }
    try {
      await AgriSlotAPI.deleteFarmerAdmin(farmerId, authToken);
      setRoleActionToast(`Farmer #${farmerId} deleted via Stored Procedure Delete_Farmer!`);
      loadFarmersList();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // --- TRADERS & WAREHOUSES CREATION ---
  const handleAddTrader = async (e) => {
    e.preventDefault();
    setAddingLogistics(true);
    try {
      await AgriSlotAPI.createTrader(newTraderForm, authToken);
      setNewTraderForm({ Name: '', License_No: '', Phone: '' });
      setRoleActionToast(`Trader "${newTraderForm.Name}" registered successfully!`);
      loadTransactionsData();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Add Trader failed: ${err.message}`);
    } finally {
      setAddingLogistics(false);
    }
  };

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    setAddingLogistics(true);
    try {
      await AgriSlotAPI.createWarehouse(newWarehouseForm, authToken);
      setNewWarehouseForm({ Mandi_ID: 1, Warehouse_Type: 'Dry Storage', Total_Capacity: 1000 });
      setRoleActionToast(`Warehouse registered for Mandi #${newWarehouseForm.Mandi_ID}!`);
      loadTransactionsData();
      setTimeout(() => setRoleActionToast(''), 5000);
    } catch (err) {
      alert(`Add Warehouse failed: ${err.message}`);
    } finally {
      setAddingLogistics(false);
    }
  };

  // --- DBMS SHOWCASE (VIVA) QUERIES ---
  const runVivaQuery = async (target) => {
    setLoadingViva(true);
    setVivaTarget(target);
    try {
      let res;
      let exp = '';
      if (target === 'Total_Weight_By_Farmer') {
        res = await AgriSlotAPI.getTotalWeightByFarmer();
        exp = 'Stored Procedure `Total_Weight_By_Farmer`: Demonstrates aggregation (SUM, COUNT) with multi-table JOIN between Bookings and Farmers, grouped by Farmer_ID.';
      } else if (target === 'Display_All_Farmers') {
        res = await AgriSlotAPI.cursorDisplayAllFarmers();
        exp = 'Stored Procedure `Display_All_Farmers`: Demonstrates an explicit SQL CURSOR (DECLARE farmer_cursor CURSOR FOR SELECT...) iterating over table rows and populating a temporary table.';
      } else if (target === 'farmer_bookings_detail_view') {
        res = await AgriSlotAPI.getFarmerBookingsView();
        exp = 'Database View `farmer_bookings_detail_view`: Demonstrates a 5-table joined view connecting Bookings, Farmers, Slots, Mandis, and Produce into a single queryable entity.';
      } else if (target === 'surat_mandi_operations_view') {
        res = await AgriSlotAPI.getSuratOperationsView();
        exp = 'Database View `surat_mandi_operations_view`: Demonstrates an operational view joining Mandis and Slots filtered specifically for District = "Surat" with remaining capacity arithmetic.';
      }
      setVivaResult(res?.data || []);
      setVivaExplanation(exp);
    } catch (err) {
      console.warn('Viva query error:', err.message);
      setVivaResult([]);
    } finally {
      setLoadingViva(false);
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
      alert('Transaction settlement recorded successfully with auto-calculated generated column Total_Amount!');
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
      loadMandisList();
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
          <p className="text-xs font-mono text-slate-600 leading-relaxed max-w-md mx-auto">
            You are logged in as a registered Producer (<span className="font-bold text-navy-border">{authUser.name}</span>). Access to the APMC Mandi Officer Control Room requires elevated administrative clearance.
          </p>
          <div className="pt-2">
            <Link
              href="/farmer"
              className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento transition-all"
            >
              Return to Farmer Dashboard
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
              Restricted Clearance Operations • Live MySQL Engine • DBMS Academic Evaluation
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
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'terminal' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Gate
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'bookings' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Bookings
            </button>
            <button
              onClick={() => setActiveTab('mandis')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'mandis' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Mandis
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'slots' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Slots
            </button>
            <button
              onClick={() => setActiveTab('produce')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'produce' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Produce
            </button>
            <button
              onClick={() => setActiveTab('farmers')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'farmers' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Farmers
            </button>
            <button
              onClick={() => setActiveTab('capacity')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'capacity' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Yard
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'transactions' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Trades
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                activeTab === 'users' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              <Users className="w-3 h-3 text-saffron" />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-2.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'audit' ? 'bg-forest text-white shadow-bento-sm' : 'text-navy-border hover:bg-white'
              }`}
            >
              Audit
            </button>
            <button
              onClick={() => setActiveTab('viva')}
              className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1 border border-saffron ${
                activeTab === 'viva' ? 'bg-saffron text-navy-border shadow-bento-sm' : 'text-navy-border hover:bg-saffron-light'
              }`}
              title="Academic DBMS Showcase"
            >
              <Sparkles className="w-3 h-3 text-forest" />
              <span>DBMS Viva</span>
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
                      Mark Completed
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BOOKINGS LEDGER
          ========================================================================= */}
      {activeTab === 'bookings' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-display font-black text-navy-border">
                APMC Arrival Booking Ledger
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Scheduled farmer delivery slots across all integrated mandis
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500 font-bold">Filter:</span>
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
          TAB: MANDIS MANAGEMENT (CRUD with MySQL Engine)
          ========================================================================= */}
      {activeTab === 'mandis' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold text-forest uppercase">
                <Store className="w-4 h-4" />
                <span>Agricultural Produce Market Committee Hubs</span>
              </div>
              <h2 className="text-xl font-display font-black text-navy-border mt-0.5">
                Mandi Centers Management
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Create, update, and manage APMC Mandis directly in the MySQL Mandis table
              </p>
            </div>

            <button
              onClick={() => handleOpenMandiModal('create')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 text-saffron" />
              <span>+ Add New Mandi</span>
            </button>
          </div>

          {/* Search & District Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search mandis by name or location..."
                value={mandiSearch}
                onChange={(e) => setMandiSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-white border border-navy-border rounded-xl font-mono text-xs font-bold text-navy-border shadow-sm focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500 font-bold">District:</span>
              <select
                value={mandiDistrictFilter}
                onChange={(e) => setMandiDistrictFilter(e.target.value)}
                className="h-10 px-3 bg-white border border-navy-border rounded-xl font-mono text-xs font-bold shadow-sm"
              >
                <option value="ALL">All Districts</option>
                {Array.from(new Set(mandis.map(m => m.District))).filter(Boolean).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                <tr>
                  <th className="py-3 px-4">Mandi ID</th>
                  <th className="py-3 px-4">Mandi Name</th>
                  <th className="py-3 px-4">Location Address</th>
                  <th className="py-3 px-4">District</th>
                  <th className="py-3 px-4">Daily Yard Capacity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-navy-border">
                {loadingMandis ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Loading mandis from MySQL...</td>
                  </tr>
                ) : (
                  mandis
                    .filter(m => {
                      const matchText = (m.Mandi_Name + ' ' + m.Location).toLowerCase().includes(mandiSearch.toLowerCase());
                      const matchDist = mandiDistrictFilter === 'ALL' || m.District === mandiDistrictFilter;
                      return matchText && matchDist;
                    })
                    .map(m => (
                      <tr key={m.Mandi_ID} className="hover:bg-mint-light/20">
                        <td className="py-3 px-4 font-bold text-slate-500">#{m.Mandi_ID}</td>
                        <td className="py-3 px-4 font-black text-navy-border">{m.Mandi_Name}</td>
                        <td className="py-3 px-4 text-slate-600">{m.Location}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-mint-foam text-forest border border-forest font-bold text-[10px]">
                            {m.District}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-forest">{Number(m.Total_Daily_Capacity_Tons).toFixed(2)} MT</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenMandiModal('edit', m)}
                              className="p-1.5 rounded-lg bg-mint-light hover:bg-forest hover:text-white text-forest border border-navy-border transition-colors"
                              title="Edit Mandi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteMandi(m.Mandi_ID, m.Mandi_Name)}
                              className="p-1.5 rounded-lg bg-coral/30 hover:bg-coral-dark hover:text-white text-coral-dark border border-coral transition-colors"
                              title="Delete Mandi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
          TAB: SLOTS MANAGEMENT (CRUD with MySQL Engine)
          ========================================================================= */}
      {activeTab === 'slots' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold text-forest uppercase">
                <Clock className="w-4 h-4" />
                <span>Operational Slot Scheduling</span>
              </div>
              <h2 className="text-xl font-display font-black text-navy-border mt-0.5">
                Time Slots &amp; Capacity Quotas
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Manage individual 2-hour and 4-hour delivery windows per Mandi yard
              </p>
            </div>

            <button
              onClick={() => handleOpenSlotModal('create')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 text-saffron" />
              <span>+ Add New Slot</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500 font-bold uppercase text-[11px]">Select Mandi:</span>
              <select
                value={selectedMandiForSlots}
                onChange={(e) => setSelectedMandiForSlots(e.target.value)}
                className="h-10 px-3 bg-white border border-navy-border rounded-xl font-mono text-xs font-bold shadow-sm flex-1"
              >
                <option value="ALL">All Mandis</option>
                {mandis.map(m => (
                  <option key={m.Mandi_ID} value={m.Mandi_ID}>
                    #{m.Mandi_ID} - {m.Mandi_Name} ({m.District})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-500 font-bold uppercase text-[11px]">Date Filter:</span>
              <input
                type="date"
                value={slotDateFilter}
                onChange={(e) => setSlotDateFilter(e.target.value)}
                className="h-10 px-3 bg-white border border-navy-border rounded-xl font-mono text-xs font-bold shadow-sm"
              />
              {slotDateFilter && (
                <button
                  onClick={() => setSlotDateFilter('')}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                <tr>
                  <th className="py-3 px-4">Slot ID</th>
                  <th className="py-3 px-4">Mandi Hub</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Timing Window</th>
                  <th className="py-3 px-4">Max Capacity</th>
                  <th className="py-3 px-4">Booked</th>
                  <th className="py-3 px-4">Remaining</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-navy-border">
                {loadingSlots ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">Loading slots from MySQL...</td>
                  </tr>
                ) : slotsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-bold">No slots match the selected filters.</td>
                  </tr>
                ) : (
                  slotsList.map(s => {
                    const remaining = Number(s.Max_Capacity_Tons) - Number(s.Booked_Capacity_Tons || 0);
                    const isFull = remaining <= 0;
                    const dateDisplay = s.Slot_Date ? String(s.Slot_Date).split('T')[0] : '';
                    return (
                      <tr key={s.Slot_ID} className="hover:bg-mint-light/20">
                        <td className="py-3 px-4 font-bold text-slate-500">#{s.Slot_ID}</td>
                        <td className="py-3 px-4 font-black">{s.Mandi_Name || `Mandi #${s.Mandi_ID}`}</td>
                        <td className="py-3 px-4 font-bold text-indigo-700">{dateDisplay}</td>
                        <td className="py-3 px-4 text-slate-600">{s.Start_Time} - {s.End_Time}</td>
                        <td className="py-3 px-4 font-bold">{Number(s.Max_Capacity_Tons).toFixed(2)} MT</td>
                        <td className="py-3 px-4 font-bold text-forest">{Number(s.Booked_Capacity_Tons || 0).toFixed(2)} MT</td>
                        <td className="py-3 px-4 font-black text-navy-border">{remaining.toFixed(2)} MT</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                            isFull ? 'bg-coral/30 text-coral-dark border-coral' : 'bg-mint-foam text-forest border-navy-border'
                          }`}>
                            {isFull ? 'Full' : 'Available'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenSlotModal('edit', s)}
                              className="p-1.5 rounded-lg bg-mint-light hover:bg-forest hover:text-white text-forest border border-navy-border transition-colors"
                              title="Edit Slot"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSlot(s.Slot_ID)}
                              className="p-1.5 rounded-lg bg-coral/30 hover:bg-coral-dark hover:text-white text-coral-dark border border-coral transition-colors"
                              title="Delete Slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: PRODUCE CATALOG (CRUD with MySQL Engine)
          ========================================================================= */}
      {activeTab === 'produce' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold text-forest uppercase">
                <Scale className="w-4 h-4" />
                <span>Agricultural Produce &amp; Commodities Catalog</span>
              </div>
              <h2 className="text-xl font-display font-black text-navy-border mt-0.5">
                Produce Commodities
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Manage registered crop categories and required storage facilities
              </p>
            </div>

            <button
              onClick={() => handleOpenProduceModal('create')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 text-saffron" />
              <span>+ Add New Crop</span>
            </button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-500 font-bold uppercase text-[11px]">Filter by Category:</span>
            <select
              value={produceCategoryFilter}
              onChange={(e) => setProduceCategoryFilter(e.target.value)}
              className="h-10 px-3 bg-white border border-navy-border rounded-xl font-mono text-xs font-bold shadow-sm"
            >
              <option value="ALL">All Categories</option>
              <option value="Grains">Grains</option>
              <option value="Pulses">Pulses</option>
              <option value="Fruits">Fruits</option>
              <option value="Vegetables">Vegetables</option>
              <option value="Oilseeds">Oilseeds</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                <tr>
                  <th className="py-3 px-4">Produce ID</th>
                  <th className="py-3 px-4">Commodity Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Required Storage Type</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-navy-border">
                {loadingProduce ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">Loading produce catalog from MySQL...</td>
                  </tr>
                ) : (
                  produceList.map(p => (
                    <tr key={p.Produce_ID} className="hover:bg-mint-light/20">
                      <td className="py-3 px-4 font-bold text-slate-500">#{p.Produce_ID}</td>
                      <td className="py-3 px-4 font-black text-navy-border">{p.Produce_Name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-saffron text-navy-border font-bold text-[10px]">
                          {p.Category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-mint-foam text-forest border border-forest font-bold text-[10px]">
                          {p.Storage_Type} Storage
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenProduceModal('edit', p)}
                            className="p-1.5 rounded-lg bg-mint-light hover:bg-forest hover:text-white text-forest border border-navy-border transition-colors"
                            title="Edit Produce"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduce(p.Produce_ID, p.Produce_Name)}
                            className="p-1.5 rounded-lg bg-coral/30 hover:bg-coral-dark hover:text-white text-coral-dark border border-coral transition-colors"
                            title="Delete Produce"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
          TAB: FARMERS DIRECTORY (Stored Procedures Insert_Farmer, Update_Farmer, Delete_Farmer)
          ========================================================================= */}
      {activeTab === 'farmers' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold text-forest uppercase">
                <Tractor className="w-4 h-4" />
                <span>Agricultural Producer Registry</span>
              </div>
              <h2 className="text-xl font-display font-black text-navy-border mt-0.5">
                Farmers Directory (Stored Procedures)
              </h2>
              <p className="text-xs font-mono text-slate-500">
                CRUD operations execute MySQL Stored Procedures: <code>Insert_Farmer</code>, <code>Update_Farmer</code>, and <code>Delete_Farmer</code> with active triggers.
              </p>
            </div>

            <button
              onClick={() => handleOpenFarmerModal('create')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all"
            >
              <Plus className="w-4 h-4 text-saffron" />
              <span>+ Register Farmer (SP)</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search farmers by name, phone or village..."
              value={farmerSearch}
              onChange={(e) => setFarmerSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-white border border-navy-border rounded-xl font-mono text-xs font-bold text-navy-border shadow-sm focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                <tr>
                  <th className="py-3 px-4">Farmer ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Aadhaar (Govt ID)</th>
                  <th className="py-3 px-4">Village Location</th>
                  <th className="py-3 px-4 text-right">Actions (SP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-navy-border">
                {loadingFarmers ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">Loading farmers from MySQL...</td>
                  </tr>
                ) : farmersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-bold">No farmer records found.</td>
                  </tr>
                ) : (
                  farmersList.map(f => (
                    <tr key={f.Farmer_ID} className="hover:bg-mint-light/20">
                      <td className="py-3 px-4 font-bold text-slate-500">#{f.Farmer_ID}</td>
                      <td className="py-3 px-4 font-black text-navy-border">{f.Name || f.Full_Name}</td>
                      <td className="py-3 px-4 font-bold text-forest">{f.Phone || f.Phone_Number}</td>
                      <td className="py-3 px-4 text-slate-600">{f.Aadhar_No || f.Aadhaar_Masked || 'Verified'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">{f.Village || 'Not specified'}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenFarmerModal('edit', f)}
                            className="p-1.5 rounded-lg bg-mint-light hover:bg-forest hover:text-white text-forest border border-navy-border transition-colors"
                            title="Update via Stored Procedure"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteFarmer(f.Farmer_ID, f.Name || f.Full_Name)}
                            className="p-1.5 rounded-lg bg-coral/30 hover:bg-coral-dark hover:text-white text-coral-dark border border-coral transition-colors"
                            title="Delete via Stored Procedure"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
          TAB: MANDI DAILY CAPACITY & UTILIZATION
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
          TAB: TRADE SETTLEMENTS & LOGISTICS
          ========================================================================= */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Booking Settlement Form */}
          <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
            <div>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold text-forest uppercase">
                <DollarSign className="w-4 h-4" />
                <span>Trade Settlement &amp; Weighbridge Scale</span>
              </div>
              <h2 className="text-xl font-display font-black text-navy-border mt-0.5">
                Settle Checked-In Arrival Booking
              </h2>
              <p className="text-xs font-mono text-slate-500">
                Calculates gross payout using MySQL generated column: <code>Total_Amount = Actual_Weight * Price_Per_Ton</code>
              </p>
            </div>

            <form onSubmit={handleSettleTransaction} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Checked-In Truck</label>
                <select
                  required
                  value={selectedBookingForTx?.Booking_ID || ''}
                  onChange={(e) => {
                    const b = bookings.find(x => String(x.Booking_ID) === e.target.value);
                    setSelectedBookingForTx(b);
                    if (b) setActualWeight(b.Estimated_Weight_Tons || '');
                  }}
                  className="w-full h-10 px-3 bg-white border border-navy-border rounded-xl font-bold"
                >
                  <option value="">-- Select Arrived Truck --</option>
                  {bookings.filter(b => b.Booking_Status === 'Checked-In' || b.Booking_Status === 'Confirmed').map(b => (
                    <option key={b.Booking_ID} value={b.Booking_ID}>
                      {b.Token_Number} - {b.Farmer_Name || `Farmer #${b.Farmer_ID}`} ({b.Produce_Name}, {b.Estimated_Weight_Tons}T)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Scale Weight (MT)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={actualWeight}
                  onChange={(e) => setActualWeight(e.target.value)}
                  placeholder="e.g. 10.5"
                  className="w-full h-10 px-3 bg-white border border-navy-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Quality Grade</label>
                <select
                  value={qualityGrade}
                  onChange={(e) => setQualityGrade(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-navy-border rounded-xl font-bold"
                >
                  <option value="Grade A">Grade A (Premium MSP)</option>
                  <option value="Grade B">Grade B (Standard)</option>
                  <option value="Grade C">Grade C (Commercial)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Price Per Ton (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={pricePerTon}
                  onChange={(e) => setPricePerTon(e.target.value)}
                  placeholder="e.g. 2600"
                  className="w-full h-10 px-3 bg-white border border-navy-border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Licensed APMC Trader</label>
                <select
                  required
                  value={selectedTraderId}
                  onChange={(e) => setSelectedTraderId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-navy-border rounded-xl font-bold"
                >
                  <option value="">-- Select Buyer --</option>
                  {traders.map(t => (
                    <option key={t.Trader_ID} value={t.Trader_ID}>
                      {t.Name} ({t.License_No})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Destination Warehouse</label>
                <select
                  required
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full h-10 px-3 bg-white border border-navy-border rounded-xl font-bold"
                >
                  <option value="">-- Select Silo / Cold Store --</option>
                  {warehouses.map(w => (
                    <option key={w.Warehouse_ID} value={w.Warehouse_ID}>
                      #{w.Warehouse_ID} - {w.Warehouse_Type} ({w.Mandi_Name || `Mandi #${w.Mandi_ID}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={txSubmitting || !selectedBookingForTx}
                  className="w-full h-10 rounded-xl bg-forest hover:bg-forest-light text-white font-display font-black text-xs uppercase tracking-wider border-[2px] border-navy-border shadow-bento active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  {txSubmitting ? 'Recording Settlement...' : 'Commit MSP Settlement Transaction'}
                </button>
              </div>
            </form>
          </div>

          {/* Transactions Ledger */}
          <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
            <h2 className="text-xl font-display font-black text-navy-border">
              MSP Trade Settlement Ledger
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-canvas text-slate-500 uppercase font-black border-b border-navy-border">
                  <tr>
                    <th className="py-3 px-4">Receipt ID</th>
                    <th className="py-3 px-4">Pass Ref</th>
                    <th className="py-3 px-4">Net Scale Weight</th>
                    <th className="py-3 px-4">Quality</th>
                    <th className="py-3 px-4">Auction Rate</th>
                    <th className="py-3 px-4">Gross Payout (Calculated)</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-navy-border">
                  {transactions.map((t) => (
                    <tr key={t.Txn_ID || t.Transaction_ID} className="hover:bg-mint-light/20">
                      <td className="py-3 px-4 font-bold">#TX-{t.Txn_ID || t.Transaction_ID}</td>
                      <td className="py-3 px-4 font-bold text-forest">
                        {t.Token_Number || t.Gate_Pass_Token || `#BK-${t.Booking_ID}`}
                      </td>
                      <td className="py-3 px-4 font-bold">{t.Actual_Weight || t.Actual_Weight_Tons} MT</td>
                      <td className="py-3 px-4">{t.Quality_Grade}</td>
                      <td className="py-3 px-4">₹{Number(t.Price_Per_Ton).toLocaleString()}/T</td>
                      <td className="py-3 px-4 font-black text-forest">
                        ₹{Number(t.Total_Amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                            t.Payment_Status === 'Released'
                              ? 'bg-mint-foam text-forest border-navy-border'
                              : 'bg-saffron text-navy-border border-navy-border'
                          }`}
                        >
                          {t.Payment_Status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {t.Payment_Status === 'Pending' && (
                          <button
                            onClick={() => handleUpdatePayment(t.Txn_ID || t.Transaction_ID, 'Released')}
                            className="px-2 py-1 rounded bg-forest hover:bg-forest-light text-white text-[10px] font-bold"
                          >
                            Release Funds
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500 font-semibold">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Traders & Warehouses Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traders Sub-Section */}
            <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-display font-black text-navy-border">Licensed APMC Traders</h3>
                  <p className="text-[11px] text-slate-500">Commercial buyers registered in Traders table</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-mint-foam text-forest font-bold">{traders.length} Active</span>
              </div>

              <form onSubmit={handleAddTrader} className="p-3 bg-canvas rounded-xl border border-navy-border/40 space-y-2">
                <div className="font-bold text-navy-border uppercase text-[10px]">+ Register New Trader</div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Trader Name"
                    value={newTraderForm.Name}
                    onChange={(e) => setNewTraderForm({ ...newTraderForm, Name: e.target.value })}
                    className="h-8 px-2 bg-white border border-navy-border rounded text-[11px]"
                  />
                  <input
                    type="text"
                    required
                    placeholder="License (e.g. GJ-TR-400)"
                    value={newTraderForm.License_No}
                    onChange={(e) => setNewTraderForm({ ...newTraderForm, License_No: e.target.value })}
                    className="h-8 px-2 bg-white border border-navy-border rounded text-[11px]"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Phone"
                    value={newTraderForm.Phone}
                    onChange={(e) => setNewTraderForm({ ...newTraderForm, Phone: e.target.value })}
                    className="h-8 px-2 bg-white border border-navy-border rounded text-[11px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingLogistics}
                  className="w-full py-1.5 rounded bg-forest text-white font-bold text-[10px] uppercase"
                >
                  Save Trader to MySQL
                </button>
              </form>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {traders.slice(0, 10).map(tr => (
                  <div key={tr.Trader_ID} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-navy-border">{tr.Name}</div>
                      <div className="text-[10px] text-slate-500">License: {tr.License_No} • Phone: {tr.Phone}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">#{tr.Trader_ID}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Warehouses Sub-Section */}
            <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-display font-black text-navy-border">Mandi Warehouses &amp; Silos</h3>
                  <p className="text-[11px] text-slate-500">Storage facilities registered in Warehouses table</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-mint-foam text-forest font-bold">{warehouses.length} Active</span>
              </div>

              <form onSubmit={handleAddWarehouse} className="p-3 bg-canvas rounded-xl border border-navy-border/40 space-y-2">
                <div className="font-bold text-navy-border uppercase text-[10px]">+ Register New Warehouse</div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newWarehouseForm.Mandi_ID}
                    onChange={(e) => setNewWarehouseForm({ ...newWarehouseForm, Mandi_ID: Number(e.target.value) })}
                    className="h-8 px-2 bg-white border border-navy-border rounded text-[11px]"
                  >
                    {mandis.map(m => (
                      <option key={m.Mandi_ID} value={m.Mandi_ID}>Mandi #{m.Mandi_ID}</option>
                    ))}
                  </select>
                  <select
                    value={newWarehouseForm.Warehouse_Type}
                    onChange={(e) => setNewWarehouseForm({ ...newWarehouseForm, Warehouse_Type: e.target.value })}
                    className="h-8 px-2 bg-white border border-navy-border rounded text-[11px]"
                  >
                    <option value="Dry Storage">Dry Storage</option>
                    <option value="Cold Storage">Cold Storage</option>
                    <option value="Silo">Silo</option>
                  </select>
                  <input
                    type="number"
                    required
                    placeholder="Capacity (MT)"
                    value={newWarehouseForm.Total_Capacity}
                    onChange={(e) => setNewWarehouseForm({ ...newWarehouseForm, Total_Capacity: Number(e.target.value) })}
                    className="h-8 px-2 bg-white border border-navy-border rounded text-[11px]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingLogistics}
                  className="w-full py-1.5 rounded bg-forest text-white font-bold text-[10px] uppercase"
                >
                  Save Warehouse to MySQL
                </button>
              </form>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                {warehouses.slice(0, 10).map(wh => (
                  <div key={wh.Warehouse_ID} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-navy-border">#{wh.Warehouse_ID} - {wh.Warehouse_Type}</div>
                      <div className="text-[10px] text-slate-500">Mandi: {wh.Mandi_Name || `Mandi #${wh.Mandi_ID}`} • Capacity: {wh.Total_Capacity} MT</div>
                    </div>
                    <span className="text-[10px] font-bold text-forest">{Number(wh.Total_Capacity - (wh.Occupied_Capacity || 0)).toFixed(0)} MT Left</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: USER & ROLE MANAGEMENT (P1 ADMIN RBAC)
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
                        <td className="py-3 px-4 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                            isAdmin ? 'bg-saffron text-navy-border border border-navy-border' :
                            u.User_Role === 'Mandi_Officer' ? 'bg-indigo-100 text-indigo-800 border border-indigo-400' :
                            'bg-mint-foam text-forest border border-forest'
                          }`}>
                            {u.User_Role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                            u.Account_Status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.Account_Status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {u.Created_At ? new Date(u.Created_At).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isSelf ? (
                            <span className="text-[10px] text-slate-400 font-bold italic">Current User</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              {!isAdmin ? (
                                <button
                                  onClick={() => {
                                    setRoleModalUser(u);
                                    setRoleModalTargetRole('Admin');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-saffron hover:bg-saffron-dark text-navy-border border border-navy-border text-[10.5px] font-black uppercase transition-all shadow-sm"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Make Admin</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setRoleModalUser(u);
                                    setRoleModalTargetRole('Farmer');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-coral/20 hover:bg-coral-dark hover:text-white text-coral-dark border border-coral text-[10.5px] font-bold uppercase transition-all"
                                >
                                  <span>Demote</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: AUDIT TRAIL
          ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-6">
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
          TAB: DBMS SHOWCASE (COLLEGE VIVA EVALUATION)
          ========================================================================= */}
      {activeTab === 'viva' && (
        <div className="space-y-6">
          <div className="p-6 bg-white rounded-bento border-[2.5px] border-navy-border shadow-bento space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10.5px] font-bold text-forest uppercase">
                  <Database className="w-4 h-4 text-saffron" />
                  <span>DBMS Academic Project Viva Showcase</span>
                </div>
                <h2 className="text-xl font-display font-black text-navy-border mt-0.5">
                  Interactive Database Engine Demonstrator
                </h2>
                <p className="text-xs font-mono text-slate-500">
                  Execute stored procedures, query relational views, and inspect live integrity triggers in MySQL
                </p>
              </div>

              <div className="flex items-center gap-2 bg-mint-foam p-1 rounded-xl border border-navy-border font-mono text-xs font-bold">
                <button
                  onClick={() => runVivaQuery('Total_Weight_By_Farmer')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    vivaTarget === 'Total_Weight_By_Farmer' ? 'bg-forest text-white' : 'text-navy-border hover:bg-white'
                  }`}
                >
                  CALL Total_Weight_By_Farmer()
                </button>
                <button
                  onClick={() => runVivaQuery('Display_All_Farmers')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    vivaTarget === 'Display_All_Farmers' ? 'bg-forest text-white' : 'text-navy-border hover:bg-white'
                  }`}
                >
                  CALL Display_All_Farmers() [Cursor]
                </button>
                <button
                  onClick={() => runVivaQuery('farmer_bookings_detail_view')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    vivaTarget === 'farmer_bookings_detail_view' ? 'bg-forest text-white' : 'text-navy-border hover:bg-white'
                  }`}
                >
                  VIEW farmer_bookings_detail_view
                </button>
                <button
                  onClick={() => runVivaQuery('surat_mandi_operations_view')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    vivaTarget === 'surat_mandi_operations_view' ? 'bg-forest text-white' : 'text-navy-border hover:bg-white'
                  }`}
                >
                  VIEW surat_mandi_operations_view
                </button>
              </div>
            </div>

            {/* Explanation Alert */}
            {vivaExplanation && (
              <div className="p-3.5 bg-canvas rounded-xl border border-navy-border/40 font-mono text-xs text-navy-border flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-saffron shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold uppercase text-[10px] text-forest">DBMS Concept Explanation for Viva:</div>
                  <div className="mt-0.5 text-slate-700">{vivaExplanation}</div>
                </div>
              </div>
            )}

            {/* Result Table */}
            <div className="overflow-x-auto border-[2px] border-navy-border rounded-xl">
              <div className="bg-navy-border text-white px-4 py-2 font-mono text-xs font-bold flex items-center justify-between">
                <span>SQL Output Set ({vivaResult ? vivaResult.length : 0} rows)</span>
                <span className="text-saffron text-[10px] uppercase">Engine: MySQL 8.x InnoDB</span>
              </div>

              {loadingViva ? (
                <div className="py-12 text-center font-mono text-xs text-slate-400">
                  Executing procedure/view query in MySQL...
                </div>
              ) : !vivaResult || vivaResult.length === 0 ? (
                <div className="py-12 text-center font-mono text-xs text-slate-400">
                  No records returned or query not yet executed.
                </div>
              ) : (
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-bold border-b border-navy-border">
                    <tr>
                      {Object.keys(vivaResult[0] || {}).map(col => (
                        <th key={col} className="py-2.5 px-3">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-navy-border">
                    {vivaResult.slice(0, 30).map((row, idx) => (
                      <tr key={idx} className="hover:bg-mint-light/20">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="py-2 px-3">
                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* DBMS Viva Concept Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 bg-white rounded-xl border-[2px] border-navy-border shadow-bento-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-forest">
                <Code2 className="w-4 h-4" />
                <span>1. ACID Transactions &amp; Locking</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Slot booking employs <code>SELECT ... FOR UPDATE</code> exclusive row-level locking inside a database transaction to prevent race conditions and overbooking.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border-[2px] border-navy-border shadow-bento-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-forest">
                <Scale className="w-4 h-4" />
                <span>2. Generated Always Columns</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                The <code>Transactions.Total_Amount</code> column is declared <code>GENERATED ALWAYS AS (Actual_Weight * Price_Per_Ton) STORED</code> ensuring financial calculations are enforced by MySQL.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border-[2px] border-navy-border shadow-bento-sm space-y-2">
              <div className="flex items-center gap-2 font-bold text-forest">
                <FileText className="w-4 h-4" />
                <span>3. Triggers &amp; Audit Trail</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Triggers like <code>Audit_Farmer_Insert</code>, <code>Audit_Farmer_Update</code>, and <code>Audit_Farmer_Delete</code> automatically record audit history in the <code>Application_Audit_Log</code> table.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS: MANDI / SLOT / PRODUCE / FARMER / ROLE MODALS
          ========================================================================= */}

      {/* MANDI MODAL */}
      {mandiModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden">
            <div className="p-4 border-b-[2px] border-navy-border bg-mint-foam flex items-center justify-between">
              <div className="font-display font-black text-sm uppercase text-navy-border">
                {mandiModal.mode === 'edit' ? 'Edit Mandi Center' : '+ Add New Mandi Center'}
              </div>
              <button onClick={() => setMandiModal({ open: false, mode: 'create', data: null })}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveMandi} className="p-6 space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Mandi Name</label>
                <input
                  type="text"
                  required
                  value={mandiForm.Mandi_Name}
                  onChange={(e) => setMandiForm({ ...mandiForm, Mandi_Name: e.target.value })}
                  placeholder="e.g. Surat Central APMC"
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Location Address</label>
                <input
                  type="text"
                  required
                  value={mandiForm.Location}
                  onChange={(e) => setMandiForm({ ...mandiForm, Location: e.target.value })}
                  placeholder="e.g. Ring Road, Near Gate 2"
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">District</label>
                <input
                  type="text"
                  required
                  value={mandiForm.District}
                  onChange={(e) => setMandiForm({ ...mandiForm, District: e.target.value })}
                  placeholder="e.g. Surat"
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Total Daily Capacity (Tons)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={mandiForm.Total_Daily_Capacity_Tons}
                  onChange={(e) => setMandiForm({ ...mandiForm, Total_Daily_Capacity_Tons: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMandiModal({ open: false, mode: 'create', data: null })}
                  className="flex-1 py-2 rounded-xl border border-navy-border bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mandiSaving}
                  className="flex-1 py-2 rounded-xl bg-forest text-white font-display font-black uppercase tracking-wider"
                >
                  {mandiSaving ? 'Saving...' : 'Save Mandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SLOT MODAL */}
      {slotModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden">
            <div className="p-4 border-b-[2px] border-navy-border bg-mint-foam flex items-center justify-between">
              <div className="font-display font-black text-sm uppercase text-navy-border">
                {slotModal.mode === 'edit' ? 'Edit Time Slot' : '+ Add New Operational Slot'}
              </div>
              <button onClick={() => setSlotModal({ open: false, mode: 'create', data: null })}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSlot} className="p-6 space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Mandi Center</label>
                <select
                  disabled={slotModal.mode === 'edit'}
                  value={slotForm.Mandi_ID}
                  onChange={(e) => setSlotForm({ ...slotForm, Mandi_ID: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                >
                  {mandis.map(m => (
                    <option key={m.Mandi_ID} value={m.Mandi_ID}>
                      #{m.Mandi_ID} - {m.Mandi_Name} ({m.District})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Slot Date (YYYY-MM-DD)</label>
                <input
                  type="date"
                  required
                  value={slotForm.Slot_Date}
                  onChange={(e) => setSlotForm({ ...slotForm, Slot_Date: e.target.value })}
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={slotForm.Start_Time}
                    onChange={(e) => setSlotForm({ ...slotForm, Start_Time: e.target.value })}
                    className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={slotForm.End_Time}
                    onChange={(e) => setSlotForm({ ...slotForm, End_Time: e.target.value })}
                    className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Max Capacity (Tons)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={slotForm.Max_Capacity_Tons}
                  onChange={(e) => setSlotForm({ ...slotForm, Max_Capacity_Tons: Number(e.target.value) })}
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSlotModal({ open: false, mode: 'create', data: null })}
                  className="flex-1 py-2 rounded-xl border border-navy-border bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slotSaving}
                  className="flex-1 py-2 rounded-xl bg-forest text-white font-display font-black uppercase tracking-wider"
                >
                  {slotSaving ? 'Saving...' : 'Save Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCE MODAL */}
      {produceModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden">
            <div className="p-4 border-b-[2px] border-navy-border bg-mint-foam flex items-center justify-between">
              <div className="font-display font-black text-sm uppercase text-navy-border">
                {produceModal.mode === 'edit' ? 'Edit Produce Item' : '+ Add New Crop to Catalog'}
              </div>
              <button onClick={() => setProduceModal({ open: false, mode: 'create', data: null })}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveProduce} className="p-6 space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Produce Name</label>
                <input
                  type="text"
                  required
                  value={produceForm.Produce_Name}
                  onChange={(e) => setProduceForm({ ...produceForm, Produce_Name: e.target.value })}
                  placeholder="e.g. Golden Sorghum"
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={produceForm.Category}
                  onChange={(e) => setProduceForm({ ...produceForm, Category: e.target.value })}
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                >
                  <option value="Grains">Grains</option>
                  <option value="Pulses">Pulses</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Oilseeds">Oilseeds</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Storage Type</label>
                <select
                  value={produceForm.Storage_Type}
                  onChange={(e) => setProduceForm({ ...produceForm, Storage_Type: e.target.value })}
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                >
                  <option value="Dry">Dry Storage</option>
                  <option value="Cold">Cold Storage</option>
                  <option value="Ambient">Ambient</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProduceModal({ open: false, mode: 'create', data: null })}
                  className="flex-1 py-2 rounded-xl border border-navy-border bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={produceSaving}
                  className="flex-1 py-2 rounded-xl bg-forest text-white font-display font-black uppercase tracking-wider"
                >
                  {produceSaving ? 'Saving...' : 'Save Produce'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FARMER MODAL (Calling Stored Procedures) */}
      {farmerModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden">
            <div className="p-4 border-b-[2px] border-navy-border bg-mint-foam flex items-center justify-between">
              <div className="font-display font-black text-sm uppercase text-navy-border">
                {farmerModal.mode === 'edit' ? 'Update Farmer (SP: Update_Farmer)' : '+ Insert Farmer (SP: Insert_Farmer)'}
              </div>
              <button onClick={() => setFarmerModal({ open: false, mode: 'create', data: null })}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveFarmer} className="p-6 space-y-4 font-mono text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={farmerForm.Name}
                  onChange={(e) => setFarmerForm({ ...farmerForm, Name: e.target.value })}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number (10 digits)</label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={farmerForm.Phone}
                  onChange={(e) => setFarmerForm({ ...farmerForm, Phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Aadhaar Number (12 digits)</label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={farmerForm.Aadhar_No}
                  onChange={(e) => setFarmerForm({ ...farmerForm, Aadhar_No: e.target.value })}
                  placeholder="e.g. 123456789012"
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Village Location</label>
                <input
                  type="text"
                  value={farmerForm.Village}
                  onChange={(e) => setFarmerForm({ ...farmerForm, Village: e.target.value })}
                  placeholder="e.g. Bardoli, Surat"
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">UPI ID (Optional)</label>
                <input
                  type="text"
                  value={farmerForm.UPI_ID}
                  onChange={(e) => setFarmerForm({ ...farmerForm, UPI_ID: e.target.value })}
                  placeholder="e.g. ramesh@upi"
                  className="w-full h-10 px-3 border border-navy-border rounded-xl font-bold"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFarmerModal({ open: false, mode: 'create', data: null })}
                  className="flex-1 py-2 rounded-xl border border-navy-border bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={farmerSaving}
                  className="flex-1 py-2 rounded-xl bg-forest text-white font-display font-black uppercase tracking-wider"
                >
                  {farmerSaving ? 'Executing SP...' : 'Execute Stored Procedure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR ROLE PROMOTION / DEMOTION */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-border/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white border-[2.5px] border-navy-border rounded-bento shadow-bento-lg overflow-hidden animate-in zoom-in-95 duration-150">
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

      {/* Database Maintenance Section */}
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
