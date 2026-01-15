import { UserRole, UserStatus } from '@generated/client';
import { Prisma } from '@generated/client';

export interface AdminUserInfo {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  fullName: string;
  isVerified: boolean;
  hasProfile: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}

export interface AdminUserDetail {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  fullName: string;
  isVerified: boolean;
  trustScore: number;
  createdAt: Date;
  lastLoginAt: Date | null;
  profile: {
    bio: string | null;
    photos: string[];
    hourlyRate: number;
    ratingAvg: number;
    ratingCount: number;
    totalBookings: number;
    completedBookings: number;
  } | null;
  stats: {
    totalBookings: number;
    completedBookings: number;
    reports: number;
    warnings: number;
  };
}

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    companions: number;
    hirers: number;
  };
  verifications: {
    pending: number;
    verified: number;
    rejected: number;
  };
  bookings: {
    total: number;
    completed: number;
    today: number;
    revenue30Days: number;
  };
  withdrawals: {
    pending: number;
  };
  moderation: {
    pendingReports: number;
    pendingAppeals: number;
    activeSuspensions: number;
  };
}

export interface SystemHealth {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
  };
  cache: {
    status: 'healthy' | 'degraded' | 'down';
    hitRate: number;
  };
  storage: {
    status: 'healthy' | 'degraded' | 'down';
    usedSpace: number;
  };
  services: Array<{
    name: string;
    status: 'healthy' | 'degraded' | 'down';
    lastCheck: Date;
  }>;
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Prisma.JsonValue;
  ipAddress: string | null;
  createdAt: Date;
}

export interface PendingVerification {
  id: string;
  userId: string;
  userName: string | null;
  type: string;
  provider: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
}

export interface PendingWithdrawal {
  id: string;
  companionId: string;
  companionName: string;
  amount: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  createdAt: Date;
}
