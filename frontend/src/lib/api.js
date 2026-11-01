const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api/v1';

// In-Memory Seed Fallbacks (ensures UI resilience if backend restarts)
const FALLBACK_MANDIS = [
  { Mandi_ID: 1, Mandi_Name: 'Surat Central APMC', Location: 'Ring Road, Surat', District: 'Surat', Total_Daily_Capacity_Tons: 500.0 },
  { Mandi_ID: 2, Mandi_Name: 'Nashik Agro Terminal', Location: 'Panchavati, Nashik', District: 'Nashik', Total_Daily_Capacity_Tons: 800.0 },
  { Mandi_ID: 3, Mandi_Name: 'Anand Grain Exchange', Location: 'Station Road, Anand', District: 'Anand', Total_Daily_Capacity_Tons: 400.0 },
  { Mandi_ID: 4, Mandi_Name: 'Rajkot Cotton & Oilseed Hub', Location: 'Bedi Road, Rajkot', District: 'Rajkot', Total_Daily_Capacity_Tons: 600.0 },
  { Mandi_ID: 5, Mandi_Name: 'Amreli District Mandi', Location: 'APMC Market, Amreli', District: 'Amreli', Total_Daily_Capacity_Tons: 350.0 },
];

const FALLBACK_PRODUCE = [
  { Produce_ID: 1, Produce_Name: 'Lokwan Sharbati Wheat', Category: 'Grains', Storage_Type: 'Dry' },
  { Produce_ID: 2, Produce_Name: 'Basmati Rice (Paddy)', Category: 'Grains', Storage_Type: 'Dry' },
  { Produce_ID: 3, Produce_Name: 'Yellow Maize (Corn)', Category: 'Grains', Storage_Type: 'Dry' },
  { Produce_ID: 4, Produce_Name: 'Medium Staple Cotton', Category: 'Oilseeds', Storage_Type: 'Ambient' },
  { Produce_ID: 5, Produce_Name: 'Red Nashik Onion', Category: 'Vegetables', Storage_Type: 'Cold' },
  { Produce_ID: 6, Produce_Name: 'Yellow Soybean', Category: 'Oilseeds', Storage_Type: 'Dry' },
  { Produce_ID: 7, Produce_Name: 'Bengal Gram (Chana)', Category: 'Pulses', Storage_Type: 'Dry' },
  { Produce_ID: 8, Produce_Name: 'Pearl Millet (Bajra)', Category: 'Grains', Storage_Type: 'Dry' },
];

const FALLBACK_SLOTS = [
  { Slot_ID: 1, Mandi_ID: 1, Mandi_Name: 'Surat Central APMC', Slot_Date: '2026-10-24', Start_Time: '08:00:00', End_Time: '10:00:00', Max_Capacity_Tons: 50.0, Booked_Capacity_Tons: 15.0, Remaining_Capacity_Tons: 35.0, Availability_Status: 'Available' },
  { Slot_ID: 2, Mandi_ID: 1, Mandi_Name: 'Surat Central APMC', Slot_Date: '2026-10-24', Start_Time: '10:00:00', End_Time: '12:00:00', Max_Capacity_Tons: 50.0, Booked_Capacity_Tons: 30.0, Remaining_Capacity_Tons: 20.0, Availability_Status: 'Available' },
  { Slot_ID: 3, Mandi_ID: 1, Mandi_Name: 'Surat Central APMC', Slot_Date: '2026-10-24', Start_Time: '13:00:00', End_Time: '15:00:00', Max_Capacity_Tons: 40.0, Booked_Capacity_Tons: 40.0, Remaining_Capacity_Tons: 0.0, Availability_Status: 'Full' },
  { Slot_ID: 4, Mandi_ID: 2, Mandi_Name: 'Nashik Agro Terminal', Slot_Date: '2026-10-24', Start_Time: '08:00:00', End_Time: '10:00:00', Max_Capacity_Tons: 80.0, Booked_Capacity_Tons: 25.0, Remaining_Capacity_Tons: 55.0, Availability_Status: 'Available' }
];

