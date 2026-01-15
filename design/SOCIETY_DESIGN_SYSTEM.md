# Society Design System
## Vietnam's First Trusted Companion Booking Platform

---

# 1. DESIGN FOUNDATIONS

## 1.1 Brand Philosophy

Society is a platform that helps Vietnamese professionals navigate social expectations with dignity and grace. Our design must feel:
- **Trustworthy** - Clear, verified, safe
- **Warm** - Friendly, not transactional
- **Premium** - Quality service, not cheap
- **Culturally Sensitive** - Respectful of Vietnamese family values
- **Professional** - Companion service, NOT dating app

Key Differentiator: We are facilitating meaningful social support, not romantic connections.

---

## 1.2 Color Palette

### Primary Colors
```css
/* Rose Pink - Primary Brand Color */
--rose-pink: #FF6B8A;
--rose-pink-light: #FF8FA6;
--rose-pink-dark: #E5526F;
--rose-pink-10: rgba(255, 107, 138, 0.1);
--rose-pink-20: rgba(255, 107, 138, 0.2);

/* Warm Coral - Secondary Accent */
--warm-coral: #FF8E72;
--warm-coral-light: #FFA891;
--warm-coral-dark: #E57558;
```

### Accent Colors
```css
/* Sunny Yellow - Ratings, Highlights, Badges */
--sunny-yellow: #FFD93D;
--sunny-yellow-light: #FFE270;
--sunny-yellow-dark: #E5C235;

/* Lavender - Soft Accents, Backgrounds */
--lavender: #C9B1FF;
--lavender-light: #DED0FF;
--lavender-dark: #A890E5;
--lavender-10: rgba(201, 177, 255, 0.1);

/* Success Teal - Verified, Online, Trust */
--success-teal: #4ECDC4;
--success-teal-light: #7EDAD4;
--success-teal-dark: #3AB5AC;
```

### Neutral Colors
```css
/* Warm Whites & Backgrounds */
--warm-white: #FFFBF7;
--soft-pink: #FFF0F3;
--card-bg: #FFFFFF;

/* Text Colors */
--text-primary: #2D2A32;
--text-secondary: #6B6572;
--text-tertiary: #9B95A3;
--text-disabled: #C4C0CA;
--text-inverse: #FFFFFF;

/* Border & Divider */
--border-light: #F0ECF3;
--border-default: #E5E1E9;
--divider: #F5F2F7;
```

### Semantic Colors
```css
/* Status Colors */
--success: #4ECDC4;
--warning: #FFB84D;
--error: #FF6B6B;
--info: #6B8AFF;

/* Booking Status */
--status-pending: #FFD93D;
--status-confirmed: #4ECDC4;
--status-active: #FF6B8A;
--status-completed: #9B95A3;
--status-cancelled: #FF6B6B;
```

### Gradient Definitions
```css
/* Primary Gradient - CTAs, Headers */
--gradient-primary: linear-gradient(135deg, #FF6B8A 0%, #FF8E72 100%);

/* Warm Gradient - Cards, Highlights */
--gradient-warm: linear-gradient(135deg, #FF8E72 0%, #FFD93D 100%);

/* Soft Gradient - Backgrounds */
--gradient-soft: linear-gradient(180deg, #FFF0F3 0%, #FFFBF7 100%);

/* Trust Gradient - Verification */
--gradient-trust: linear-gradient(135deg, #4ECDC4 0%, #6B8AFF 100%);

/* Premium Gradient - Special badges */
--gradient-premium: linear-gradient(135deg, #C9B1FF 0%, #FF8FA6 100%);
```

---

## 1.3 Typography

### Font Family
```css
/* Primary Font - Vietnamese Support Essential */
--font-primary: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;

/* Alternative if needed */
--font-secondary: 'Inter', sans-serif;
```

### Type Scale
```css
/* Display - Splash screens, major headers */
--text-display: 700 36px/44px var(--font-primary);
letter-spacing: -0.02em;

/* H1 - Screen titles */
--text-h1: 700 28px/36px var(--font-primary);
letter-spacing: -0.01em;

/* H2 - Section headers */
--text-h2: 600 22px/28px var(--font-primary);

/* H3 - Card titles, important text */
--text-h3: 600 18px/24px var(--font-primary);

/* H4 - Subtitles */
--text-h4: 600 16px/22px var(--font-primary);

/* Body Large - Featured text */
--text-body-lg: 400 16px/24px var(--font-primary);

/* Body - Default text */
--text-body: 400 15px/22px var(--font-primary);

/* Body Small - Secondary content */
--text-body-sm: 400 14px/20px var(--font-primary);

/* Caption - Labels, timestamps */
--text-caption: 500 12px/16px var(--font-primary);

/* Tiny - Badges, tags */
--text-tiny: 600 10px/14px var(--font-primary);
letter-spacing: 0.02em;
```

