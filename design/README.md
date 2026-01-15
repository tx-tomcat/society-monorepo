# Society Design Documentation

## Vietnam's First Trusted Companion Booking Platform

---

## Overview

This documentation package contains the complete design system and screen specifications for Society - a two-sided marketplace connecting Vietnamese professionals with verified companions for family events, weddings, Tet celebrations, and business occasions.

---

## Documentation Structure

```
/design
  README.md                    # This file - Overview and index
  SOCIETY_DESIGN_SYSTEM.md     # Complete design foundations
  USER_FLOWS.md                # User journeys and state machines
  INTERACTIONS_ANIMATIONS.md   # Micro-animations and gestures
  ICON_SPECIFICATIONS.md       # Icon library and usage
  IMPLEMENTATION_GUIDE.md      # Tailwind config and code examples

  /screens
    01_ONBOARDING_AUTH.md      # Screens 1-7: Splash to Registration
    02_CLIENT_SCREENS.md       # Screens 8-18: Client experience
    03_COMPANION_SCREENS.md    # Screens 19-24: Companion experience
    04_SAFETY_TRUST.md         # Screens 25-27: Safety features
```

---

## Quick Reference

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Rose Pink | #FF6B8A | Primary brand, CTAs, headers |
| Warm Coral | #FF8E72 | Secondary accents, gradients |
| Sunny Yellow | #FFD93D | Ratings, highlights, badges |
| Lavender | #C9B1FF | Soft accents, backgrounds |
| Success Teal | #4ECDC4 | Verified badges, online status |
| Warm White | #FFFBF7 | Page backgrounds |
| Soft Pink | #FFF0F3 | Card backgrounds |

### Typography

| Style | Size/Weight | Usage |
|-------|-------------|-------|
| Display | 36px/700 | Splash screens |
| H1 | 28px/700 | Screen titles |
| H2 | 22px/600 | Section headers |
| H3 | 18px/600 | Card titles |
| Body | 15px/400 | Default text |
| Caption | 12px/500 | Labels, timestamps |

### Screen Count

| Category | Screens | Count |
|----------|---------|-------|
| Onboarding & Auth | Splash, Welcome x3, Login, Registration x2 | 7 |
| Client Screens | Home to Notifications | 11 |
| Companion Screens | Dashboard to Profile Editor | 6 |
| Safety & Trust | Badges, Safety Center, Disputes | 3 |
| **Total** | | **27 screens** |

---

## Design Principles

### 1. Trust First
Every design decision reinforces safety and verification. Prominent badges, clear status indicators, and transparent processes build confidence.

### 2. Warm, Not Dating
Society facilitates professional companion services for social events - the aesthetic is warm and inviting but clearly positions this as a service platform, not a dating app.

### 3. Culturally Sensitive
Designs respect Vietnamese cultural values around family, "saving face", and social expectations. Copy and imagery reflect these nuances.

### 4. Mobile-First
All screens designed for mobile (375px base), with touch-friendly targets (44px minimum) and safe area considerations.

### 5. Rapid Implementation
Components use Tailwind CSS patterns, standard spacing (4px grid), and common UI patterns that developers can build quickly.

---

## Key Components

### Buttons
- **Primary**: Gradient background (rose to coral), full roundness, pink shadow
- **Secondary**: Outlined with rose-pink border
- **Ghost**: Text only, subtle hover state

### Cards
- **Companion Card**: 4:5 portrait, gradient overlay, verification badges, online indicator
- **Booking Card**: Date-grouped, status badge, companion info, price summary
- **Stats Card**: Dashboard metrics with trend indicators

### Badges
- **Verification**: Teal background, shield icon
- **Status**: Color-coded (pending/confirmed/active/completed)
- **Occasion Tags**: Outlined pills

### Navigation
- **Bottom Tab Bar**: 5 items, fill icons when active, pink accent
- **Top Header**: Back button, centered title, action icons

---

## User Flows

### Client Journey
1. Onboarding (3 slides)
2. Login/Register
3. Browse companions (Home/Search)
4. View profile and availability
5. Book (occasion, date, details)
6. Pay (escrow)
7. Active booking (GPS, chat, emergency)
8. Review

### Companion Journey
1. Apply (extended registration)
2. Verification (ID, selfie, photos)
3. Setup (bio, pricing, availability)
4. Receive requests
5. Accept/decline bookings
6. Complete service
7. Withdraw earnings

---

## Safety Features

### During Booking
- GPS check-in (every 30 minutes)
- In-app messaging
- Emergency button (SOS)
- Safe word detection
- 24/7 support access

### Trust Infrastructure
- ID verification (CCCD)
- Selfie liveness check
- zkTLS background verification
- Review/rating system
- Escrow payment protection

---

## Implementation Notes

### Font
- Primary: Be Vietnam Pro (supports Vietnamese characters)
- Fallback: System fonts

### Icons
- Library: Phosphor Icons (recommended)
- Sizes: 16/20/24px
- Weights: Regular (default), Fill (active)

### Animations
- Transitions: 200-300ms ease-out
- Micro-interactions: 150ms
- Loading: Skeleton shimmer
- Success: Lottie checkmark with confetti

### Accessibility
- Reduced motion support
- Focus indicators
- Screen reader announcements
- Touch targets 44px+

---

## Getting Started

### For Designers
1. Review `SOCIETY_DESIGN_SYSTEM.md` for foundations
2. Reference screen files for specific layouts
3. Use `INTERACTIONS_ANIMATIONS.md` for motion specs

### For Developers
1. Start with `IMPLEMENTATION_GUIDE.md` for Tailwind config
2. Use component code examples as starting points
3. Reference `ICON_SPECIFICATIONS.md` for icon setup
4. Follow `USER_FLOWS.md` for navigation logic

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial design system and all 27 screens |

---

## Contact

Questions about the design system? Reach out to the design team or check the implementation guide for technical details.
