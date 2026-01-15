# Society - User Flows & Journey Maps

---

## 1. Client User Flows

### 1.1 New Client Onboarding Flow

```
┌─────────────┐
│   Splash    │
│   Screen    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Welcome 1  │────▶│  Welcome 2  │────▶│  Welcome 3  │
│   (Trust)   │     │  (Events)   │     │  (Safety)   │
└─────────────┘     └─────────────┘     └──────┬──────┘
       │                                       │
       │ Skip                                  │
       └───────────────────┬───────────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Login     │
                    │   Screen    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │  Login  │  │ Sign Up │  │ Social  │
        │  Email  │  │  Phone  │  │  Login  │
        └────┬────┘  └────┬────┘  └────┬────┘
             │            │            │
             └────────────┼────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ OTP Verify  │
                   │  (if new)   │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Basic Info  │
                   │ Name/DOB    │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Create     │
                   │  Password   │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Profile   │
                   │   Photo     │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Home /    │
                   │  Discovery  │
                   └─────────────┘
```

### 1.2 Booking Flow

```
┌─────────────┐
│    Home     │
│  Discovery  │
└──────┬──────┘
       │
       │ Browse/Search
       ▼
┌─────────────┐
│   Search    │──────┐
│  & Filters  │      │ Filter by:
└──────┬──────┘      │ - Occasion
       │             │ - Date
       │             │ - Location
       ▼             │ - Price
┌─────────────┐      │ - Rating
│ Companion   │◀─────┘
│   Cards     │
└──────┬──────┘
       │
       │ Tap Card
       ▼
┌─────────────┐
│ Companion   │
│  Profile    │
│  (Full)     │
└──────┬──────┘
       │
       ├─────────────────┐
       │ Message         │ Check Availability
       ▼                 ▼
┌─────────────┐    ┌─────────────┐
│   Chat      │    │  Booking    │
│  Interface  │    │  Step 1:    │
└─────────────┘    │  Occasion   │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Booking    │
                   │  Step 2:    │
                   │ Date/Time   │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Booking    │
                   │  Step 3:    │
                   │  Details    │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Review &   │
                   │  Payment    │
                   └──────┬──────┘
                          │
                          │ Pay
                          ▼
                   ┌─────────────┐
                   │  Payment    │
                   │ Processing  │
                   └──────┬──────┘
                          │
             ┌────────────┼────────────┐
             │ Success    │            │ Failed
             ▼            │            ▼
      ┌─────────────┐     │     ┌─────────────┐
      │  Booking    │     │     │   Error     │
      │ Confirmed   │     │     │   Retry     │
      └──────┬──────┘     │     └─────────────┘
             │            │
             ▼            │
      ┌─────────────┐     │
      │    Chat     │     │
      │    with     │     │
      │ Companion   │     │
      └──────┬──────┘     │
             │            │
             ▼            │
      ┌─────────────┐     │
      │  Booking    │     │
      │  Details    │     │
      │  (Pending/  │     │
      │  Confirmed) │     │
      └─────────────┘     │
```

### 1.3 Active Booking Flow

```
┌─────────────┐
│   Booking   │
│   Day       │
└──────┬──────┘
       │
       │ Notification: "Booking starts in 1hr"
       ▼
┌─────────────┐
│  Booking    │
│  Details    │
└──────┬──────┘
       │
       │ Booking start time
       ▼
┌─────────────┐
│   Active    │
│  Booking    │
│   Screen    │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│    GPS      │ │   Chat      │ │   Call      │ │  Emergency  │
│  Check-in   │ │ Companion   │ │ Companion   │ │   Button    │
└─────────────┘ └─────────────┘ └─────────────┘ └──────┬──────┘
                                                       │
                                               ┌───────┴───────┐
                                               ▼               ▼
                                        ┌─────────────┐ ┌─────────────┐
                                        │  Emergency  │ │   Normal    │
                                        │   Options   │ │ Completion  │
                                        └─────────────┘ └──────┬──────┘
                                                               │
       ┌───────────────────────────────────────────────────────┘
       │ Booking end time
       ▼
┌─────────────┐
│  Service    │
│  Complete   │
│ Confirmation│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Leave     │
│   Review    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Booking    │
│  Complete   │
└─────────────┘
```

### 1.4 Dispute Flow

