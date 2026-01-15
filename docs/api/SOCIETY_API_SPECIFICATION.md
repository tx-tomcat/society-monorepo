# Society Mobile App - API Specification v2.0

## Overview

This document outlines the redesigned API endpoints for the Society mobile app, supporting both **Hirer** (customers booking companions) and **Companion** (service providers) user flows.

### Key Changes from Existing Backend

The current backend uses `Experience/ExperienceBooking` model focused on one-time events. The new design introduces:

1. **Dual User Types**: Clear separation between Hirer and Companion roles
2. **Request-Based Booking Flow**: Hirers request → Companions accept/decline
3. **Real-time Status Updates**: Booking lifecycle management
4. **Enhanced Safety Features**: GPS tracking, SOS alerts, escrow payments
5. **Calendar/Availability System**: Companions set availability, Hirers see slots

---

## Database Schema Changes

### New/Modified Tables

```prisma
// User type distinction
model User {
  id                String             @id @default(uuid())
  role              UserRole           @default(HIRER)  // NEW: HIRER | COMPANION | BOTH
  hirerProfile      HirerProfile?
  companionProfile  CompanionProfile?
  // ... existing fields
}

enum UserRole {
  HIRER
  COMPANION
  BOTH
}

// Hirer-specific profile
model HirerProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  bookingsCount   Int      @default(0)
  totalSpent      Decimal  @default(0)
  preferredOccasions String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Companion-specific profile (replaces ProfessionalProfile)
model CompanionProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  displayName     String
  bio             String?
  hourlyRate      Decimal
  photos          String[]
  occasions       String[]  // Wedding, Tet, Corporate, Coffee Date, etc.
  isVerified      Boolean  @default(false)
  isPremium       Boolean  @default(false)
  rating          Decimal  @default(0)
  reviewCount     Int      @default(0)
  responseRate    Int      @default(100)
  completionRate  Int      @default(100)
  totalEarnings   Decimal  @default(0)
  totalBookings   Int      @default(0)
  location        String?
  availability    CompanionAvailability[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

// Availability slots
model CompanionAvailability {
  id              String            @id @default(uuid())
  companionId     String
  companion       CompanionProfile  @relation(fields: [companionId], references: [id])
  dayOfWeek       Int               // 0-6 (Sunday-Saturday)
  startTime       String            // "09:00"
  endTime         String            // "18:00"
  isRecurring     Boolean           @default(true)
  specificDate    DateTime?         // For non-recurring availability
  createdAt       DateTime          @default(now())
}

// Booking model
model Booking {
  id              String        @id @default(uuid())
  code            String        @unique  // SOC-2025-XXXX
  hirerId         String
  hirer           User          @relation("HirerBookings", fields: [hirerId], references: [id])
  companionId     String
  companion       User          @relation("CompanionBookings", fields: [companionId], references: [id])

  // Booking details
  occasion        String
  date            DateTime
  startTime       String
  endTime         String
  duration        Int           // in minutes
  location        String
  locationLat     Decimal?
  locationLng     Decimal?
  specialRequests String?

  // Status tracking
  status          BookingStatus @default(PENDING)
  requestedAt     DateTime      @default(now())
  respondedAt     DateTime?
  confirmedAt     DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  cancelledAt     DateTime?
  cancelReason    String?
  cancelledBy     String?       // HIRER | COMPANION | SYSTEM

  // Pricing
  hourlyRate      Decimal
  subtotal        Decimal
  serviceFee      Decimal
  platformFee     Decimal
  totalAmount     Decimal
  companionEarnings Decimal

  // Safety
  hirerCheckedIn    Boolean   @default(false)
  companionCheckedIn Boolean  @default(false)
  sosTriggered      Boolean   @default(false)

  // Payment
  paymentId       String?
  payment         Payment?      @relation(fields: [paymentId], references: [id])
  escrowStatus    EscrowStatus  @default(PENDING)

  // Reviews
  hirerReview     Review?       @relation("HirerReview")
  companionReview Review?       @relation("CompanionReview")

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

enum BookingStatus {
  PENDING       // Hirer submitted request
  ACCEPTED      // Companion accepted
  CONFIRMED     // Payment confirmed
  IN_PROGRESS   // Booking started
  COMPLETED     // Booking finished
  CANCELLED     // Either party cancelled
  EXPIRED       // Request timed out
}

enum EscrowStatus {
  PENDING       // Awaiting payment
  HELD          // Payment held in escrow
  RELEASED      // Released to companion
  REFUNDED      // Refunded to hirer
}
```

