# Society - Custom SVG Icon System

---

## 1. Icon System Overview

Society uses a **custom SVG icon library** designed specifically for the platform. All icons follow a consistent visual language that reflects warmth, trust, and Vietnamese cultural sensitivity.

### 1.1 Design Principles

```
- Rounded corners (2px radius on strokes)
- Consistent 2px stroke weight
- Friendly, approachable aesthetic
- Cultural appropriateness for Vietnam
- Optimized for mobile (touch-friendly)
```

### 1.2 Icon Grid & Sizes

```
Base Grid: 24x24px
Stroke: 2px
Corner Radius: 2px
Padding: 2px inner safe area

Size Scale:
--icon-xs: 16px   /* Inline text, badges */
--icon-sm: 18px   /* List items, compact UI */
--icon-md: 20px   /* Default UI size */
--icon-lg: 24px   /* Navigation, prominent actions */
--icon-xl: 28px   /* Featured sections */
--icon-2xl: 32px  /* Empty states, modals */
--icon-3xl: 48px  /* Splash, major features */
```

### 1.3 Icon Colors

```css
/* Primary states */
--icon-primary: #FF6B8A;      /* Rose Pink - CTAs, active states */
--icon-secondary: #6B6572;    /* Default UI icons */
--icon-tertiary: #9B95A3;     /* Placeholder, disabled */
--icon-inverse: #FFFFFF;      /* On dark backgrounds */

/* Semantic colors */
--icon-success: #4ECDC4;      /* Success Teal */
--icon-warning: #FFD93D;      /* Sunny Yellow */
--icon-error: #FF5757;        /* Error Red */
--icon-info: #C9B1FF;         /* Lavender */
```

---

## 2. Society Logo & Brand Mark

### 2.1 Logo Mark - Heart Connection

```svg
<!-- Society Logo Mark - Heart with connecting hands -->
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Heart shape -->
  <path d="M24 42C24 42 6 30 6 18C6 12 10.5 7 16.5 7C20.5 7 23.5 10 24 12C24.5 10 27.5 7 31.5 7C37.5 7 42 12 42 18C42 30 24 42 24 42Z"
        fill="#FF6B8A" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Connecting hands inside -->
  <path d="M16 22C16 22 19 20 21 22C23 24 24 25 24 25C24 25 25 24 27 22C29 20 32 22 32 22"
        stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="18" cy="26" r="2" fill="white"/>
  <circle cx="30" cy="26" r="2" fill="white"/>
</svg>
```

### 2.2 Wordmark

```svg
<!-- Society Wordmark -->
<svg width="120" height="32" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <text x="0" y="24" font-family="SF Pro Display, system-ui" font-weight="600" font-size="24" fill="#2D2A33">
    Society
  </text>
</svg>
```

---

## 3. Navigation Icons

### 3.1 Bottom Tab Bar - Client

#### Home Icon
```svg
<!-- Home - Inactive -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        stroke="#9B95A3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

<!-- Home - Active -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        fill="#FF6B8A" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Search Icon
```svg
<!-- Search - Inactive -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="11" cy="11" r="7" stroke="#9B95A3" stroke-width="2"/>
  <path d="M16 16L21 21" stroke="#9B95A3" stroke-width="2" stroke-linecap="round"/>
</svg>

<!-- Search - Active -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="11" cy="11" r="7" fill="#FF6B8A" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M16 16L21 21" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Bookings/Calendar Icon
```svg
<!-- Calendar - Inactive -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="5" width="18" height="16" rx="2" stroke="#9B95A3" stroke-width="2"/>
  <path d="M3 9H21" stroke="#9B95A3" stroke-width="2"/>
  <path d="M8 3V5" stroke="#9B95A3" stroke-width="2" stroke-linecap="round"/>
  <path d="M16 3V5" stroke="#9B95A3" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="15" r="2" fill="#9B95A3"/>
</svg>

<!-- Calendar - Active -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="5" width="18" height="16" rx="2" fill="#FF6B8A" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M3 9H21" stroke="white" stroke-width="2"/>
  <path d="M8 3V5" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round"/>
  <path d="M16 3V5" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="15" r="2" fill="white"/>
</svg>
```

