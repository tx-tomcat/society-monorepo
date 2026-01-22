# Backend Optimization Design

**Date**: 2026-01-23
**Status**: Draft
**Goal**: Comprehensive backend optimization for faster API responses, better scalability, and improved UX

## Executive Summary

This design addresses critical performance and reliability issues discovered through comprehensive codebase analysis:

1. **Blocking Operations**: 6 major blocking operations causing 2-30s delays
2. **Race Conditions**: 5 critical concurrency bugs risking data corruption
3. **Database Issues**: N+1 queries, missing indexes, sequential operations
4. **API Response Bloat**: Over-fetching, missing pagination, deep nesting
5. **Caching Gaps**: Frequently accessed data not cached
6. **Memory Leaks**: Uncleaned event listeners
7. **Security Issues**: Sensitive data in logs, missing rate limits

## Technology Choice

**Bull/BullMQ** with existing Redis infrastructure (ioredis in CacheService)

Rationale:
- Redis already configured and running
- Full control over job lifecycle
- Mature ecosystem with monitoring tools
- No additional infrastructure costs

---

## Phase 1: Critical Concurrency Fixes (Priority: CRITICAL)

### Problem: Race Conditions

Five critical race conditions that can cause data corruption or financial loss:

#### 1.1 Double Payment Processing
**File**: `bank-transfer.service.ts:152-297`

```typescript
// BEFORE: Non-atomic check-then-update
const payment = await this.prisma.payment.findUnique({...});
if (payment.status !== 'PENDING') return; // Race window here
await this.prisma.payment.update({...});
```

**Fix**: Add database-level unique constraint + serializable transaction

```typescript
// AFTER: Atomic with unique constraint
await this.prisma.$transaction(async (tx) => {
  const payment = await tx.payment.update({
    where: {
      id: paymentId,
      status: 'PENDING' // Atomic check
    },
    data: { status: 'PROCESSING' }
  });
  // Continue processing...
}, { isolationLevel: 'Serializable' });
```

#### 1.2 Rating Calculation Race
**File**: `bookings.service.ts:1051-1082`

```typescript
// BEFORE: Read-modify-write without lock
const profile = await this.prisma.companionProfile.findUnique({...});
const newAvg = (profile.rating * profile.reviewCount + newRating) / (profile.reviewCount + 1);
await this.prisma.companionProfile.update({...});
```

**Fix**: Use atomic increment with raw SQL or Prisma's increment

```typescript
// AFTER: Atomic update
await this.prisma.$executeRaw`
  UPDATE "CompanionProfile"
  SET
    "reviewCount" = "reviewCount" + 1,
    "rating" = (("rating" * "reviewCount") + ${newRating}) / ("reviewCount" + 1)
  WHERE "userId" = ${companionId}
`;
```

#### 1.3 Wallet Balance Race
**File**: `wallet.service.ts:168-210`

```typescript
// BEFORE: Check balance then deduct
const wallet = await this.prisma.wallet.findUnique({...});
if (wallet.balance < amount) throw new Error('Insufficient');
await this.prisma.wallet.update({ data: { balance: wallet.balance - amount }});
```

**Fix**: Atomic decrement with check

```typescript
// AFTER: Atomic with constraint
const result = await this.prisma.wallet.updateMany({
  where: {
    userId,
    balance: { gte: amount } // Atomic check
  },
  data: {
    balance: { decrement: amount }
  }
});
if (result.count === 0) throw new InsufficientBalanceError();
```

#### 1.4 Booking Frequency Bypass
**File**: `bookings.service.ts:175-234`

**Fix**: Add unique constraint on `(hirerId, companionId, date)` with partial index

```sql
CREATE UNIQUE INDEX booking_frequency_idx
ON "Booking" ("hirerId", "companionId", DATE("startTime"))
WHERE status NOT IN ('CANCELLED', 'DECLINED');
```

#### 1.5 Webhook Idempotency
**File**: `wallet.service.ts:264-345`