```
┌─────────────┐
│  Completed  │
│   Booking   │
└──────┬──────┘
       │
       │ Report Issue
       ▼
┌─────────────┐
│   Select    │
│ Issue Type  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Describe   │
│   Issue     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Upload    │
│  Evidence   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Select     │
│ Resolution  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Submit    │
│   Report    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Case      │
│  Created    │
└──────┬──────┘
       │
       │ Wait for review
       ▼
┌─────────────┐
│   Under     │
│   Review    │
└──────┬──────┘
       │
       ├─────────────────┐
       ▼                 ▼
┌─────────────┐    ┌─────────────┐
│   Info      │    │  Decision   │
│  Request    │    │    Made     │
└──────┬──────┘    └──────┬──────┘
       │                  │
       │ Provide info     │
       └──────────────────┤
                          ▼
                   ┌─────────────┐
                   │ Resolution  │
                   │  Applied    │
                   └──────┬──────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
       ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
       │   Refund    │ │   Credit    │ │  No Action  │
       │  Processed  │ │   Applied   │ │   (Report   │
       └─────────────┘ └─────────────┘ │   Only)     │
                                       └─────────────┘
```

---

## 2. Companion User Flows

### 2.1 Companion Registration Flow

```
┌─────────────┐
│   Login/    │
│   Signup    │
└──────┬──────┘
       │
       │ "Become a Companion"
       ▼
┌─────────────┐
│   Role      │
│  Selection  │
└──────┬──────┘
       │
       │ Select Companion
       ▼
┌─────────────┐
│Requirements │
│   Preview   │
└──────┬──────┘
       │
       │ "I'm Ready"
       ▼
┌─────────────┐
│   Phone     │
│ Verification│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    OTP      │
│   Verify    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     ID      │
│Verification │
│ (Front/Back)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Selfie    │
│  Liveness   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Profile   │
│   Photos    │
│  (3-6 min)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Profile   │
│    Info     │
│ (Bio/Skills)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Pricing   │
│   Setup     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Registration│
│  Complete   │
└──────┬──────┘
       │
       │ Pending Review
       ▼
┌─────────────┐     ┌─────────────┐
│  Dashboard  │◀────│   Review    │
│  (Limited)  │     │  Approved   │
└─────────────┘     └─────────────┘
```

### 2.2 Booking Request Flow

```
┌─────────────┐
│  Dashboard  │
└──────┬──────┘
       │
       │ New Request Notification
       ▼
┌─────────────┐
│  Incoming   │
│  Requests   │
└──────┬──────┘
       │
       │ Tap Request
       ▼
┌─────────────┐
│  Request    │
│  Details    │
│ - Client    │
│ - Date/Time │
│ - Location  │
│ - Occasion  │
│ - Earnings  │
└──────┬──────┘
       │
       ├─────────────────┐
       │ Accept          │ Decline
       ▼                 ▼
┌─────────────┐    ┌─────────────┐
│  Booking    │    │  Decline    │
│ Confirmed   │    │   Reason    │
└──────┬──────┘    └──────┬──────┘
       │                  │
       │                  │
       ▼                  ▼
┌─────────────┐    ┌─────────────┐
│   Chat      │    │  Request    │
│   Client    │    │  Declined   │
└─────────────┘    └─────────────┘
```

### 2.3 Active Service Flow (Companion)

```
┌─────────────┐
│   Booking   │
│   Day       │
└──────┬──────┘
       │
       │ Notification: "Prepare for booking"
       ▼
┌─────────────┐
│  Booking    │
│  Details    │
└──────┬──────┘
       │
       │ Travel to venue
       ▼
┌─────────────┐
│   Start     │
│  Service    │
│  (GPS In)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Active    │
│  Service    │
│   Screen    │
└──────┬──────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Update     │ │   Chat      │ │  Request    │ │  Emergency  │
│  Check-in   │ │   Client    │ │ Extension   │ │   Button    │
└─────────────┘ └─────────────┘ └──────┬──────┘ └─────────────┘
                                       │
                                       ▼
                                ┌─────────────┐
                                │   Client    │
                                │  Approves   │
                                └──────┬──────┘
                                       │
       ┌───────────────────────────────┘
       │ Service end time
       ▼
┌─────────────┐
│  Complete   │
│  Service    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Service   │
│   Summary   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Earnings   │
│  Pending    │
└─────────────┘
```

### 2.4 Earnings & Withdrawal Flow

```
┌─────────────┐
│  Dashboard  │
│ or Earnings │
│    Tab      │
└──────┬──────┘
       │
       │ View Balance
       ▼
┌─────────────┐
│  Earnings   │
│  Overview   │
│ - Available │
│ - Pending   │
│ - History   │
└──────┬──────┘
       │
       │ Withdraw
       ▼
┌─────────────┐
│   Enter     │
│   Amount    │
└──────┬──────┘
       │
       ▼
┌─────────────┐        ┌─────────────┐
│   Select    │◀──────▶│    Add      │
│   Bank      │        │ Bank Account│
└──────┬──────┘        └─────────────┘
       │
       ▼
┌─────────────┐
│   Review    │
│  Withdrawal │
└──────┬──────┘
       │
       │ Confirm
       ▼
┌─────────────┐
│  Processing │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Withdrawal  │
│ Successful  │
└──────┬──────┘
       │
       │ 1-2 Business Days
       ▼
┌─────────────┐
│   Funds     │
│  Received   │
└─────────────┘
```