#### Chat Icon
```svg
<!-- Chat - Inactive -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 12C21 16.4183 16.9706 20 12 20C10.5 20 9.1 19.7 7.8 19.2L3 21L4.5 17C3.5 15.6 3 14 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z"
        stroke="#9B95A3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="8" cy="12" r="1" fill="#9B95A3"/>
  <circle cx="12" cy="12" r="1" fill="#9B95A3"/>
  <circle cx="16" cy="12" r="1" fill="#9B95A3"/>
</svg>

<!-- Chat - Active -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21 12C21 16.4183 16.9706 20 12 20C10.5 20 9.1 19.7 7.8 19.2L3 21L4.5 17C3.5 15.6 3 14 3 12C3 7.58172 7.02944 4 12 4C16.9706 4 21 7.58172 21 12Z"
        fill="#FF6B8A" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="8" cy="12" r="1" fill="white"/>
  <circle cx="12" cy="12" r="1" fill="white"/>
  <circle cx="16" cy="12" r="1" fill="white"/>
</svg>
```

#### Profile/User Icon
```svg
<!-- User - Inactive -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="8" r="4" stroke="#9B95A3" stroke-width="2"/>
  <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
        stroke="#9B95A3" stroke-width="2" stroke-linecap="round"/>
</svg>

<!-- User - Active -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="8" r="4" fill="#FF6B8A" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M4 20C4 16.6863 7.58172 14 12 14C16.4183 14 20 16.6863 20 20"
        stroke="#FF6B8A" stroke-width="2" stroke-linecap="round"/>
</svg>
```

### 3.2 Bottom Tab Bar - Companion

#### Wallet/Earnings Icon
```svg
<!-- Wallet - Inactive -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="6" width="20" height="14" rx="2" stroke="#9B95A3" stroke-width="2"/>
  <path d="M2 10H22" stroke="#9B95A3" stroke-width="2"/>
  <circle cx="17" cy="14" r="2" fill="#9B95A3"/>
</svg>

<!-- Wallet - Active -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="6" width="20" height="14" rx="2" fill="#FF6B8A" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M2 10H22" stroke="white" stroke-width="2"/>
  <circle cx="17" cy="14" r="2" fill="white"/>
</svg>
```

#### Requests/Tray Icon
```svg
<!-- Requests - Inactive -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="8" width="18" height="12" rx="2" stroke="#9B95A3" stroke-width="2"/>
  <path d="M7 8V6C7 4.89543 7.89543 4 9 4H15C16.1046 4 17 4.89543 17 6V8"
        stroke="#9B95A3" stroke-width="2"/>
  <path d="M3 12H21" stroke="#9B95A3" stroke-width="2"/>
</svg>

<!-- Requests - Active -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="8" width="18" height="12" rx="2" fill="#FF6B8A" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M7 8V6C7 4.89543 7.89543 4 9 4H15C16.1046 4 17 4.89543 17 6V8"
        stroke="#FF6B8A" stroke-width="2"/>
  <path d="M3 12H21" stroke="white" stroke-width="2"/>
</svg>
```

### 3.3 Top Navigation Icons

#### Back Arrow
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M15 6L9 12L15 18" stroke="#2D2A33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Close/X Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 6L18 18M6 18L18 6" stroke="#2D2A33" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Settings/Gear Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="3" stroke="#6B6572" stroke-width="2"/>
  <path d="M12 2V5M12 19V22M22 12H19M5 12H2M19.07 4.93L16.95 7.05M7.05 16.95L4.93 19.07M19.07 19.07L16.95 16.95M7.05 7.05L4.93 4.93"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### More Options (Dots)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="6" r="2" fill="#6B6572"/>
  <circle cx="12" cy="12" r="2" fill="#6B6572"/>
  <circle cx="12" cy="18" r="2" fill="#6B6572"/>
</svg>
```

#### Filter/Funnel Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 5H21L14 13V19L10 21V13L3 5Z" stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Notification Bell
```svg
<!-- Bell - Default -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

<!-- Bell - With notification badge -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="18" cy="5" r="4" fill="#FF6B8A"/>
</svg>
```

---

## 4. Action Icons

### 4.1 Primary Actions

#### Add/Plus Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 5V19M5 12H19" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Edit/Pencil Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 3L21 8L8 21H3V16L16 3Z" stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 6L18 11" stroke="#6B6572" stroke-width="2"/>
</svg>
```