### Font Weights
```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

---

## 1.4 Spacing System

Based on 4px grid, using Tailwind conventions:

```css
--space-0: 0px;
--space-0.5: 2px;
--space-1: 4px;
--space-1.5: 6px;
--space-2: 8px;
--space-2.5: 10px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-14: 56px;
--space-16: 64px;
--space-20: 80px;
```

### Usage Guidelines
- **Tight (4px)**: Between related elements, icon-text gaps
- **Default (8px)**: Standard element spacing
- **Medium (16px)**: Card padding, section gaps
- **Large (24px)**: Between sections
- **XL (32px)**: Major section dividers
- **Hero (48px+)**: Splash screens, major headers

---

## 1.5 Border Radius

```css
--radius-none: 0px;
--radius-sm: 4px;      /* Small buttons, tags */
--radius-md: 8px;      /* Inputs, small cards */
--radius-lg: 12px;     /* Cards, modals */
--radius-xl: 16px;     /* Large cards */
--radius-2xl: 20px;    /* Bottom sheets */
--radius-3xl: 24px;    /* Special containers */
--radius-full: 9999px; /* Pills, avatars */
```

---

## 1.6 Shadows & Elevation

```css
/* Subtle - Cards at rest */
--shadow-sm: 0px 1px 2px rgba(45, 42, 50, 0.04),
             0px 2px 4px rgba(45, 42, 50, 0.02);

/* Default - Elevated cards */
--shadow-md: 0px 2px 4px rgba(45, 42, 50, 0.04),
             0px 4px 8px rgba(45, 42, 50, 0.04);

/* Prominent - Active states, floating elements */
--shadow-lg: 0px 4px 8px rgba(45, 42, 50, 0.04),
             0px 8px 16px rgba(45, 42, 50, 0.06);

/* Heavy - Modals, bottom sheets */
--shadow-xl: 0px 8px 16px rgba(45, 42, 50, 0.06),
             0px 16px 32px rgba(45, 42, 50, 0.08);

/* Colored shadows for CTAs */
--shadow-pink: 0px 4px 12px rgba(255, 107, 138, 0.3);
--shadow-teal: 0px 4px 12px rgba(78, 205, 196, 0.3);
```

---

## 1.7 Layout Grid

### Mobile Grid (375px base)
```css
--grid-columns: 4;
--grid-margin: 20px;
--grid-gutter: 16px;
```

### Tablet Grid (768px+)
```css
--grid-columns: 8;
--grid-margin: 32px;
--grid-gutter: 24px;
```

### Safe Areas
```css
--safe-area-top: env(safe-area-inset-top, 44px);
--safe-area-bottom: env(safe-area-inset-bottom, 34px);
```

---

# 2. COMPONENT LIBRARY

## 2.1 Buttons

### Primary Button
```
Style: Solid gradient background
Background: var(--gradient-primary)
Text: var(--text-inverse), var(--font-semibold)
Size: Height 52px, Padding 24px horizontal
Border Radius: var(--radius-full)
Shadow: var(--shadow-pink)

States:
- Default: As above
- Pressed: scale(0.98), shadow reduced
- Disabled: opacity 0.5, no shadow
- Loading: Spinner replaces text

Tailwind:
bg-gradient-to-r from-rose-pink to-warm-coral text-white font-semibold
h-13 px-6 rounded-full shadow-pink
active:scale-[0.98] disabled:opacity-50
```

### Secondary Button
```
Style: Outlined
Background: transparent
Border: 2px solid var(--rose-pink)
Text: var(--rose-pink), var(--font-semibold)
Size: Height 52px, Padding 24px horizontal
Border Radius: var(--radius-full)

States:
- Default: As above
- Pressed: Background var(--rose-pink-10)
- Disabled: opacity 0.5

