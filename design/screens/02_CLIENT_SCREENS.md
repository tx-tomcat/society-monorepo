# Society - Client Screens

---

## Screen 8: Home / Discovery

### Purpose
Main landing screen for clients to discover and browse companions.

### Layout
```
┌─────────────────────────────────────┐
│ ░░░░░░░ Safe Area ░░░░░░░░░░░░░░░░ │
├─────────────────────────────────────┤
│                                     │
│  Hi, Minh! 👋           [🔔] [👤]  │
│  Find your perfect companion        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔍 Search companions...     │    │
│  └─────────────────────────────┘    │
│                                     │
│  What's the occasion?               │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ 💒  │ │ 👨‍👩‍👧 │ │ 🧧  │ │ 💼  │   │
│  │Wed- │ │Fam- │ │ Tet │ │Busi-│   │
│  │ding │ │ily  │ │     │ │ness │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
│  Top Rated ──────────── See All >   │
│                                     │
│  ┌──────────┐ ┌──────────┐          │
│  │          │ │          │          │
│  │ [Photo]  │ │ [Photo]  │  ←Scroll │
│  │          │ │          │          │
│  │ ● Online │ │          │          │
│  │──────────│ │──────────│          │
│  │ ✓ Minh T.│ │ ✓ Lan P. │          │
│  │ ★4.9(127)│ │ ★4.8(89) │          │
│  │ 400k₫/hr │ │ 350k₫/hr │          │
│  │[Wedding] │ │[Family]  │          │
│  └──────────┘ └──────────┘          │
│                                     │
│  Available This Week ─── See All >  │
│                                     │
│  ┌──────────┐ ┌──────────┐          │
│  │          │ │          │          │
│  │ [Photo]  │ │ [Photo]  │          │
│  │          │ │          │          │
│  └──────────┘ └──────────┘          │
│                                     │
│  Near You (District 1) ─ See All >  │
│                                     │
│  ┌──────────┐ ┌──────────┐          │
│  │ [Card]   │ │ [Card]   │          │
│  └──────────┘ └──────────┘          │
│                                     │
├─────────────────────────────────────┤
│  🏠      🔍      📅      💬     👤  │
│ Home   Search Bookings  Chat  Profile│
└─────────────────────────────────────┘
```

### Specifications

**Header Section**
```
Layout: Row, space-between
Left:
  - Greeting: "Hi, [Name]!" var(--text-h3)
  - Subtitle: "Find your perfect companion" var(--text-body-sm), var(--text-secondary)
Right:
  - Notification bell: 24px icon, badge if unread
  - Profile avatar: 36px, circular

Background: var(--warm-white)
Padding: 20px horizontal, 16px vertical
```

**Search Bar**
```
Style: Pill search input
Background: var(--soft-pink)
Height: 48px
Radius: var(--radius-full)
Icon: Search, 20px, left, var(--text-tertiary)
Placeholder: "Search companions..."
Tap: Navigates to full search screen
```

**Occasion Categories**
```
Layout: Horizontal scroll, 4 visible
Item Size: 72px width
Structure:
  - Icon container: 56px circle, var(--soft-pink) bg
  - Icon: 28px emoji or custom icon
  - Label: var(--text-caption), center
  - Active: Icon container has rose-pink border

Categories:
  - 💒 Wedding
  - 👨‍👩‍👧 Family
  - 🧧 Tet
  - 💼 Business
  - 🎉 Party (scroll to see)
  - ☕ Coffee (scroll to see)

Tap: Opens filtered search
```

**Section Headers**
```
Layout: Row, space-between
Title: var(--text-h4), var(--text-primary)
See All: var(--text-body-sm), var(--rose-pink), tappable
Padding: 16px top, 8px bottom
```

**Companion Cards (Discovery Style)**
```
Layout: Horizontal scroll
Card Width: 160px
Card Aspect: 4:5
Gap: 12px
Padding: 20px horizontal (first/last)

Card Structure:
- Full-bleed photo with gradient overlay
- Online indicator: Top-right, green dot
- Verified badge: Small teal badge with checkmark
- Name: var(--text-h4), white
- Rating: Star + number, yellow star
- Price: "From [amount]/hr", var(--text-body-sm)
- Tags: Occasion pills, white bg/20

Shadow: var(--shadow-md)
Radius: var(--radius-xl)
```

**Content Sections**
```
Sections in order:
1. Top Rated - Highest rated companions
2. Available This Week - Calendar-based
3. Near You - Location-based
4. New to Society - Recently verified
5. For Weddings - Occasion filter
6. For Family Events - Occasion filter
```

**Bottom Tab Bar**
- See Component Library specs
- Home tab active (rose-pink)

### Interactions
- Pull to refresh: Updates all sections
- Scroll: Horizontal per section, vertical for page
- Card tap: Opens Companion Profile
- Category tap: Opens filtered search
- Search tap: Opens Search screen
- See All tap: Opens full list view

### Loading State
```
Skeleton cards:
- Same dimensions as companion cards
- Shimmer animation
- 2 visible per section
```

### Empty States
```
If no companions available:
- Illustration of sad companion
- "No companions available right now"
- "Check back soon or adjust your filters"
- [Adjust Filters] button
```

