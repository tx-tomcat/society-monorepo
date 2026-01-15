export enum Role {
  PROFESSIONAL = 'PROFESSIONAL',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  SUPPORT = 'SUPPORT',
}

export enum Permission {
  // User Management
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_MANAGE = 'user:manage',

  // Profile
  PROFILE_READ = 'profile:read',
  PROFILE_WRITE = 'profile:write',

  // Matching
  MATCH_READ = 'match:read',
  MATCH_WRITE = 'match:write',

  // Messaging
  MESSAGE_READ = 'message:read',
  MESSAGE_WRITE = 'message:write',
  MESSAGE_DELETE = 'message:delete',

  // Moderation
  MODERATION_READ = 'moderation:read',
  MODERATION_WRITE = 'moderation:write',
  MODERATION_BAN = 'moderation:ban',

  // Admin
  ADMIN_ACCESS = 'admin:access',
  ADMIN_USERS = 'admin:users',
  ADMIN_ANALYTICS = 'admin:analytics',
  ADMIN_CONFIG = 'admin:config',

  // Payments
  PAYMENT_READ = 'payment:read',
  PAYMENT_REFUND = 'payment:refund',

  // Events
  EVENT_READ = 'event:read',
  EVENT_WRITE = 'event:write',
  EVENT_MANAGE = 'event:manage',

  // Verification
  VERIFICATION_READ = 'verification:read',
  VERIFICATION_WRITE = 'verification:write',
  VERIFICATION_APPROVE = 'verification:approve',
}

export const RolePermissions: Record<Role, Permission[]> = {
  [Role.PROFESSIONAL]: [
    Permission.USER_READ,
    Permission.PROFILE_READ,
    Permission.PROFILE_WRITE,
    Permission.MATCH_READ,
    Permission.MATCH_WRITE,
    Permission.MESSAGE_READ,
    Permission.MESSAGE_WRITE,
    Permission.PAYMENT_READ,
    Permission.EVENT_READ,
  ],
  [Role.STUDENT]: [
    Permission.USER_READ,
    Permission.PROFILE_READ,
    Permission.PROFILE_WRITE,
    Permission.MATCH_READ,
    Permission.MATCH_WRITE,
    Permission.MESSAGE_READ,
    Permission.MESSAGE_WRITE,
    Permission.PAYMENT_READ,
    Permission.EVENT_READ,
  ],
  [Role.MODERATOR]: [
    Permission.USER_READ,
    Permission.PROFILE_READ,
    Permission.MODERATION_READ,
    Permission.MODERATION_WRITE,
    Permission.MESSAGE_READ,
    Permission.MESSAGE_DELETE,
  ],
  [Role.SUPPORT]: [
    Permission.USER_READ,
    Permission.PROFILE_READ,
    Permission.PAYMENT_READ,
    Permission.VERIFICATION_READ,
  ],
  [Role.ADMIN]: Object.values(Permission),
};