---

## API Endpoints

### Base URL
```
Production: https://api.society.vn/v2
Staging: https://api-staging.society.vn/v2
```

### Authentication

All endpoints require Bearer token unless marked as `[Public]`.

```
Authorization: Bearer <jwt_token>
```

---

## 1. Authentication & Onboarding

### 1.1 Send OTP
```http
POST /auth/otp/send
```

**Request:**
```json
{
  "phone": "+84901234567",
  "type": "LOGIN" | "REGISTER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

### 1.2 Verify OTP
```http
POST /auth/otp/verify
```

**Request:**
```json
{
  "phone": "+84901234567",
  "otp": "123456"
}
```

**Response:**
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "uuid",
    "phone": "+84901234567",
    "role": "HIRER",
    "isVerified": false,
    "onboardingComplete": false
  }
}
```

### 1.3 Register User
```http
POST /auth/register
```

**Request:**
```json
{
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "role": "HIRER" | "COMPANION",
  "dateOfBirth": "1995-01-15"
}
```

### 1.4 Verify Identity (VNeID)
```http
POST /auth/verify-identity
```

**Request:**
```json
{
  "idType": "VNEID" | "CCCD" | "PASSPORT",
  "idNumber": "012345678901",
  "frontImage": "base64_or_url",
  "backImage": "base64_or_url",
  "selfieImage": "base64_or_url"
}
```

**Response:**
```json
{
  "verificationId": "uuid",
  "status": "PENDING" | "APPROVED" | "REJECTED",
  "message": "Verification submitted. Processing within 24 hours."
}
```

---

## 2. Companion Discovery (Hirer)