#### Delete/Trash Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 6H21" stroke="#FF5757" stroke-width="2" stroke-linecap="round"/>
  <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6"
        stroke="#FF5757" stroke-width="2"/>
  <path d="M5 6L6 20C6 20.5523 6.44772 21 7 21H17C17.5523 21 18 20.5523 18 20L19 6"
        stroke="#FF5757" stroke-width="2"/>
  <path d="M10 10V17M14 10V17" stroke="#FF5757" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Share Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="5" r="3" stroke="#6B6572" stroke-width="2"/>
  <circle cx="6" cy="12" r="3" stroke="#6B6572" stroke-width="2"/>
  <circle cx="18" cy="19" r="3" stroke="#6B6572" stroke-width="2"/>
  <path d="M8.5 10.5L15.5 6.5M8.5 13.5L15.5 17.5" stroke="#6B6572" stroke-width="2"/>
</svg>
```

#### Heart/Favorite Icon
```svg
<!-- Heart - Outline -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21C12 21 3 15 3 9C3 6 5.5 3 8.5 3C10.5 3 12 5 12 5C12 5 13.5 3 15.5 3C18.5 3 21 6 21 9C21 15 12 21 12 21Z"
        stroke="#FF6B8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

<!-- Heart - Filled -->
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 21C12 21 3 15 3 9C3 6 5.5 3 8.5 3C10.5 3 12 5 12 5C12 5 13.5 3 15.5 3C18.5 3 21 6 21 9C21 15 12 21 12 21Z"
        fill="#FF6B8A" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Phone/Call Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 16.92V19.92C22 20.4835 21.5523 20.92 21 20.92C12.163 20.92 5 13.757 5 4.92C5 4.36772 5.43667 3.92 6 3.92H9C9.5 3.92 9.92 4.28 10 4.77L10.45 7.77C10.52 8.24 10.31 8.71 9.92 8.97L8.09 10.18C9.57 13.39 12.11 15.93 15.32 17.41L16.53 15.58C16.79 15.19 17.26 14.98 17.73 15.05L20.73 15.5C21.22 15.58 21.58 16 21.58 16.5L22 16.92Z"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Video Call Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="6" width="14" height="12" rx="2" stroke="#6B6572" stroke-width="2"/>
  <path d="M16 10L22 7V17L16 14V10Z" stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### 4.2 Booking Actions

#### Book Now (Calendar+)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="5" width="18" height="16" rx="2" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M3 9H21" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M8 3V5M16 3V5" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round"/>
  <path d="M12 12V18M9 15H15" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Check Availability
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="5" width="18" height="16" rx="2" stroke="#4ECDC4" stroke-width="2"/>
  <path d="M3 9H21" stroke="#4ECDC4" stroke-width="2"/>
  <path d="M8 3V5M16 3V5" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round"/>
  <path d="M9 15L11 17L15 13" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Cancel Booking
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#FF5757" stroke-width="2"/>
  <path d="M9 9L15 15M15 9L9 15" stroke="#FF5757" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Reschedule Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#FF8E72" stroke-width="2"/>
  <path d="M12 7V12L15 14" stroke="#FF8E72" stroke-width="2" stroke-linecap="round"/>
  <path d="M5 4L8 7L5 10" stroke="#FF8E72" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Complete/Check Circle
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#4ECDC4" stroke-width="2"/>
  <path d="M8 12L11 15L16 9" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

### 4.3 Arrow/Navigation Icons

#### Right Arrow
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 6L15 12L9 18" stroke="#9B95A3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Down Arrow/Dropdown
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 9L12 15L18 9" stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Up Arrow
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 15L12 9L18 15" stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### External Link
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 4H4V20H20V14" stroke="#6B6572" stroke-width="2" stroke-linecap="round"/>
  <path d="M14 4H20V10" stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 4L10 14" stroke="#6B6572" stroke-width="2" stroke-linecap="round"/>