---

## 3. Safety Flows

### 3.1 Emergency Button Flow

```
┌─────────────┐
│   Active    │
│   Booking   │
└──────┬──────┘
       │
       │ Tap Emergency Button
       ▼
┌─────────────┐
│  Emergency  │
│   Options   │
│   Sheet     │
└──────┬──────┘
       │
       ├────────────┬────────────┬────────────┬────────────┐
       ▼            ▼            ▼            ▼            ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│Call 113   │ │Call       │ │Alert      │ │Share      │ │Sound      │
│(Police)   │ │Emergency  │ │Society    │ │Location   │ │Alarm      │
│           │ │Contact    │ │Support    │ │           │ │           │
└─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └───────────┘
      │             │             │             │
      │             │             │             │
      ▼             ▼             ▼             ▼
┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
│Phone Call │ │Phone Call │ │Support    │ │Location   │
│to Police  │ │to Contact │ │Alerted    │ │Sent to    │
│           │ │           │ │           │ │Contacts   │
└───────────┘ └───────────┘ └─────┬─────┘ └───────────┘
                                  │
                                  ▼
                           ┌───────────┐
                           │Support    │
                           │Calls Back │
                           │           │
                           │Booking    │
                           │Flagged    │
                           └───────────┘
```

### 3.2 Safe Word Detection Flow

```
┌─────────────┐
│   Active    │
│   Chat      │
└──────┬──────┘
       │
       │ Message contains safe word
       ▼
┌─────────────┐
│   System    │
│  Detection  │
└──────┬──────┘
       │
       │ Automatic
       ▼
┌─────────────┐
│  Alert to   │
│   Society   │
│   Support   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Support   │
│   Reviews   │
│    Chat     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Discreet   │
│   Call to   │
│    User     │
│ (Fake Name) │
└──────┬──────┘
       │
       ├─────────────────┐
       │ False Alarm     │ Real Emergency
       ▼                 ▼
┌─────────────┐    ┌─────────────┐
│   Resume    │    │  Emergency  │
│   Booking   │    │  Protocol   │
└─────────────┘    │  Activated  │
                   └─────────────┘
```

### 3.3 GPS Check-in Flow

```
┌─────────────┐
│   Active    │
│   Booking   │
└──────┬──────┘
       │
       │ Check-in Reminder (every 30min)
       ▼
┌─────────────┐
│  Check-in   │
│Notification │
└──────┬──────┘
       │
       ├─────────────────┐
       │ Tap "All Good"  │ Tap "Need Help"
       ▼                 ▼
┌─────────────┐    ┌─────────────┐
│  Location   │    │  Emergency  │
│  Updated    │    │   Options   │
└─────────────┘    └─────────────┘

       │
       │ No response within 10 minutes
       ▼
┌─────────────┐
│   Support   │
│   Notified  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Support   │
│   Calls     │
│    User     │
└─────────────┘
```

---

## 4. Navigation Structure

### 4.1 Client App Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                        BOTTOM TAB BAR                        │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│    Home     │   Search    │  Bookings   │    Chat     │   Profile   │
│   (Feed)    │  (Filter)   │  (History)  │  (Messages) │  (Settings) │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘
       │             │             │             │             │
       ▼             ▼             ▼             ▼             ▼
  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │Discovery│  │Search   │  │Upcoming │  │Chat List│  │Account  │
  │Carousel │  │Results  │  │Active   │  │         │  │Settings │
  │         │  │Filters  │  │Past     │  │         │  │Safety   │
  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘
       │            │            │            │            │
       └─────────▶ Companion Profile ◀────────┘            │
                      │                                    │
                      ▼                                    │
                 Booking Flow ─────────────▶ Payment ──────┘
                      │
                      ▼
                 Active Booking
                      │
                      ▼
                 Review Flow