**Fix**: Use idempotency key with unique constraint

```prisma
model WebhookLog {
  id            String   @id @default(cuid())
  idempotencyKey String  @unique
  processedAt   DateTime @default(now())
  result        Json
}
```

### Database Migrations Required

```sql
-- 1. Payment status transition constraint
ALTER TABLE "Payment" ADD CONSTRAINT payment_status_transition
  CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'));

-- 2. Booking frequency unique index
CREATE UNIQUE INDEX booking_frequency_idx
ON "Booking" ("hirerId", "companionId", DATE("startTime"))
WHERE status NOT IN ('CANCELLED', 'DECLINED');

-- 3. Webhook idempotency table
CREATE TABLE "WebhookLog" (
  "id" TEXT PRIMARY KEY,
  "idempotencyKey" TEXT UNIQUE NOT NULL,
  "processedAt" TIMESTAMP DEFAULT NOW(),
  "result" JSONB
);

-- 4. Wallet balance non-negative constraint
ALTER TABLE "Wallet" ADD CONSTRAINT wallet_balance_non_negative
  CHECK (balance >= 0);
```

---

## Phase 2: Bull Queue Infrastructure

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                                │
│  (Controllers receive requests, return immediately)              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Queue Producer                              │
│  (Services add jobs to queues with priority & delay options)     │
└─────────────────────┬───────────────────────────────────────────┘
                      │
         ┌────────────┼────────────┬────────────┬────────────┐
         ▼            ▼            ▼            ▼            ▼
    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
    │ notify  │ │  file   │ │ content │ │ payment │ │   zns   │
    │  queue  │ │  queue  │ │  queue  │ │  queue  │ │  queue  │
    └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘
         │           │           │           │           │
         ▼           ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Redis                                    │
│  (Job storage, status tracking, delayed jobs, retries)           │
└─────────────────────────────────────────────────────────────────┘
         │           │           │           │           │
         ▼           ▼           ▼           ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Queue Workers                               │
│  (Process jobs asynchronously with concurrency limits)           │
└─────────────────────────────────────────────────────────────────┘
```

### Queue Definitions

| Queue | Purpose | Concurrency | Retry | Delay |
|-------|---------|-------------|-------|-------|
| `notification` | Push, email, SMS | 10 | 3x exponential | - |
| `file-processing` | Images, thumbnails | 5 | 2x | - |
| `content-review` | AI moderation | 3 | 2x | - |
| `payment` | Fraud check, earnings | 5 | 3x | - |
| `zns` | Zalo OTP | 5 | 3x | - |
| `scheduled` | Reminders, cleanup | 2 | 2x | yes |

### Implementation Structure

```
src/modules/queue/
├── queue.module.ts
├── queue.config.ts
├── producers/
│   ├── notification.producer.ts
│   ├── file-processing.producer.ts
│   ├── content-review.producer.ts
│   ├── payment.producer.ts
│   └── zns.producer.ts
├── processors/
│   ├── notification.processor.ts
│   ├── file-processing.processor.ts
│   ├── content-review.processor.ts
│   ├── payment.processor.ts
│   └── zns.processor.ts
└── interfaces/
    └── job-data.interface.ts
