import { BookingStatus, ServiceType } from '@generated/client';

// ============================================
// Response Types
// ============================================

export interface DashboardResponse {
  todaysSummary: TodaySummary;
  upcomingBookings: UpcomingBooking[];
  recentActivity: ActivityItem[];
  stats: DashboardStats;
}

export interface TodaySummary {
  date: string;
  bookingsCount: number;
  earnings: number;
  nextBooking: NextBookingInfo | null;
}

export interface NextBookingInfo {
  id: string;
  startDatetime: string;
  endDatetime: string;
  occasionType: ServiceType;
  hirer: {
    displayName: string;
    avatar: string | null;
  };
  locationAddress: string;
  startsIn: string;
}

export interface UpcomingBooking {
  id: string;
  startDatetime: string;
  endDatetime: string;
  occasionType: ServiceType;
  status: BookingStatus;
  hirer: {
    displayName: string;
    avatar: string | null;
  };
  locationAddress: string;
  totalPrice: number;
}

export interface ActivityItem {
  id: string;
  type: 'booking_request' | 'booking_confirmed' | 'booking_completed' | 'review_received' | 'payment_received';
  title: string;
  description: string;
  amount?: number;
  createdAt: string;
}

export interface DashboardStats {
  rating: number;
  reviewCount: number;
  responseRate: number;
  completionRate: number;
  totalBookings: number;
  thisMonthBookings: number;
  thisMonthEarnings: number;
}

export interface EarningsOverviewResponse {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  periodStats: PeriodStats;
  recentTransactions: Transaction[];
}

export interface PeriodStats {
  thisWeek: {
    amount: number;
    bookings: number;
    change: number;
  };
  thisMonth: {
    amount: number;
    bookings: number;
    change: number;
  };
  thisYear: {
    amount: number;
    bookings: number;
    change: number;
  };
}

export interface Transaction {
  id: string;
  type: 'earning' | 'withdrawal' | 'bonus' | 'refund';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}