### 2.1 Browse Companions
```http
GET /companions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `location` | string | District/City filter |
| `occasion` | string | Wedding, Tet, Corporate, etc. |
| `minPrice` | number | Minimum hourly rate (VND) |
| `maxPrice` | number | Maximum hourly rate (VND) |
| `date` | string | YYYY-MM-DD - Filter by availability |
| `rating` | number | Minimum rating (0-5) |
| `verified` | boolean | Only verified companions |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `sort` | string | `rating`, `price_asc`, `price_desc`, `popular` |

**Response:**
```json
{
  "companions": [
    {
      "id": "uuid",
      "displayName": "Minh Anh",
      "age": 24,
      "avatar": "https://...",
      "location": "District 1, HCMC",
      "hourlyRate": 500000,
      "rating": 4.9,
      "reviewCount": 127,
      "isVerified": true,
      "isPremium": true,
      "occasions": ["Wedding", "Corporate", "Tet"],
      "photos": ["url1", "url2"],
      "isAvailable": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 2.2 Get Companion Profile
```http
GET /companions/:id
```

**Response:**
```json
{
  "id": "uuid",
  "displayName": "Minh Anh",
  "age": 24,
  "bio": "Professional companion specializing in weddings...",
  "avatar": "https://...",
  "photos": ["url1", "url2", "url3", "url4"],
  "location": "District 1, HCMC",
  "hourlyRate": 500000,
  "rating": 4.9,
  "reviewCount": 127,
  "responseRate": 98,
  "completionRate": 100,
  "isVerified": true,
  "isPremium": true,
  "occasions": ["Wedding", "Corporate", "Tet", "Family Events"],
  "languages": ["Vietnamese", "English"],
  "memberSince": "2024-01-15",
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Very professional and friendly",
      "occasion": "Wedding",
      "date": "2025-01-10",
      "hirer": {
        "name": "Nguyen V.",
        "avatar": "url"
      }
    }
  ],
  "availability": {
    "nextAvailable": "2025-01-20",
    "thisWeek": [
      { "date": "2025-01-20", "slots": ["09:00-12:00", "14:00-18:00"] },
      { "date": "2025-01-21", "slots": ["10:00-15:00"] }
    ]
  }
}
```

### 2.3 Get Companion Availability
```http
GET /companions/:id/availability
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | YYYY-MM-DD |
| `endDate` | string | YYYY-MM-DD |

**Response:**
```json
{
  "companionId": "uuid",
  "timezone": "Asia/Ho_Chi_Minh",
  "availability": [
    {
      "date": "2025-01-20",
      "isAvailable": true,
      "slots": [
        { "start": "09:00", "end": "12:00" },
        { "start": "14:00", "end": "18:00" }
      ],
      "bookedSlots": [
        { "start": "12:00", "end": "14:00" }
      ]
    }
  ]
}
```

---

## 3. Booking Flow

### 3.1 Create Booking Request (Hirer)
```http
POST /bookings
```

**Request:**
```json
{
  "companionId": "uuid",
  "occasion": "Wedding Reception",
  "date": "2025-01-20",
  "startTime": "14:00",
  "endTime": "18:00",
  "location": "Rex Hotel, 141 Nguyen Hue, District 1, HCMC",
  "locationCoordinates": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "specialRequests": "Please wear a formal red áo dài"
}
```

**Response:**
```json
{
  "id": "uuid",
  "code": "SOC-2025-0120",
  "status": "PENDING",
  "companion": {
    "id": "uuid",
    "displayName": "Minh Anh",
    "avatar": "url"
  },
  "occasion": "Wedding Reception",
  "date": "2025-01-20",
  "startTime": "14:00",
  "endTime": "18:00",
  "duration": 240,
  "location": "Rex Hotel, 141 Nguyen Hue, District 1, HCMC",
  "specialRequests": "Please wear a formal red áo dài",
  "pricing": {
    "hourlyRate": 500000,
    "hours": 4,
    "subtotal": 2000000,
    "serviceFee": 200000,
    "total": 2200000
  },
  "expiresAt": "2025-01-18T14:00:00Z",
  "createdAt": "2025-01-17T10:30:00Z"
}
```

### 3.2 Get Booking Requests (Companion)
```http
GET /companion/bookings/requests
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `PENDING`, `ALL` |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:**
```json
{
  "requests": [
    {
      "id": "uuid",
      "code": "SOC-2025-0120",
      "hirer": {
        "id": "uuid",
        "name": "Nguyen Van Minh",
        "avatar": "url",
        "rating": 4.8,
        "bookingsCount": 5,
        "memberSince": "2024-12-01"
      },
      "occasion": "Wedding Reception",
      "date": "2025-01-20",
      "startTime": "14:00",
      "endTime": "18:00",
      "duration": 240,
      "location": "Rex Hotel, District 1",
      "specialRequests": "Please wear a formal red áo dài",
      "earnings": {
        "total": 2200000,
        "platformFee": 396000,
        "yourEarnings": 1804000
      },
      "requestedAt": "2025-01-17T10:30:00Z",
      "expiresAt": "2025-01-18T14:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### 3.3 Respond to Booking Request (Companion)
```http
POST /companion/bookings/:id/respond
```

**Request (Accept):**
```json
{
  "action": "ACCEPT",
  "message": "Looking forward to meeting you!"
}
```

**Request (Decline):**
```json
{
  "action": "DECLINE",
  "reason": "SCHEDULE_CONFLICT" | "LOCATION_TOO_FAR" | "OTHER",
  "message": "Sorry, I have another booking at that time."
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "ACCEPTED" | "DECLINED",
  "respondedAt": "2025-01-17T11:00:00Z",
  "message": "Booking accepted. Awaiting payment."
}
```

### 3.4 Process Payment (Hirer)
```http
POST /bookings/:id/pay
```

**Request:**
```json
{
  "paymentMethod": "VNPAY" | "MOMO" | "CARD",
  "returnUrl": "society://booking/success"
}
```

**Response:**
```json
{
  "paymentId": "uuid",
  "paymentUrl": "https://vnpay.vn/...",
  "booking": {
    "id": "uuid",
    "status": "CONFIRMED",
    "escrowStatus": "HELD"
  }
}
```

### 3.5 Get My Bookings (Hirer)
```http
GET /bookings
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `all`, `upcoming`, `active`, `completed`, `cancelled` |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "code": "SOC-2025-0115",
      "companion": {
        "id": "uuid",
        "displayName": "Minh Anh",
        "avatar": "url",
        "isVerified": true
      },
      "occasion": "Wedding Reception",
      "date": "2025-01-15",
      "startTime": "14:00",
      "endTime": "18:00",
      "location": "Rex Hotel, District 1",
      "status": "UPCOMING",
      "totalAmount": 2200000
    }
  ],
  "pagination": { ... }
}
```

### 3.6 Get Booking Detail
```http
GET /bookings/:id
```

**Response:**
```json
{
  "id": "uuid",
  "code": "SOC-2025-0115",
  "status": "CONFIRMED",
  "companion": {
    "id": "uuid",
    "displayName": "Minh Anh",
    "avatar": "url",
    "phone": "+84901234567",
    "rating": 4.9,
    "reviewCount": 127,
    "isVerified": true
  },
  "hirer": {
    "id": "uuid",
    "name": "Nguyen Van Minh",
    "avatar": "url",
    "phone": "+84909876543",
    "rating": 4.8,
    "bookingsCount": 5
  },
  "occasion": "Wedding Reception",
  "date": "2025-01-15",
  "startTime": "14:00",
  "endTime": "18:00",
  "duration": 240,
  "location": "Rex Hotel, 141 Nguyen Hue, District 1, HCMC",
  "locationCoordinates": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "specialRequests": "Please wear a formal red áo dài",
  "pricing": {
    "hourlyRate": 500000,
    "hours": 4,
    "subtotal": 2000000,
    "serviceFee": 200000,
    "total": 2200000
  },
  "companionEarnings": {
    "bookingAmount": 2000000,
    "platformFee": 360000,
    "yourEarnings": 1640000
  },
  "escrowStatus": "HELD",
  "timeline": [
    { "event": "REQUESTED", "timestamp": "2025-01-10T10:00:00Z" },
    { "event": "ACCEPTED", "timestamp": "2025-01-10T11:30:00Z" },
    { "event": "PAID", "timestamp": "2025-01-10T12:00:00Z" },
    { "event": "CONFIRMED", "timestamp": "2025-01-10T12:00:00Z" }
  ],
  "createdAt": "2025-01-10T10:00:00Z"
}
```

### 3.7 Cancel Booking
```http
POST /bookings/:id/cancel
```

**Request:**
```json
{
  "reason": "CHANGE_OF_PLANS" | "EMERGENCY" | "FOUND_ALTERNATIVE" | "OTHER",
  "details": "Family emergency came up"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "CANCELLED",
  "cancelledAt": "2025-01-12T15:00:00Z",
  "refund": {
    "eligible": true,
    "amount": 2200000,
    "fee": 0,
    "refundAmount": 2200000,
    "policy": "Full refund - cancelled more than 24 hours before"
  }
}
```

### 3.8 Check In (Both parties)
```http
POST /bookings/:id/check-in
```

**Request:**
```json
{
  "location": {
    "lat": 10.7769,
    "lng": 106.7009
  }
}
```

**Response:**
```json
{
  "success": true,
  "checkedInAt": "2025-01-15T13:55:00Z",
  "booking": {
    "status": "IN_PROGRESS",
    "hirerCheckedIn": true,
    "companionCheckedIn": true
  }
}
```

### 3.9 Complete Booking
```http
POST /bookings/:id/complete
```

**Request:**
```json
{
  "rating": 5,
  "review": "Amazing experience! Very professional and friendly.",
  "tips": 100000
}
```

---

## 4. Companion Dashboard & Schedule

### 4.1 Get Dashboard Stats
```http
GET /companion/dashboard
```

**Response:**
```json
{
  "stats": {
    "weeklyEarnings": 2460000,
    "rating": 4.9,
    "totalBookings": 127,
    "responseRate": 98,
    "completionRate": 100
  },
  "todaysBookings": [
    {
      "id": "uuid",
      "hirer": {
        "name": "Nguyen Van Minh",
        "avatar": "url"
      },
      "occasion": "Coffee Date",
      "time": "14:00 - 16:00",
      "location": "The Coffee House, D3",
      "status": "CONFIRMED"
    }
  ],
  "pendingRequests": 2,
  "quickActions": {
    "requestsCount": 2,
    "upcomingCount": 5,
    "availableBalance": 3460000
  }
}
```

### 4.2 Get Schedule
```http
GET /companion/schedule
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | YYYY-MM-DD |
| `endDate` | string | YYYY-MM-DD |

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "date": "2025-01-20",
      "startTime": "14:00",
      "endTime": "18:00",
      "hirer": {
        "name": "Nguyen Van Minh",
        "avatar": "url"
      },
      "occasion": "Wedding Reception",
      "location": "Rex Hotel",
      "status": "CONFIRMED",
      "earnings": 1640000
    }
  ],
  "availability": [
    {
      "dayOfWeek": 1,
      "startTime": "09:00",
      "endTime": "18:00"
    }
  ]
}
```

### 4.3 Update Availability
```http
PUT /companion/availability
```

**Request:**
```json
{
  "recurring": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": 3, "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": 4, "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": 5, "startTime": "09:00", "endTime": "18:00" }
  ],
  "exceptions": [
    { "date": "2025-01-28", "available": false, "reason": "Tết holiday" }
  ]
}
```

---

## 5. Earnings & Wallet

### 5.1 Get Earnings Overview
```http
GET /companion/earnings
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `period` | string | `week`, `month`, `year` |

