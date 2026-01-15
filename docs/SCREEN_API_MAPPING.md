# Society App - Screen to API Mapping

This document maps each mobile app screen to the corresponding backend API endpoints.

## Base URL
```
https://api.society.vn/v1
```

---

## HIRER (Customer) Screens

### 1. Auth/Splash
**Screen**: Welcome, app intro
**APIs Used**: None (static screen)

---

### 2. Auth/Login/Register
**Screen**: Phone/email + OTP authentication

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Send OTP | POST | `/auth/magic-link` | Send OTP to email |
| Verify OTP | POST | `/auth/verify-otp` | Verify the OTP code |
| Resend OTP | POST | `/auth/resend` | Resend magic link |
| Exchange Code | POST | `/auth/callback` | Exchange auth code for session |
| Refresh Token | POST | `/auth/refresh` | Refresh access token |

**Request Example**:
```json
// POST /auth/magic-link
{
  "email": "user@example.com",
  "userType": "HIRER"
}

// POST /auth/verify-otp
{
  "email": "user@example.com",
  "token": "123456"
}
```

---

### 3. Auth/Verify Identity
**Screen**: VNeID / ID verification

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Status | GET | `/verification/status` | Get verification status |
| Initiate ID | POST | `/verification/identity/initiate` | Start identity verification |
| Get History | GET | `/verification/history` | Get verification history |

---

### 4. Home/Browse Companions
**Screen**: Discovery feed, filters

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Browse | GET | `/companions` | List companions with filters |

**Query Parameters**:
```
?page=1
&limit=20
&location=Ho+Chi+Minh
&occasion=DINNER
&minPrice=300000
&maxPrice=1000000
&rating=4
&verified=true
&sortBy=rating
&sortOrder=desc
```

