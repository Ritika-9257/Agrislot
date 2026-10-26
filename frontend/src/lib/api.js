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

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok && !data.success) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (err) {
    // If backend is momentarily unreachable, supply offline fallback where feasible
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      // In-memory fallback dispatch
      if (endpoint.startsWith('/mandis')) {
        return { success: true, data: FALLBACK_MANDIS };
      }
      if (endpoint.startsWith('/produce')) {
        return { success: true, data: FALLBACK_PRODUCE };
      }
      if (endpoint.startsWith('/farmers')) {
        return { success: true, data: FALLBACK_FARMERS };
      }
      if (endpoint.startsWith('/bookings/token/')) {
        const token = decodeURIComponent(endpoint.split('/bookings/token/')[1]).trim().toUpperCase();
        if (FALLBACK_BOOKINGS[token]) {
          return { success: true, data: FALLBACK_BOOKINGS[token] };
        }
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

  // Produce
  getProduce: (category) =>
    apiRequest(`/produce${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  getProduceById: (id) => apiRequest(`/produce/${id}`),

  // Farmers
  registerFarmer: (data) =>
    apiRequest('/farmers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getFarmers: () => apiRequest('/farmers'),
  getFarmerById: (id) => apiRequest(`/farmers/${id}`),
  getFarmerBookings: (id) => apiRequest(`/farmers/${id}/bookings`),

  // Slots
  getSlots: (params) => {
    const q = new URLSearchParams();
    if (params?.mandiId) q.append('mandiId', params.mandiId.toString());
    if (params?.date) q.append('date', params.date);
    if (params?.availableOnly) q.append('availableOnly', 'true');
    return apiRequest(`/slots?${q.toString()}`);
  },
  getSlotUtilization: () => apiRequest('/slots/utilization'),

  // Bookings
  createBooking: (data) =>
    apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBookingByToken: (token) =>
    apiRequest(`/bookings/token/${encodeURIComponent((token || '').trim())}`),
  getBookingById: (id) => apiRequest(`/bookings/${id}`),
  cancelBooking: (id) =>
    apiRequest(`/bookings/${id}/cancel`, { method: 'PATCH' }),

  // Auth & Admin
  login: (credentials) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
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
  getWarehouses: () => apiRequest('/transactions/warehouses'),
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
  getAuditLogs: (token, params) => {
    const q = new URLSearchParams(params || {}).toString();
    return apiRequest(`/admin/audit-logs${q ? `?${q}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
};
