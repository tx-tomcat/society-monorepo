export interface ModerationQueueItem {
  id: string;
  contentType: string;
  contentId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  priority: number;
  flags: string[];
  status: string;
  assignedTo: string | null;
  createdAt: Date;
  content?: any;
}

export interface ModerationActionInfo {
  id: string;
  queueId: string;
  moderatorId: string;
  moderatorName: string | null;
  action: string;
  reason: string | null;
  notes: string | null;
  createdAt: Date;
}

export interface UserReportInfo {
  id: string;
  reporterId: string;
  reporterName: string | null;
  reportedUserId: string;
  reportedUserName: string | null;
  reason: string;
  description: string | null;
  status: string;
  createdAt: Date;
}

export interface SuspensionInfo {
  id: string;
  userId: string;
  userName: string | null;
  reason: string;
  suspendedById: string;
  suspendedByName: string | null;
  suspendedAt: Date;
  suspendedUntil: Date | null;
  isPermanent: boolean;
  liftedAt: Date | null;
  liftedByName: string | null;
}

export interface AppealInfo {
  id: string;
  userId: string;
  userName: string | null;
  suspensionId: string | null;
  appealText: string;
  status: string;
  reviewedById: string | null;
  reviewedByName: string | null;
  reviewNotes: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

export interface ModerationStats {
  pendingItems: number;
  reviewingItems: number;
  resolvedToday: number;
  pendingAppeals: number;
  activeSuspensions: number;
}

export interface ContentReviewResult {
  isSafe: boolean;
  flags: string[];
  confidence: number;
  suggestedAction?: string;
}
