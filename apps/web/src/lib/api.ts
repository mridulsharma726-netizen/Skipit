const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('skipit_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Handle FormData
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  googleAuth: (payload: { credential?: string; id_token?: string; email?: string; full_name?: string; avatar_url?: string }) =>
    fetchApi('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload: any) => fetchApi('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => fetchApi('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  sendOtp: (phone: string) => fetchApi('/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (payload: { phone: string; otp: string; full_name?: string }) =>
    fetchApi('/auth/otp/verify', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => fetchApi('/auth/me'),
  updateProfile: (payload: any) => fetchApi('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  submitKyc: (formData: FormData) => fetchApi('/auth/kyc/submit', { method: 'POST', body: formData }),

  // Categories
  getCategories: () => fetchApi('/categories'),

  // Listings
  getListings: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi(`/listings${qs ? `?${qs}` : ''}`);
  },
  getFeaturedListings: () => fetchApi('/listings/featured'),
  getListing: (id: string) => fetchApi(`/listings/${id}`),
  createListing: (formData: FormData) => fetchApi('/listings', { method: 'POST', body: formData }),
  updateListing: (id: string, formData: FormData) => fetchApi(`/listings/${id}`, { method: 'PUT', body: formData }),
  toggleListingStatus: (id: string) => fetchApi(`/listings/${id}/toggle-status`, { method: 'PATCH' }),
  deleteListing: (id: string) => fetchApi(`/listings/${id}`, { method: 'DELETE' }),
  getMyListings: () => fetchApi('/listings/my/all'),

  // Chat
  getConversations: () => fetchApi('/chat/conversations'),
  getMessages: (peerId: string) => fetchApi(`/chat/messages/${peerId}`),
  sendMessage: (payload: { receiver_id: string; content: string; listing_id?: string }) =>
    fetchApi('/chat/messages', { method: 'POST', body: JSON.stringify(payload) }),
  sendInquiry: (payload: { listing_id: string; initial_message?: string }) =>
    fetchApi('/chat/inquiry', { method: 'POST', body: JSON.stringify(payload) }),

  // Wishlist
  getWishlist: () => fetchApi('/wishlist'),
  addToWishlist: (listing_id: string) => fetchApi('/wishlist', { method: 'POST', body: JSON.stringify({ listing_id }) }),
  removeFromWishlist: (listingId: string) => fetchApi(`/wishlist/${listingId}`, { method: 'DELETE' }),

  // Reviews
  createReview: (payload: any) => fetchApi('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getUserReviews: (userId: string) => fetchApi(`/reviews/user/${userId}`),

  // Reports
  submitReport: (payload: any) => fetchApi('/reports', { method: 'POST', body: JSON.stringify(payload) }),

  // Notifications
  getNotifications: () => fetchApi('/notifications'),
  markAllNotificationsRead: () => fetchApi('/notifications/read-all', { method: 'PATCH' }),

  // Admin
  getAdminMetrics: () => fetchApi('/admin/metrics'),
  getAdminUsers: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetchApi(`/admin/users${qs ? `?${qs}` : ''}`);
  },
  toggleBanUser: (userId: string, is_banned: boolean, reason?: string) =>
    fetchApi(`/admin/users/${userId}/ban`, { method: 'PATCH', body: JSON.stringify({ is_banned, reason }) }),
  getKycSubmissions: () => fetchApi('/admin/kyc/submissions'),
  reviewKyc: (userId: string, status: 'approved' | 'rejected', notes?: string) =>
    fetchApi(`/admin/kyc/submissions/${userId}/review`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  getAdminReports: () => fetchApi('/admin/reports'),
  resolveReport: (reportId: string, status: string) =>
    fetchApi(`/admin/reports/${reportId}/resolve`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
