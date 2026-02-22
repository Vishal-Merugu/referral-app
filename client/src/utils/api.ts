import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (typeof window !== "undefined" && err.response?.status === 401) {
      localStorage.removeItem("token");
      delete api.defaults.headers.common["Authorization"];
      window.location.href =
        "/login?redirect=" +
        encodeURIComponent(window.location.pathname + window.location.search);
    }
    return Promise.reject(err);
  },
);

// ── Types ──────────────────────────────────────────────────────────────────
export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "SEEKER" | "EMPLOYEE";
}
export interface LoginPayload {
  email: string;
  password: string;
}
export interface CreateReferralPayload {
  jobRole: string;
  department?: string;
  experienceLevel: string;
  description: string;
  referralPrice?: number;
  skills?: string[];
  remoteType?: "REMOTE" | "HYBRID" | "ONSITE";
  salaryMin?: number;
  salaryMax?: number;
}
export interface UpdateReferralPayload extends Partial<CreateReferralPayload> {
  status?: string;
}
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  headline?: string;
  bio?: string;
  companyId?: string | null;
  avatarUrl?: string | null;
  skills?: string[];
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  resumeUrl?: string;
}
export interface ReferralFilters {
  search?: string;
  companyId?: string;
  experienceLevel?: string;
  remoteType?: string;
  skills?: string;
  page?: number;
  limit?: number;
}

// ── Auth ───────────────────────────────────────────────────────────────────
export const auth = {
  signup: (data: SignupPayload) => api.post("/auth/signup", data),
  login: (data: LoginPayload) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
  deleteAccount: () => api.delete("/auth/account"),
  resetPassword: (email: string) => api.post("/auth/reset-password", { email }),
};

// ── Profile ────────────────────────────────────────────────────────────────
export const profile = {
  update: (data: UpdateProfilePayload) => api.patch("/auth/profile", data),
  getPublic: (userId: string) => api.get(`/users/${userId}/public`),
};

// ── Referrals ──────────────────────────────────────────────────────────────
export const referrals = {
  getAll: (params?: ReferralFilters) =>
    api.get("/referrals", { params: params || {} }),
  getById: (id: string) => api.get(`/referrals/${id}`),
  getMy: () => api.get("/referrals/my"),
  getSaved: () => api.get("/referrals/saved"),
  create: (data: CreateReferralPayload) => api.post("/referrals", data),
  update: (id: string, data: UpdateReferralPayload) =>
    api.patch(`/referrals/${id}`, data),
  save: (id: string) => api.post(`/referrals/${id}/save`),
  unsave: (id: string) => api.delete(`/referrals/${id}/save`),
};

// ── Appointments ───────────────────────────────────────────────────────────
export const appointments = {
  create: (data: {
    referralPostId: string;
    message?: string;
    scheduledAt?: string;
  }) => api.post("/appointments", data),
  getMy: () => api.get("/appointments/my"),
  updateStatus: (id: string, status: string) =>
    api.patch(`/appointments/${id}`, { status }),
  updateStage: (id: string, stage: string) =>
    api.patch(`/appointments/${id}/stage`, { stage }),
};

// ── Companies ──────────────────────────────────────────────────────────────
export const companies = {
  list: () => api.get("/companies"),
  get: (id: string) => api.get(`/companies/${id}`),
  create: (data: {
    name: string;
    domain: string;
    description?: string;
    logoUrl?: string;
  }) => api.post("/companies", data),
};

// ── Messages ───────────────────────────────────────────────────────────────
export const messages = {
  getThread: (partnerId: string) => api.get(`/messages/${partnerId}`),
  send: (data: {
    receiverId: string;
    content: string;
    appointmentId?: string;
  }) => api.post("/messages", data),
  markRead: (senderId: string) => api.patch(`/messages/read/${senderId}`),
  unreadCount: () => api.get("/messages/unread-count"),
};

// ── Notifications ──────────────────────────────────────────────────────────
export const notifications = {
  list: () => api.get("/notifications"),
  unreadCount: () => api.get("/notifications/unread-count"),
  readAll: () => api.patch("/notifications/read-all"),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
};

// ── Reviews ────────────────────────────────────────────────────────────────
export const reviews = {
  create: (data: {
    appointmentId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
  }) => api.post("/reviews", data),
  forUser: (userId: string) => api.get(`/reviews/user/${userId}`),
};

// ── Resources ──────────────────────────────────────────────────────────────
export const resources = {
  list: (params?: { category?: string; companyId?: string; page?: number }) =>
    api.get("/resources", { params }),
  get: (id: string) => api.get(`/resources/${id}`),
  create: (data: {
    title: string;
    content: string;
    category: string;
    companyId?: string;
  }) => api.post("/resources", data),
  upvote: (id: string) => api.post(`/resources/${id}/upvote`),
};

// ── Analytics ──────────────────────────────────────────────────────────────
export const analytics = {
  myReferrals: () => api.get("/analytics/my-referrals"),
};

// ── Availability ───────────────────────────────────────────────────────────
export const availability = {
  getMine: () => api.get("/availability"),
  setMine: (data: {
    timezone: string;
    slots: { dayOfWeek: number; startTime: string; endTime: string }[];
  }) => api.post("/availability", data),
  getForUser: (userId: string, date: string) =>
    api.get(`/users/${userId}/available-slots`, { params: { date } }),
};

// ── AI ─────────────────────────────────────────────────────────────────────
export const ai = {
  match: (resumeText: string) => api.post("/ai/match", { resumeText }),
};

// ── Admin ──────────────────────────────────────────────────────────────────
export const admin = {
  stats: () => api.get("/admin/stats"),
  users: (params?: { page?: number; search?: string }) =>
    api.get("/admin/users", { params }),
  banUser: (id: string) => api.patch(`/admin/users/${id}/ban`),
  unbanUser: (id: string) => api.patch(`/admin/users/${id}/unban`),
  referrals: (params?: { page?: number; search?: string }) =>
    api.get("/admin/referrals", { params }),
  closeReferral: (id: string) => api.patch(`/admin/referrals/${id}/close`),
};

// ── Set token ──────────────────────────────────────────────────────────────
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    localStorage.setItem("token", token);
  } else {
    delete api.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
  }
};