Tailwind:
bg-transparent border-2 border-rose-pink text-rose-pink font-semibold
h-13 px-6 rounded-full
active:bg-rose-pink/10 disabled:opacity-50
```

### Ghost Button
```
Style: Text only with hover state
Background: transparent
Text: var(--rose-pink), var(--font-semibold)
Size: Height 44px, Padding 16px horizontal

States:
- Default: As above
- Pressed: Background var(--rose-pink-10)

Tailwind:
bg-transparent text-rose-pink font-semibold
h-11 px-4 rounded-lg
active:bg-rose-pink/10
```

### Icon Button
```
Size Options:
- Small: 36px x 36px, icon 18px
- Medium: 44px x 44px, icon 22px
- Large: 52px x 52px, icon 26px

Variants:
- Filled: bg-rose-pink text-white
- Outlined: border border-border-default text-text-secondary
- Ghost: bg-transparent text-text-secondary

Border Radius: var(--radius-full)
```

### Button Sizes
```css
/* Large - Primary CTAs */
--btn-lg: height 52px, text 16px, padding 24px;

/* Medium - Secondary actions */
--btn-md: height 44px, text 15px, padding 20px;

/* Small - Tertiary, inline */
--btn-sm: height 36px, text 14px, padding 16px;
```

---

## 2.2 Input Fields

### Text Input
```
Style: Filled with border on focus
Background: var(--soft-pink)
Border: none (default), 2px solid var(--rose-pink) (focus)
Text: var(--text-primary)
Placeholder: var(--text-tertiary)
Size: Height 52px, Padding 16px
Border Radius: var(--radius-lg)

States:
- Default: bg soft-pink
- Focus: border rose-pink, bg white
- Error: border error, bg white
- Disabled: opacity 0.5

Label: Above input, var(--text-caption), var(--text-secondary)
Helper Text: Below input, var(--text-caption)
Error Text: Below input, var(--text-caption), var(--error)

Tailwind:
bg-soft-pink border-2 border-transparent rounded-lg h-13 px-4
text-text-primary placeholder:text-text-tertiary
focus:bg-white focus:border-rose-pink focus:outline-none
```

### Search Input
```
Style: Rounded with icon
Background: var(--soft-pink)
Border Radius: var(--radius-full)
Height: 44px
Left Icon: Search (20px), var(--text-tertiary)
Right: Clear button on content

Tailwind:
bg-soft-pink rounded-full h-11 pl-11 pr-10
```

### Textarea
```
Style: Multi-line input
Background: var(--soft-pink)
Min Height: 100px
Padding: 16px
Border Radius: var(--radius-lg)
Resize: vertical only
```

### Dropdown / Select
```
Style: Similar to text input with chevron
Right Icon: ChevronDown (20px)
Opens: Bottom sheet on mobile
```

---

## 2.3 Cards

### Companion Card (Discovery)
```
Layout:
- Aspect ratio: 4:5 (portrait)
- Image covers full card with gradient overlay at bottom
- Content at bottom over overlay

Structure:
┌─────────────────────────────┐
│                             │
│      [Companion Photo]      │
│                             │
│  ┌─ Online indicator (teal) │
│  │                          │
│  ▼ Gradient Overlay ────────│
│  [Verified Badge]           │
│  Nguyen Minh Thu, 26        │
│  ★ 4.9 (127 reviews)        │
│  From 800,000₫/2hr          │
│  [Wedding] [Family]         │
└─────────────────────────────┘

Specifications:
- Card Radius: var(--radius-xl)
- Shadow: var(--shadow-md)
- Image: object-fit cover
- Gradient: linear-gradient(transparent 40%, rgba(0,0,0,0.7) 100%)
- Online dot: 10px, var(--success-teal), positioned top-right
- Name: var(--text-h3), white
- Rating: var(--text-body-sm), var(--sunny-yellow) for star
- Price: var(--text-body-sm), white
- Tags: var(--text-tiny), pill bg white/20

Tailwind:
relative overflow-hidden rounded-xl shadow-md
aspect-[4/5] bg-gray-100
```

### Companion Card (Horizontal)
```
Layout:
┌────────────────────────────────────┐
│ ┌──────┐  Nguyen Minh Thu          │
│ │Photo │  ★ 4.9 · 127 reviews      │
│ │80x80 │  From 800,000₫/2hr        │
│ │      │  [Verified] [Online]      │
│ └──────┘                     [→]   │
└────────────────────────────────────┘

