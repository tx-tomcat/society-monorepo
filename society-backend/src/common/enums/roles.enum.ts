export enum Role {
  ADMIN = 'ADMIN',
  HIRER = 'HIRER',
  COMPANION = 'COMPANION',
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
  [Role.ADMIN]: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE,
    Permission.PROFILE_READ,
    Permission.PROFILE_WRITE,
    Permission.MATCH_READ,
    Permission.MATCH_WRITE,
    Permission.MESSAGE_READ,
    Permission.MESSAGE_WRITE,
    Permission.MESSAGE_DELETE,
    Permission.MODERATION_READ,
    Permission.MODERATION_WRITE,
    Permission.MODERATION_BAN,
    Permission.ADMIN_ACCESS,
    Permission.ADMIN_USERS,
    Permission.ADMIN_ANALYTICS,
    Permission.ADMIN_CONFIG,
    Permission.PAYMENT_READ,
    Permission.PAYMENT_REFUND,
    Permission.EVENT_READ,
    Permission.EVENT_WRITE,
    Permission.EVENT_MANAGE,
    Permission.VERIFICATION_READ,
    Permission.VERIFICATION_WRITE,
    Permission.VERIFICATION_APPROVE,
  ],
  [Role.HIRER]: [
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
  [Role.COMPANION]: [
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


};