</svg>
```

---

## 5. Status & Indicator Icons

### 5.1 Verification Badges

#### ID Verified Shield
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L4 6V11C4 16.5 7.5 21.5 12 22.5C16.5 21.5 20 16.5 20 11V6L12 2Z"
        fill="#4ECDC4" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 12L11 15L16 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Phone Verified
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="6" y="2" width="12" height="20" rx="2" stroke="#C9B1FF" stroke-width="2"/>
  <path d="M10 18H14" stroke="#C9B1FF" stroke-width="2" stroke-linecap="round"/>
  <circle cx="17" cy="7" r="4" fill="#4ECDC4"/>
  <path d="M15 7L16.5 8.5L19 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### zkTLS Verified (Premium Lock)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="zkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#FF6B8A"/>
      <stop offset="100%" style="stop-color:#C9B1FF"/>
    </linearGradient>
  </defs>
  <rect x="4" y="10" width="16" height="12" rx="2" fill="url(#zkGradient)"/>
  <path d="M8 10V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10"
        stroke="url(#zkGradient)" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="15" r="2" fill="white"/>
  <path d="M12 17V19" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Premium/Crown Badge
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 18L5 8L9 11L12 5L15 11L19 8L21 18H3Z"
        fill="#FFD93D" stroke="#FFD93D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M3 18H21V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V18Z"
        fill="#FFD93D" stroke="#FFD93D" stroke-width="2"/>
</svg>
```

### 5.2 Status Indicators

#### Online Status (Dot)
```svg
<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="6" cy="6" r="5" fill="#4ECDC4" stroke="white" stroke-width="2"/>
</svg>
```

#### Offline Status (Dot)
```svg
<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="6" cy="6" r="4" stroke="#9B95A3" stroke-width="2"/>
</svg>
```

#### Pending Clock
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#FFD93D" stroke-width="2"/>
  <path d="M12 7V12L15 15" stroke="#FFD93D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Active/In Progress
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M10 8L16 12L10 16V8Z" fill="#FF6B8A"/>
</svg>
```

### 5.3 Rating Stars

#### Full Star
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L14.9 8.6L22 9.3L16.8 14L18.2 21L12 17.5L5.8 21L7.2 14L2 9.3L9.1 8.6L12 2Z"
        fill="#FFD93D" stroke="#FFD93D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Half Star
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="halfStar">
      <stop offset="50%" stop-color="#FFD93D"/>
      <stop offset="50%" stop-color="transparent"/>
    </linearGradient>
  </defs>
  <path d="M12 2L14.9 8.6L22 9.3L16.8 14L18.2 21L12 17.5L5.8 21L7.2 14L2 9.3L9.1 8.6L12 2Z"
        fill="url(#halfStar)" stroke="#FFD93D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Empty Star
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L14.9 8.6L22 9.3L16.8 14L18.2 21L12 17.5L5.8 21L7.2 14L2 9.3L9.1 8.6L12 2Z"
        stroke="#E5E2E9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

---

## 6. Category & Occasion Icons

### 6.1 Occasion Types

#### Wedding (Rings)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="9" cy="12" r="5" stroke="#FF6B8A" stroke-width="2"/>
  <circle cx="15" cy="12" r="5" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M7 8L5 4M11 8L13 4" stroke="#FFD93D" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Family Gathering (Family Group)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Parent 1 -->
  <circle cx="7" cy="7" r="3" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M2 16C2 13.5 4.5 12 7 12C9.5 12 12 13.5 12 16" stroke="#FF6B8A" stroke-width="2"/>
  <!-- Parent 2 -->
  <circle cx="17" cy="7" r="3" stroke="#FF8E72" stroke-width="2"/>
  <path d="M12 16C12 13.5 14.5 12 17 12C19.5 12 22 13.5 22 16" stroke="#FF8E72" stroke-width="2"/>
  <!-- Child -->
  <circle cx="12" cy="15" r="2" stroke="#FFD93D" stroke-width="2"/>
  <path d="M8 21C8 19.5 10 18 12 18C14 18 16 19.5 16 21" stroke="#FFD93D" stroke-width="2"/>
</svg>
```

