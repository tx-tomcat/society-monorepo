# SOCIETY — Complete Technical Documentation

## Vietnam's First Trusted Companion Booking Platform

**Version:** 2.0  
**Last Updated:** January 2026  
**Author:** James (Founder/CTO)

---

# Table of Contents

1. [Product Requirements Document (PRD)](#part-1-product-requirements-document-prd)
2. [MVP Scope Definition](#part-2-mvp-scope-definition)
3. [User Flows](#part-3-user-flows)
4. [Use Cases & Edge Cases](#part-4-use-cases--edge-cases)
5. [System Architecture](#part-5-system-architecture)
6. [Entity Relationship Diagram (ERD)](#part-6-entity-relationship-diagram-erd)
7. [Appendices](#appendices)

---

# Part 1: Product Requirements Document (PRD)

## 1.1 Product Vision

Society is Vietnam's first technology platform for companion rental services — connecting clients who need verified companions for family events, weddings, and business functions with companions seeking flexible, high-paying work.

### Mission Statement

To professionalize Vietnam's fragmented $10-30M companion rental market by building the trusted technology layer that eliminates pain points for both clients and companions.

### Success Metrics

| Metric | Target (Year 1) |
|--------|-----------------|
| Active Companions | 2,000+ |
| Total Bookings | 8,000 |
| Gross Transaction Value | 14 billion VND ($560K) |
| Platform Revenue | 2.5 billion VND ($100K) |
| Break-even | Month 5 |

## 1.2 Target Users

### Primary Persona: Hirer (Client)

- **Age:** 25-40, Urban professionals (HCMC, Hanoi)
- **Income:** 15-50M VND/month
- **Pain Points:** Family pressure, no trusted platform, fear of scams
- **Goals:** Find verified companion, transparent pricing, secure payment

### Secondary Persona: Companion (Provider)

- **Demographics:** 92% university students, Age 20-28
- **Pain Points:** Payment risks, safety concerns, inconsistent bookings
- **Goals:** Guaranteed payment, safety features, build reputation

## 1.3 Feature Requirements

### P0 — Critical for MVP

| Feature | Hirer | Companion | Description |
|---------|:-----:|:---------:|-------------|
| User Registration | ✓ | ✓ | Phone/Email + OTP |
| Identity Verification | ✓ | ✓ | VNeID, photo verification |
| Profile Management | ✓ | ✓ | Photos, bio, preferences |
| Browse & Search | ✓ | — | Filter by location, price, occasion |
| Booking Flow | ✓ | ✓ | Date/time, occasion, location |
| In-App Messaging | ✓ | ✓ | 1-on-1 chat post-booking |
| Payment (Escrow) | ✓ | ✓ | VNPay/Momo integration |
| Ratings & Reviews | ✓ | ✓ | Post-service rating |
| Notifications | ✓ | ✓ | Push notifications |

### P1 — High Priority (Month 2-3)

- Earnings Dashboard, Calendar Sync, Favorite Companions, Report & Block

### P2 — Medium Priority (Month 4-6)

- GPS Check-in, Emergency Button, Profile Boost, Verified Badges

### P3 — Future

- AI Matching, Multi-day Packages, Corporate Accounts, Premium Dating

---

# Part 2: MVP Scope Definition

## 2.1 MVP Screen Map

### Hirer App — 12 Screens

1. Splash, 2. Login/Register, 3. Verification, 4. Browse Companions, 5. Search & Filter, 6. Companion Profile, 7. Booking Form, 8. Payment, 9. Booking Confirmation, 10. My Bookings, 11. Chat, 12. Settings

### Companion App — 14 Screens

1. Splash, 2. Login/Register, 3. Identity Verification, 4. Create Profile, 5. Set Services, 6. Set Pricing, 7. Set Availability, 8. Dashboard, 9. Booking Requests, 10. My Schedule, 11. Booking Detail, 12. Chat, 13. Earnings, 14. Settings

## 2.2 MVP Timeline

| Week | Milestone |
|------|-----------|
| 1 | Setup & Auth |
| 2 | Profiles & Onboarding |
| 3 | Discovery & Search |
| 4 | Booking Flow |
| 5 | Payments |
| 6 | Messaging & Notifications |
| 7 | Testing & Polish |
| 8 | Soft Launch |

---

# Part 3: User Flows

## 3.1 Hirer Registration Flow

```
[App Launch] → [Splash] → [Login/Register] → [OTP Verify] → [Create Profile] → [Home: Browse]
```

## 3.2 Booking Flow

```
[Browse] → [Filter] → [Companion Profile] → [Book Now] → [Booking Form] → [Payment] → [Confirmation]
```

## 3.3 Companion Onboarding Flow

```
[Register] → [Identity Verification] → [Create Profile] → [Set Services] → [Set Pricing] → [Set Availability] → [Dashboard]
```

## 3.4 Companion Booking Management

```
[Notification] → [Booking Requests] → [Request Detail] → [Accept/Decline] → [Confirmed] → [Chat Enabled]
```

## 3.5 Earnings & Withdrawal Flow

```
[Dashboard] → [Earnings] → [Withdraw] → [Enter Amount] → [Select Bank] → [Confirm] → [Processing]
```

---
# Part 4: Use Cases & Edge Cases

## 4.1 Authentication Use Cases

### UC-AUTH-001: New User Registration

| Field | Description |
|-------|-------------|
| **Actor** | New User |
| **Main Flow** | Enter phone → Receive OTP → Verify → Create profile → Complete |

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-AUTH-001a | Invalid phone format | Show validation error |
| EC-AUTH-001b | Phone already registered | Offer login option |
| EC-AUTH-001c | OTP expired (>60s) | Allow resend, max 3/15min |
| EC-AUTH-001d | Wrong OTP 5 times | Lock 30 minutes |
| EC-AUTH-001e | SMS not received | Offer voice call OTP |
| EC-AUTH-001f | Network timeout | Auto-retry 3 times |
| EC-AUTH-001g | App closed during registration | Resume from last step |
| EC-AUTH-001h | Under 18 (DOB) | Block registration |

### UC-AUTH-002: Returning User Login

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-AUTH-002a | Token expired | Show login, redirect |
| EC-AUTH-002b | Account suspended | Show message + support |
| EC-AUTH-002c | Account deleted | Offer re-registration |
| EC-AUTH-002d | New device login | Security notification |
| EC-AUTH-002e | Brute force detected | Enable CAPTCHA |

### UC-AUTH-003: Account Deletion

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-AUTH-003a | Pending bookings | Block deletion |
| EC-AUTH-003b | Unreleased earnings | Block until withdrawn |
| EC-AUTH-003c | Data export request | Generate download |
| EC-AUTH-003d | Re-register within 30 days | Offer recovery |

---

## 4.2 Companion Profile Use Cases

### UC-COMP-001: Create Companion Profile

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-COMP-001a | Blurry VNeID | Request re-upload |
| EC-COMP-001b | Selfie doesn't match ID | Flag for manual review |
| EC-COMP-001c | Inappropriate photos | Auto-detect, reject |
| EC-COMP-001d | Bio contains contact info | Auto-filter, warn |
| EC-COMP-001e | Price below minimum | Show minimum requirement |
| EC-COMP-001f | No availability set | Block activation |
| EC-COMP-001g | Duplicate VNeID | Block, flag fraud |
| EC-COMP-001h | Under 18 per VNeID | Block companion role |
| EC-COMP-001i | Stolen/stock photos | Reject, request original |

### UC-COMP-002: Update Availability

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-COMP-002a | Block time with booking | Prevent blocking |
| EC-COMP-002b | All availability removed | Hide from search, warn |
| EC-COMP-002c | Conflict with pending request | Show notification |

### UC-COMP-003: Update Pricing

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-COMP-003a | Price >50% increase | Show warning |
| EC-COMP-003b | Below minimum | Block save |
| EC-COMP-003c | Pending requests at old price | Honor old price |

---

## 4.3 Discovery Use Cases

### UC-DISC-001: Browse Companions

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-DISC-001a | No companions in city | Suggest expand radius |
| EC-DISC-001b | All fully booked | Show "Request availability" |
| EC-DISC-001c | Location not detected | Prompt permission/manual |
| EC-DISC-001d | Slow network | Skeleton loaders, progressive load |
| EC-DISC-001e | End of results | Show "No more results" |
| EC-DISC-001f | Blocked companion | Hide from results |

### UC-DISC-002: Search with Filters

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-DISC-002a | No results match | Suggest broadening filters |
| EC-DISC-002b | Past date selected | Disable past dates |
| EC-DISC-002c | Min > Max price | Swap values or error |
| EC-DISC-002d | Zero results for date | Suggest nearby dates |

### UC-DISC-003: View Profile

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-DISC-003a | Companion deactivated | "Profile no longer available" |
| EC-DISC-003b | No reviews yet | "Be the first to book!" |
| EC-DISC-003c | Photos fail to load | Placeholder + retry |
| EC-DISC-003d | Blocked by companion | "Companion not available" |
| EC-DISC-003e | Deep link | Open directly, login if needed |

---

## 4.4 Booking Use Cases

### UC-BOOK-001: Create Booking Request

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-BOOK-001a | Slot no longer available | Show error, refresh |
| EC-BOOK-001b | Pending booking same companion | Warn about overlap |
| EC-BOOK-001c | Payment fails | Show error, alternatives |
| EC-BOOK-001d | Payment timeout | Hold slot 10 min, release |
| EC-BOOK-001e | App crashes during payment | Webhook handles, confirm on return |
| EC-BOOK-001f | Booking limit exceeded | Block, flag for review |
| EC-BOOK-001g | Same-day booking | +30% surge pricing |
| EC-BOOK-001h | Location outside service area | Warn, allow if companion accepts |
| EC-BOOK-001i | Duration exceeds max | Show limits, suggest split |
| EC-BOOK-001j | Low trust score | Additional verification |
| EC-BOOK-001k | Inappropriate special request | Filter, ask to rephrase |
| EC-BOOK-001l | Multiple simultaneous bookings | Process sequential, second fails |

### UC-BOOK-002: Companion Accepts

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-BOOK-002a | No response 24h | Auto-decline, refund |
| EC-BOOK-002b | Accept then cancel | Strike system |
| EC-BOOK-002c | Double booking conflict | Block second |
| EC-BOOK-002d | Hirer cancelled while reviewing | Show "Cancelled by hirer" |
| EC-BOOK-002e | Network error | Auto-retry |
| EC-BOOK-002f | Verification expired | Block until re-verified |

### UC-BOOK-003: Companion Declines

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-BOOK-003a | Declines all (pattern) | Flag for review |
| EC-BOOK-003b | Decline rate >50% | Warning, affect ranking |
| EC-BOOK-003c | Discriminatory reason | Flag for policy violation |

### UC-BOOK-004: Hirer Cancels

**Cancellation Policy:**

| Timing | Refund |
|--------|--------|
| > 48h | 100% |
| 24-48h | 50% |
| < 24h | 0% |
| Companion no-show | 100% + credits |

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-BOOK-004a | Cancel during active | No refund, "completed early" |
| EC-BOOK-004b | Emergency claimed | Once per account with verification |
| EC-BOOK-004c | Refund fails | Retry auto, support notification |
| EC-BOOK-004d | Cancels repeatedly | Flag, may require deposit |
| EC-BOOK-004e | Force majeure | Full refund both parties |

### UC-BOOK-005: Companion Cancels

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-BOOK-005a | Cancel <24h | Major strike, potential suspension |
| EC-BOOK-005b | Verified emergency | No strike with docs |
| EC-BOOK-005c | Multiple cancels | Progressive penalties |
| EC-BOOK-005d | Near Tết/holiday | Extra penalty |
| EC-BOOK-005e | Falls ill day-of | Verified sick leave, no strike |

### UC-BOOK-006: Complete Booking

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-BOOK-006a | Hirer disputes quality | Hold payment, support review |
| EC-BOOK-006b | Hirer claims no-show | Require GPS proof (P1) |
| EC-BOOK-006c | Companion claims hirer no-show | Verify via chat/location |
| EC-BOOK-006d | Ended early mutual | Proportional payment |
| EC-BOOK-006e | Neither confirms | Auto-complete 48h |
| EC-BOOK-006f | Extended beyond time | Pay extra via app first |

### UC-BOOK-007: Handle Dispute

**Dispute Categories:**

| Category | Response Time | Resolution |
|----------|---------------|------------|
| No-show | 24h | Full refund or release |
| Service quality | 48h | Partial refund if valid |
| Inappropriate behavior | 24h | Full refund + account action |
| Safety concern | Immediate | Emergency protocol |
| Payment issue | 48h | Refund or correction |

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-BOOK-007a | Both file disputes | Priority safety, then chronological |
| EC-BOOK-007b | Inconclusive evidence | 50/50 split or favor better history |
| EC-BOOK-007c | Filed after 7 days | Reject as too late |
| EC-BOOK-007d | Multiple disputes same parties | Flag, suggest blocking |
| EC-BOOK-007e | False dispute | Penalty for filer |
| EC-BOOK-007f | During active booking | Immediate intervention |

---

## 4.5 Payment Use Cases

### UC-PAY-001: Process Payment

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-PAY-001a | Declined (insufficient funds) | Error, alternatives |
| EC-PAY-001b | Timeout | Auto-cancel, allow retry |
| EC-PAY-001c | User cancels on page | Return to form |
| EC-PAY-001d | Duplicate payment | Detect, block duplicate |
| EC-PAY-001e | Success but callback fails | Webhook reconciliation |
| EC-PAY-001f | Currency mismatch | Auto-convert to VND |
| EC-PAY-001g | Provider down | "Try again later" |
| EC-PAY-001h | Fraud detected | Block, additional verification |
| EC-PAY-001i | First-time large payment (>5M) | Additional verification |
| EC-PAY-001j | 3D Secure fails | Suggest alternative |

### UC-PAY-002: Process Refund

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-PAY-002a | Original method invalid | Refund to wallet/credits |
| EC-PAY-002b | Partial refund dispute | Support review |
| EC-PAY-002c | Refund fails | Retry 3x, manual intervention |
| EC-PAY-002d | Not received claim | Provide transaction ID |
| EC-PAY-002e | Exceeds original (error) | Block, review |

### UC-PAY-003: Withdrawal

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-PAY-003a | Exceeds balance | Block, show balance |
| EC-PAY-003b | Wrong bank details | Transfer fails, notify |
| EC-PAY-003c | Daily limit reached | Show limit, retry later |
| EC-PAY-003d | Bank maintenance | Queue, process when available |
| EC-PAY-003e | Suspicious pattern | Hold for review |
| EC-PAY-003f | First withdrawal | Additional KYC |
| EC-PAY-003g | Pending dispute | Block pending earnings |
| EC-PAY-003h | Bank rejects | Notify, suggest update details |
| EC-PAY-003i | Unverified account | Require verification first |

---

## 4.6 Messaging Use Cases

### UC-MSG-001: Send Message

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-MSG-001a | Network failure | Queue locally, retry |
| EC-MSG-001b | Recipient offline | Deliver on connect + push |
| EC-MSG-001c | Contains phone number | Auto-mask until booking day |
| EC-MSG-001d | Inappropriate content | Filter/block with warning |
| EC-MSG-001e | Spam (rapid messages) | Rate limit 10/min |
| EC-MSG-001f | Too long | 1000 char limit |
| EC-MSG-001g | Chat closed | "Chat disabled" + support |
| EC-MSG-001h | Blocked by other | Not delivered, no notification |
| EC-MSG-001i | Image too large | Auto-compress or error |

### UC-MSG-002: Report User

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-MSG-002a | False report | Penalize reporter |
| EC-MSG-002b | Multiple reports same user | Expedite, may auto-suspend |
| EC-MSG-002c | Booking today | Urgent review |
| EC-MSG-002d | Counter-report | Review both perspectives |

---

## 4.7 Review Use Cases

### UC-REV-001: Submit Review

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-REV-001a | Contains profanity | Auto-filter, rephrase |
| EC-REV-001b | Window expired (>7 days) | Disable submission |
| EC-REV-001c | Edit after submission | One edit within 24h |
| EC-REV-001d | Outlier rating | Flag for review |
| EC-REV-001e | Contains personal info | Auto-redact |

### UC-REV-002: Dispute Review

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-REV-002a | Deadline passed | Reject dispute |
| EC-REV-002b | Clear violation | Remove immediately |
| EC-REV-002c | Reviewer deleted | Keep review, anonymize |
| EC-REV-002d | Negative pattern from one user | Investigate harassment |

---

## 4.8 Safety Use Cases

### UC-SAFE-001: Emergency During Booking

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-SAFE-001a | False alarm | 30s cancel option |
| EC-SAFE-001b | No response to callback | Authorities after 5 min |
| EC-SAFE-001c | Location disabled | Use last known |
| EC-SAFE-001d | Multiple triggers same user | Investigate misuse |
| EC-SAFE-001e | Harassment accusation | Immediate suspension |

### UC-SAFE-002: Block User

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-SAFE-002a | During active booking | Complete current, block future |
| EC-SAFE-002b | Blocked tries to book | "Not available" |
| EC-SAFE-002c | Mutual block | Neither sees other |
| EC-SAFE-002d | Blocked creates new account | Flag evasion |

### UC-SAFE-003: Report Fraud

**Fraud Types:**

| Type | Response |
|------|----------|
| Fake profile | Suspend, verify identity |
| Payment fraud | Reverse, ban |
| Service fraud | Refund, penalize |
| Booking fraud | Remove fake data, suspend |
| Identity theft | Ban, report authorities |

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-SAFE-003a | Report against new user | Higher scrutiny |
| EC-SAFE-003b | Report against high-rated | Thorough investigation |
| EC-SAFE-003c | Multiple reports same user | Immediate suspension |
| EC-SAFE-003d | False report | Penalize reporter |
| EC-SAFE-003e | Significant money involved | Escalate to legal |

---

## 4.9 Notification Use Cases

### UC-NOTIF-001: Receive Push

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-NOTIF-001a | Push disabled | In-app notifications |
| EC-NOTIF-001b | Token expired | Re-register on app open |
| EC-NOTIF-001c | Delivery failed | Retry 3x |
| EC-NOTIF-001d | DND mode | Queue until DND ends |
| EC-NOTIF-001e | Too many notifications | Rate limit per hour |
| EC-NOTIF-001f | Deep link broken | Fallback to home |

---

## 4.10 Admin Use Cases

### UC-ADMIN-001: Verify Companion

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-ADMIN-001a | Document obscured | Request re-upload |
| EC-ADMIN-001b | Low selfie quality | Request new selfie |
| EC-ADMIN-001c | Tampered document | Reject, flag fraud |
| EC-ADMIN-001d | Name mismatch | Allow reasonable variation |
| EC-ADMIN-001e | Expired ID | Request current |
| EC-ADMIN-001f | Foreign ID | Manual review + additional proof |

### UC-ADMIN-002: Handle Support Ticket

**SLA:**

| Priority | First Response | Resolution |
|----------|---------------|------------|
| Critical (safety) | 1h | 4h |
| High (payments) | 4h | 24h |
| Medium (disputes) | 24h | 48h |
| Low (general) | 48h | 72h |

**Edge Cases:**

| ID | Scenario | Response |
|----|----------|----------|
| EC-ADMIN-002a | User unresponsive | Auto-close 7 days |
| EC-ADMIN-002b | Requires escalation | Transfer to senior |
| EC-ADMIN-002c | User abusive | Warning, then terminate |
| EC-ADMIN-002d | Same issue repeatedly | Find root cause |

---

## 4.11 System Edge Cases

### Server Errors

| Scenario | User Experience | Backend |
|----------|----------------|---------|
| API 500 | "Something went wrong" + retry | Log, alert on-call |
| DB timeout | Graceful degradation | Connection pool recovery |
| Payment provider down | "Temporarily unavailable" | Queue for retry |
| Push failure | Silent, in-app fallback | Retry alternate channel |
| Upload failure | "Failed" + retry | Clean partial uploads |

### Data Inconsistencies

| Scenario | Detection | Resolution |
|----------|-----------|------------|
| Double payment | Webhook reconciliation | Auto-refund duplicate |
| Missing booking | Payment exists, booking doesn't | Create from payment |
| Orphaned conversation | Booking cancelled | Archive |
| Rating drift | Periodic recalculation | Correct + log |
| Timezone mismatch | Wrong time shown | Normalize to Vietnam |

### Concurrent Operations

| Scenario | Resolution |
|----------|------------|
| Same slot, two hirers | First payment wins |
| Accept while hirer cancels | Honor earlier timestamp |
| Withdrawal during earning release | Lock balance |
| Profile update during view | Cache, refresh next view |

---

## 4.12 Seasonal Scenarios

### Tết Peak Period

| Challenge | Mitigation |
|-----------|------------|
| 10x traffic | Auto-scaling, CDN |
| All booked | Waitlist, notifications |
| Payment provider overwhelmed | Queue, show wait time |
| Support surge | More staff, prioritize safety |
| Last-minute cancels | Strict policy, surge pricing |
| Price gouging | Price caps |

---

## 4.13 Edge Case Summary

### By Severity

| Severity | Count | Examples |
|----------|-------|----------|
| Critical | 15 | Safety, fraud, payment failures |
| High | 35 | Booking conflicts, refunds, verification |
| Medium | 50 | UI edge cases, filters, notifications |
| Low | 25 | Cosmetic, rare flows |

### By Frequency

| Frequency | Count | Examples |
|-----------|-------|----------|
| Common (>1/day) | 30 | Network timeouts, OTP resends |
| Occasional (weekly) | 45 | Payment failures, cancellations |
| Rare (monthly) | 35 | Fraud attempts, system errors |
| Very Rare (quarterly) | 15 | Major outages, legal issues |

---
# Part 5: System Architecture

## 5.1 High-Level Architecture

```
                        ┌──────────────┐
                        │   Clients    │
                        └──────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Hirer App  │     │ Companion   │     │   Admin     │
    │ React Native│     │    App      │     │   Portal    │
    └─────────────┘     └─────────────┘     └─────────────┘
                               │
                        HTTPS / WSS
                               │
              ┌────────────────────────────────┐
              │         Cloudflare CDN         │
              └────────────────────────────────┘
                               │
              ┌────────────────────────────────┐
              │         API Gateway            │
              └────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│    Auth      │      │   Core API   │      │   Realtime   │
│   (Clerk)    │      │   (NestJS)   │      │  (Supabase)  │
└──────────────┘      └──────────────┘      └──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  PostgreSQL  │      │    Redis     │      │ Cloudflare   │
│  (Supabase)  │      │  (Railway)   │      │     R2       │
└──────────────┘      └──────────────┘      └──────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   VNPay /    │      │   Claude     │      │   Firebase   │
│    Momo      │      │     API      │      │     FCM      │
└──────────────┘      └──────────────┘      └──────────────┘
```

## 5.2 Technology Stack

### Frontend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React Native 0.73+ | Cross-platform |
| Navigation | Expo Router 3.x | File-based routing |
| State | Zustand 4.x | State management |
| UI | React Native Paper | Components |
| Forms | React Hook Form | Validation |
| API | TanStack Query 5.x | Data fetching |
| Maps | React Native Maps | Location |
| Push | Expo Notifications | Push handling |

### Backend

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | NestJS 10.x | API framework |
| ORM | Prisma 5.x | Database ORM |
| Validation | class-validator | Request validation |
| Auth | Clerk SDK | Authentication |
| Docs | Swagger/OpenAPI | API documentation |

### Infrastructure

| Service | Provider | Purpose |
|---------|----------|---------|
| Database | Supabase PostgreSQL | Primary store |
| Cache | Railway Redis | Caching |
| Storage | Cloudflare R2 | Files |
| CDN | Cloudflare | Edge caching |
| Hosting | Railway | API deployment |
| Realtime | Supabase | WebSocket |
| Push | Firebase FCM | Notifications |

### External Services

| Service | Provider | Purpose |
|---------|----------|---------|
| Payments | VNPay, Momo | Payment processing |
| SMS | Twilio | OTP |
| AI | Claude API | Matching, assistance |
| ID Verification | VNeID API | Identity |
| Maps | Google Maps | Location |

## 5.3 API Endpoints

```
/api/v1
├── /auth
│   ├── POST /register, /login, /verify-otp, /refresh, /logout
├── /users
│   ├── GET /me, PATCH /me, POST /me/avatar, DELETE /me
├── /companions
│   ├── GET /, GET /:id, GET /:id/reviews, GET /:id/availability
├── /companion
│   ├── GET /profile, PATCH /profile, POST /photos
│   ├── PUT /services, /pricing, /availability, GET /stats
├── /bookings
│   ├── POST /, GET /, GET /:id
│   ├── PATCH /:id/accept, /:id/decline, /:id/cancel, /:id/complete
│   ├── POST /:id/review
├── /payments
│   ├── POST /initiate, /webhook/vnpay, /webhook/momo
│   ├── GET /history
├── /earnings
│   ├── GET /, /history, POST /withdraw, GET /bank-accounts
├── /messages
│   ├── GET /conversations, /conversations/:id
│   ├── POST /conversations/:id
├── /notifications
│   ├── GET /, PATCH /:id/read, POST /register-device
├── /reports
│   ├── POST /, GET /my-reports
└── /admin
    ├── GET /users, /companions/pending, /reports
    ├── PATCH /companions/:id/verify, /reports/:id
```

## 5.4 Security

| Data | Protection |
|------|------------|
| Phone Numbers | Masked until booking day |
| Messages | Encrypted at rest |
| Photos | Signed URLs |
| Payment Data | PCI DSS (not stored) |
| ID Documents | Encrypted, auto-delete |

---

# Part 6: Entity Relationship Diagram (ERD)

## 6.1 Schema Overview

### User Domain

```
users (1) ─────────────▶ companions (0..1)
  │                           │
  │                           ├── companion_photos (N)
  │                           ├── companion_services (N)
  │                           └── companion_availability (N)
```

### Booking Domain

```
bookings ──────┬── payments (1:1)
               ├── reviews (1:2)
               ├── conversations (1:1) ── messages (N)
               └── earnings (1:1)
```

### Financial Domain

```
companions ────┬── earnings (N)
               ├── bank_accounts (N)
               └── withdrawals (N)
```

### Trust & Safety Domain

```
users ─────────┬── reports (N)
               ├── user_blocks (N)
               └── user_strikes (N)
```

## 6.2 Key Tables

### users
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id        VARCHAR(255) UNIQUE NOT NULL,
    phone           VARCHAR(20) UNIQUE,
    email           VARCHAR(255) UNIQUE,
    full_name       VARCHAR(100) NOT NULL,
    avatar_url      TEXT,
    gender          VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth   DATE,
    role            VARCHAR(20) DEFAULT 'hirer' CHECK (role IN ('hirer', 'companion', 'admin')),
    is_verified     BOOLEAN DEFAULT FALSE,
    trust_score     INTEGER DEFAULT 100,
    is_active       BOOLEAN DEFAULT TRUE,
    is_suspended    BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### companions
```sql
CREATE TABLE companions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id),
    bio                 TEXT,
    height_cm           INTEGER,
    languages           TEXT[],
    hourly_rate         INTEGER NOT NULL,
    half_day_rate       INTEGER,
    full_day_rate       INTEGER,
    rating_avg          DECIMAL(2,1) DEFAULT 0.0,
    rating_count        INTEGER DEFAULT 0,
    total_bookings      INTEGER DEFAULT 0,
    completed_bookings  INTEGER DEFAULT 0,
    verification_status VARCHAR(20) DEFAULT 'pending',
    is_featured         BOOLEAN DEFAULT FALSE,
    is_active           BOOLEAN DEFAULT TRUE,
    is_hidden           BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### bookings
```sql
CREATE TABLE bookings (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_number      VARCHAR(20) UNIQUE NOT NULL,
    hirer_id            UUID NOT NULL REFERENCES users(id),
    companion_id        UUID NOT NULL REFERENCES companions(id),
    status              booking_status DEFAULT 'pending',
    occasion_type       service_type NOT NULL,
    start_datetime      TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime        TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_hours      DECIMAL(4,2) NOT NULL,
    location_address    TEXT NOT NULL,
    location_lat        DECIMAL(10,8),
    location_lng        DECIMAL(11,8),
    special_requests    TEXT,
    base_price          INTEGER NOT NULL,
    platform_fee        INTEGER NOT NULL,
    surge_fee           INTEGER DEFAULT 0,
    total_price         INTEGER NOT NULL,
    payment_status      payment_status DEFAULT 'pending',
    cancelled_by        UUID REFERENCES users(id),
    cancel_reason       TEXT,
    request_expires_at  TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### payments
```sql
CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id          UUID NOT NULL REFERENCES bookings(id),
    user_id             UUID NOT NULL REFERENCES users(id),
    amount              INTEGER NOT NULL,
    currency            VARCHAR(3) DEFAULT 'VND',
    provider            payment_provider NOT NULL,
    provider_txn_id     VARCHAR(255),
    status              payment_status DEFAULT 'pending',
    provider_response   JSONB,
    paid_at             TIMESTAMP WITH TIME ZONE,
    released_at         TIMESTAMP WITH TIME ZONE,
    refunded_at         TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### reviews
```sql
CREATE TABLE reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID NOT NULL REFERENCES bookings(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),
    reviewee_id     UUID NOT NULL REFERENCES users(id),
    rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment         TEXT,
    tags            TEXT[],
    is_visible      BOOLEAN DEFAULT TRUE,
    is_disputed     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(booking_id, reviewer_id)
);
```

### conversations & messages
```sql
CREATE TABLE conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id      UUID REFERENCES bookings(id),
    hirer_id        UUID NOT NULL REFERENCES users(id),
    companion_id    UUID NOT NULL REFERENCES companions(id),
    last_message_at TIMESTAMP WITH TIME ZONE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    sender_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    message_type    message_type DEFAULT 'text',
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### earnings, withdrawals, bank_accounts
```sql
CREATE TABLE earnings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id    UUID NOT NULL REFERENCES companions(id),
    booking_id      UUID NOT NULL REFERENCES bookings(id),
    gross_amount    INTEGER NOT NULL,
    platform_fee    INTEGER NOT NULL,
    net_amount      INTEGER NOT NULL,
    status          earnings_status DEFAULT 'pending',
    released_at     TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE bank_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id    UUID NOT NULL REFERENCES companions(id),
    bank_name       VARCHAR(100) NOT NULL,
    account_number  VARCHAR(50) NOT NULL,
    account_holder  VARCHAR(100) NOT NULL,
    is_primary      BOOLEAN DEFAULT FALSE,
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE withdrawals (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    companion_id    UUID NOT NULL REFERENCES companions(id),
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
    amount          INTEGER NOT NULL,
    status          withdrawal_status DEFAULT 'pending',
    requested_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at    TIMESTAMP WITH TIME ZONE
);
```

### reports, user_blocks, user_strikes
```sql
CREATE TABLE reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id     UUID NOT NULL REFERENCES users(id),
    reported_id     UUID NOT NULL REFERENCES users(id),
    booking_id      UUID REFERENCES bookings(id),
    type            report_type NOT NULL,
    description     TEXT NOT NULL,
    evidence_urls   TEXT[],
    status          report_status DEFAULT 'pending',
    resolution      TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_blocks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id      UUID NOT NULL REFERENCES users(id),
    blocked_id      UUID NOT NULL REFERENCES users(id),
    reason          TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE user_strikes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    type            strike_type NOT NULL,
    reason          TEXT NOT NULL,
    booking_id      UUID REFERENCES bookings(id),
    expires_at      TIMESTAMP WITH TIME ZONE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 6.3 Key Relationships

| Parent | Child | Relationship |
|--------|-------|--------------|
| users | companions | 1:0..1 |
| users | bookings (hirer) | 1:N |
| companions | bookings | 1:N |
| companions | photos, services, availability | 1:N |
| bookings | payments | 1:1 |
| bookings | reviews | 1:2 |
| bookings | conversations | 1:1 |
| bookings | earnings | 1:1 |
| conversations | messages | 1:N |
| companions | bank_accounts, withdrawals | 1:N |
| users | notifications, device_tokens | 1:N |
| users | reports, blocks, strikes | 1:N |

---

# Appendices

## Appendix A: Enums

```sql
CREATE TYPE service_type AS ENUM (
    'family_introduction', 'wedding_attendance', 'tet_companionship',
    'business_event', 'casual_outing', 'class_reunion', 'other'
);

CREATE TYPE booking_status AS ENUM (
    'pending', 'confirmed', 'active', 'completed',
    'cancelled', 'disputed', 'expired'
);

CREATE TYPE payment_status AS ENUM (
    'pending', 'paid', 'held', 'released', 'refunded', 'partial_refund', 'failed'
);

CREATE TYPE payment_provider AS ENUM ('vnpay', 'momo', 'stripe', 'bank_transfer');

CREATE TYPE message_type AS ENUM ('text', 'image', 'location', 'system');

CREATE TYPE earnings_status AS ENUM ('pending', 'available', 'withdrawn', 'cancelled');

CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TYPE notification_type AS ENUM (
    'booking_request', 'booking_confirmed', 'booking_declined',
    'booking_cancelled', 'booking_reminder', 'booking_completed',
    'new_message', 'new_review', 'payment_received',
    'withdrawal_completed', 'account_verified', 'system'
);

CREATE TYPE report_type AS ENUM (
    'harassment', 'inappropriate_behavior', 'no_show', 'fraud',
    'fake_profile', 'spam', 'safety_concern', 'payment_issue', 'other'
);

CREATE TYPE report_status AS ENUM ('pending', 'under_review', 'resolved', 'dismissed');

CREATE TYPE strike_type AS ENUM (
    'late_cancellation', 'no_show', 'policy_violation',
    'inappropriate_behavior', 'fraud_attempt', 'fake_review', 'spam'
);
```

## Appendix B: Business Rules

### Pricing

| Rule | Value |
|------|-------|
| Platform Fee | 18% |
| Minimum Hourly | 100,000 VND |
| Surge (<24h) | +30% |
| Holiday Surge | +50-100% |
| Min Withdrawal | 200,000 VND |

### Cancellation Policy

| Timing | Hirer Refund | Companion Penalty |
|--------|--------------|-------------------|
| >48h | 100% | None |
| 24-48h | 50% | None |
| <24h | 0% | None |
| Companion cancels | 100% | Strike |

### Strike System

| Strikes | Consequence |
|---------|-------------|
| 1 | Warning |
| 2 | 7-day restriction |
| 3 | 30-day suspension |
| 4+ | Ban review |

### Response Times

| Action | Limit | Consequence |
|--------|-------|-------------|
| Accept/Decline | 24h | Auto-expire |
| Confirm Complete | 48h | Auto-complete |
| Submit Review | 7 days | Window closes |
| Dispute Review | 7 days | Cannot dispute |

## Appendix C: Error Codes

| Code | Category | Description |
|------|----------|-------------|
| AUTH001 | Authentication | Invalid OTP |
| AUTH002 | Authentication | OTP expired |
| AUTH003 | Authentication | Account suspended |
| AUTH004 | Authentication | Session expired |
| BOOK001 | Booking | Slot unavailable |
| BOOK002 | Booking | Companion not accepting |
| BOOK003 | Booking | Invalid date/time |
| BOOK004 | Booking | Already cancelled |
| BOOK005 | Booking | Cannot cancel active |
| PAY001 | Payment | Payment failed |
| PAY002 | Payment | Insufficient funds |
| PAY003 | Payment | Provider unavailable |
| PAY004 | Payment | Refund failed |
| EARN001 | Earnings | Insufficient balance |
| EARN002 | Earnings | Invalid bank account |
| EARN003 | Earnings | Withdrawal limit |
| MSG001 | Messaging | Chat unavailable |
| MSG002 | Messaging | User blocked |
| MSG003 | Messaging | Content filtered |
| USER001 | User | Profile incomplete |
| USER002 | User | Verification required |
| SYS001 | System | Service unavailable |
| SYS002 | System | Rate limited |
| SYS003 | System | Invalid request |

## Appendix D: Indexes

```sql
-- Users
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- Companions
CREATE INDEX idx_companions_user_id ON companions(user_id);
CREATE INDEX idx_companions_rating ON companions(rating_avg DESC);
CREATE INDEX idx_companions_hourly_rate ON companions(hourly_rate);
CREATE INDEX idx_companions_search ON companions(is_active, is_hidden, verification_status);

-- Bookings
CREATE INDEX idx_bookings_hirer ON bookings(hirer_id);
CREATE INDEX idx_bookings_companion ON bookings(companion_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_start_datetime ON bookings(start_datetime);
CREATE INDEX idx_bookings_number ON bookings(booking_number);

-- Payments
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_provider_txn ON payments(provider_txn_id);

-- Reviews
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_visible ON reviews(reviewee_id, is_visible) WHERE is_visible = TRUE;

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(conversation_id, created_at DESC);

-- Earnings
CREATE INDEX idx_earnings_companion ON earnings(companion_id);
CREATE INDEX idx_earnings_status ON earnings(companion_id, status);

-- Reports
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_pending ON reports(status, created_at) WHERE status = 'pending';

-- Strikes
CREATE INDEX idx_strikes_user ON user_strikes(user_id);
CREATE INDEX idx_strikes_active ON user_strikes(user_id, is_active) WHERE is_active = TRUE;
```

---

**Document Version:** 2.0  
**Created:** January 2026  
**Author:** James (Founder/CTO)  
**Status:** Ready for Development
