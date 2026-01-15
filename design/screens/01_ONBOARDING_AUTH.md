# Society - Onboarding & Authentication Screens

---

## Screen 1: Splash Screen

### Purpose
Initial app launch screen, establishes brand identity while loading.

### Layout
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│                                     │
│           ┌─────────┐               │
│           │ Society │               │
│           │  Logo   │               │
│           └─────────┘               │
│                                     │
│        Trusted Companions           │
│        for Life's Moments           │
│                                     │
│                                     │
│                                     │
│             [Loader]                │
│                                     │
│                                     │
└─────────────────────────────────────┘

Background: Gradient (Soft Pink to Warm White)
```

### Specifications

**Background**
```css
background: linear-gradient(180deg, #FFF0F3 0%, #FFFBF7 100%);
```

**Logo**
- Size: 80px x 80px
- Position: Center, 35% from top
- Style: Custom Society logo mark (heart + handshake symbol)
- Color: Rose Pink (#FF6B8A)

**Brand Name**
- Font: var(--text-display)
- Color: var(--text-primary)
- Text: "Society"
- Position: Below logo, 12px gap

**Tagline**
- Font: var(--text-body)
- Color: var(--text-secondary)
- Text: "Trusted Companions for Life's Moments"
- Position: Below brand name, 8px gap

**Loader**
- Type: Custom dots animation
- Colors: Rose Pink, Warm Coral, Sunny Yellow (cycling)
- Size: 8px dots, 16px spacing
- Position: Bottom third of screen
- Animation: Scale pulse, 1.2s staggered

**Timing**
- Minimum display: 2 seconds
- Maximum: Until app loads
- Transition: Fade out, 300ms

### Animation Sequence
1. Logo fades in (0-400ms)
2. Brand name slides up (200-600ms)
3. Tagline fades in (400-800ms)
4. Loader appears (800ms+)

---

## Screen 2: Welcome Screen 1 - Trust

### Purpose
First onboarding slide establishing trust and verification.

### Layout
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│      ┌───────────────────────┐      │
│      │                       │      │
│      │    [Illustration]     │      │
│      │   Shield with check   │      │
│      │   + happy faces       │      │
│      │                       │      │
│      └───────────────────────┘      │
│                                     │
│        Every Companion              │
│        is Verified                  │
│                                     │
│   ID verification, background       │
│   checks, and real reviews          │
│   from real families.               │
│                                     │
│            ● ○ ○                    │
│                                     │
│     [Skip]            [Next →]      │
│                                     │
└─────────────────────────────────────┘

Background: Warm White (#FFFBF7)
```

### Specifications

**Illustration Area**
- Size: 280px x 240px
- Position: Center, 100px from top (after safe area)
- Style: Soft, warm illustration
- Elements: Shield icon, verification checkmarks, diverse happy faces
- Colors: Rose Pink, Success Teal, Lavender accents

**Headline**
- Font: var(--text-h1)
- Color: var(--text-primary)
- Text: "Every Companion\nis Verified"
- Alignment: Center
- Position: 32px below illustration

**Description**
- Font: var(--text-body)
- Color: var(--text-secondary)
- Text: "ID verification, background checks, and real reviews from real families."
- Alignment: Center
- Max Width: 280px
- Position: 16px below headline

**Page Indicator**
- Style: Dots
- Active: 8px, Rose Pink, filled
- Inactive: 8px, var(--border-default), outline
- Spacing: 8px between dots
- Position: 40px below description

**Navigation**
- Position: Bottom, 32px padding, above safe area
- Layout: Space-between

**Skip Button**
- Style: Ghost button
- Text: "Skip"
- Color: var(--text-tertiary)

**Next Button**
- Style: Primary button (smaller, 44px height)
- Text: "Next →"
- Width: Auto (padding based)

### Interaction
- Swipe right: Previous (disabled on first)
- Swipe left: Next screen
- Skip: Goes to Login
- Next: Goes to Welcome 2

---

## Screen 3: Welcome Screen 2 - Events

### Purpose
Second onboarding slide showing use cases.

### Layout
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│      ┌───────────────────────┐      │
│      │                       │      │
│      │    [Illustration]     │      │
│      │  Calendar + events    │      │
│      │  Wedding, Family,     │      │
│      │  Tet celebration      │      │
│      │                       │      │
│      └───────────────────────┘      │
│                                     │
│        Perfect for Every            │
│        Occasion                     │
│                                     │
│   Weddings, family gatherings,      │
│   Tet celebrations, business        │
│   events - find the right match.    │
│                                     │
│            ○ ● ○                    │
│                                     │
│     [Skip]            [Next →]      │
│                                     │
└─────────────────────────────────────┘

Background: Warm White (#FFFBF7)
```

### Specifications

**Illustration**
- Style: Calendar with event icons floating
- Elements: Wedding rings, family icon, Tet symbols (mai flower, red envelope)
- Colors: Rose Pink, Warm Coral, Sunny Yellow
- Animation: Subtle floating elements

**Headline**
- Text: "Perfect for Every\nOccasion"

**Description**
- Text: "Weddings, family gatherings, Tet celebrations, business events - find the right match."

**Event Tags** (Optional enhancement)
- Show floating tags: "Wedding", "Family", "Tet", "Business"
- Style: Soft colored pills around illustration

---

## Screen 4: Welcome Screen 3 - Safety

### Purpose
Third onboarding slide emphasizing safety features.

### Layout
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│      ┌───────────────────────┐      │
│      │                       │      │
│      │    [Illustration]     │      │
│      │   Phone with GPS,     │      │
│      │   emergency button,   │      │
│      │   support chat        │      │
│      │                       │      │
│      └───────────────────────┘      │
│                                     │
│        Your Safety                  │
│        Comes First                  │
│                                     │
│   GPS check-ins, emergency          │
│   button, secure payments,          │
│   and 24/7 support team.            │
│                                     │
│            ○ ○ ●                    │
│                                     │
│                 [Get Started]       │
│                                     │
└─────────────────────────────────────┘

Background: Warm White (#FFFBF7)
```

### Specifications

**Illustration**
- Style: Phone mockup with safety features
- Elements: GPS pin, SOS button, shield, chat bubble
- Colors: Success Teal (primary), Rose Pink accents
- Animation: Pulsing GPS pin

**Headline**
- Text: "Your Safety\nComes First"

**Description**
- Text: "GPS check-ins, emergency button, secure payments, and 24/7 support team."

**CTA Button**
- Style: Primary button, full width (minus margins)
- Text: "Get Started"
- Height: 52px
- Position: Replaces Skip/Next pair
- Animation: Subtle pulse to draw attention

### Transition
- Tapping "Get Started" transitions to Login screen
- Use slide-left animation

---

## Screen 5: Login Screen

### Purpose
Authentication entry point for returning users.

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│                                     │
│           ┌─────────┐               │
│           │  Logo   │               │
│           └─────────┘               │
│                                     │
│        Welcome Back                 │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📱  Phone number            │    │
│  │     +84 |                   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🔒  Password                │    │
│  │     ••••••••          [👁]  │    │
│  └─────────────────────────────┘    │
│                                     │
│            Forgot Password?         │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Sign In             │    │
│  └─────────────────────────────┘    │
│                                     │
│        ─── Or continue with ───     │
│                                     │
│    [Google]    [Apple]    [Zalo]   │
│                                     │
│                                     │
│   Don't have an account? Sign Up    │
│                                     │
└─────────────────────────────────────┘

Background: Warm White (#FFFBF7)
```

### Specifications

**Header**
- Back button: 24px icon, left aligned, var(--text-primary)
- Shows on navigation from registration

**Logo**
- Size: 56px
- Position: Center, 32px below safe area
- Tappable: Goes to splash (Easter egg)

**Title**
- Font: var(--text-h1)
- Text: "Welcome Back"
- Color: var(--text-primary)
- Position: 24px below logo

**Phone Input**
- Label: "Phone number"
- Prefix: Country code selector (+84 default for Vietnam)
- Placeholder: "Enter your phone number"
- Keyboard: Phone pad
- Validation: Vietnamese phone format

**Password Input**
- Label: "Password"
- Type: Password with visibility toggle
- Right Icon: Eye/EyeSlash toggle
- Validation: Min 8 characters

**Forgot Password**
- Style: Text link
- Color: var(--rose-pink)
- Font: var(--text-body-sm)
- Position: Right-aligned below password, 8px gap

**Sign In Button**
- Style: Primary button, full width
- Text: "Sign In"
- State: Disabled until valid inputs
- Position: 24px below forgot password

**Divider**
- Style: Line with text
- Line: 1px var(--border-light)
- Text: "Or continue with"
- Font: var(--text-caption)
- Color: var(--text-tertiary)

**Social Login**
- Layout: 3 buttons, equal width, 12px gap
- Style: Outlined, 48px height
- Icons: Google, Apple, Zalo logos (24px)
- Radius: var(--radius-lg)

**Sign Up Link**
- Position: Bottom, above safe area
- Text: "Don't have an account? **Sign Up**"
- "Sign Up" is Rose Pink, tappable

### States

**Loading**
- Sign In button shows spinner
- Inputs disabled
- Social buttons disabled

**Error**
- Invalid phone: Red border, error message below
- Wrong password: Shake animation, error message
- Account not found: Error message, prompt to sign up

### Validation
```javascript
Phone: /^(\+84|0)[3|5|7|8|9][0-9]{8}$/
Password: min 8 chars
```

---

## Screen 6: Client Registration Flow

### 6.1 Phone Verification

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 1 of 4                  │
│        ━━━━━░░░░░░░░░░░░            │
│                                     │
│        Let's Get Started            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📱  Phone number            │    │
│  │     +84 |                   │    │
│  └─────────────────────────────┘    │
│                                     │
│   We'll send you a verification     │
│   code via SMS.                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      Send Verification      │    │
│  └─────────────────────────────┘    │
│                                     │
│   By continuing, you agree to our   │
│   Terms of Service & Privacy Policy │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Progress Bar**
- Style: Segmented bar, 4 segments
- Active: var(--rose-pink)
- Inactive: var(--border-light)
- Step text: var(--text-caption), var(--text-secondary)

**Title**
- Font: var(--text-h1)
- Text: "Let's Get Started"

**Helper Text**
- Font: var(--text-body-sm)
- Color: var(--text-secondary)
- Text: "We'll send you a verification code via SMS."

**Legal Text**
- Font: var(--text-caption)
- Color: var(--text-tertiary)
- Links: Rose Pink, underlined

---

### 6.2 OTP Verification

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 1 of 4                  │
│        ━━━━━░░░░░░░░░░░░            │
│                                     │
│        Enter Verification           │
│        Code                         │
│                                     │
│   We sent a code to +84 912 345 678 │
│                                     │
│       ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │
│       │  │ │  │ │  │ │  │ │  │ │  │ │
│       └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ │
│                                     │
│                                     │
│   Didn't receive code? Resend (45s) │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Verify              │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**OTP Input**
- Style: 6 individual boxes
- Box Size: 48px x 56px
- Font: var(--text-h2)
- Border: 2px solid var(--border-default)
- Focus: Border var(--rose-pink)
- Filled: Background var(--soft-pink)
- Radius: var(--radius-md)
- Spacing: 8px between boxes

**Resend**
- Initially: "Resend in 60s" (countdown)
- After timer: "Resend Code" (tappable, rose-pink)

**Auto-submit**
- Verify button activates on 6 digits
- Or auto-submit after small delay

---

### 6.3 Basic Information

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 2 of 4                  │
│        ━━━━━━━━━━░░░░░░░            │
│                                     │
│        Tell Us About                │
│        Yourself                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Full Name                   │    │
│  │ Enter your full name        │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Email (optional)            │    │
│  │ your@email.com              │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Date of Birth               │    │
│  │ DD / MM / YYYY          [📅]│    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Gender                      │    │
│  │ Select gender           [▼] │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Continue            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Name Input**
- Required field
- Validation: Min 2 characters, letters and spaces only

**Email Input**
- Optional
- Validation: Valid email format

**Date of Birth**
- Opens date picker (bottom sheet)
- Must be 18+
- Format: DD/MM/YYYY (Vietnamese standard)

**Gender**
- Options: Male, Female, Other, Prefer not to say
- Opens bottom sheet selector

---

### 6.4 Create Password

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 3 of 4                  │
│        ━━━━━━━━━━━━━━━░░░            │
│                                     │
│        Create a Secure              │
│        Password                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Password                    │    │
│  │ ••••••••              [👁]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Password strength: Strong ━━━━━━━  │
│                                     │
│  ✓ At least 8 characters            │
│  ✓ Contains a number                │
│  ✓ Contains uppercase               │
│  ○ Contains special character       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Confirm Password            │    │
│  │ ••••••••              [👁]  │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Continue            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Strength Indicator**
- Weak: Red, 1/4 bar
- Fair: Orange, 2/4 bar
- Good: Yellow, 3/4 bar
- Strong: Green, 4/4 bar

**Requirements Checklist**
- ✓ = Green checkmark, met
- ○ = Gray circle, not met
- Updates in real-time

**Confirm Password**
- Must match
- Error if mismatch

---

### 6.5 Profile Photo

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 4 of 4                  │
│        ━━━━━━━━━━━━━━━━━━━          │
│                                     │
│        Add a Profile                │
│        Photo                        │
│                                     │
│   This helps companions recognize   │
│   you when you meet.                │
│                                     │
│           ┌─────────────┐           │
│           │             │           │
│           │   [Camera]  │           │
│           │     📷      │           │
│           │             │           │
│           │  Tap to add │           │
│           └─────────────┘           │
│                                     │
│                                     │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      Complete Setup         │    │
│  └─────────────────────────────┘    │
│                                     │
│          Skip for now               │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Photo Upload Area**
- Size: 160px x 160px
- Border: 2px dashed var(--border-default)
- Radius: var(--radius-full)
- Icon: Camera, 48px, var(--text-tertiary)
- Text: "Tap to add", var(--text-body-sm)

**Options on Tap**
- Bottom sheet with:
  - Take Photo
  - Choose from Library
  - Cancel

**After Photo Added**
- Shows circular crop of photo
- Overlay edit button (bottom-right)
- Option to remove/change

**Skip**
- Style: Ghost text link
- Goes to home with default avatar

---

## Screen 7: Companion Registration Flow

### 7.1 Role Selection (If coming from generic signup)

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│                                     │
│        How would you like           │
│        to use Society?              │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   [👤]  I'm Looking for     │    │
│  │         a Companion         │    │
│  │                             │    │
│  │   Book verified companions  │    │
│  │   for your events           │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │   [⭐]  I Want to Become    │    │
│  │         a Companion         │    │
│  │                             │    │
│  │   Earn by accompanying      │    │
│  │   clients to events         │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Selection Cards**
- Style: Large tappable cards
- Background: white
- Border: 2px solid var(--border-default)
- Selected: Border var(--rose-pink), bg var(--rose-pink-10)
- Radius: var(--radius-xl)
- Padding: 24px
- Icon: 40px, var(--rose-pink)
- Title: var(--text-h3)
- Description: var(--text-body-sm), var(--text-secondary)

---

### 7.2 Companion Requirements

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Before You Start             │
│                                     │
│   To become a Society companion,    │
│   you'll need to complete:          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📱  Phone Verification      │    │
│  │     Verify your phone       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🪪  ID Verification         │    │
│  │     Upload government ID    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📸  Profile Photos          │    │
│  │     Add at least 3 photos   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ✍️  Profile Setup           │    │
│  │     Bio, skills, pricing    │    │
│  └─────────────────────────────┘    │
│                                     │
│   Estimated time: 10-15 minutes     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     I'm Ready, Let's Go     │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

---

### 7.3 ID Verification

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 2 of 5                  │
│        ━━━━━━━━░░░░░░░░░░           │
│                                     │
│        Verify Your                  │
│        Identity                     │
│                                     │
│   This keeps our community safe.    │
│   Your ID is encrypted and secure.  │
│                                     │
│  Document Type:                     │
│  ┌─────────────────────────────┐    │
│  │ CCCD / Citizen ID       [▼] │    │
│  └─────────────────────────────┘    │
│                                     │
│  Front of ID:                       │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      [📷 Take Photo]        │    │
│  │                             │    │
│  │   Position ID within frame  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Back of ID:                        │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      [📷 Take Photo]        │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Continue            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Document Types**
- CCCD (Citizen ID) - Default
- Passport
- Driver's License

**Photo Upload Area**
- Size: Full width x 180px
- Border: 2px dashed var(--border-default)
- Radius: var(--radius-lg)
- Icon: Camera
- Guidelines overlay when capturing

**Photo Guidelines**
- Overlay shows ID outline
- Corners marked
- Text: "Position ID within frame"
- Good lighting indicator

**Security Note**
- Icon: Lock
- Text: "Your ID is encrypted using bank-level security"
- Color: var(--success-teal)

---

### 7.4 Selfie Verification (Liveness Check)

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 2 of 5                  │
│        ━━━━━━━━░░░░░░░░░░           │
│                                     │
│        Take a Selfie                │
│                                     │
│   This confirms you match your ID.  │
│                                     │
│       ┌───────────────────┐         │
│       │                   │         │
│       │    ┌─────────┐    │         │
│       │    │  Face   │    │         │
│       │    │  Oval   │    │         │
│       │    └─────────┘    │         │
│       │                   │         │
│       │  Position face    │         │
│       │  in the oval      │         │
│       └───────────────────┘         │
│                                     │
│   Instructions:                     │
│   • Good lighting                   │
│   • Look straight at camera         │
│   • Remove glasses/hat              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      📷 Take Selfie         │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Camera View**
- Aspect: 1:1 square
- Face oval overlay: Dashed white/pink
- Background: Camera preview

**Liveness Detection**
- May include: "Turn head left", "Smile", etc.
- Progress indicator
- Anti-spoofing measures

---

### 7.5 Profile Photos

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 3 of 5                  │
│        ━━━━━━━━━━━━░░░░░            │
│                                     │
│        Add Your Best                │
│        Photos                       │
│                                     │
│   Add at least 3 photos. These      │
│   will appear on your profile.      │
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │        │ │        │ │        │   │
│  │  [+]   │ │  [+]   │ │  [+]   │   │
│  │Primary │ │        │ │        │   │
│  └────────┘ └────────┘ └────────┘   │
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐   │
│  │        │ │        │ │        │   │
│  │  [+]   │ │  [+]   │ │  [+]   │   │
│  │        │ │        │ │        │   │
│  └────────┘ └────────┘ └────────┘   │
│                                     │
│   Photo tips:                       │
│   ✓ Clear face visible              │
│   ✓ Recent photos only              │
│   ✓ Different outfits/settings      │
│   ✗ No filters or heavy editing     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Continue            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Photo Grid**
- Layout: 3 columns, 2 rows
- Photo Size: Square, ~100px
- Gap: 12px
- First slot: Marked as "Primary"

**Empty State**
- Border: 2px dashed var(--border-default)
- Icon: Plus, 24px
- Radius: var(--radius-lg)

**Filled State**
- Shows photo thumbnail
- Delete button: X in top-right corner
- Drag to reorder capability

**Requirements**
- Minimum: 3 photos
- Maximum: 6 photos
- Continue disabled until 3+ uploaded

---

### 7.6 Profile Information

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 4 of 5                  │
│        ━━━━━━━━━━━━━━━░░░            │
│                                     │
│        Tell Clients                 │
│        About You                    │
│                                     │
│  Bio:                               │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │ Write a friendly bio...     │    │
│  │                             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                             45/300  │
│                                     │
│  Services I Offer:                  │
│  ┌───────────┐ ┌───────────┐        │
│  │ Wedding   │ │ Family    │        │
│  └───────────┘ └───────────┘        │
│  ┌───────────┐ ┌───────────┐        │
│  │ Tet/Hol.  │ │ Business  │        │
│  └───────────┘ └───────────┘        │
│                                     │
│  Languages:                         │
│  ┌─────────────────────────────┐    │
│  │ Vietnamese, English     [+] │    │
│  └─────────────────────────────┘    │
│                                     │
│  Interests/Hobbies:                 │
│  ┌─────────────────────────────┐    │
│  │ Add interests...        [+] │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         Continue            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Bio**
- Type: Textarea
- Min: 50 characters
- Max: 300 characters
- Counter in bottom-right

**Services**
- Type: Multi-select chips
- Options: Wedding, Family Gathering, Tet/Holiday, Business Event
- Style: Outlined, filled when selected

**Languages**
- Type: Multi-select via bottom sheet
- Shows as chips
- Common: Vietnamese, English

**Interests**
- Type: Free-form tags or selection
- Helps with matching

---

### 7.7 Pricing Setup

### Layout
```
┌─────────────────────────────────────┐
│ [←]                                 │
│                                     │
│        Step 5 of 5                  │
│        ━━━━━━━━━━━━━━━━━━━          │
│                                     │
│        Set Your                     │
│        Pricing                      │
│                                     │
│   Set your hourly rate and packages.│
│   You can change these anytime.     │
│                                     │
│  Base Hourly Rate:                  │
│  ┌─────────────────────────────┐    │
│  │ ₫ 400,000                   │    │
│  └─────────────────────────────┘    │
│  Suggested: 300,000₫ - 600,000₫     │
│                                     │
│  Minimum Booking:                   │
│  ┌─────────────────────────────┐    │
│  │ 2 hours                 [▼] │    │
│  └─────────────────────────────┘    │
│                                     │
│  Package Rates (Optional):          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Half Day (4hr)  1,400,000₫  │    │
│  │                       [Edit]│    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Full Day (8hr)  2,500,000₫  │    │
│  │                       [Edit]│    │
│  └─────────────────────────────┘    │
│                                     │
│          [+ Add Package]            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     Complete Registration   │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Hourly Rate**
- Type: Currency input
- Format: Vietnamese Dong
- Keyboard: Number pad
- Suggestion: Based on market data

**Packages**
- Pre-defined: Half Day, Full Day
- Custom packages possible
- Each shows calculated discount vs hourly

**Commission Notice**
- Small text below pricing
- "Society takes 18% commission on bookings"
- Transparent about fees

---

### 7.8 Registration Complete

### Layout
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│           ┌─────────────┐           │
│           │     ✓       │           │
│           │   Success   │           │
│           └─────────────┘           │
│                                     │
│        You're Almost                │
│        There!                       │
│                                     │
│   Your profile is under review.     │
│   We'll verify your information     │
│   within 24-48 hours.               │
│                                     │
│   What's Next:                      │
│                                     │
│   📧 Check your email for updates   │
│                                     │
│   📅 Set up your availability       │
│      calendar                       │
│                                     │
│   💳 Add payout method to receive   │
│      earnings                       │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     Go to Dashboard         │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

### Specifications

**Success Animation**
- Checkmark with confetti burst
- Circle animates from 0 to full
- Lottie animation recommended

**Status Badge**
- Shows "Pending Review" badge
- Yellow status color

**CTA**
- Takes to companion dashboard
- Dashboard shows pending status prominently