```

### Service Refactoring

#### Notifications Service (Before)

```typescript
// notifications.service.ts - BLOCKING
async send(dto: SendNotificationDto): Promise<NotificationResult> {
  const notification = await this.prisma.notification.create({...});

  // These block the request:
  if (dto.sendPush) {
    for (const token of user.pushTokens) {
      await this.pushService.sendToDevice({...}); // 0.5-2s per token
    }
  }
  if (dto.sendEmail) {
    await this.emailService.send({...}); // 0.5-2s
  }
  if (dto.sendSms) {
    await this.smsService.send({...}); // 0.5-2s
  }

  return result;
}
```

#### Notifications Service (After)

```typescript
// notifications.service.ts - NON-BLOCKING
async send(dto: SendNotificationDto): Promise<NotificationResult> {
  const notification = await this.prisma.notification.create({...});

  // Queue for async processing - returns immediately
  await this.notificationProducer.enqueue({
    notificationId: notification.id,
    userId: dto.userId,
    channels: {
      push: dto.sendPush,
      email: dto.sendEmail,
      sms: dto.sendSms,
    },
    payload: {
      title: dto.title,
      body: dto.body,
      data: dto.data,
    }
  });

  return { notificationId: notification.id, channels: { inApp: true } };
}
```

```typescript
// notification.processor.ts
@Processor('notification')
export class NotificationProcessor {
  @Process()
  async handle(job: Job<NotificationJobData>) {
    const { notificationId, userId, channels, payload } = job.data;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true, pushTokens: { where: { isActive: true } } }
    });

    const results = await Promise.allSettled([
      channels.push && this.sendPush(user, payload),
      channels.email && this.sendEmail(user, payload),
      channels.sms && this.sendSms(user, payload),
    ]);

    // Log results
    await this.logDeliveryResults(notificationId, results);
  }
}
```

### Operations to Move to Queues

| Operation | Current Location | Blocking Time | Priority |
|-----------|-----------------|---------------|----------|
| Push/Email/SMS | notifications.service.ts:41-123 | 0.5-6s | High |
| Image processing | files.service.ts:112-140 | 2-15s | High |
| AI content review | content-review.service.ts:18-70 | 2-30s | High |
| Review moderation | bookings.service.ts:1040 | 2-5s | Medium |
| Fraud detection | payments.service.ts:70 | 1-3s | Medium |
| Zalo OTP | zns.service.ts:sendOtp | 1-3s | Medium |
| Earnings calculation | payments.service.ts:263-313 | 0.5-1s | Low |

---

## Phase 3: Database & Query Optimization

### 3.1 N+1 Query Fixes

#### Companion Availability (companions.service.ts:593-621)

```typescript
// BEFORE: N+1 queries
const companions = await this.prisma.companionProfile.findMany({...});
for (const companion of companions) {
  const availability = await this.prisma.availability.findMany({
    where: { companionId: companion.userId }
  });
  companion.availability = availability;
}
```

```typescript
// AFTER: Single query with include
const companions = await this.prisma.companionProfile.findMany({
  include: {
    availability: {
      where: {
        dayOfWeek: { in: requestedDays }
      }
    }
  }
});
```

#### Companion Services (companions.service.ts:785-806)

```typescript
// BEFORE: N+2 queries in loop
for (const companion of companions) {
  const services = await this.prisma.service.findMany({...});
  const occasions = await this.prisma.companionOccasion.findMany({...});
}
```

```typescript
// AFTER: Batch with IN clause
const companionIds = companions.map(c => c.userId);
const [allServices, allOccasions] = await Promise.all([
  this.prisma.service.findMany({
    where: { companionId: { in: companionIds } }
  }),
  this.prisma.companionOccasion.findMany({
    where: { companionId: { in: companionIds } }
  })
]);

// Map back to companions
const servicesByCompanion = groupBy(allServices, 'companionId');
const occasionsByCompanion = groupBy(allOccasions, 'companionId');
```

### 3.2 Missing Indexes

```sql
-- Booking queries by status and date
CREATE INDEX idx_booking_companion_status_date
ON "Booking" ("companionId", "status", "startTime");

CREATE INDEX idx_booking_hirer_status
ON "Booking" ("hirerId", "status");

-- Companion browsing
CREATE INDEX idx_companion_active_verified
ON "CompanionProfile" ("isActive", "isVerified", "rating" DESC);

CREATE INDEX idx_companion_location
ON "CompanionProfile" USING GIST ("location");

-- Availability lookups
CREATE INDEX idx_availability_companion_day
ON "Availability" ("companionId", "dayOfWeek");