---

## Screen 9: Search & Filters

### Purpose
Advanced search with multiple filter options.

### Layout
```
┌─────────────────────────────────────┐
│ [←]     Search           [Clear All]│
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔍 Search by name...     [×]│    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ Occasion    Date    Location ▼ │ │
│  └────────────────────────────────┘ │
│                                     │
│  Active Filters:                    │
│  [Wedding ×] [Dec 24 ×] [D7 ×]      │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Showing 24 companions              │
│  [Grid 田]  [List 三]    [Sort ▼]   │
│                                     │
│  ┌──────────┐ ┌──────────┐          │
│  │ [Card]   │ │ [Card]   │          │
│  │          │ │          │          │
│  │          │ │          │          │
│  └──────────┘ └──────────┘          │
│                                     │
│  ┌──────────┐ ┌──────────┐          │
│  │ [Card]   │ │ [Card]   │          │
│  │          │ │          │          │
│  │          │ │          │          │
│  └──────────┘ └──────────┘          │
│                                     │
│  ┌──────────┐ ┌──────────┐          │
│  │ [Card]   │ │ [Card]   │          │
│  └──────────┘ └──────────┘          │
│                                     │
├─────────────────────────────────────┤
│        [🎚️ More Filters]            │
└─────────────────────────────────────┘
```

### Specifications

**Search Header**
```
Background: white
Search Input:
  - Full width minus back button
  - Auto-focus on entry
  - Clear button when has content
  - Keyboard: Default with search key
```

**Quick Filter Tabs**
```
Layout: Horizontal tabs, scrollable
Style: Segmented control appearance
Options: Occasion, Date, Location, Price, Rating
Active: Underline var(--rose-pink)
Tap: Opens respective filter bottom sheet
```

**Active Filters Display**
```
Layout: Horizontal scroll of chips
Chip Style:
  - Background: var(--rose-pink-10)
  - Text: var(--rose-pink)
  - X icon: Right side, tappable to remove
  - Radius: var(--radius-full)
Padding: 6px 12px
```

**Results Header**
```
Layout: Row with controls
Left: "Showing X companions"
Right: View toggle + Sort dropdown
View Toggle:
  - Grid (2 columns) - Default
  - List (full width cards)
```

**Sort Options (Bottom Sheet)**
```
Options:
- Recommended (default)
- Highest Rated
- Price: Low to High
- Price: High to Low
- Most Reviews
- Nearest
- Recently Active
```

**Results Grid**
```
Grid View:
  - 2 columns
  - Gap: 12px
  - Card: Discovery style (compact)

List View:
  - Full width
  - Horizontal card layout
  - More details visible
```

**More Filters FAB**
```
Position: Bottom center, above tab bar
Style: Secondary button
Icon: Sliders
Text: "More Filters"
Opens: Full filter bottom sheet
```

### Filter Bottom Sheet (Full)

