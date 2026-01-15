# Society - Interactions & Micro-Animations

---

## 1. Global Interaction Patterns

### 1.1 Touch Feedback

**All Interactive Elements**
```css
/* Standard press feedback */
.interactive {
  transition: transform 150ms ease-out, opacity 150ms ease-out;
}

.interactive:active {
  transform: scale(0.98);
  opacity: 0.9;
}
```

**Buttons - Primary**
```css
.btn-primary {
  transition: all 200ms ease-out;
  box-shadow: 0px 4px 12px rgba(255, 107, 138, 0.3);
}

.btn-primary:active {
  transform: scale(0.97);
  box-shadow: 0px 2px 8px rgba(255, 107, 138, 0.2);
}
```

**Cards**
```css
.card {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-sm);
}
```

### 1.2 Haptic Feedback Patterns

```javascript
// Light - Standard taps
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium - Confirmations, toggles
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy - Important actions, errors
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success - Completion, booking confirmed
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Warning - Alerts, attention needed
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Error - Failed actions
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
```

**When to Use:**
- Light: Tab switches, list item taps, navigation
- Medium: Button presses, toggle switches, selections
- Heavy: Emergency button, delete confirmations
- Success: Booking confirmed, payment complete
- Warning: Form validation errors, alerts
- Error: Payment failed, network error

---

## 2. Screen Transitions

### 2.1 Navigation Transitions

**Push (Forward Navigation)**
```javascript
// Screen slides in from right
animation: {
  type: 'slide',
  direction: 'left',
  duration: 300,
  easing: 'ease-out',
}

// Content fades as it slides
containerStyle: {
  opacity: { from: 0, to: 1 },
  transform: { translateX: { from: 50, to: 0 } }
}
```

**Pop (Back Navigation)**
```javascript
// Screen slides out to right
animation: {
  type: 'slide',
  direction: 'right',
  duration: 250,
  easing: 'ease-in',
}
```

**Modal Presentation**
```javascript
// Bottom sheet / Modal
animation: {
  type: 'slide',
  direction: 'up',
  duration: 350,
  easing: 'cubic-bezier(0.32, 0.72, 0, 1)', // iOS spring curve
}

// Backdrop fade
backdropAnimation: {
  opacity: { from: 0, to: 0.5 },
  duration: 300,
}
```

**Tab Transitions**
```javascript
// Cross-fade between tabs
animation: {
  type: 'fade',
  duration: 200,
  easing: 'ease-in-out',
}

// No horizontal sliding for tabs
```

### 2.2 Content Transitions

**List Item Appearance (Staggered)**
```javascript
// Each item delays by 50ms
items.map((item, index) => ({
  animation: {
    opacity: { from: 0, to: 1 },
    transform: { translateY: { from: 20, to: 0 } },
    duration: 300,
    delay: index * 50,
    easing: 'ease-out',
  }
}));
```

**Card Expansion**
```javascript
// Companion card to full profile
animation: {
  type: 'shared-element',
  elements: ['photo', 'name', 'rating'],
  duration: 350,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
}
```

---

## 3. Component Animations

### 3.1 Loading States

**Skeleton Shimmer**
```css
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--soft-pink) 0%,
    var(--warm-white) 50%,
    var(--soft-pink) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

**Spinner**
```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--rose-pink-20);
  border-top-color: var(--rose-pink);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

**Dots Loading (Splash)**
```css
@keyframes pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.dot {
  animation: pulse 1.4s ease-in-out infinite;
}

.dot:nth-child(1) { animation-delay: 0ms; }
.dot:nth-child(2) { animation-delay: 160ms; }
.dot:nth-child(3) { animation-delay: 320ms; }
```

**Button Loading**
```javascript
// Text fades out, spinner fades in
buttonLoading: {
  text: {
    opacity: { from: 1, to: 0 },
    duration: 150,
  },
  spinner: {
    opacity: { from: 0, to: 1 },
    delay: 150,
    duration: 150,
  }
}
```

### 3.2 Success/Error States

