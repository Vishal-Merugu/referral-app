/** User (from auth/profile) */
export interface User {
  id: string;
  email: string;
  role: "SEEKER" | "EMPLOYEE" | "ADMIN";
  firstName: string | null;
  lastName: string | null;
  headline: string | null;
  bio?: string | null;
  avatarUrl: string | null;
  skills?: string[];
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  resumeUrl?: string | null;
  companyId: string | null;
  company?: Company | null;
  isBanned?: boolean;
  isVerified?: boolean;
  reviewsReceived?: {
    rating: number;
    comment?: string | null;
    createdAt?: string;
    reviewer?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
    };
  }[];
  referralPosts?: Pick<
    ReferralPost,
    "id" | "jobRole" | "experienceLevel" | "status"
  >[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string | null;
  description?: string | null;
  websiteUrl?: string | null;
  industry?: string | null;
  headquarters?: string | null;
  size?: string | null;
  techStack?: string[];
  perks?: string[];
}

export type RemoteType = "REMOTE" | "HYBRID" | "ONSITE";

export interface ReferralPost {
  id: string;
  jobRole: string;
  department: string | null;
  experienceLevel: string;
  description: string;
  referralPrice: number | string;
  status: string;
  employeeId: string;
  skills?: string[];
  remoteType?: RemoteType;
  salaryMin?: number | null;
  salaryMax?: number | null;
  viewCount?: number;
  employee?: {
    id?: string;
    firstName: string | null;
    lastName: string | null;
    headline: string | null;
    avatarUrl?: string | null;
    isVerified?: boolean;
    company: Company | null;
    reviewsReceived?: { rating: number }[];
  };
  appointments?: Appointment[];
  savedBy?: { id: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  status: string;
  stage?: string;
  message: string | null;
  scheduledAt: string | null;
  referralPostId: string;
  referralPost?: ReferralPost;
  seekerId?: string;
  seeker?: {
    id?: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  appointmentId?: string | null;
  content: string;
  readAt?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  receiver?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  appointmentId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface Resource {
  id: string;
  authorId: string;
  title: string;
  content: string;
  category: string;
  companyId?: string | null;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    headline?: string | null;
  };
  company?: Company | null;
}

/** Axios error with API error body */
export interface ApiError extends Error {
  response?: { data?: { error?: string }; status?: number };
}