### Layout
```
┌─────────────────────────────────────┐
│ ─────                               │
│                                     │
│  Filters               [Reset All]  │
│                                     │
│  Occasion                           │
│  ○ Wedding  ○ Family  ○ Tet         │
│  ○ Business ○ Party   ○ Coffee      │
│                                     │
│  Date                               │
│  ┌─────────────────────────────┐    │
│  │ Select date(s)          [📅]│    │
│  └─────────────────────────────┘    │
│                                     │
│  Location                           │
│  ┌─────────────────────────────┐    │
│  │ District 7, HCMC        [📍]│    │
│  └─────────────────────────────┘    │
│                                     │
│  Price Range                        │
│  200k ━━━━━━━●━━━━━━━●━━━━ 1M      │
│  300,000₫ - 700,000₫ / hour        │
│                                     │
│  Rating                             │
│  [Any] [4.0+] [4.5+] [4.8+]        │
│                                     │
│  Gender                             │
│  [Any] [Female] [Male] [Other]     │
│                                     │
│  Availability                       │
│  □ Available now                    │
│  □ Instant booking only            │
│                                     │
│  Languages                          │
│  [Vietnamese ✓] [English] [Other]  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Show 24 Results           │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Occasion Selection**
- Type: Multi-select chips
- Style: Outlined, filled when selected

**Date Selection**
- Type: Calendar picker
- Allows: Single date or range
- Shows: Available companions count per day

**Location Selection**
- Type: District/City selector
- Hierarchy: City > District
- Option: Use current location

**Price Range**
- Type: Dual-thumb slider
- Min: 200,000₫
- Max: 1,000,000₫
- Step: 50,000₫
- Display: Selected range below

**Rating Filter**
- Type: Single-select chips
- Options: Any, 4.0+, 4.5+, 4.8+

**Show Results Button**
- Shows real-time count
- Updates as filters change
- Disabled if 0 results

---

## Screen 10: Companion Profile

### Purpose
Detailed view of a companion with booking capability.

### Layout
```
┌─────────────────────────────────────┐
│ [←]                    [♡] [Share] │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │                                 ││
│  │        [Main Photo]             ││
│  │                                 ││
│  │                                 ││
│  │  ● ○ ○ ○ ○  (gallery dots)     ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ✓ ID Verified │ ● Online       ││
│  └─────────────────────────────────┘│
│                                     │
│  Nguyen Minh Thu, 26                │
│  ★ 4.9 (127 reviews) · HCMC        │
│                                     │
│  "Friendly, professional companion  │
│  for your family events. I love..." │
│  [Read more]                        │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Services                           │
│  [Wedding] [Family] [Tet] [Business]│
│                                     │
│  Languages                          │
│  🇻🇳 Vietnamese · 🇬🇧 English         │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Pricing                            │
│  ┌─────────────────────────────────┐│
│  │ Hourly          400,000₫/hr    ││
│  │ Half Day (4hr)  1,400,000₫     ││
│  │ Full Day (8hr)  2,500,000₫     ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Availability                       │
│  ┌─────────────────────────────────┐│
│  │    December 2024                ││
│  │ Su Mo Tu We Th Fr Sa           ││
│  │  1  2  3  4  5 ●6  7           ││
│  │  8  9 10 11 12 13 14           ││
│  │ ○15 16 17 ●18 ●19 ●20 21       ││
│  │ 22 23 ●24 ●25 26 27 28         ││
│  │ 29 30 31                        ││
│  └─────────────────────────────────┘│
│  ● Available  ○ Limited            │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Reviews (127)          See All >   │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [Avatar] Tran Van A.            ││
│  │ ★★★★★  Wedding · Dec 2024      ││
│  │                                 ││
│  │ "Thu was amazing! Made my       ││
│  │ family so comfortable..."       ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [Avatar] Le Thi B.              ││
│  │ ★★★★★  Family · Nov 2024       ││
│  │                                 ││
│  │ "Professional and kind..."      ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  About                              │
│                                     │
│  Interests                          │
│  [Reading] [Travel] [Cooking]       │
│                                     │
│  Education                          │
│  University of Economics HCMC       │
│                                     │
│  Response Time                      │
│  Usually responds within 1 hour     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  From 400,000₫/hr                   │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      Check Availability      │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │       💬 Message             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Photo Gallery**
```
Type: Horizontal swipe gallery
Aspect: 4:3 or full width
Height: 375px
Indicators: Dots at bottom
Gestures: Swipe left/right, tap to fullscreen
```

**Verification Badges**
```
Layout: Horizontal row of badges
Badge Style: Pill with icon
- ID Verified: Teal, shield-check icon
- Background Checked: Teal, clipboard-check icon
- zkTLS Verified: Gradient, lock icon
- Online: Green dot + "Online" text
```

**Name & Rating**
```
Name: var(--text-h1)
Age: After comma, same style
Rating: Star icon (yellow) + number + review count
Location: var(--text-body-sm), var(--text-secondary)
```

**Bio Section**
```
Font: var(--text-body)
Max Lines: 3 initially
Read More: Expands full text
Background: var(--soft-pink) card
Padding: 16px
Radius: var(--radius-lg)
```

**Services Tags**
```
Layout: Flex wrap
Style: Outlined chips
Color: var(--border-default) border, var(--text-secondary) text
```

**Pricing Table**
```
Background: white
Border: 1px solid var(--border-light)
Radius: var(--radius-lg)
Rows:
  - Label left, price right
  - Divider between rows
  - Best value badge on packages (optional)
```

**Availability Calendar**
```
Type: Month view, compact
Available Days: Rose pink filled dot
Limited: Rose pink outline dot
Unavailable: Gray, no indicator
Navigation: Swipe or arrows for months
```

**Reviews Section**
```
Review Card:
  - Avatar: 40px
  - Name: var(--text-h4)
  - Rating: 5 stars inline
  - Occasion + Date: var(--text-caption), var(--text-tertiary)
  - Text: var(--text-body-sm), max 3 lines
  - Background: white
  - Padding: 16px
  - Gap: 12px between cards
```

**Sticky Footer**
```
Position: Fixed bottom
Background: white
Shadow: 0 -4px 12px rgba(0,0,0,0.05)
Padding: 16px 20px + safe area
Content:
  - Price: "From [amount]/hr" left side
  - Primary CTA: "Check Availability"
  - Secondary CTA: "Message" icon button
```

### Interactions
- Photo tap: Fullscreen gallery
- Heart: Add to favorites
- Share: Native share sheet
- Check Availability: Opens booking flow
- Message: Opens chat with companion
- Review card tap: Full review view
- Calendar date tap: Opens booking for that date

---

## Screen 11: Booking Flow

### Purpose
Multi-step booking process with occasion, date/time, and details.

### Step 1: Select Occasion