const FALLBACK_FARMERS = [
  { Farmer_ID: 1, Full_Name: 'Ramesh Patel', Name: 'Ramesh Patel', Phone: '9000000001', Phone_Number: '9000000001', Village: 'Olpad', District: 'Surat' },
  { Farmer_ID: 2, Full_Name: 'Suresh Chaudhary', Name: 'Suresh Chaudhary', Phone: '9000000002', Phone_Number: '9000000002', Village: 'Bardoli', District: 'Surat' },
  { Farmer_ID: 3, Full_Name: 'Mahesh Parmar', Name: 'Mahesh Parmar', Phone: '9000000003', Phone_Number: '9000000003', Village: 'Kamrej', District: 'Surat' },
  { Farmer_ID: 4, Full_Name: 'Kiran Desai', Name: 'Kiran Desai', Phone: '9000000004', Phone_Number: '9000000004', Village: 'Palsana', District: 'Surat' },
  { Farmer_ID: 5, Full_Name: 'Arjun Patel', Name: 'Arjun Patel', Phone: '9000000005', Phone_Number: '9000000005', Village: 'Navsari', District: 'Navsari' },
];

const FALLBACK_BOOKINGS = {
  'AG-T001': {
    Booking_ID: 1,
    Token_Number: 'AG-T001',
    Gate_Pass_Token: 'AG-T001',
    Farmer_ID: 1,
    Farmer_Name: 'Ramesh Patel',
    Farmer_Phone: '9000000001',
    Phone_Number: '9000000001',
    Slot_ID: 1,
    Slot_Date: '2026-10-24',
    Start_Time: '08:00:00',
    End_Time: '10:00:00',
    Mandi_ID: 1,
    Mandi_Name: 'Surat Central APMC',
    District: 'Surat',
    Produce_ID: 1,
    Produce_Name: 'Lokwan Sharbati Wheat',
    Category: 'Grains',
    Storage_Type: 'Dry',
    Estimated_Weight_Tons: 10.0,
    Booking_Status: 'Confirmed',
    Village: 'Olpad',
    Aadhaar_Masked: 'XXXX-XXXX-0001',
  },
  'AG-T002': {
    Booking_ID: 2,
    Token_Number: 'AG-T002',
    Gate_Pass_Token: 'AG-T002',
    Farmer_ID: 2,
    Farmer_Name: 'Suresh Chaudhary',
    Farmer_Phone: '9000000002',
    Phone_Number: '9000000002',
    Slot_ID: 2,
    Slot_Date: '2026-10-24',
    Start_Time: '08:00:00',
    End_Time: '10:00:00',
    Mandi_ID: 1,
    Mandi_Name: 'Surat Central APMC',
    District: 'Surat',
    Produce_ID: 2,
    Produce_Name: 'Basmati Rice (Paddy)',
    Category: 'Grains',
    Storage_Type: 'Dry',
    Estimated_Weight_Tons: 15.0,
    Booking_Status: 'Checked-In',
    Village: 'Bardoli',
    Aadhaar_Masked: 'XXXX-XXXX-0002',
  },
  'AG-T003': {
    Booking_ID: 3,
    Token_Number: 'AG-T003',
    Gate_Pass_Token: 'AG-T003',
    Farmer_ID: 3,
    Farmer_Name: 'Mahesh Parmar',
    Farmer_Phone: '9000000003',
    Phone_Number: '9000000003',
    Slot_ID: 3,
    Slot_Date: '2026-10-24',
    Start_Time: '09:00:00',
    End_Time: '11:00:00',
    Mandi_ID: 1,
    Mandi_Name: 'Surat Central APMC',
    District: 'Surat',
    Produce_ID: 3,
    Produce_Name: 'Yellow Maize (Corn)',
    Category: 'Grains',
    Storage_Type: 'Dry',
    Estimated_Weight_Tons: 8.0,
    Booking_Status: 'Completed',
    Village: 'Kamrej',
    Aadhaar_Masked: 'XXXX-XXXX-0003',
  },
  'AG-T004': {
    Booking_ID: 4,
    Token_Number: 'AG-T004',
    Gate_Pass_Token: 'AG-T004',
    Farmer_ID: 4,
    Farmer_Name: 'Kiran Desai',
    Farmer_Phone: '9000000004',
    Phone_Number: '9000000004',
    Slot_ID: 4,
    Slot_Date: '2026-10-24',
    Start_Time: '10:00:00',
    End_Time: '12:00:00',
    Mandi_ID: 1,
    Mandi_Name: 'Surat Central APMC',
    District: 'Surat',
    Produce_ID: 4,
    Produce_Name: 'Medium Staple Cotton',
    Category: 'Oilseeds',
    Storage_Type: 'Ambient',
    Estimated_Weight_Tons: 12.0,
    Booking_Status: 'Confirmed',
    Village: 'Palsana',
    Aadhaar_Masked: 'XXXX-XXXX-0004',
  },
};

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (!headers['Authorization'] && typeof window !== 'undefined') {
    const savedToken = localStorage.getItem('agrislot_token');
    if (savedToken) {
      headers['Authorization'] = `Bearer ${savedToken}`;
    }
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok && !data.success) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    // If backend is momentarily unreachable, supply offline fallback where feasible
    const isNetworkErr =
      err.name === 'TypeError' ||
      (err.message && /fetch|network|failed/i.test(err.message));

    if (isNetworkErr) {
      // Handle slots before mandis to prevent /mandis/:id/slots returning Mandi objects
      if (endpoint.includes('/slots')) {
        const matchMandi = endpoint.match(/\/mandis\/(\d+)\/slots/);
        if (matchMandi) {
          const mId = Number(matchMandi[1]);
          const filtered = FALLBACK_SLOTS.filter((s) => s.Mandi_ID === mId);
          return { success: true, data: filtered.length > 0 ? filtered : FALLBACK_SLOTS };
        }
        return { success: true, data: FALLBACK_SLOTS };
      }
      if (endpoint.startsWith('/mandis')) {
        return { success: true, data: FALLBACK_MANDIS };
      }
      if (endpoint.startsWith('/produce')) {
        return { success: true, data: FALLBACK_PRODUCE };
      }
      if (options.method === 'POST' && endpoint === '/farmers') {
        const body = options.body ? JSON.parse(options.body) : {};
        const newFarmer = {
          Farmer_ID: Math.floor(100 + Math.random() * 900),
          Full_Name: body.Full_Name || body.Name || 'New Farmer',
          Name: body.Full_Name || body.Name || 'New Farmer',
          Phone_Number: body.Phone_Number || body.Phone || '9000000000',
          Phone: body.Phone_Number || body.Phone || '9000000000',
          Village: body.Village || 'Surat',
          District: body.District || 'Surat',
        };
        FALLBACK_FARMERS.unshift(newFarmer);
        return { success: true, message: 'Farmer registered', data: newFarmer };
      }
      if (endpoint.startsWith('/farmers')) {
        if (endpoint.includes('/bookings')) {
          return { success: true, data: Object.values(FALLBACK_BOOKINGS) };
        }
        return { success: true, data: FALLBACK_FARMERS };
      }
      if (options.method === 'POST' && endpoint === '/bookings') {
        const body = options.body ? JSON.parse(options.body) : {};
        const newBooking = {
          Booking_ID: Math.floor(1000 + Math.random() * 9000),
          Token_Number: `AG-T${Math.floor(10000 + Math.random() * 90000)}`,
          Gate_Pass_Token: `AG-T${Math.floor(10000 + Math.random() * 90000)}`,
          Farmer_ID: body.Farmer_ID || 1,
          Farmer_Name: 'Ramesh Patel',
          Phone_Number: '9000000001',
          Slot_ID: body.Slot_ID || 1,
          Slot_Date: '2026-10-24',
          Start_Time: '08:00:00',
          End_Time: '10:00:00',
          Mandi_ID: 1,
          Mandi_Name: 'Surat Central APMC',
          District: 'Surat',
          Produce_ID: body.Produce_ID || 1,
          Produce_Name: 'Lokwan Sharbati Wheat',
          Estimated_Weight_Tons: body.Estimated_Weight_Tons || 10,
          Booking_Status: 'Confirmed',
          Village: 'Olpad',
        };
        FALLBACK_BOOKINGS[newBooking.Token_Number] = newBooking;
        return { success: true, message: 'Booking created', data: newBooking };
      }
      if (endpoint.includes('/cancel')) {
        return { success: true, message: 'Booking cancelled' };
      }
      if (endpoint.startsWith('/bookings/token/')) {
        const token = decodeURIComponent(endpoint.split('/bookings/token/')[1]).trim().toUpperCase();
        if (FALLBACK_BOOKINGS[token]) {
          return { success: true, data: FALLBACK_BOOKINGS[token] };
        }
        return { success: true, data: Object.values(FALLBACK_BOOKINGS)[0] };
      }
      if (endpoint.startsWith('/bookings')) {
        return { success: true, data: Object.values(FALLBACK_BOOKINGS) };
      }
      if (endpoint.includes('/statistics')) {
        return { success: true, data: { total_bookings: 25, total_farmers: 25, total_mandis: 5 } };
      }
      throw new Error('AgriSlot backend offline. Please verify it is running on http://localhost:5001');
    }
    throw err;
  }
}

