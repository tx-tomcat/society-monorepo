export interface RateLimitStatus {
  type: string;
  remaining: number;
  limit: number;
  resetAt: Date;
  blocked: boolean;
}

export interface SecurityEventInfo {
  id: string;
  userId: string | null;
  userName: string | null;
  eventType: string;
  ip: string | null;
  userAgent: string | null;
  details: Record<string, any>;
  riskScore: number;
  createdAt: Date;
}

export interface BlockedIpInfo {
  ip: string;
  reason: string | null;
  blockedBy: string | null;
  blockedAt: Date;
  expiresAt: Date | null;
  isPermanent: boolean;
}

export interface FraudReportInfo {
  id: string;
  userId: string;
  userName: string | null;
  riskLevel: string;
  fraudType: string;
  description: string | null;
  evidence: Record<string, any>;
  status: string;
  reviewedBy: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

export interface SecurityMetrics {
  loginAttemptsToday: number;
  failedLoginsToday: number;
  blockedIps: number;
  activeSessions: number;
  suspiciousActivities: number;
  fraudReportsPending: number;
}

export interface RiskAssessment {
  userId: string;
  overallRisk: string;
  riskScore: number;
  factors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

export interface SessionInfo {
  id: string;
  userId: string;
  ip: string;
  userAgent: string;
  device: string;
  location: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  isCurrent: boolean;
}

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDurationSeconds: number;
  requireStrongPassword: boolean;
  enableTwoFactor: boolean;
  allowedOrigins: string[];
  rateLimits: Record<string, { maxRequests: number; windowSeconds: number }>;
}