### Layout
```
┌─────────────────────────────────────┐
│ [×]      Book Companion             │
├─────────────────────────────────────┤
│                                     │
│  Step 1 of 3                        │
│  ━━━━━━━░░░░░░░░░░░                 │
│                                     │
│  What's the occasion?               │
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │  💒  Wedding                    ││
│  │                                 ││
│  │  Companion for wedding events,  ││
│  │  family introductions           ││
│  │                              [○]││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │  👨‍👩‍👧  Family Gathering           ││
│  │                                 ││
│  │  Meet the parents, family       ││
│  │  dinners, celebrations          ││
│  │                              [○]││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │  🧧  Tet / Holiday              ││
│  │                                 ││
│  │  Lunar New Year visits,         ││
│  │  holiday gatherings             ││
│  │                              [○]││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │  💼  Business Event             ││
│  │                                 ││
│  │  Corporate events, networking   ││
│  │                              [○]││
│  └─────────────────────────────────┘│
│                                     │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │          Continue               ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Specifications

**Occasion Cards**
```
Style: Selectable cards
Background: white
Border: 2px solid var(--border-light)
Selected Border: 2px solid var(--rose-pink)
Selected Background: var(--rose-pink-10)
Radius: var(--radius-lg)
Padding: 16px

Content:
  - Icon: 32px emoji or icon
  - Title: var(--text-h3)
  - Description: var(--text-body-sm), var(--text-secondary)
  - Radio indicator: Right side
```

---

### Step 2: Date & Time

### Layout
```
┌─────────────────────────────────────┐
│ [←]      Book Companion             │
├─────────────────────────────────────┤
│                                     │
│  Step 2 of 3                        │
│  ━━━━━━━━━━━━░░░░░░                 │
│                                     │
│  When do you need a companion?      │
│                                     │
│  ┌─────────────────────────────────┐│
│  │      < December 2024 >          ││
│  │                                 ││
│  │  Su  Mo  Tu  We  Th  Fr  Sa    ││
│  │   1   2   3   4   5   6   7    ││
│  │   8   9  10  11  12  13  14    ││
│  │  15  16  17  18  19  20  21    ││
│  │  22  23 [24] 25  26  27  28    ││
│  │  29  30  31                     ││
│  │                                 ││
│  │ ● Available  ○ Limited  - Busy  ││
│  └─────────────────────────────────┘│
│                                     │
│  Selected: Tuesday, Dec 24, 2024    │
│                                     │
│  Duration                           │
│  ┌────────────────────────────────┐ │
│  │ [2hr] [4hr] [8hr] [Custom]     │ │
│  └────────────────────────────────┘ │
│                                     │
│  Start Time                         │
│  ┌─────────────────────────────────┐│
│  │  2:00 PM                    [▼] ││
│  └─────────────────────────────────┘│
│                                     │
│  End Time                           │
│  6:00 PM                            │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Price Summary                      │
│  4 hours × 400,000₫      1,600,000₫│
│  Service fee (18%)         288,000₫│
│  ─────────────────────────────      │
│  Total                   1,888,000₫│
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │          Continue               ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Specifications

**Calendar**
```
Style: Full month view
Available: Rose pink text, tappable
Limited: Rose pink outline, tappable
Unavailable: Gray text, not tappable
Selected: Rose pink filled circle background
Today: Outline indicator
```

**Duration Selector**
```
Type: Segmented control
Options: 2hr, 4hr (Half Day), 8hr (Full Day), Custom
Custom: Opens hour picker
```

**Time Picker**
```
Type: Bottom sheet time picker
Format: 12-hour with AM/PM
Intervals: 30 minutes
Constraints: Within companion's availability
```

**Price Summary**
```
Background: var(--soft-pink)
Radius: var(--radius-lg)
Padding: 16px
Line Items:
  - Base: Duration x Rate
  - Service Fee: 18% clearly shown
  - Total: var(--text-h3), bold
```

---

### Step 3: Additional Details

