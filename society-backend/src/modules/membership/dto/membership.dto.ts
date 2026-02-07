import { IsEnum } from 'class-validator';

// ============ Request DTOs ============

export class PurchaseMembershipDto {
  @IsEnum(['SILVER', 'GOLD', 'PLATINUM'])
  tier: 'SILVER' | 'GOLD' | 'PLATINUM';
}

// ============ Response DTOs ============

export interface MembershipPricingResponse {
  tier: string;
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

export interface ActiveMembershipResponse {
  id: string;
  tier: string;
  status: string;
  price: number;
  startedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface MembershipBenefitsResponse {
  tier: string | null;
  forYouLimit: number;
  maxPendingBookings: number;
  freeCancellationHours: number;
  priorityBooking: boolean;
  nearbySearch: boolean;
  earlyAccess: boolean;
  dedicatedSupport: boolean;
}

export interface MembershipMeResponse {
  active: ActiveMembershipResponse | null;
  history: ActiveMembershipResponse[];
}

export interface MembershipPurchaseResponse {
  membershipId: string;
  tier: string;
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
