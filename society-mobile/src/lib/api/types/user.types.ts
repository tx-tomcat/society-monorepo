/**
 * Shared user types for API responses
 * These types match the backend /users/profile endpoint response
 */

export type UserRole = 'hirer' | 'companion' | 'admin';
export type BackendUserRole = 'HIRER' | 'COMPANION' | 'ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface UserBase {
  id: string;
  email: string;
  phone?: string;
  fullName: string;
  avatarUrl?: string;
  gender?: string;
  dateOfBirth?: string;
  role: BackendUserRole;
  status: UserStatus;
  isVerified: boolean;
  trustScore: number;
}

export interface CompanionProfile {
  bio?: string;
  heightCm?: number;
  languages?: string[];
  hourlyRate?: number;
  halfDayRate?: number;
  fullDayRate?: number;
  ratingAvg?: number;
  ratingCount?: number;
  totalBookings?: number;
  isActive?: boolean;
  isHidden?: boolean;
  photos?: Array<{ id: string; url: string; order: number; isPrimary?: boolean }>;
  services?: Array<{ id: string; name: string; description?: string }>;
  availability?: unknown;
}

export interface HirerProfile {
  id: string;
  company?: string;
  occupation?: string;
  preferredServices?: string[];
}

export interface UserProfileResponse {
  user: UserBase;
  profile: CompanionProfile | HirerProfile | null;
  verifications: Array<{ type: string; verifiedAt: string }>;
}

/**
 * Maps backend role (uppercase) to mobile role (lowercase)
 */
export const roleMap: Record<BackendUserRole, UserRole> = {
  HIRER: 'hirer',
  COMPANION: 'companion',
  ADMIN: 'admin',
};

/**
 * Maps mobile role to backend role
 */
export const reverseRoleMap: Record<UserRole, BackendUserRole> = {
  hirer: 'HIRER',
  companion: 'COMPANION',
  admin: 'ADMIN',
};