```

### 4.2 Companion App Navigation

```
┌─────────────────────────────────────────────────────────────┐
│                        BOTTOM TAB BAR                        │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│    Home     │  Calendar   │  Requests   │  Earnings   │   Profile   │
│ (Dashboard) │(Availability)│  (Inbox)   │  (Wallet)   │  (Editor)   │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘
       │             │             │             │             │
       ▼             ▼             ▼             ▼             ▼
  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
  │Stats    │  │Month    │  │Pending  │  │Balance  │  │Edit     │
  │Upcoming │  │View     │  │Accepted │  │History  │  │Photos   │
  │Requests │  │Edit Day │  │Declined │  │Withdraw │  │Bio      │
  └────┬────┘  └─────────┘  └────┬────┘  └────┬────┘  │Pricing  │
       │                        │            │       └─────────┘
       └────────────▶ Booking Details ◀──────┘
                           │
                           ▼
                      Active Service
                           │
                           ▼
                    Service Complete
```

---

## 5. State Machines

### 5.1 Booking State Machine

```
                    ┌──────────────┐
                    │   CREATED    │
                    │  (Pending    │
                    │  Companion)  │
                    └──────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │ Accept         │ Decline        │ Timeout
          ▼                ▼                ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │  CONFIRMED   │ │  DECLINED    │ │   EXPIRED    │
   │              │ │              │ │              │
   └──────┬───────┘ └──────────────┘ └──────────────┘
          │
          │ Start Time
          ▼
   ┌──────────────┐
   │    ACTIVE    │
   │              │
   └──────┬───────┘
          │
   ┌──────┼───────────────────┐
   │      │ End Time          │ Cancel
   │      ▼                   ▼
   │ ┌──────────────┐  ┌──────────────┐
   │ │  COMPLETED   │  │  CANCELLED   │
   │ │              │  │              │
   │ └──────┬───────┘  └──────────────┘
   │        │
   │        │ Dispute Filed
   │        ▼
   │ ┌──────────────┐
   │ │   DISPUTED   │
   │ │              │
   │ └──────┬───────┘
   │        │
   │        │ Resolved
   │        ▼
   │ ┌──────────────┐
   └▶│   RESOLVED   │
     │              │
     └──────────────┘
```

### 5.2 Companion Verification State Machine

```
     ┌──────────────┐
     │   STARTED    │
     │              │
     └──────┬───────┘
            │
            │ Phone Verified
            ▼
     ┌──────────────┐
     │PHONE_VERIFIED│
     │              │
     └──────┬───────┘
            │
            │ ID Uploaded
            ▼
     ┌──────────────┐
     │ ID_SUBMITTED │
     │              │
     └──────┬───────┘
            │
     ┌──────┼──────────────┐
     │      │ Approved     │ Rejected
     │      ▼              ▼
     │ ┌──────────────┐ ┌──────────────┐
     │ │ ID_VERIFIED  │ │ ID_REJECTED  │
     │ │              │ │              │
     │ └──────┬───────┘ └──────────────┘
     │        │
     │        │ Background Check Passed
     │        ▼
     │ ┌──────────────┐
     │ │   APPROVED   │
     │ │  (Can work)  │
     │ └──────┬───────┘
     │        │
     │        │ zkTLS Verified
     │        ▼
     │ ┌──────────────┐
     └▶│  PREMIUM     │
       │ (All badges) │
       └──────────────┘
```

### 5.3 Payment State Machine

```
     ┌──────────────┐
     │   PENDING    │
     │  (Client     │
     │  initiated)  │
     └──────┬───────┘
            │
            │ Payment Attempted
            ▼
     ┌──────────────┐
     │  PROCESSING  │
     │              │
     └──────┬───────┘
            │
     ┌──────┼──────────────┐
     │      │ Success      │ Failed
     │      ▼              ▼
     │ ┌──────────────┐ ┌──────────────┐
     │ │    HELD      │ │   FAILED     │
     │ │  (In Escrow) │ │   (Retry)    │
     │ └──────┬───────┘ └──────────────┘
     │        │
     │        │ Service Completed
     │        ▼
     │ ┌──────────────┐
     │ │  RELEASING   │
     │ │              │
     │ └──────┬───────┘
     │        │
     │ ┌──────┼──────────────┐
     │ │      │ 24hr Hold    │ Dispute
     │ │      ▼              ▼
     │ │ ┌──────────────┐ ┌──────────────┐
     │ │ │  RELEASED    │ │    HELD      │
     │ │ │  (To Comp.)  │ │ (Pending     │
     │ │ └──────────────┘ │  Resolution) │
     │ │                  └──────┬───────┘
     │ │                         │
     │ │                         │ Resolved
     │ │                         ▼
     │ │                  ┌──────────────┐
     │ └─────────────────▶│   SETTLED    │
     │                    │              │
     │                    └──────────────┘
     │
     │ Cancellation (by either party)
     ▼
┌──────────────┐
│  REFUNDED    │
│  (To Client) │
└──────────────┘
```