### Layout
```
┌─────────────────────────────────────┐
│ [←]      Book Companion             │
├─────────────────────────────────────┤
│                                     │
│  Step 3 of 3                        │
│  ━━━━━━━━━━━━━━━━━━━                │
│                                     │
│  Tell us more about your event      │
│                                     │
│  Event Location                     │
│  ┌─────────────────────────────────┐│
│  │ Enter address or venue      [📍]││
│  └─────────────────────────────────┘│
│                                     │
│  Event Details (Optional)           │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │ Share any details that would    ││
│  │ help your companion prepare...  ││
│  │                                 ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                           0/500     │
│                                     │
│  Suggestions:                       │
│  [Dress code: Formal]               │
│  [Meeting my parents]               │
│  [Need to know family names]        │
│                                     │
│  Special Requests                   │
│  □ Companion should drive           │
│  □ Photography assistance needed    │
│  □ Gift suggestions welcome         │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Pickup Option                      │
│  ○ I'll pick up companion           │
│  ○ Companion comes to venue         │
│  ○ Meet at venue                    │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │      Review Booking             ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Specifications

**Location Input**
```
Type: Address autocomplete
Integration: Google Places or local API
Icon: Map pin, opens map picker
```

**Event Details**
```
Type: Textarea
Placeholder: Contextual based on occasion
Max Length: 500 characters
Counter: Bottom right
```

**Quick Suggestions**
```
Type: Tappable chips
Action: Appends to textarea
Style: Outlined, var(--lavender) background
```

**Special Requests**
```
Type: Checkboxes
Options vary by occasion type
```

**Pickup Options**
```
Type: Radio buttons
Default: Meet at venue
```

---

## Screen 12: Booking Confirmation & Payment

### Purpose
Review booking details and process secure payment.

### Layout
```
┌─────────────────────────────────────┐
│ [←]      Confirm Booking            │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [Photo]  Nguyen Minh Thu        ││
│  │  64x64   ★ 4.9 · Verified      ││
│  └─────────────────────────────────┘│
│                                     │
│  Booking Details                    │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │  📅 Tuesday, December 24, 2024  ││
│  │                                 ││
│  │  ⏰ 2:00 PM - 6:00 PM (4 hours) ││
│  │                                 ││
│  │  💒 Wedding Companion           ││
│  │                                 ││
│  │  📍 Gem Center, District 7      ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Payment Summary                    │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │  Service (4hr × 400,000₫)      ││
│  │                     1,600,000₫  ││
│  │                                 ││
│  │  Service Fee (18%)              ││
│  │                       288,000₫  ││
│  │                                 ││
│  │  ───────────────────────────   ││
│  │  Total              1,888,000₫  ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  🔒 Secure Payment                  │
│                                     │
│  How escrow works:                  │
│  ┌─────────────────────────────────┐│
│  │ 1. Payment held securely        ││
│  │ 2. Released after service       ││
│  │ 3. Full refund if cancelled     ││
│  │    24hrs before                 ││
│  └─────────────────────────────────┘│
│                                     │
│  Payment Method                     │
│  ┌─────────────────────────────────┐│
│  │ [💳]  •••• 4242          [>]   ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [📱]  MoMo Wallet        [>]   ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [🏦]  Bank Transfer      [>]   ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  □ I agree to the Terms of Service  │
│    and Cancellation Policy          │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │    Pay 1,888,000₫               ││
│  └─────────────────────────────────┘│
│                                     │
│  🔒 Secured by Society Escrow       │
└─────────────────────────────────────┘
```

### Specifications

**Companion Summary**
```
Style: Compact card
Photo: 64px, rounded
Name: var(--text-h3)
Rating + Verified: var(--text-body-sm)
```

**Booking Details Card**
```
Background: var(--soft-pink)
Radius: var(--radius-lg)
Padding: 16px
Icons: 20px, var(--rose-pink)
Text: var(--text-body)
```

**Payment Summary**
```
Background: white
Border: 1px solid var(--border-light)
Line items clearly separated
Total: var(--text-h3), bold
```

**Escrow Explanation**
```
Style: Info card
Background: var(--success-teal)/10
Border: 1px solid var(--success-teal)/20
Icon: Shield or Lock
Text: var(--text-body-sm)
```

**Payment Methods**
```
Style: Selectable list items
Icons: Payment provider logos
Chevron: Right side
Selected: Checkmark or radio
Add New: "+ Add payment method" at bottom
```

**Terms Checkbox**
```
Required to proceed
Links: Underlined, tappable
```

**Pay Button**
```
Style: Primary, full width
Shows exact amount
Disabled until terms accepted
```

### Payment Processing

```
States:
1. Processing - Full screen overlay
   - Spinner
   - "Processing payment..."
   - Do not close warning

2. Success - Transition to confirmation
   - Checkmark animation
   - "Booking confirmed!"
   - Auto-navigate to booking details

3. Failed - Error state
   - Error message
   - Try again button
   - Alternative payment option
```

---

## Screen 13: Active Booking

### Purpose
Real-time view during an active booking with safety features.

### Layout
```
┌─────────────────────────────────────┐
│        Active Booking               │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │      🟢 SERVICE IN PROGRESS     ││
│  │                                 ││
│  │      2:45:30 remaining          ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [Photo]  Nguyen Minh Thu        ││
│  │  80x80   💬 Message    📞 Call  ││
│  │                                 ││
│  │  Wedding Companion              ││
│  │  Gem Center, District 7         ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  📍 GPS Check-in                    │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │      [Map Preview]              ││
│  │                                 ││
│  │  Last check-in: 5 min ago       ││
│  │  Location: Gem Center           ││
│  │                                 ││
│  │      [📍 Check In Now]          ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Booking Timeline                   │
│                                     │
│  ✓ 2:00 PM  Booking started        │
│  ✓ 2:05 PM  GPS check-in           │
│  ● 2:30 PM  Reminder sent          │
│  ○ 6:00 PM  Scheduled end          │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Need Help?                         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │  [🛡️]  Safety Center            ││
│  │         Emergency contacts       ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │  [💬]  Contact Support          ││
│  │         24/7 available          ││
│  └─────────────────────────────────┘│
│                                     │
│                                     │
│                            [🆘]     │
│                         Emergency   │
│                                     │
├─────────────────────────────────────┤
│  🏠      🔍      📅      💬     👤  │
└─────────────────────────────────────┘
```

### Specifications

**Status Banner**
```
Background: var(--gradient-primary)
Text: White
Status: "SERVICE IN PROGRESS"
Timer: Large countdown
Pulse: Subtle animation on status dot
```

**Companion Card**
```
Style: Prominent with actions
Actions:
  - Message: Opens chat
  - Call: In-app or direct call