-- Notification queries
CREATE INDEX idx_notification_user_read
ON "Notification" ("userId", "isRead", "createdAt" DESC);

-- Payment webhook lookups
CREATE INDEX idx_payment_external_id
ON "Payment" ("externalPaymentId");
```

### 3.3 Sequential to Parallel Queries

```typescript
// BEFORE: Sequential
const user = await this.prisma.user.findUnique({...});
const settings = await this.prisma.userSettings.findUnique({...});
const wallet = await this.prisma.wallet.findUnique({...});

// AFTER: Parallel
const [user, settings, wallet] = await Promise.all([
  this.prisma.user.findUnique({...}),
  this.prisma.userSettings.findUnique({...}),
  this.prisma.wallet.findUnique({...}),
]);
```

**Locations to apply**:
- `profile.service.ts:getFullProfile`
- `companions.service.ts:getCompanionDashboard`
- `bookings.service.ts:getBookingDetails`

---

## Phase 4: API Response Optimization

### 4.1 Field Selection (Over-fetching)

#### Companion Browse (35-45% payload reduction)

```typescript
// BEFORE: Returns all 8 photos + full bio
include: {
  photos: true,
  user: true
}

// AFTER: Minimal fields for list view
select: {
  userId: true,
  displayName: true,
  tagline: true,
  rating: true,
  reviewCount: true,
  hourlyRate: true,
  photos: {
    take: 1,
    where: { isPrimary: true },
    select: { url: true }
  },
  user: {
    select: { avatarUrl: true }
  }
}
```

#### Booking List (60-70% reduction)

```typescript
// BEFORE: Full nested objects
include: {
  companion: { include: { user: true, photos: true } },
  hirer: { include: { hirerProfile: true } },
  payment: true,
  review: true
}

// AFTER: Minimal for list
select: {
  id: true,
  status: true,
  startTime: true,
  endTime: true,
  totalAmount: true,
  companion: {
    select: {
      displayName: true,
      photos: { take: 1, where: { isPrimary: true }, select: { url: true } }
    }
  }
}
```

### 4.2 Pagination Fixes

```typescript
// BEFORE: No pagination (bookings.service.ts:350)
const requests = await this.prisma.booking.findMany({
  where: { companionId, status: 'PENDING' }
});

// AFTER: Cursor-based pagination
const requests = await this.prisma.booking.findMany({
  where: { companionId, status: 'PENDING' },
  take: limit + 1, // Fetch one extra to check hasMore
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { createdAt: 'desc' }
});

const hasMore = requests.length > limit;
if (hasMore) requests.pop();

return { items: requests, nextCursor: requests[requests.length - 1]?.id, hasMore };
```

### 4.3 Endpoints to Optimize

| Endpoint | Current Size | Optimized | Reduction |
|----------|-------------|-----------|-----------|
| GET /companions | ~15KB/item | ~2KB/item | 87% |
| GET /bookings/requests | Unbounded | Paginated | 80-95% |
| GET /bookings/:id | ~8KB | ~3KB | 62% |
| GET /user/profile | ~5KB | ~2KB | 60% |

---

## Phase 5: Caching Layer

### Cache Strategy

| Data | TTL | Invalidation | Key Pattern |
|------|-----|--------------|-------------|
| Companion profile | 15 min | On update | `companion:${id}` |
| Companion list (browse) | 5 min | On new/update | `companions:browse:${hash}` |
| Occasions | 24 hours | On admin update | `occasions:all` |
| Holidays | 24 hours | On admin update | `holidays:${year}` |
| User settings | 15 min | On update | `settings:${userId}` |
| Boosted companions | 5 min | On boost change | `companions:boosted` |

### Implementation

```typescript
// cache-patterns.service.ts
@Injectable()
export class CachePatternsService {
  constructor(private cache: CacheService) {}