#### Tet/Holiday (Mai Flower - Vietnamese Yellow Apricot)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Flower petals -->
  <ellipse cx="12" cy="6" rx="3" ry="4" fill="#FFD93D"/>
  <ellipse cx="6" cy="11" rx="3" ry="4" transform="rotate(-45 6 11)" fill="#FFD93D"/>
  <ellipse cx="18" cy="11" rx="3" ry="4" transform="rotate(45 18 11)" fill="#FFD93D"/>
  <ellipse cx="8" cy="17" rx="3" ry="4" transform="rotate(-20 8 17)" fill="#FFD93D"/>
  <ellipse cx="16" cy="17" rx="3" ry="4" transform="rotate(20 16 17)" fill="#FFD93D"/>
  <!-- Center -->
  <circle cx="12" cy="12" r="3" fill="#FF8E72"/>
  <circle cx="12" cy="12" r="1.5" fill="#FFD93D"/>
</svg>
```

#### Business Event (Briefcase)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="7" width="18" height="14" rx="2" stroke="#6B6572" stroke-width="2"/>
  <path d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7"
        stroke="#6B6572" stroke-width="2"/>
  <path d="M3 12H21" stroke="#6B6572" stroke-width="2"/>
  <path d="M10 12V14H14V12" stroke="#6B6572" stroke-width="2"/>
</svg>
```

#### Party/Celebration (Confetti)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 20L8 4L20 16L4 20Z" fill="#C9B1FF" stroke="#C9B1FF" stroke-width="2" stroke-linejoin="round"/>
  <circle cx="15" cy="5" r="2" fill="#FF6B8A"/>
  <circle cx="19" cy="9" r="1.5" fill="#FFD93D"/>
  <rect x="17" y="3" width="2" height="4" rx="1" fill="#4ECDC4" transform="rotate(15 17 3)"/>
  <path d="M10 10L12 12" stroke="white" stroke-width="2" stroke-linecap="round"/>
  <path d="M7 13L9 15" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Coffee/Casual (Coffee Cup)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 8H18C19.6569 8 21 9.34315 21 11C21 12.6569 19.6569 14 18 14H17"
        stroke="#FF8E72" stroke-width="2"/>
  <path d="M3 8H17V16C17 18.2091 15.2091 20 13 20H7C4.79086 20 3 18.2091 3 16V8Z"
        stroke="#FF8E72" stroke-width="2"/>
  <path d="M6 4C6 4 7 6 10 6C13 6 14 4 14 4" stroke="#FF8E72" stroke-width="2" stroke-linecap="round"/>
</svg>
```

### 6.2 Red Envelope (Li Xi) - Vietnamese Cultural Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="3" width="16" height="18" rx="2" fill="#FF6B8A"/>
  <path d="M4 8H20" stroke="#CC0000" stroke-width="2"/>
  <circle cx="12" cy="14" r="4" fill="#FFD93D" stroke="#CC0000" stroke-width="1"/>
  <path d="M12 12V16M10 14H14" stroke="#CC0000" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

---

## 7. Profile & Account Icons

#### Camera Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="6" width="20" height="14" rx="2" stroke="#6B6572" stroke-width="2"/>
  <circle cx="12" cy="13" r="4" stroke="#6B6572" stroke-width="2"/>
  <path d="M7 6L8 4H16L17 6" stroke="#6B6572" stroke-width="2"/>
</svg>
```

#### Gallery/Images Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="5" width="18" height="14" rx="2" stroke="#6B6572" stroke-width="2"/>
  <circle cx="8" cy="10" r="2" fill="#6B6572"/>
  <path d="M21 15L16 10L11 15L8 12L3 17" stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Location/Map Pin Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 22C12 22 19 16 19 10C19 6.13401 15.866 3 12 3C8.13401 3 5 6.13401 5 10C5 16 12 22 12 22Z"
        stroke="#FF6B8A" stroke-width="2"/>
  <circle cx="12" cy="10" r="3" stroke="#FF6B8A" stroke-width="2"/>
</svg>
```

#### Clock/Time Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#6B6572" stroke-width="2"/>
  <path d="M12 6V12L16 14" stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Price/Money Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#4ECDC4" stroke-width="2"/>
  <path d="M12 6V18M15 9C15 9 14 8 12 8C10 8 9 9.5 9 10.5C9 11.5 10 12 12 12.5C14 13 15 13.5 15 14.5C15 15.5 14 17 12 17C10 17 9 16 9 16"
        stroke="#4ECDC4" stroke-width="2" stroke-linecap="round"/>
</svg>
```