Specifications:
- Card Radius: var(--radius-lg)
- Shadow: var(--shadow-sm)
- Background: white
- Padding: 12px
- Photo: 80px, radius-lg
- Gap: 12px
```

### Booking Card
```
Layout:
┌────────────────────────────────────┐
│ [Status Badge: Upcoming]           │
│                                    │
│ ┌──────┐  Wedding Companion        │
│ │Photo │  with Nguyen Minh Thu     │
│ │64x64 │                           │
│ └──────┘  📅 Dec 24, 2024          │
│           ⏰ 2:00 PM - 6:00 PM     │
│           📍 District 7, HCMC      │
│                                    │
│ ─────────────────────────────────  │
│ 3,200,000₫           [View Details]│
└────────────────────────────────────┘

Specifications:
- Background: white
- Radius: var(--radius-lg)
- Shadow: var(--shadow-sm)
- Padding: 16px
- Status Badge: Appropriate color per status
```

### Stats Card (Dashboard)
```
Layout:
┌──────────────────┐
│ 📊               │
│ Total Earnings   │
│ 12,500,000₫      │
│ +15% this month  │
└──────────────────┘

Specifications:
- Background: var(--gradient-soft)
- Radius: var(--radius-lg)
- Padding: 16px
- Icon: 24px, var(--rose-pink)
- Label: var(--text-caption), var(--text-secondary)
- Value: var(--text-h2), var(--text-primary)
- Change: var(--text-caption), var(--success-teal) or var(--error)
```

---

## 2.4 Badges & Tags

### Verification Badge
```
Style: Pill with icon
Background: var(--success-teal)
Text: white, var(--text-tiny)
Icon: ShieldCheck (12px)
Padding: 4px 8px
Radius: var(--radius-full)

Variants:
- ID Verified: teal bg, "ID Verified"
- zkTLS Verified: gradient-trust bg, "zkTLS Verified"
- Background Checked: teal bg, "Background Checked"
```

### Status Badge
```
Variants:
- Pending: bg sunny-yellow/20, text sunny-yellow-dark
- Confirmed: bg success-teal/20, text success-teal-dark
- Active: bg rose-pink/20, text rose-pink-dark
- Completed: bg text-tertiary/20, text text-secondary
- Cancelled: bg error/20, text error

Size: Padding 6px 10px, text-tiny
Radius: var(--radius-sm)
```

### Occasion Tag
```
Style: Outlined pill
Border: 1px solid var(--border-default)
Background: white
Text: var(--text-secondary), var(--text-caption)
Padding: 6px 12px
Radius: var(--radius-full)

Selected State:
Border: 1px solid var(--rose-pink)
Background: var(--rose-pink-10)
Text: var(--rose-pink)
```

### Rating Badge
```
Style: Star with number
Icon: Star filled, var(--sunny-yellow)
Text: var(--text-body-sm), var(--text-primary)
Format: "★ 4.9"
```

### Online Indicator
```
Style: Dot
Size: 10px
Color: var(--success-teal)
Border: 2px solid white
Position: Absolute, overlapping avatar
Animation: Subtle pulse
```

---

## 2.5 Navigation

### Bottom Tab Bar
```
Layout:
┌────────────────────────────────────┐
│  🏠      🔍      📅      💬      👤  │
│ Home   Search  Bookings  Chat  Profile│
└────────────────────────────────────┘

Specifications:
- Background: white
- Height: 56px + safe-area-bottom
- Shadow: 0px -2px 10px rgba(0,0,0,0.05)
- Items: 5 equal columns
- Icon: 24px
- Label: var(--text-tiny)
- Active: var(--rose-pink)
- Inactive: var(--text-tertiary)
- Active indicator: Dot below icon, var(--rose-pink)
```

### Top Navigation Bar
```
Style: Clean with optional back button

Layout (Standard):
┌────────────────────────────────────┐
│ [←]      Screen Title        [⚙️]  │
└────────────────────────────────────┘

Layout (Search):
┌────────────────────────────────────┐
│ [←]  [   🔍 Search...      ]  [⚡] │
└────────────────────────────────────┘

Specifications:
- Height: 56px
- Background: var(--warm-white) or transparent
- Title: var(--text-h4), center
- Icons: 24px, var(--text-primary)
- Padding: 0 16px
```

### Segmented Control / Tabs
```
Layout:
┌────────────────────────────────────┐
│ [  Upcoming  ] [ Active ] [ Past ] │
└────────────────────────────────────┘