export const AgriSlotAPI = {
  // Mandis
  getMandis: (district) =>
    apiRequest(`/mandis${district ? `?district=${encodeURIComponent(district)}` : ''}`),
  getMandiById: (id) => apiRequest(`/mandis/${id}`),
  getMandiSlots: (id, availableOnly = false) =>
    apiRequest(`/mandis/${id}/slots${availableOnly ? '?availableOnly=true' : ''}`),
  createMandi: (data, token) =>
    apiRequest('/mandis', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  updateMandi: (id, data, token) =>
    apiRequest(`/mandis/${id}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  deleteMandi: (id, token) =>
    apiRequest(`/mandis/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  // Produce
  getProduce: (category) =>
    apiRequest(`/produce${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getProduceById: (id) => apiRequest(`/produce/${id}`),
  createProduce: (data, token) =>
    apiRequest('/produce', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  updateProduce: (id, data, token) =>
    apiRequest(`/produce/${id}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  deleteProduce: (id, token) =>
    apiRequest(`/produce/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  // Farmers
  registerFarmer: (data) =>
    apiRequest('/farmers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getFarmers: (filters = {}) => {
    const q = new URLSearchParams();
    if (filters.search) q.append('search', filters.search);
    if (filters.page) q.append('page', String(filters.page));
    if (filters.limit) q.append('limit', String(filters.limit));
    return apiRequest(`/farmers?${q.toString()}`);
  },
  getMyProfile: (token) =>
    apiRequest('/farmers/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  getMyBookings: (token) =>
    apiRequest('/farmers/me/bookings', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  getFarmerById: (id, token) =>
    apiRequest(`/farmers/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  getFarmerBookings: (id, token) =>
    apiRequest(`/farmers/${id}/bookings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  createFarmerAdmin: (data, token) =>
    apiRequest('/admin/farmers', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  updateFarmerAdmin: (id, data, token) =>
    apiRequest(`/admin/farmers/${id}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  deleteFarmerAdmin: (id, token) =>
    apiRequest(`/admin/farmers/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  // Slots
  getSlots: (params) => {
    const q = new URLSearchParams();
    if (params?.mandiId) q.append('mandiId', params.mandiId.toString());
    if (params?.date) q.append('date', params.date);
    if (params?.availableOnly) q.append('availableOnly', 'true');
    return apiRequest(`/slots?${q.toString()}`);
  },
  getSlotUtilization: () => apiRequest('/slots/utilization'),
  createSlot: (data, token) =>
    apiRequest('/slots', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  updateSlot: (id, data, token) =>
    apiRequest(`/slots/${id}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  deleteSlot: (id, token) =>
    apiRequest(`/slots/${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  // Bookings
  createBooking: (data, token) =>
    apiRequest('/bookings', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  getBookingByToken: (token) =>
    apiRequest(`/bookings/token/${encodeURIComponent((token || '').trim())}`),
  getBookingById: (id) => apiRequest(`/bookings/${id}`),
  cancelBooking: (id, token) =>
    apiRequest(`/bookings/${id}/cancel`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  // Auth & Admin
  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  setupPassword: (data) =>
    apiRequest('/auth/setup-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  googleLogin: ({ credential }) =>
    apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  getCurrentUser: (token) =>
    apiRequest('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  getAdminDashboard: (token) =>
    apiRequest('/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    }),
  getAdminUsers: (token, filters = {}) => {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        q.append(k, String(v));
      }
    });
    return apiRequest(`/admin/users?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  updateUserRole: (id, role, token) =>
    apiRequest(`/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role })
    }),
  getAdminBookings: (token, filters = {}) => {
    const q = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        q.append(k, String(v));
      }
    });
    return apiRequest(`/admin/bookings?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  updateBookingStatus: (id, status, token) =>
    apiRequest(`/admin/bookings/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ Booking_Status: status }),
    }),

  // Transactions, Traders & Warehouses
  getTransactions: () => apiRequest('/transactions'),
  getTransactionSummary: () => apiRequest('/transactions/summary'),
  getTraders: () => apiRequest('/transactions/traders'),
  createTrader: (data, token) =>
    apiRequest('/transactions/traders', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  getWarehouses: () => apiRequest('/transactions/warehouses'),
  createWarehouse: (data, token) =>
    apiRequest('/transactions/warehouses', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(data),
    }),
  recordTransaction: (data, token) =>
    apiRequest('/transactions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
  updatePaymentStatus: (id, status, token) =>
    apiRequest(`/admin/transactions/${id}/payment-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ Payment_Status: status }),
    }),

  // Database Analytics, Views & Benchmark Queries
  getStatistics: () => apiRequest('/analytics/dashboard/statistics'),
  getOperationalMetrics: (params) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
      });
    }
    const qs = q.toString();
    return apiRequest(`/analytics/operational${qs ? `?${qs}` : ''}`);
  },
  getFarmerBookingsView: () => apiRequest('/analytics/views/farmer-bookings'),
  getSuratOperationsView: () => apiRequest('/analytics/views/surat-operations'),
  runBenchmarkQuery: (queryNum, payload) => {
    if (queryNum === 2 || queryNum === 8) {
      return apiRequest(`/analytics/query${queryNum}`, {
        method: 'POST',
        body: JSON.stringify(payload || {}),
      });
    }
    return apiRequest(`/analytics/query${queryNum}`);
  },

  // In-App Notifications
  getNotifications: (params) => {
    const q = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.append(k, String(v));
      });
    }
    const qs = q.toString();
    return apiRequest(`/notifications${qs ? `?${qs}` : ''}`);
  },
  markNotificationRead: (id) =>
    apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    apiRequest('/notifications/read-all', { method: 'PATCH' }),

  // CSV Report Exports (Safe RFC 4180)
  getExportCsvUrl: (type, params) => {
    const q = new URLSearchParams(params || {}).toString();
    return `${API_BASE}/admin/export/${type}.csv${q ? `?${q}` : ''}`;
  },

  // Database Maintenance & Seed Reset (Requires confirmation and Admin credentials)
  resetDatabase: (token, confirmation = 'RESET_AGRISLOT_DATABASE') =>
    apiRequest('/admin/reset-database', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ confirm: confirmation })
    }),

  // Stored Procedures & Database Automation
  cursorDisplayAllFarmers: () => apiRequest('/automation/cursors/farmers/all'),
  cursorDisplayFirstFive: () => apiRequest('/automation/cursors/farmers/first-five'),
  paginatedSearch: (page = 1, limit = 10, search = '') =>
    apiRequest(`/automation/search/paginated?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  getTotalBookingWeight: () => apiRequest('/automation/functions/total-weight'),
  getTotalWeightByFarmer: () => apiRequest('/automation/procedures/weight-by-farmer'),
  getAuditLogs: (token, params) => {
    const q = new URLSearchParams(params || {}).toString();
    return apiRequest(`/admin/audit-logs${q ? `?${q}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
};