---

## 8. Safety & Trust Icons

### 8.1 Safety Features

#### Emergency/SOS Button
```svg
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="24" cy="24" r="22" fill="#FF5757" stroke="#FF5757" stroke-width="4"/>
  <text x="24" y="30" text-anchor="middle" font-family="SF Pro Display, system-ui" font-weight="700" font-size="16" fill="white">SOS</text>
</svg>
```

#### GPS/Crosshair Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="8" stroke="#4ECDC4" stroke-width="2"/>
  <circle cx="12" cy="12" r="3" fill="#4ECDC4"/>
  <path d="M12 2V6M12 18V22M2 12H6M18 12H22" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Shield/Safety Center Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L4 6V11C4 16.5 7.5 21.5 12 22.5C16.5 21.5 20 16.5 20 11V6L12 2Z"
        stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 8V12M12 16V16.01" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Support/Headset Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 13V11C4 6.58172 7.58172 3 12 3C16.4183 3 20 6.58172 20 11V13"
        stroke="#FF6B8A" stroke-width="2"/>
  <rect x="2" y="13" width="4" height="6" rx="2" stroke="#FF6B8A" stroke-width="2"/>
  <rect x="18" y="13" width="4" height="6" rx="2" stroke="#FF6B8A" stroke-width="2"/>
  <path d="M20 19C20 20.1046 19.1046 21 18 21H14" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Lock/Secure Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="10" width="16" height="12" rx="2" stroke="#4ECDC4" stroke-width="2"/>
  <path d="M8 10V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10"
        stroke="#4ECDC4" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="15" r="2" fill="#4ECDC4"/>
</svg>
```

#### Eye/Privacy Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12C22 12 18.5 19 12 19C5.5 19 2 12 2 12Z"
        stroke="#6B6572" stroke-width="2"/>
  <circle cx="12" cy="12" r="3" stroke="#6B6572" stroke-width="2"/>
</svg>
```

### 8.2 Trust Indicators

#### Warning/Alert Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 3L22 20H2L12 3Z" stroke="#FFD93D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 10V14M12 17V17.01" stroke="#FFD93D" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Info Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#C9B1FF" stroke-width="2"/>
  <path d="M12 8V8.01M12 11V16" stroke="#C9B1FF" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Help/Question Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#6B6572" stroke-width="2"/>
  <path d="M9 9C9 7.5 10.5 6.5 12 6.5C13.5 6.5 15 7.5 15 9C15 10.5 13 11 12 12V14"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="17" r="1" fill="#6B6572"/>
</svg>
```

---

## 9. Communication Icons

### 9.1 Messaging

#### Send Message Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M22 2L11 13" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#FF6B8A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Attach File Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M21.5 12.5L12 22C9.5 24.5 5.5 24.5 3 22C0.5 19.5 0.5 15.5 3 13L14 2C15.5 0.5 18 0.5 19.5 2C21 3.5 21 6 19.5 7.5L8.5 18.5C7.5 19.5 6 19.5 5 18.5C4 17.5 4 16 5 15L14.5 5.5"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Voice Message/Microphone Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="9" y="2" width="6" height="12" rx="3" stroke="#6B6572" stroke-width="2"/>
  <path d="M5 10C5 13.866 8.13401 17 12 17C15.866 17 19 13.866 19 10"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round"/>
  <path d="M12 17V22M8 22H16" stroke="#6B6572" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Message Read (Double Check)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2 12L7 17L17 7" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7 12L12 17L22 7" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Message Sent (Single Check)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 12L10 17L20 7" stroke="#9B95A3" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

---

## 10. Finance & Payment Icons

#### Wallet Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="6" width="20" height="14" rx="2" stroke="#6B6572" stroke-width="2"/>
  <path d="M2 10H22" stroke="#6B6572" stroke-width="2"/>
  <circle cx="17" cy="14" r="2" fill="#6B6572"/>
  <path d="M6 6V4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V6" stroke="#6B6572" stroke-width="2"/>
</svg>
```

#### Credit Card Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="5" width="20" height="14" rx="2" stroke="#6B6572" stroke-width="2"/>
  <path d="M2 10H22" stroke="#6B6572" stroke-width="2"/>
  <path d="M6 15H10" stroke="#6B6572" stroke-width="2" stroke-linecap="round"/>