**Success Checkmark (Lottie)**
```javascript
// Use Lottie for complex animations
// Circle draws, then checkmark draws
const successAnimation = require('./animations/success-check.json');

// Duration: ~1.2s
// Include confetti particles
```

**Error Shake**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-8px); }
  40%, 80% { transform: translateX(8px); }
}

.error-shake {
  animation: shake 400ms ease-out;
}
```

**Toast Notification**
```javascript
toast: {
  enter: {
    opacity: { from: 0, to: 1 },
    transform: { translateY: { from: 20, to: 0 } },
    duration: 250,
    easing: 'ease-out',
  },
  exit: {
    opacity: { from: 1, to: 0 },
    duration: 200,
    easing: 'ease-in',
  },
  duration: 3000, // Auto-dismiss
}
```

### 3.3 Interactive Elements

**Toggle Switch**
```css
.toggle-thumb {
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-track {
  transition: background-color 200ms ease;
}

/* On state */
.toggle.on .toggle-thumb {
  transform: translateX(20px);
}

.toggle.on .toggle-track {
  background-color: var(--success-teal);
}
```

**Checkbox**
```javascript
checkbox: {
  check: {
    // Draw checkmark with SVG stroke animation
    strokeDashoffset: { from: 24, to: 0 },
    duration: 200,
    easing: 'ease-out',
  },
  background: {
    scale: { from: 1, to: 1.1, to: 1 },
    duration: 200,
  }
}
```

**Rating Stars**
```javascript
// Tap on star triggers rating
starAnimation: {
  scale: { from: 1, to: 1.3, to: 1 },
  duration: 300,
  easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Spring bounce
}

// Stars fill in sequence
fillAnimation: {
  fill: { color: var(--sunny-yellow) },
  delay: (index) => index * 50,
  duration: 150,
}
```

**Pull to Refresh**
```javascript
pullToRefresh: {
  threshold: 80, // pixels
  indicator: {
    // Rotate based on pull distance
    rotation: (pullDistance) => (pullDistance / 80) * 360,
  },
  release: {
    // Spinner spins
    animation: 'spin',
    duration: 'until-complete',
  }
}
```

### 3.4 Card Animations

**Companion Card Hover/Focus**
```css
.companion-card {
  transition: transform 200ms ease-out, box-shadow 200ms ease-out;
}

.companion-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* Online indicator pulse */
@keyframes online-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(78, 205, 196, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(78, 205, 196, 0);
  }
}