  async getCompanionProfile(id: string): Promise<CompanionProfile | null> {
    const cacheKey = `companion:${id}`;

    // Try cache first
    const cached = await this.cache.get<CompanionProfile>(cacheKey);
    if (cached) return cached;

    // Fetch from DB
    const profile = await this.prisma.companionProfile.findUnique({...});
    if (profile) {
      await this.cache.set(cacheKey, profile, 900); // 15 min
    }

    return profile;
  }

  async invalidateCompanion(id: string): Promise<void> {
    await Promise.all([
      this.cache.del(`companion:${id}`),
      this.cache.del('companions:boosted'),
      // Invalidate browse cache patterns
    ]);
  }
}
```

---

## Phase 6: Memory & Security Fixes

### 6.1 Memory Leak Fixes

#### CacheService Event Listeners

```typescript
// BEFORE: No cleanup
this.redis.on('error', (error) => {...});
this.redis.on('connect', () => {...});
this.redis.on('close', () => {...});

// AFTER: Cleanup on destroy
private boundHandlers = {
  error: this.handleError.bind(this),
  connect: this.handleConnect.bind(this),
  close: this.handleClose.bind(this),
};

onModuleInit() {
  this.redis.on('error', this.boundHandlers.error);
  this.redis.on('connect', this.boundHandlers.connect);
  this.redis.on('close', this.boundHandlers.close);
}

async onModuleDestroy() {
  this.redis.off('error', this.boundHandlers.error);
  this.redis.off('connect', this.boundHandlers.connect);
  this.redis.off('close', this.boundHandlers.close);
  await this.redis.quit();
}
```

#### Prisma Query Listener (Development)

```typescript
// Only attach in development, and clean up
if (process.env.NODE_ENV === 'development') {
  const queryHandler = (e: Prisma.QueryEvent) => {...};
  this.prisma.$on('query', queryHandler);
  // Store reference for cleanup
}
```

### 6.2 Security Fixes

#### Remove Sensitive Logging

```typescript
// jwt.guard.ts - Remove header logging
// BEFORE: this.logger.debug(`Headers: ${JSON.stringify(request.headers)}`);
// AFTER: this.logger.debug('Processing authentication request');

// webhooks.controller.ts - Redact sensitive data
this.logger.debug('Webhook received', {
  type: body.type,
  // Don't log: body.data, headers.authorization
});
```

#### Add Rate Limiting

```typescript
// payment.controller.ts
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
@Post('create')
async createPayment() {...}

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Post('webhook')
async handleWebhook() {...}
```

---

## Implementation Order

### Week 1: Critical Fixes
1. Database migrations for unique constraints
2. Fix race conditions with atomic operations
3. Add webhook idempotency

### Week 2: Queue Infrastructure
1. Set up Bull module and configuration
2. Create producers and processors
3. Migrate notifications to queue
4. Migrate file processing to queue

### Week 3: Database Optimization
1. Add missing indexes
2. Fix N+1 queries
3. Parallelize sequential queries

### Week 4: API & Caching
1. Implement field selection
2. Add pagination
3. Set up caching patterns
4. Memory leak fixes

### Week 5: Security & Monitoring
1. Remove sensitive logging
2. Add rate limiting
3. Set up Bull Board monitoring
4. Performance testing

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Booking creation P95 | ~5s | <500ms |
| Notification send | ~3s blocking | <50ms (queued) |
| File upload response | ~10s | <200ms (queued) |
| Companion browse | ~800ms | <200ms |
| API payload size | 15KB avg | <3KB avg |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Queue failure | Implement dead-letter queue, monitoring alerts |
| Cache inconsistency | Short TTLs, explicit invalidation on writes |
| Migration downtime | Run migrations during low traffic, test on staging |
| Redis outage | CacheService already handles no-op mode gracefully |

---

## Monitoring

- **Bull Board**: Visual queue monitoring at `/admin/queues`
- **Metrics**: Job completion rate, processing time, failure rate
- **Alerts**: Queue backlog >100 jobs, failure rate >5%