Photo: 80px with online indicator
```

**GPS Check-in Section**
```
Map: Small preview, tappable
Style:
  - Border: 2px dashed var(--success-teal)
  - Background: var(--success-teal)/5
Check-in Button:
  - Updates location
  - Shows timestamp
  - Companion sees matching check-in
```

**Timeline**
```
Style: Vertical timeline
Completed: Green check, filled
Current: Rose pink dot, pulsing
Upcoming: Gray circle, unfilled
```

**Emergency Button**
```
Position: Fixed, bottom-right
Style:
  - 56px red circle
  - SOS or warning icon
  - Shadow with red glow
Interaction:
  - Tap: Opens emergency options
  - Long press (3s): Direct emergency call
Haptic: Heavy impact
```

### Emergency Bottom Sheet
```
┌─────────────────────────────────────┐
│ ─────                               │
│                                     │
│  🆘 Emergency Options               │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [📞] Call Emergency (113)       ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [👤] Call Emergency Contact     ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [💬] Alert Society Support      ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [📍] Share Live Location        ││
│  └─────────────────────────────────┘│
│                                     │
│          [Cancel]                   │
│                                     │
└─────────────────────────────────────┘
```

---

## Screen 14: My Bookings

### Purpose
View all bookings across different states.

### Layout
```
┌─────────────────────────────────────┐
│          My Bookings                │
├─────────────────────────────────────┤
│                                     │
│  ┌────────────────────────────────┐ │
│  │[Upcoming] [Active] [Past]      │ │
│  └────────────────────────────────┘ │
│                                     │
│  Upcoming Bookings (2)              │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ┌────────┐                      ││
│  │ │ STATUS │  CONFIRMED           ││
│  │ └────────┘                      ││
│  │                                 ││
│  │ [Photo]  Wedding Companion      ││
│  │  64x64   with Nguyen Minh Thu   ││
│  │                                 ││
│  │  📅 Dec 24, 2024                ││
│  │  ⏰ 2:00 PM - 6:00 PM           ││
│  │  📍 District 7, HCMC            ││
│  │                                 ││
│  │  ────────────────────────────   ││
│  │  1,888,000₫      [View Details] ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ ┌────────┐                      ││
│  │ │ STATUS │  PENDING             ││
│  │ └────────┘                      ││
│  │                                 ││
│  │ [Photo]  Family Gathering       ││
│  │  64x64   with Le Thi Lan        ││
│  │                                 ││
│  │  📅 Dec 31, 2024                ││
│  │  ⏰ 6:00 PM - 10:00 PM          ││
│  │  📍 District 1, HCMC            ││
│  │                                 ││
│  │  ────────────────────────────   ││
│  │  1,200,000₫       [Cancel]      ││
│  └─────────────────────────────────┘│
│                                     │
│                                     │
├─────────────────────────────────────┤
│  🏠      🔍      📅      💬     👤  │
└─────────────────────────────────────┘
```

### Tab Content Variations

**Upcoming Tab**
- Shows confirmed and pending bookings
- Sorted by date (nearest first)
- Actions: View Details, Cancel (if within policy), Message

**Active Tab**
- Shows currently in-progress bookings
- Prominent display with timer
- Quick actions: Open active view, Message, Emergency

**Past Tab**
- Shows completed and cancelled bookings
- Status badge indicates outcome
- Actions: View Details, Leave Review (if not done), Rebook

### Booking Card States

**Pending**
```
Badge: Yellow, "PENDING"
Note: "Waiting for companion confirmation"
Actions: Cancel
```

**Confirmed**
```
Badge: Teal, "CONFIRMED"
Countdown: "In 3 days"
Actions: View Details, Message, Add to Calendar
```

**Active**
```
Badge: Rose pink, "ACTIVE"
Timer: Remaining time
Actions: View Active Booking
```

**Completed**
```
Badge: Gray, "COMPLETED"
Review CTA if not reviewed
Actions: View Details, Leave Review, Rebook
```

**Cancelled**
```
Badge: Red outline, "CANCELLED"
Shows who cancelled
Shows refund status
```

### Empty States

**No Upcoming Bookings**
```
Illustration: Calendar with sparkles
Title: "No upcoming bookings"
Subtitle: "Find a companion for your next event"
CTA: [Browse Companions]
```

**No Past Bookings**
```
Illustration: History clock
Title: "No booking history yet"
Subtitle: "Your completed bookings will appear here"
```

---

## Screen 15: Chat Interface

### Purpose
Messaging between client and companion.

### Layout
```
┌─────────────────────────────────────┐
│ [←]  Nguyen Minh Thu      [⋮]      │
│       ● Online                      │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 📅 Booking: Dec 24, Wedding     ││
│  │    2:00 PM - 6:00 PM            ││
│  └─────────────────────────────────┘│
│                                     │
│                     ┌──────────────┐│
│                     │ Hi! I saw    ││
│                     │ your booking ││
│                     │ request.     ││
│                     │ Happy to help││
│                     │ with your    ││
│                     │ wedding! 😊  ││
│                     │      2:30 PM ││
│                     └──────────────┘│
│                                     │
│  ┌──────────────┐                   │
│  │ Great! Could │                   │
│  │ you tell me  │                   │
│  │ about the    │                   │
│  │ dress code?  │                   │
│  │ 2:32 PM  ✓✓  │                   │
│  └──────────────┘                   │
│                                     │
│                     ┌──────────────┐│
│                     │ Of course!   ││
│                     │ Semi-formal  ││
│                     │ is perfect.  ││
│                     │ I have some  ││
│                     │ ao dai       ││
│                     │ options 👗   ││
│                     │      2:35 PM ││
│                     └──────────────┘│
│                                     │
│                     ┌──────────────┐│
│                     │   [Photo]    ││
│                     │              ││
│                     │      2:36 PM ││
│                     └──────────────┘│
│                                     │
│  ┌──────────────┐                   │
│  │ That looks   │                   │
│  │ perfect! 👍  │                   │
│  │ 2:38 PM  ✓✓  │                   │
│  └──────────────┘                   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [📷] [Type a message...    ] [➤]  │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Header**
```
Back Button: Returns to chat list or booking
Name: var(--text-h4)
Status: Online dot + "Online" or "Last seen X"
More Menu: Report, Block, View Profile
```