.online-indicator {
  animation: online-pulse 2s infinite;
}
```

**Booking Card Status Change**
```javascript
statusChange: {
  // Old status fades out
  oldBadge: {
    opacity: { from: 1, to: 0 },
    scale: { from: 1, to: 0.8 },
    duration: 150,
  },
  // New status scales in
  newBadge: {
    opacity: { from: 0, to: 1 },
    scale: { from: 0.8, to: 1 },
    delay: 150,
    duration: 200,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  }
}
```

**Card Swipe Actions**
```javascript
swipeActions: {
  threshold: 80, // pixels to trigger

  // Reveal action buttons
  revealAnimation: {
    backgroundColor: { to: var(--error) }, // or success
    duration: 200,
  },

  // Snap back if not triggered
  snapBack: {
    transform: { translateX: { to: 0 } },
    duration: 200,
    easing: 'ease-out',
  },

  // Complete action
  dismiss: {
    transform: { translateX: { to: '-100%' } },
    opacity: { to: 0 },
    height: { to: 0 },
    duration: 300,
  }
}
```

---

## 4. Page-Specific Animations

### 4.1 Splash Screen

```javascript
splashSequence: {
  // Logo appears
  logo: {
    opacity: { from: 0, to: 1 },
    scale: { from: 0.8, to: 1 },
    duration: 400,
    delay: 0,
    easing: 'ease-out',
  },

  // Brand name slides up
  brandName: {
    opacity: { from: 0, to: 1 },
    transform: { translateY: { from: 20, to: 0 } },
    duration: 300,
    delay: 200,
  },

  // Tagline fades in
  tagline: {
    opacity: { from: 0, to: 1 },
    duration: 300,
    delay: 400,
  },

  // Loading dots
  dots: {
    appear: { delay: 800 },
    animation: 'pulse', // As defined above
  }
}
```

### 4.2 Onboarding Screens

```javascript
onboardingTransition: {
  // Page indicator
  indicator: {
    // Active dot scales up
    active: { scale: { to: 1.2 } },
    inactive: { scale: { to: 1 } },
    duration: 200,
  },

  // Content transition
  content: {
    exit: {
      opacity: { to: 0 },
      transform: { translateX: { to: -30 } },
      duration: 200,
    },
    enter: {
      opacity: { from: 0, to: 1 },
      transform: { translateX: { from: 30, to: 0 } },
      duration: 300,
      delay: 100,
    }
  },

  // Illustration
  illustration: {
    // Subtle float animation on idle
    float: {
      transform: { translateY: { from: 0, to: -10, to: 0 } },
      duration: 3000,
      loop: true,
      easing: 'ease-in-out',
    }
  }
}
```

### 4.3 Home/Discovery

```javascript
homeAnimations: {
  // Pull to refresh
  pullRefresh: { /* As defined above */ },

  // Category icons
  categoryIcon: {
    tap: {
      scale: { from: 1, to: 0.95, to: 1 },
      duration: 200,
    },
    selected: {
      borderWidth: { from: 0, to: 2 },
      borderColor: var(--rose-pink),
      duration: 150,
    }
  },

  // Companion cards appear
  cardAppear: {
    // Staggered entrance
    opacity: { from: 0, to: 1 },
    transform: { translateY: { from: 30, to: 0 } },
    duration: 300,
    stagger: 100,
  },

  // Horizontal scroll momentum
  scrollMomentum: {
    deceleration: 0.992, // iOS-like
  }
}
```

### 4.4 Companion Profile

```javascript
profileAnimations: {
  // Photo gallery
  gallery: {
    swipe: {
      // Parallax effect on text
      parallax: { factor: 0.3 },
      // Dots update
      dots: { duration: 150 },
    },
    zoom: {
      // Double-tap to zoom
      scale: { from: 1, to: 2 },
      duration: 200,
    }
  },

  // Sections load in
  sections: {
    stagger: 80,
    animation: {
      opacity: { from: 0, to: 1 },
      transform: { translateY: { from: 20, to: 0 } },
      duration: 300,
    }
  },

  // Sticky header
  stickyHeader: {
    // Fade in on scroll past photo
    threshold: 300,
    animation: {
      opacity: { from: 0, to: 1 },
      duration: 200,
    }
  },

  // Heart favorite
  favorite: {
    add: {
      scale: { from: 1, to: 1.3, to: 1 },
      color: { to: var(--rose-pink) },
      duration: 300,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    remove: {
      scale: { from: 1, to: 0.9, to: 1 },
      color: { to: var(--text-tertiary) },
      duration: 200,
    }
  }
}
```

### 4.5 Booking Flow

```javascript
bookingAnimations: {
  // Progress bar
  progressBar: {
    fill: {
      width: { to: 'step%' },
      duration: 300,
      easing: 'ease-out',
    }
  },

  // Occasion cards
  occasionSelect: {
    selected: {
      borderColor: { to: var(--rose-pink) },
      backgroundColor: { to: var(--rose-pink-10) },
      scale: { from: 1, to: 1.02, to: 1 },
      duration: 200,
    },
    radioFill: {
      scale: { from: 0, to: 1 },
      duration: 200,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    }
  },

  // Calendar date selection
  calendar: {
    dateSelect: {
      backgroundColor: { to: var(--rose-pink) },
      color: { to: 'white' },
      scale: { from: 1, to: 1.1, to: 1 },
      duration: 200,
    }
  },

  // Price update
  priceUpdate: {
    // Counter animation
    counting: {
      duration: 300,
      easing: 'ease-out',
    },
    highlight: {
      backgroundColor: { to: var(--sunny-yellow-10) },
      duration: 500,
    }
  }
}
```

### 4.6 Active Booking

```javascript
activeBookingAnimations: {
  // Timer countdown
  timer: {
    // Pulse every second
    tick: {
      scale: { from: 1, to: 1.02, to: 1 },
      duration: 200,
    },
    // Warning when < 15 min
    warning: {
      color: { to: var(--warning) },
      pulse: true,
    }
  },

  // GPS check-in
  gpsCheckin: {
    success: {
      icon: {
        scale: { from: 0, to: 1 },
        duration: 300,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      ring: {
        scale: { from: 1, to: 1.5 },
        opacity: { from: 1, to: 0 },
        duration: 400,
      }
    }
  },

  // Timeline progress
  timeline: {
    stepComplete: {
      icon: {
        color: { to: var(--success-teal) },
        scale: { from: 1, to: 1.2, to: 1 },
      },
      line: {
        backgroundColor: { to: var(--success-teal) },
        duration: 300,
      }
    }
  },

  // Emergency button
  emergencyButton: {
    idle: {
      // Subtle pulse to draw attention
      scale: { from: 1, to: 1.05, to: 1 },
      duration: 2000,
      loop: true,
    },
    pressed: {
      scale: { to: 0.95 },
      shadow: { blur: 20, spread: 5, color: 'rgba(255, 107, 107, 0.5)' },
    },
    longPress: {
      // Progress ring around button
      ring: {
        strokeDashoffset: { from: 100, to: 0 },
        duration: 3000,
      }
    }
  }
}
```

### 4.7 Chat Interface

```javascript
chatAnimations: {
  // Message send
  sendMessage: {
    // Bubble appears
    bubble: {
      opacity: { from: 0, to: 1 },
      transform: {
        translateY: { from: 20, to: 0 },
        scale: { from: 0.9, to: 1 },
      },
      duration: 200,
    },
    // Sending indicator
    sending: {
      opacity: { loop: [0.5, 1] },
      duration: 800,
    },
    // Sent checkmark
    sent: {
      opacity: { from: 0, to: 1 },
      duration: 150,
    }
  },

  // Message receive
  receiveMessage: {
    bubble: {
      opacity: { from: 0, to: 1 },
      transform: { translateY: { from: 10, to: 0 } },
      duration: 200,
    }
  },

  // Typing indicator
  typing: {
    dots: {
      // Three dots bouncing
      translateY: { from: 0, to: -5, to: 0 },
      duration: 600,
      stagger: 100,
      loop: true,
    }
  },

  // Image loading
  imageLoad: {
    skeleton: 'shimmer',
    loaded: {
      opacity: { from: 0, to: 1 },
      duration: 200,
    }
  }
}
```

### 4.8 Review Submission

```javascript
reviewAnimations: {
  // Star rating
  stars: {
    hover: {
      scale: { to: 1.1 },
      duration: 100,
    },
    select: {
      scale: { from: 1, to: 1.3, to: 1 },
      color: { to: var(--sunny-yellow) },
      duration: 300,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    // Fill animation for all stars up to selected
    fill: {
      stagger: 50,
      duration: 150,
    }
  },

  // Quick tags
  tagSelect: {
    selected: {
      backgroundColor: { to: var(--rose-pink-10) },
      borderColor: { to: var(--rose-pink) },
      scale: { from: 1, to: 1.05, to: 1 },
      duration: 200,
    }
  },

  // Submit success
  submitSuccess: {
    // Confetti burst
    confetti: {
      particles: 50,
      spread: 60,
      duration: 2000,
    },
    // Thank you message
    message: {
      opacity: { from: 0, to: 1 },
      transform: { translateY: { from: 20, to: 0 } },
      delay: 500,
      duration: 300,
    }
  }
}
```

---

## 5. Gesture Handling

### 5.1 Swipe Gestures

**Horizontal Swipes**
```javascript
horizontalSwipe: {
  // Gallery navigation
  gallery: {
    threshold: 50,
    velocityThreshold: 0.5,
    rubberBand: true, // Bounce at edges
  },

  // Card dismiss
  cardDismiss: {
    threshold: 100,
    feedback: 'medium', // Haptic
    actionThreshold: 0.4, // 40% of width
  },

  // Navigation back
  backGesture: {
    edgeWidth: 20, // From left edge
    threshold: 100,
  }
}
```

**Vertical Swipes**
```javascript
verticalSwipe: {
  // Pull to refresh
  pullRefresh: {
    threshold: 80,
    resistance: 0.5,
  },

  // Dismiss modal
  modalDismiss: {
    threshold: 150,
    velocityThreshold: 0.5,
  },

  // Scroll to dismiss keyboard
  keyboardDismiss: {
    threshold: 50,
    direction: 'down',
  }
}
```

### 5.2 Long Press

```javascript
longPress: {
  // Context menu
  contextMenu: {
    duration: 500,
    feedback: 'medium',
    preview: true, // Show preview if supported
  },

  // Emergency button
  emergency: {
    duration: 3000,
    feedback: 'heavy',
    progressIndicator: true,
  },

  // Reorder
  reorder: {
    duration: 300,
    scale: 1.05,
    shadow: 'elevated',
    feedback: 'light',
  }
}
```

### 5.3 Pinch & Zoom

```javascript
pinchZoom: {
  // Photo gallery
  gallery: {
    minScale: 1,
    maxScale: 3,
    doubleTapScale: 2,
    bounceBack: true,
  }
}
```

---

## 6. Performance Guidelines

### 6.1 Animation Performance

```javascript
performanceRules: {
  // Use native driver when possible
  useNativeDriver: true,

  // Prefer transform and opacity
  preferredProperties: ['transform', 'opacity'],

  // Avoid animating
  avoid: ['width', 'height', 'top', 'left', 'padding', 'margin'],

  // Frame rate target
  targetFPS: 60,

  // Reduce motion for accessibility
  reduceMotion: {
    respectSystemSetting: true,
    fallback: 'instant', // Instant transitions
  }
}
```

### 6.2 Loading Optimization

```javascript
loadingStrategy: {
  // Skeleton screens
  showSkeletonAfter: 100, // ms

  // Spinners
  showSpinnerAfter: 300, // ms

  // Progressive loading
  images: {
    placeholder: 'blur', // Low-res blur
    fadeIn: 200,
  },

  // Lazy loading
  offscreenContent: {
    threshold: '200px', // Load before visible
  }
}
```

### 6.3 Animation Timing Reference

```javascript
timings: {
  // Micro-interactions
  micro: 100,      // Tiny feedback
  fast: 150,       // Quick responses
  normal: 200,     // Standard animations
  medium: 300,     // Transitions
  slow: 400,       // Complex animations

  // Page transitions
  pageEnter: 300,
  pageExit: 250,

  // Modal
  modalEnter: 350,
  modalExit: 250,

  // Toast
  toastEnter: 250,
  toastExit: 200,
  toastDuration: 3000,
}
```

---

## 7. Accessibility Considerations

### 7.1 Reduced Motion

```javascript
// Check system preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Simplified animations
reducedMotionAnimations: {
  // Replace animations with instant changes
  fade: { duration: 0 },
  slide: { duration: 0 },
  scale: { duration: 0 },

  // Keep essential feedback
  success: { opacity: true }, // Simple fade
  error: { color: true },     // Color change only

  // Remove decorative animations
  pulse: false,
  float: false,
  confetti: false,
}
```

### 7.2 Focus Indicators

```css
/* Visible focus for keyboard navigation */
:focus-visible {
  outline: 2px solid var(--rose-pink);
  outline-offset: 2px;
}

/* Focus animation */
@keyframes focus-pulse {
  0%, 100% { outline-offset: 2px; }
  50% { outline-offset: 4px; }
}

.focus-animated:focus-visible {
  animation: focus-pulse 1s infinite;
}
```

### 7.3 Screen Reader Announcements

```javascript
announcements: {
  // Loading states
  loading: 'Loading...',
  loaded: 'Content loaded',

  // Actions
  bookingConfirmed: 'Booking confirmed successfully',
  messageSent: 'Message sent',

  // Navigation
  screenChange: 'Navigated to {screenName}',

  // Errors
  error: 'Error: {errorMessage}',
}
```