**Response:**
```json
{
  "availableBalance": 3460000,
  "pendingBalance": 1640000,
  "periodStats": {
    "period": "month",
    "totalEarnings": 8450000,
    "bookingsCount": 12,
    "changePercent": 23
  },
  "breakdown": {
    "bookingEarnings": 8200000,
    "tips": 150000,
    "bonuses": 100000
  }
}
```

### 5.2 Get Transaction History
```http
GET /companion/transactions
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | `earning`, `withdrawal`, `bonus`, `all` |
| `page` | number | Page number |
| `limit` | number | Items per page |

**Response:**
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "earning",
      "description": "Wedding Reception - Nguyen Van Minh",
      "amount": 1640000,
      "bookingId": "uuid",
      "date": "2025-01-15",
      "status": "completed"
    },
    {
      "id": "uuid",
      "type": "withdrawal",
      "description": "Bank Transfer - Vietcombank",
      "amount": -5000000,
      "date": "2025-01-12",
      "status": "completed"
    }
  ],
  "pagination": { ... }
}
```

### 5.3 Get Bank Accounts
```http
GET /companion/bank-accounts
```

**Response:**
```json
{
  "accounts": [
    {
      "id": "uuid",
      "bankName": "Vietcombank",
      "bankCode": "VCB",
      "accountNumber": "****5678",
      "accountHolder": "NGUYEN THI MINH ANH",
      "isDefault": true
    }
  ]
}
```