**Booking Context Banner**
```
Position: Pinned below header
Background: var(--soft-pink)
Info: Date, occasion, time
Tappable: Opens booking details
```

**Message Bubbles**

```
Sent (Right side):
  - Background: var(--rose-pink)
  - Text: white
  - Radius: 16px, 16px, 4px, 16px
  - Max Width: 75%
  - Timestamp: Bottom right, small, white/70
  - Read Receipt: ✓✓ (double check)

Received (Left side):
  - Background: white
  - Text: var(--text-primary)
  - Radius: 16px, 16px, 16px, 4px
  - Border: 1px solid var(--border-light)
  - Max Width: 75%
  - Timestamp: Bottom right, small, var(--text-tertiary)
```

**Image Messages**
```
Max Width: 240px
Radius: Same as bubble
Tap: Opens fullscreen viewer
Loading: Skeleton shimmer
```

**Input Area**
```
Background: white
Border Top: 1px solid var(--border-light)
Padding: 12px 16px + safe area

Attachment Button:
  - 40px icon button
  - Opens: Camera, Gallery, File options

Text Input:
  - Flexible height (max 4 lines)
  - Placeholder: "Type a message..."
  - Background: var(--soft-pink)
  - Radius: var(--radius-full)

Send Button:
  - 40px circle
  - Background: var(--rose-pink)
  - Icon: Arrow/Send, white
  - Disabled: When empty
```

**Safety Features**
```
- No personal contact info sharing detection
- Warning if trying to share phone/email
- All chats logged for safety
- Report message option on long-press
```

### Chat List Screen
```
┌─────────────────────────────────────┐
│          Messages                   │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [●Avatar]  Nguyen Minh Thu      ││
│  │   48px    That looks perfect!   ││
│  │            2:38 PM    [●] 2     ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [Avatar]   Le Thi Lan           ││
│  │   48px    See you tomorrow!     ││
│  │            Yesterday            ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘

Online indicator: Green dot on avatar
Unread count: Rose pink badge
Unread row: Bold name, bg soft-pink
```

---

## Screen 16: Post-Booking Review

### Purpose
Submit rating and review after booking completion.