Specifications:
- Background: var(--soft-pink)
- Radius: var(--radius-full)
- Height: 44px
- Padding: 4px
- Segment Radius: var(--radius-full)
- Active: bg white, shadow-sm, text-primary
- Inactive: bg transparent, text-secondary
```

---

## 2.6 Avatars

### Size Variants
```css
--avatar-xs: 32px;  /* Inline mentions */
--avatar-sm: 40px;  /* List items */
--avatar-md: 56px;  /* Cards */
--avatar-lg: 80px;  /* Profile headers */
--avatar-xl: 120px; /* Profile pages */
```

### Avatar with Verification
```
Structure:
┌─────────┐
│  Photo  │ ← Rounded full
│         │
└────[✓]──┘ ← Verification badge overlay (bottom-right)

Badge: 18px circle, teal bg, white checkmark
```

### Avatar with Online Status
```
Structure:
┌─────────┐
│  Photo  │ ← Rounded full
│         │
└──────[●]┘ ← Green dot (top-right or bottom-right)
```

---

## 2.7 Modals & Bottom Sheets

### Bottom Sheet
```
Specifications:
- Background: white
- Top Radius: var(--radius-2xl)
- Handle: 40px x 4px, var(--border-default), centered, top 8px
- Padding: 24px
- Max Height: 90% screen
- Animation: Slide up, 300ms ease-out

Handle Indicator:
- Width: 40px, Height: 4px
- Background: var(--border-default)
- Radius: full
- Margin: 8px auto 16px
```

### Modal Dialog
```
Specifications:
- Background: white
- Radius: var(--radius-xl)
- Padding: 24px
- Max Width: calc(100% - 48px)
- Shadow: var(--shadow-xl)
- Overlay: rgba(45, 42, 50, 0.5)
- Animation: Fade in + scale from 0.95, 200ms
```

### Alert Dialog
```
Structure:
┌────────────────────────────────────┐
│              [Icon]                │
│                                    │
│           Alert Title              │
│                                    │
│    Description text goes here      │
│    and can span multiple lines.    │
│                                    │
│  [Secondary]          [Primary]    │
└────────────────────────────────────┘

Icon Size: 48px
Title: var(--text-h3), center
Description: var(--text-body), center, var(--text-secondary)
Button Layout: Horizontal, gap 12px
```

---

## 2.8 Lists & Cells

### Standard List Item
```
Layout:
┌────────────────────────────────────┐
│ [Icon]  Title Text            [→]  │
│         Subtitle text              │
└────────────────────────────────────┘

Specifications:
- Height: Auto (min 56px)
- Padding: 16px
- Icon: 24px, left
- Chevron: 20px, right, var(--text-tertiary)
- Divider: 1px, var(--divider), inset 56px left
```

### Settings List Item
```
Layout:
┌────────────────────────────────────┐
│ [Icon]  Setting Name        [Toggle]│
│         Description text           │
└────────────────────────────────────┘
```

---

## 2.9 Form Elements

### Toggle Switch
```
Specifications:
- Track Size: 51px x 31px
- Track Off: var(--border-default)
- Track On: var(--success-teal)
- Thumb: 27px circle, white, shadow-sm
- Transition: 200ms ease
```

### Checkbox
```
Specifications:
- Size: 22px
- Border: 2px solid var(--border-default)
- Radius: var(--radius-sm)
- Checked: bg rose-pink, white checkmark
- Transition: 150ms
```

### Radio Button
```
Specifications:
- Size: 22px
- Border: 2px solid var(--border-default)
- Selected: Border rose-pink, inner dot rose-pink (12px)
```

### Slider
```
Specifications:
- Track Height: 4px
- Track Color: var(--border-default)
- Fill Color: var(--rose-pink)
- Thumb: 24px circle, white, shadow-md
```

---

## 2.10 Feedback Components

### Toast / Snackbar
```
Layout:
┌────────────────────────────────────┐
│ [✓]  Booking confirmed!    [Dismiss]│
└────────────────────────────────────┘

Specifications:
- Background: var(--text-primary)
- Text: white
- Radius: var(--radius-lg)
- Padding: 12px 16px
- Shadow: var(--shadow-lg)
- Position: Bottom, 16px from edges
- Duration: 3-4 seconds
- Animation: Slide up + fade
```

### Loading States
```
Spinner:
- Size: 24px (inline), 40px (full screen)
- Color: var(--rose-pink)
- Animation: Rotate 360deg, 1s linear infinite