**Response**:
```json
{
  "companions": [
    {
      "id": "comp-123",
      "displayName": "Linh Nguyen",
      "age": 25,
      "photos": ["https://..."],
      "location": { "city": "Ho Chi Minh", "district": "District 1" },
      "hourlyRate": 500000,
      "rating": 4.8,
      "reviewCount": 45,
      "isVerified": true,
      "isPremium": false,
      "occasions": ["DINNER", "WEDDING", "EVENTS"]
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

---

### 5. Home/Search & Filter
**Screen**: Location, price, occasion, availability

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Search | GET | `/companions` | Same as browse with filters |

**Filter Options**:
- `location`: City/District name
- `occasion`: WEDDING, TET, FAMILY_EVENTS, CORPORATE, COFFEE_DATE, SOCIAL_EVENTS, DINNER, PARTY, OTHER
- `minPrice`, `maxPrice`: Price range in VND
- `rating`: Minimum rating (1-5)
- `verified`: Only verified companions
- `date`, `startTime`, `endTime`: Check availability

---

### 6. Profile/Companion Profile
**Screen**: Photos, bio, services, reviews, pricing

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Profile | GET | `/companions/:companionId` | Full companion profile |
| Get Reviews | GET | `/companions/:companionId/reviews` | Paginated reviews |
| Get Availability | GET | `/companions/:companionId/availability` | Date availability |

**Response** (Profile):
```json
{
  "id": "comp-123",
  "displayName": "Linh Nguyen",
  "bio": "Professional companion...",
  "age": 25,
  "photos": ["https://..."],
  "location": { "city": "Ho Chi Minh", "district": "District 1" },
  "hourlyRate": 500000,
  "rating": 4.8,
  "reviewCount": 45,
  "responseRate": 95,
  "completionRate": 98,
  "isVerified": true,
  "isPremium": false,
  "occasions": ["DINNER", "WEDDING"],
  "languages": ["vi", "en"],
  "memberSince": "2024-01-15",
  "reviews": [...],
  "availability": {
    "nextAvailable": "2025-02-01",
    "thisWeek": [
      { "dayOfWeek": 1, "isAvailable": true },
      ...
    ]
  }
}
```

---

### 7. Booking/Select Date/Time
**Screen**: Calendar, time slots

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Availability | GET | `/companions/:companionId/availability` | Check available slots |

**Query Parameters**:
```
?startDate=2025-02-01&endDate=2025-02-07
```

**Response**:
```json
[
  {
    "date": "2025-02-01",
    "slots": [
      { "startTime": "09:00", "endTime": "12:00" },
      { "startTime": "14:00", "endTime": "18:00" }
    ]
  }
]
```

---

### 8. Booking/Booking Details
**Screen**: Occasion, location, special requests

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Create Booking | POST | `/bookings` | Create new booking |

**Request**:
```json
{
  "companionId": "comp-123",
  "occasion": "DINNER",
  "date": "2025-02-01",
  "startTime": "18:00",
  "endTime": "21:00",
  "location": "Restaurant ABC, District 1",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "notes": "Birthday celebration"
}
```

---

### 9. Booking/Payment
**Screen**: VNPay/Momo, escrow confirmation

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Create Payment | POST | `/payments` | Initiate payment |
| Validate Promo | POST | `/payments/promo/validate` | Apply promo code |
| Get Payment | GET | `/payments/:id` | Get payment details |

**Request**:
```json
{
  "bookingId": "booking-123",
  "amount": 1500000,
  "paymentMethod": "VNPAY",
  "promoCode": "NEWUSER"
}
```

---

### 10. Booking/Booking Success
**Screen**: Confirmation, chat link

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Booking | GET | `/bookings/:bookingId` | Get booking confirmation |
| Start Chat | POST | `/conversations` | Create conversation |

---

### 11. Orders/My Bookings
**Screen**: Upcoming, active, past

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Bookings | GET | `/bookings/hirer` | List hirer's bookings |

**Query Parameters**:
```
?status=PENDING,CONFIRMED,IN_PROGRESS
&page=1
&limit=20
```

**Response**:
```json
{
  "bookings": [
    {
      "id": "booking-123",
      "code": "SOC-2025-0001",
      "status": "CONFIRMED",
      "date": "2025-02-01",
      "startTime": "18:00",
      "endTime": "21:00",
      "location": "Restaurant ABC",
      "totalAmount": 1500000,
      "occasion": "DINNER",
      "companion": {
        "id": "comp-123",
        "displayName": "Linh Nguyen",
        "photo": "https://..."
      }
    }
  ],
  "pagination": { ... }
}
```

---

### 12. Orders/Booking Detail
**Screen**: Status, companion info, actions

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Detail | GET | `/bookings/:bookingId` | Full booking details |
| Update Status | PUT | `/bookings/:bookingId/status` | Cancel booking |
| Submit Review | POST | `/bookings/:bookingId/review` | Leave review |

**Cancel Request**:
```json
{
  "status": "CANCELLED",
  "reason": "Change of plans"
}
```

**Review Request**:
```json
{
  "rating": 5,
  "comment": "Great experience!"
}
```

---

### 13. Chat/Messages List
**Screen**: All conversations

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| List Chats | GET | `/conversations` | Get all conversations |
| Unread Count | GET | `/conversations/unread-count` | Get unread count |

---

### 14. Chat/Chat Room
**Screen**: 1-on-1 with companion

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Messages | GET | `/conversations/:id/messages` | Load messages |
| Send Message | POST | `/conversations/:id/messages` | Send message |
| Mark Read | POST | `/conversations/:id/read` | Mark as read |

**Send Message**:
```json
{
  "content": "Hello, looking forward to meeting you!",
  "type": "text"
}
```

---

### 15. Account/My Profile
**Screen**: Settings, wallet, history, support

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Profile | GET | `/users/profile` | Get user profile |
| Update Profile | PUT | `/users/profile/professional` | Update profile |
| Get Payments | GET | `/payments/history` | Payment history |
| Sign Out | POST | `/auth/signout` | Log out |

---

## COMPANION (Provider) Screens

### 1. Auth/Splash
**Screen**: Welcome, earnings pitch
**APIs Used**: None (static screen)

---

### 2. Auth/Login/Register
**Screen**: Phone/email + OTP
**Same as Hirer** - See [Auth/Login/Register](#2-authloginregister)

---

### 3. Auth/Verify Identity
**Screen**: VNeID / ID + photo verification

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Status | GET | `/verification/status` | Verification status |
| Init Identity | POST | `/verification/identity/initiate` | Start ID verification |
| Get History | GET | `/verification/history` | Verification history |

---

### 4. Onboard/Create Profile
**Screen**: Photos, bio, about me

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Create Profile | POST | `/companions/me/profile` | Create companion profile |

**Request**:
```json
{
  "displayName": "Linh Nguyen",
  "bio": "Professional companion for social events...",
  "dateOfBirth": "1998-05-15",
  "photos": ["https://storage.../photo1.jpg"],
  "locationCity": "Ho Chi Minh",
  "locationDistrict": "District 1",
  "languages": ["vi", "en"]
}
```

---

### 5. Onboard/Set Services
**Screen**: What occasions (wedding, Tet, dinner...)

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Update Profile | PUT | `/companions/me/profile` | Set occasions |

**Request**:
```json
{
  "occasions": ["WEDDING", "TET", "DINNER", "CORPORATE"]
}
```

---

### 6. Onboard/Set Pricing
**Screen**: Hourly rate, packages

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Update Profile | PUT | `/companions/me/profile` | Set pricing |

**Request**:
```json
{
  "hourlyRate": 500000
}
```

---

### 7. Onboard/Set Availability
**Screen**: Calendar, working hours

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Set Availability | PUT | `/companions/me/availability` | Update schedule |

**Request**:
```json
{
  "schedule": [
    {
      "dayOfWeek": 1,
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "21:00"
    },
    {
      "dayOfWeek": 2,
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "21:00"
    }
  ]
}
```

---

### 8. Home/Dashboard
**Screen**: Today's bookings, earnings, rating

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Dashboard | GET | `/companion/dashboard` | Dashboard summary |

**Response**:
```json
{
  "todaysSummary": {
    "bookingsCount": 2,
    "totalEarnings": 1500000,
    "nextBooking": {
      "id": "booking-123",
      "startTime": "14:00",
      "location": "Coffee Shop",
      "client": { "name": "John" }
    }
  },
  "upcomingBookings": [...],
  "recentActivity": [...],
  "stats": {
    "rating": 4.8,
    "reviewCount": 45,
    "responseRate": 95,
    "completionRate": 98,
    "thisMonth": {
      "bookings": 12,
      "earnings": 6000000
    }
  }
}
```

---

### 9. Bookings/Booking Requests
**Screen**: Incoming requests (accept/decline)

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Requests | GET | `/bookings/companion/requests` | Pending requests |
| Accept/Decline | PUT | `/bookings/:id/status` | Update status |

**Accept Request**:
```json
{
  "status": "ACCEPTED"
}
```

**Decline Request**:
```json
{
  "status": "DECLINED",
  "reason": "Not available on this date"
}
```

---

### 10. Bookings/My Schedule
**Screen**: Calendar view of confirmed bookings

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Schedule | GET | `/bookings/companion/schedule` | Calendar view |

**Query Parameters**:
```
?startDate=2025-02-01&endDate=2025-02-28
```

---

### 11. Bookings/Booking Detail
**Screen**: Hirer info, location, time, occasion

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Detail | GET | `/bookings/:bookingId` | Full booking info |
| Start Booking | PUT | `/bookings/:id/status` | Mark IN_PROGRESS |
| Complete | PUT | `/bookings/:id/status` | Mark COMPLETED |
| Update Location | POST | `/safety/location/:bookingId` | Share location |
| Trigger SOS | POST | `/safety/sos` | Emergency alert |

**Start Booking**:
```json
{
  "status": "IN_PROGRESS"
}
```

---

### 12. Chat/Messages List
**Same as Hirer** - See [Chat/Messages List](#13-chatmessages-list)

---

### 13. Chat/Chat Room
**Same as Hirer** - See [Chat/Chat Room](#14-chatchat-room)

---

### 14. Earnings/Earnings Overview
**Screen**: Daily/weekly/monthly stats

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Overview | GET | `/companion/earnings` | Earnings summary |

**Response**:
```json
{
  "availableBalance": 5000000,
  "pendingBalance": 1500000,
  "totalEarnings": 25000000,
  "periods": {
    "thisWeek": { "amount": 3000000, "change": 15 },
    "lastWeek": { "amount": 2600000 },
    "thisMonth": { "amount": 8500000, "change": 20 },
    "lastMonth": { "amount": 7000000 }
  }
}
```

---

### 15. Earnings/Withdrawal
**Screen**: Bank transfer, payment history

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Transactions | GET | `/companion/earnings/transactions` | Transaction list |
| Get Bank Accounts | GET | `/companion/earnings/bank-accounts` | Saved accounts |
| Add Bank Account | POST | `/companion/earnings/bank-accounts` | Add new account |
| Delete Account | DELETE | `/companion/earnings/bank-accounts/:id` | Remove account |
| Withdraw | POST | `/companion/earnings/withdraw` | Request withdrawal |

**Add Bank Account**:
```json
{
  "bankCode": "VCB",
  "bankName": "Vietcombank",
  "accountNumber": "1234567890",
  "accountHolder": "NGUYEN VAN A"
}
```

**Withdraw Request**:
```json
{
  "amount": 2000000,
  "bankAccountId": "acc-123"
}
```

---

### 16. Profile/My Profile
**Screen**: View public profile

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Get Profile | GET | `/companions/me/profile` | Own companion profile |

---

### 17. Profile/Edit Profile
**Screen**: Update photos, bio, services, pricing

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Update Profile | PUT | `/companions/me/profile` | Update all fields |
| Update Availability | PUT | `/companions/me/availability` | Update schedule |

---

## Safety Features (Both User Types)

### SOS / Emergency

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Trigger SOS | POST | `/safety/sos` | Emergency alert |
| Get Active Alerts | GET | `/safety/sos/active` | Active SOS alerts |
| Resolve SOS | PUT | `/safety/sos/:alertId` | Update SOS status |

**Trigger SOS**:
```json
{
  "bookingId": "booking-123",
  "alertType": "EMERGENCY",
  "latitude": 10.762622,
  "longitude": 106.660172,
  "message": "Need immediate help"
}
```

### Location Tracking

| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| Update Location | POST | `/safety/location/:bookingId` | Share location |
| Get History | GET | `/safety/location/:bookingId/history` | Location trail |

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not logged in |
| 403 | Forbidden - No permission |
| 404 | Not Found |
| 409 | Conflict - Already exists |
| 500 | Server Error |

---

## Booking Status Flow

```
PENDING → ACCEPTED → CONFIRMED → IN_PROGRESS → COMPLETED
    ↓         ↓          ↓           ↓
 DECLINED  CANCELLED  CANCELLED   CANCELLED
```

---

## OccasionType Enum Values

```typescript
enum OccasionType {
  WEDDING = 'WEDDING',
  TET = 'TET',
  FAMILY_EVENTS = 'FAMILY_EVENTS',
  CORPORATE = 'CORPORATE',
  COFFEE_DATE = 'COFFEE_DATE',
  SOCIAL_EVENTS = 'SOCIAL_EVENTS',
  DINNER = 'DINNER',
  PARTY = 'PARTY',
  OTHER = 'OTHER'
}
```

---

## Authentication Header

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## Vietnamese Payment Providers

- **VNPay**: Standard Vietnamese payment gateway
- **MoMo**: Mobile wallet integration
- **Bank Transfer**: Direct bank transfers

All payments go through escrow until booking completion.
