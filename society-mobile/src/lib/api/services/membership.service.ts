import { apiClient } from '../client';

export type MembershipTier = 'SILVER' | 'GOLD' | 'PLATINUM';
export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface MembershipPricing {
  tier: MembershipTier;
  name: string;
  durationDays: number;
  price: number;
  forYouLimit: number;
  maxPendingBookings: number;
  freeCancellationHours: number;
  priorityBooking: boolean;
  nearbySearch: boolean;
  earlyAccess: boolean;
  dedicatedSupport: boolean;
  description: string | null;
}

export interface ActiveMembership {
  id: string;
  tier: MembershipTier;
  status: MembershipStatus;
  price: number;
  startedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface MembershipBenefits {
  tier: MembershipTier | null;
  forYouLimit: number;
  maxPendingBookings: number;
  freeCancellationHours: number;
  priorityBooking: boolean;
  nearbySearch: boolean;
  earlyAccess: boolean;
  dedicatedSupport: boolean;
}

export interface MembershipMeResponse {
  active: ActiveMembership | null;
  history: ActiveMembership[];
}

export interface MembershipPurchaseResult {
  membershipId: string;
  tier: MembershipTier;
  price: number;
  paymentRequestId: string;
  code: string;
  qrUrl: string;
  deeplinks: Array<{
    appId: string;
    name: string;
    logo: string;
    deeplink: string;
  }>;
  accountInfo: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  expiresAt: string;
}

export const membershipService = {
  /**
   * Get membership tier pricing options
   */
  async getPricing(): Promise<MembershipPricing[]> {
    return apiClient.get('/membership/pricing');
  },

  /**
   * Get current user's membership status and history
   */
  async getMe(): Promise<MembershipMeResponse> {
    return apiClient.get('/membership/me');
  },

  /**
   * Purchase a membership tier
   */
  async purchase(tier: MembershipTier): Promise<MembershipPurchaseResult> {
    return apiClient.post('/membership/purchase', { tier });
  },

  /**
   * Get current user's membership benefits
   */
  async getBenefits(): Promise<MembershipBenefits> {
    return apiClient.get('/membership/benefits');
  },
};