Skeleton:
- Background: var(--soft-pink)
- Shimmer: linear-gradient animation
- Radius: Match content it replaces

Pull to Refresh:
- Indicator: Spinner, rose-pink
- Background: var(--soft-pink)
```

### Empty States
```
Structure:
┌────────────────────────────────────┐
│                                    │
│         [Illustration]             │
│                                    │
│        No Bookings Yet             │
│                                    │
│   Start by finding the perfect     │
│   companion for your next event    │
│                                    │
│      [Browse Companions]           │
│                                    │
└────────────────────────────────────┘

Illustration: 120px, soft colors
Title: var(--text-h3)
Description: var(--text-body), var(--text-secondary)
```

---

## 2.11 Special Components

### Emergency Button (Active Booking)
```
Style: Prominent SOS button
Background: var(--error)
Size: 56px circle
Icon: Phone/SOS, white, 28px
Shadow: 0px 4px 16px rgba(255, 107, 107, 0.4)
Position: Fixed, bottom-right, above tab bar

Interaction:
- Tap: Shows emergency options sheet
- Long press (3s): Direct call to emergency
- Haptic: Heavy impact on press
```

### GPS Check-in Card
```
Layout:
┌────────────────────────────────────┐
│ 📍 GPS Check-in                    │
│                                    │
│ You're at: Gem Center, D7          │
│ Last updated: 2 min ago            │
│                                    │
│ [Check in Again]                   │
│                                    │
│ ⓘ Location shared with support     │
└────────────────────────────────────┘

Border: 2px dashed var(--success-teal)
Background: var(--success-teal)/5
```

### Verification Progress
```
Layout:
┌────────────────────────────────────┐
│ Verification Status                │
│                                    │
│ ✓ Phone Verified      ━━━━━━━━━━━  │
│ ✓ ID Uploaded         ━━━━━━━━━━━  │
│ ◐ ID Review           ━━━━━━━░░░░  │
│ ○ Background Check    ░░░░░░░░░░░  │
│                                    │
│ 65% Complete                       │
└────────────────────────────────────┘
```

### Price Display
```
Format: Vietnamese Dong
Symbol: ₫ (suffix)
Grouping: Period for thousands (1.200.000₫)
Display: var(--text-h3) for main price

Example:
"800.000₫" - Small
"1.200.000₫" - Large bookings
"From 800.000₫/2hr" - With duration
```

### Rating Display
```
Full Rating:
★ ★ ★ ★ ★  4.9 (127 reviews)

Compact:
★ 4.9 · 127 reviews

Stars: var(--sunny-yellow) for filled
       var(--border-default) for empty
```

---

## 2.12 Iconography

### Icon Style
- Source: Phosphor Icons (recommended) or Heroicons
- Weight: Regular for UI, Fill for active states
- Size: 20px (default), 24px (navigation), 28px (featured)
- Color: Inherits from text color

### Core Icons Needed
```
Navigation:
- home, search, calendar, chat, user

Actions:
- plus, minus, edit, trash, share, download
- heart, heart-fill, star, star-fill
- check, x, arrow-left, arrow-right
- chevron-down, chevron-right

Status:
- shield-check (verified)
- map-pin (location)
- clock (time)
- currency-circle-dollar (payment)
- warning (alert)
- info (information)

Communication:
- chat-circle, phone, video-camera
- bell, bell-ringing

Safety:
- warning-circle (emergency)
- lock (secure)
- eye, eye-slash (visibility)
- gps (location sharing)
```

---

# 3. SCREEN SPECIFICATIONS

## Screen Index

### Onboarding & Authentication
1. Splash Screen
2. Welcome Screen 1 - Trust
3. Welcome Screen 2 - Events
4. Welcome Screen 3 - Safety
5. Login Screen
6. Client Registration Flow
7. Companion Registration Flow

### Client Screens
8. Home / Discovery
9. Search & Filters
10. Companion Profile
11. Booking Flow
12. Booking Confirmation & Payment
13. Active Booking
14. My Bookings
15. Chat Interface
16. Post-Booking Review
17. Client Profile & Settings
18. Notifications

### Companion Screens
19. Companion Dashboard
20. Calendar / Availability
21. Incoming Requests
22. Active Service
23. Earnings & Withdrawal
24. Profile Editor

### Safety & Trust
25. Verification Badges
26. Safety Center
27. Dispute Resolution

---