### 5.4 Add Bank Account
```http
POST /companion/bank-accounts
```

**Request:**
```json
{
  "bankCode": "VCB",
  "accountNumber": "1234567890",
  "accountHolder": "NGUYEN THI MINH ANH",
  "isDefault": true
}
```

### 5.5 Request Withdrawal
```http
POST /companion/withdrawals
```

**Request:**
```json
{
  "amount": 3000000,
  "bankAccountId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "amount": 3000000,
  "fee": 0,
  "netAmount": 3000000,
  "status": "PENDING",
  "estimatedArrival": "2025-01-18",
  "bankAccount": {
    "bankName": "Vietcombank",
    "accountNumber": "****5678"
  }
}
```

---

## 6. Profile Management

### 6.1 Get My Profile (Companion)
```http
GET /companion/profile
```

**Response:**
```json
{
  "id": "uuid",
  "displayName": "Minh Anh",
  "bio": "Professional companion specializing in weddings...",
  "hourlyRate": 500000,
  "photos": ["url1", "url2", "url3", "url4"],
  "occasions": ["Wedding", "Corporate", "Tet", "Family Events"],
  "location": "District 1, Ho Chi Minh City",
  "isVerified": true,
  "isPremium": true,
  "stats": {
    "rating": 4.9,
    "reviewCount": 127,
    "responseRate": 98,
    "completionRate": 100,
    "totalBookings": 127,
    "totalEarnings": 42500000
  }
}
```

### 6.2 Update Profile (Companion)
```http
PUT /companion/profile
```

**Request:**
```json
{
  "displayName": "Minh Anh",
  "bio": "Updated bio...",
  "hourlyRate": 550000,
  "occasions": ["Wedding", "Corporate", "Tet"],
  "location": "District 1, Ho Chi Minh City"
}
```

### 6.3 Upload Photos
```http
POST /companion/photos
```

**Request:** `multipart/form-data`
- `photos[]`: Array of image files
- `mainPhotoIndex`: Index of main photo (0-based)

---

## 7. Messaging