</svg>
```

#### Bank Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 21H21M4 18H20M5 10V18M9 10V18M15 10V18M19 10V18M3 10L12 3L21 10H3Z"
        stroke="#6B6572" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Withdraw (Arrow Down)
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="#4ECDC4" stroke-width="2"/>
  <path d="M12 7V17M12 17L8 13M12 17L16 13" stroke="#4ECDC4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

#### Receipt Icon
```svg
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 2V22L6 20L8 22L10 20L12 22L14 20L16 22L18 20L20 22V2L18 4L16 2L14 4L12 2L10 4L8 2L6 4L4 2Z"
        stroke="#6B6572" stroke-width="2" stroke-linejoin="round"/>
  <path d="M8 8H16M8 12H14M8 16H12" stroke="#6B6572" stroke-width="2" stroke-linecap="round"/>
</svg>
```

---

## 11. Implementation Guide

### 11.1 React Native SVG Setup

```bash
npm install react-native-svg
```

### 11.2 Icon Component Structure

```tsx
// components/icons/index.ts
export * from './HomeIcon';
export * from './SearchIcon';
export * from './CalendarIcon';
// ... export all icons

// components/icons/HomeIcon.tsx
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  active?: boolean;
}

export const HomeIcon = ({
  size = 24,
  color = '#9B95A3',
  active = false
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
      fill={active ? '#FF6B8A' : 'none'}
      stroke={active ? '#FF6B8A' : color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
```

### 11.3 Icon Wrapper Component

```tsx
// components/Icon.tsx
import * as Icons from './icons';

type IconName = keyof typeof Icons;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  active?: boolean;
}

export const Icon = ({ name, ...props }: IconProps) => {
  const IconComponent = Icons[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return <IconComponent {...props} />;
};

// Usage
<Icon name="HomeIcon" size={24} active={true} />
<Icon name="HeartIcon" color="#FF6B8A" />
```

### 11.4 Color Constants

```tsx
// constants/colors.ts
export const iconColors = {
  primary: '#FF6B8A',      // Rose Pink
  secondary: '#6B6572',    // Default
  tertiary: '#9B95A3',     // Muted
  inverse: '#FFFFFF',      // On dark bg
  success: '#4ECDC4',      // Teal
  warning: '#FFD93D',      // Yellow
  error: '#FF5757',        // Red
  info: '#C9B1FF',         // Lavender
  accent: '#FF8E72',       // Coral
};
```

---

## 12. Icon Checklist by Screen

### Splash/Onboarding
- [x] Logo mark (custom heart)
- [x] Shield/trust icon
- [x] Calendar icon
- [x] GPS/safety icon
- [x] Arrow right

### Login/Registration
- [x] Phone icon
- [x] Lock icon
- [x] Eye/eye-slash
- [x] Camera
- [x] Check

### Home/Discovery
- [x] Search icon
- [x] Bell notification
- [x] Filter funnel
- [x] Star rating
- [x] Heart favorite
- [x] Occasion icons
- [x] Online indicator
- [x] Verified badge

### Companion Profile
- [x] Back arrow
- [x] Heart
- [x] Share
- [x] Star
- [x] Calendar
- [x] Clock
- [x] MapPin
- [x] Chat
- [x] Shield badges

### Booking Flow
- [x] All occasion icons
- [x] Calendar
- [x] Clock
- [x] MapPin
- [x] Credit card
- [x] Lock secure

### Active Booking
- [x] SOS emergency
- [x] GPS crosshair
- [x] Chat
- [x] Phone
- [x] Check circle
- [x] Clock

### Chat
- [x] Back arrow
- [x] More options
- [x] Camera
- [x] Gallery
- [x] Send arrow
- [x] Check/double-check

### Profile/Settings
- [x] User
- [x] Credit card
- [x] MapPin
- [x] Heart
- [x] Shield
- [x] Lock
- [x] Bell
- [x] Help/question
- [x] Support headset

### Companion Dashboard
- [x] Wallet
- [x] Calendar
- [x] Check circle
- [x] Clock
- [x] MapPin
- [x] Edit pencil
- [x] Withdraw arrow