### Layout
```
┌─────────────────────────────────────┐
│ [×]     Leave a Review              │
├─────────────────────────────────────┤
│                                     │
│        ┌──────────────┐             │
│        │   [Photo]    │             │
│        │    80x80     │             │
│        └──────────────┘             │
│                                     │
│        Nguyen Minh Thu              │
│        Wedding · Dec 24, 2024       │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  How was your experience?           │
│                                     │
│        ☆   ☆   ☆   ☆   ☆           │
│                                     │
│  Tap to rate                        │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  What went well? (Optional)         │
│                                     │
│  [Professional] [Punctual]          │
│  [Friendly] [Great conversation]    │
│  [Well-dressed] [Made family happy] │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Write a review                     │
│  ┌─────────────────────────────────┐│
│  │                                 ││
│  │ Share your experience to help   ││
│  │ others find great companions... ││
│  │                                 ││
│  │                                 ││
│  │                                 ││
│  └─────────────────────────────────┘│
│                           25/500    │
│                                     │
│  □ Post anonymously (first name     │
│    initial only: M.)                │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Add Photos (Optional)              │
│  ┌─────┐ ┌─────┐ ┌─────┐           │
│  │ [+] │ │     │ │     │           │
│  └─────┘ └─────┘ └─────┘           │
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────────┐│
│  │       Submit Review             ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Specifications

**Rating Stars**
```
Size: 40px each
Gap: 16px
Empty: var(--border-default) outline
Filled: var(--sunny-yellow) solid
Animation: Scale pop on selection
```

**Quick Tags**
```
Type: Multi-select chips
Style: Outlined, filled when selected
Background Selected: var(--rose-pink-10)
Border Selected: var(--rose-pink)
```

**Review Text**
```
Type: Textarea
Min Length: None (optional)
Max Length: 500 characters
Placeholder: Context-aware prompt
```

**Anonymous Option**
```
Checkbox with explanation
Shows preview of how name appears
```

**Photo Upload**
```
Optional photos from the event
Max: 3 photos
Guidelines: No faces without consent
```

**Submission**
- Requires rating (1-5 stars)
- Text and photos optional
- Thank you screen after submission

---

## Screen 17: Client Profile & Settings

### Purpose
Manage personal profile, preferences, and app settings.

### Layout
```
┌─────────────────────────────────────┐
│          Profile                    │
├─────────────────────────────────────┤
│                                     │
│        ┌──────────────┐             │
│        │   [Photo]    │  [Edit]     │
│        │    100x100   │             │
│        └──────────────┘             │
│                                     │
│        Tran Van Minh                │
│        +84 912 345 678              │
│        Client since Dec 2024        │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Account                            │
│  ┌─────────────────────────────────┐│
│  │ [👤]  Edit Profile          [>]││
│  ├─────────────────────────────────┤│
│  │ [💳]  Payment Methods       [>]││
│  ├─────────────────────────────────┤│
│  │ [📍]  Saved Addresses       [>]││
│  ├─────────────────────────────────┤│
│  │ [♡]   Favorites             [>]││
│  └─────────────────────────────────┘│
│                                     │
│  Safety                             │
│  ┌─────────────────────────────────┐│
│  │ [🛡️]  Safety Center         [>]││
│  ├─────────────────────────────────┤│
│  │ [👥]  Emergency Contacts    [>]││
│  ├─────────────────────────────────┤│
│  │ [🔒]  Privacy Settings      [>]││
│  └─────────────────────────────────┘│
│                                     │
│  Preferences                        │
│  ┌─────────────────────────────────┐│
│  │ [🔔]  Notifications         [>]││
│  ├─────────────────────────────────┤│
│  │ [🌐]  Language              [>]││
│  └─────────────────────────────────┘│
│                                     │
│  Support                            │
│  ┌─────────────────────────────────┐│
│  │ [❓]  Help Center           [>]││
│  ├─────────────────────────────────┤│
│  │ [💬]  Contact Support       [>]││
│  ├─────────────────────────────────┤│
│  │ [⭐]  Rate Society          [>]││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │        Sign Out                 ││
│  └─────────────────────────────────┘│
│                                     │
│  Version 1.0.0                      │
│                                     │
├─────────────────────────────────────┤
│  🏠      🔍      📅      💬     👤  │
└─────────────────────────────────────┘
```

### Specifications

**Profile Header**
```
Avatar: 100px, circular, editable
Edit Button: Overlay on avatar or beside
Name: var(--text-h2)
Phone: var(--text-body-sm), var(--text-secondary)
Member Since: var(--text-caption), var(--text-tertiary)
```

**Settings Groups**
```
Background: white
Radius: var(--radius-lg)
Dividers: 1px var(--border-light)
Icon: 24px, var(--rose-pink)
Chevron: 20px, var(--text-tertiary)
Tap feedback: bg var(--soft-pink)
```

**Sign Out Button**
```
Style: Ghost/text button
Color: var(--error)
Confirmation: Alert dialog
```

---

## Screen 18: Notifications

### Purpose
View all app notifications and alerts.

### Layout
```
┌─────────────────────────────────────┐
│ [←]      Notifications      [⚙️]   │
├─────────────────────────────────────┤
│                                     │
│  Today                              │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [🔔]  Booking Confirmed!        ││
│  │       Your booking with Minh    ││
│  │       Thu is confirmed for      ││
│  │       Dec 24, 2024              ││
│  │                        2:30 PM  ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [💬]  New Message               ││
│  │       Nguyen Minh Thu sent      ││
│  │       you a message             ││
│  │                        1:15 PM  ││
│  └─────────────────────────────────┘│
│                                     │
│  Yesterday                          │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [⭐]  Leave a Review            ││
│  │       How was your experience   ││
│  │       with Le Thi Lan?          ││
│  │                       11:00 AM  ││
│  └─────────────────────────────────┘│
│                                     │
│  This Week                          │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ [🎉]  Welcome to Society!       ││
│  │       Your account is ready.    ││
│  │       Start browsing...         ││
│  │                          Dec 20 ││
│  └─────────────────────────────────┘│
│                                     │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Notification Types**
```
Booking: Calendar icon, teal
Message: Chat icon, rose-pink
Review: Star icon, yellow
Promo: Gift icon, coral
System: Info icon, lavender
Safety: Shield icon, teal
```

**Notification Item**
```
Background: white (unread: soft-pink)
Padding: 16px
Icon: 24px in colored circle
Title: var(--text-h4)
Body: var(--text-body-sm), max 2 lines
Time: var(--text-caption), var(--text-tertiary)
Unread indicator: Rose pink dot
```

**Grouping**
```
Groups: Today, Yesterday, This Week, Earlier
Header: var(--text-caption), var(--text-secondary), uppercase
```

**Actions**
```
Tap: Navigate to relevant screen
Swipe Left: Delete / Mark read
Settings: Configure notification preferences
```

**Empty State**
```
Illustration: Bell with zzz
Title: "All caught up!"
Subtitle: "No new notifications"
```