### 7.1 Get Conversations
```http
GET /messages/conversations
```

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "participant": {
        "id": "uuid",
        "name": "Nguyen Van Minh",
        "avatar": "url"
      },
      "bookingId": "uuid",
      "lastMessage": {
        "content": "See you tomorrow!",
        "timestamp": "2025-01-14T18:30:00Z",
        "isRead": false
      },
      "unreadCount": 2
    }
  ]
}
```

### 7.2 Get Messages
```http
GET /messages/conversations/:id
```

**Response:**
```json
{
  "conversationId": "uuid",
  "participant": {
    "id": "uuid",
    "name": "Nguyen Van Minh",
    "avatar": "url"
  },
  "booking": {
    "id": "uuid",
    "code": "SOC-2025-0115",
    "status": "CONFIRMED"
  },
  "messages": [
    {
      "id": "uuid",
      "senderId": "uuid",
      "content": "Hi, looking forward to meeting you!",
      "timestamp": "2025-01-14T10:00:00Z",
      "isRead": true
    }
  ]
}
```

### 7.3 Send Message
```http
POST /messages/conversations/:id
```

**Request:**
```json
{
  "content": "See you tomorrow at 2pm!",
  "attachments": []
}
```

---

## 8. Safety Features

### 8.1 Trigger SOS
```http
POST /safety/sos
```

**Request:**
```json
{
  "bookingId": "uuid",
  "location": {
    "lat": 10.7769,
    "lng": 106.7009
  },
  "message": "Need assistance"
}
```

**Response:**
```json
{
  "alertId": "uuid",
  "status": "SENT",
  "notified": ["emergency_contacts", "support_team"],
  "message": "Help is on the way. Stay safe."
}
```

### 8.2 Share Location
```http
POST /safety/location
```

**Request:**
```json
{
  "bookingId": "uuid",
  "location": {
    "lat": 10.7769,
    "lng": 106.7009
  }
}
```

---

## 9. Reviews & Ratings

### 9.1 Submit Review (After Booking)
```http
POST /bookings/:id/review
```

**Request:**
```json
{
  "rating": 5,
  "comment": "Amazing experience! Very professional and friendly.",
  "tags": ["professional", "friendly", "punctual"]
}
```

### 9.2 Get Reviews
```http
GET /companions/:id/reviews
```

**Response:**
```json
{
  "averageRating": 4.9,
  "totalReviews": 127,
  "ratingBreakdown": {
    "5": 110,
    "4": 12,
    "3": 3,
    "2": 1,
    "1": 1
  },
  "reviews": [
    {
      "id": "uuid",
      "rating": 5,
      "comment": "Amazing experience!",
      "occasion": "Wedding",
      "date": "2025-01-10",
      "hirer": {
        "name": "Nguyen V.",
        "avatar": "url"
      }
    }
  ]
}
```

---

## 10. Notifications

### 10.1 Get Notifications
```http
GET /notifications
```

**Response:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "BOOKING_REQUEST",
      "title": "New Booking Request",
      "body": "Nguyen Van Minh wants to book you for a Wedding Reception",
      "data": {
        "bookingId": "uuid"
      },
      "isRead": false,
      "createdAt": "2025-01-17T10:30:00Z"
    }
  ],
  "unreadCount": 3
}
```

### 10.2 Mark as Read
```http
POST /notifications/:id/read
```

### 10.3 Register Push Token
```http
POST /notifications/token
```

**Request:**
```json
{
  "token": "expo_push_token",
  "platform": "ios" | "android"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "The requested booking could not be found",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing token |
| `FORBIDDEN` | 403 | Action not permitted |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `BOOKING_EXPIRED` | 400 | Booking request has expired |
| `COMPANION_UNAVAILABLE` | 400 | Companion not available for slot |
| `INSUFFICIENT_BALANCE` | 400 | Not enough balance for withdrawal |
| `PAYMENT_FAILED` | 400 | Payment processing failed |

---

## Webhooks (For Payment Providers)

### VNPay Callback
```http
POST /webhooks/vnpay
```

### Momo Callback
```http
POST /webhooks/momo
```

---

## Rate Limiting

- **Authentication endpoints**: 5 requests per minute
- **General API**: 100 requests per minute
- **Upload endpoints**: 10 requests per minute

---

## Versioning

API version is included in the URL path (`/v2/`). Breaking changes will increment the version number.

---

*Last Updated: January 2025*
*Version: 2.0*
