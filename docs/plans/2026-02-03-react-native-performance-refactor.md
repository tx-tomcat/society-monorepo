# React Native Performance Refactoring Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve mobile app performance by fixing re-rendering issues, optimizing list performance, and improving animation efficiency.

**Architecture:** Apply React Native performance best practices including React.memo for list items, FlashList for virtualized lists, memoized callbacks, and GPU-accelerated animations. Changes are isolated to individual components with no architectural changes.

**Tech Stack:** React Native, Expo, FlashList, Reanimated, NativeWind

---

## Task 1: Memoize Badge Component

**Files:**
- Modify: `society-mobile/src/components/ui/badge.tsx:117-142`

**Step 1: Read the current Badge component**

Verify the component structure before modifying.

**Step 2: Wrap Badge in React.memo**

```typescript
export const Badge = React.memo(function Badge({
  label,
  icon,
  variant = 'default',
  size = 'default',
  className = '',
  testID,
  ...props
}: Props) {
  const styles = React.useMemo(() => badge({ variant, size }), [variant, size]);
  return (
    <View
      className={styles.container({ className })}
      testID={testID}
      {...props}
    >
      {icon && <View className="mr-1">{icon}</View>}
      <Text
        className={styles.label()}
        testID={testID ? `${testID}-label` : undefined}
      >
        {label}
      </Text>
    </View>
  );
});
```

**Step 3: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors related to badge.tsx

**Step 4: Commit**

```bash
git add society-mobile/src/components/ui/badge.tsx
git commit -m "perf(mobile): memoize Badge component to prevent unnecessary re-renders

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Memoize CompanionCard Component

**Files:**
- Modify: `society-mobile/src/components/companion-card.tsx:62-239`

**Step 1: Read the current CompanionCard component**

Verify the component structure.

**Step 2: Wrap CompanionCard in React.memo**

Change line 62 from:
```typescript
export function CompanionCard({
```

To:
```typescript
export const CompanionCard = React.memo(function CompanionCard({
```

And add closing parenthesis at line 239:
```typescript
});
```

**Step 3: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors related to companion-card.tsx

**Step 4: Commit**

```bash
git add society-mobile/src/components/companion-card.tsx
git commit -m "perf(mobile): memoize CompanionCard to prevent re-renders in lists

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Memoize ConversationCard in Chat Screen

**Files:**
- Modify: `society-mobile/src/app/hirer/chat/index.tsx:40-133`

**Step 1: Wrap ConversationCard in React.memo**

Change line 40 from:
```typescript
function ConversationCard({
```

To:
```typescript
const ConversationCard = React.memo(function ConversationCard({
```

And change line 133 from:
```typescript
}
```

To:
```typescript
});
```

**Step 2: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add society-mobile/src/app/hirer/chat/index.tsx
git commit -m "perf(mobile): memoize ConversationCard component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Replace FlatList with FlashList in Chat Screen

**Files:**
- Modify: `society-mobile/src/app/hirer/chat/index.tsx`

**Step 1: Update imports**

Change line 9 from:
```typescript
  FlatList,
```

To:
```typescript
import { FlashList } from '@shopify/flash-list';
```

And remove FlatList from react-native import.

**Step 2: Replace FlatList with FlashList**

Change lines 242-255:
```typescript
<FlashList
  data={conversations}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  showsVerticalScrollIndicator={false}
  refreshControl={
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={refetch}
      tintColor={colors.rose[400]}
    />
  }
  estimatedItemSize={80}
  contentContainerStyle={{ flexGrow: 1 }}
/>
```

**Step 3: Remove MotiView animation from renderItem**

The dynamic `delay: index * 50` causes performance issues. Change renderItem (lines 197-211):
```typescript
const renderItem = React.useCallback(
  ({ item }: { item: ConversationItem }) => (
    <ConversationCard
      conversation={item}
      onPress={() => handleConversationPress(item.id)}
    />
  ),
  [handleConversationPress]
);
```

**Step 4: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 5: Commit**

```bash
git add society-mobile/src/app/hirer/chat/index.tsx
git commit -m "perf(mobile): replace FlatList with FlashList in chat screen

- Use FlashList for better virtualization
- Remove index-based animation delays from renderItem
- Memoize ConversationCard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Memoize FavoriteCard in Favorites Screen

**Files:**
- Modify: `society-mobile/src/app/hirer/favorites/index.tsx:47-118`

**Step 1: Wrap FavoriteCard in React.memo**

Change line 47 from:
```typescript
function FavoriteCard({
```

To:
```typescript
const FavoriteCard = React.memo(function FavoriteCard({
```

And change line 118 from:
```typescript
}
```

To:
```typescript
});
```

**Step 2: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add society-mobile/src/app/hirer/favorites/index.tsx
git commit -m "perf(mobile): memoize FavoriteCard component

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Replace FlatList with FlashList in Favorites Screen

**Files:**
- Modify: `society-mobile/src/app/hirer/favorites/index.tsx`

**Step 1: Update imports**

Add FlashList import and remove FlatList from react-native import:
```typescript
import { FlashList } from '@shopify/flash-list';
```

**Step 2: Replace FlatList with FlashList**

Change lines 261-274:
```typescript
<FlashList
  data={favorites}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ padding: 8, flexGrow: 1 }}
  refreshControl={
    <RefreshControl
      refreshing={isRefetching}
      onRefresh={refetch}
      tintColor={colors.rose[400]}
    />
  }
  estimatedItemSize={120}
/>
```

**Step 3: Remove MotiView animation from renderItem**

Change renderItem (lines 213-228):
```typescript
const renderItem = React.useCallback(
  ({ item }: { item: FavoriteItem }) => (
    <FavoriteCard
      favorite={item}
      onPress={() => handleCompanionPress(item.companion.id)}
      onRemove={() => handleRemoveFavorite(item.companionId)}
    />
  ),
  [handleCompanionPress, handleRemoveFavorite]
);
```

**Step 4: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 5: Commit**

```bash
git add society-mobile/src/app/hirer/favorites/index.tsx
git commit -m "perf(mobile): replace FlatList with FlashList in favorites screen

- Use FlashList for better virtualization
- Remove index-based animation delays from renderItem
- Memoize FavoriteCard

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Fix TabBar Inline Handler Functions

**Files:**
- Modify: `society-mobile/src/components/ui/tab-bar.tsx:179-252`

**Step 1: Create memoized handler factory**

Add before the return statement in TabBar (around line 185):
```typescript
const handleTabPress = React.useCallback(
  (route: typeof state.routes[0], index: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (state.index !== index && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  },
  [navigation, state.index]
);

const handleTabLongPress = React.useCallback(
  (route: typeof state.routes[0]) => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  },
  [navigation]
);
```

**Step 2: Update the map to use memoized handlers**

Replace lines 206-223 (the onPress and onLongPress definitions inside the map) with usage of the memoized handlers:
```typescript
return (
  <Pressable
    key={route.key}
    accessibilityRole="button"
    accessibilityState={isFocused ? { selected: true } : {}}
    accessibilityLabel={options.tabBarAccessibilityLabel}
    testID={options.tabBarButtonTestID}
    onPress={() => handleTabPress(route, index)}
    onLongPress={() => handleTabLongPress(route)}
    className="flex-1 items-center justify-center py-2"
  >
```

**Step 3: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 4: Commit**

```bash
git add society-mobile/src/components/ui/tab-bar.tsx
git commit -m "perf(mobile): memoize TabBar press handlers

- Extract onPress/onLongPress to useCallback outside map loop
- Reduces function recreation on every render

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Fix Progress Bar Animation (Use GPU-Accelerated Property)

**Files:**
- Modify: `society-mobile/src/components/ui/progress-bar.tsx:34-40`

**Step 1: Change width animation to scaleX transform**

Replace the useAnimatedStyle (lines 34-40):
```typescript
const style = useAnimatedStyle(() => {
  return {
    transform: [{ scaleX: progress.value / 100 }],
    transformOrigin: 'left',
    backgroundColor: '#FF6B8A',
    height: 2,
    width: '100%',
  };
});
```

**Step 2: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add society-mobile/src/components/ui/progress-bar.tsx
git commit -m "perf(mobile): use GPU-accelerated scaleX instead of width animation

- Width animations run on JS thread causing jank
- scaleX transform is GPU-accelerated for smooth 60fps

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Optimize Dashboard Data Fetching

**Files:**
- Modify: `society-mobile/src/app/(app)/index.tsx:56-126`

**Step 1: Add data staleness check to prevent over-fetching**

Add a ref to track last fetch time and skip if data is fresh (< 30 seconds):
```typescript
const lastFetchRef = React.useRef<number>(0);
const STALE_TIME = 30000; // 30 seconds

const fetchDashboardData = React.useCallback(async (force = false) => {
  const now = Date.now();
  if (!force && now - lastFetchRef.current < STALE_TIME) {
    return; // Data is still fresh
  }
  lastFetchRef.current = now;

  try {
    // ... existing fetch logic
  } catch (error) {
    // ... existing error handling
  }
}, []);

useFocusEffect(
  React.useCallback(() => {
    fetchDashboardData(false); // Don't force on focus
  }, [fetchDashboardData])
);

const handleRefresh = React.useCallback(() => {
  setIsRefreshing(true);
  fetchDashboardData(true); // Force refresh
}, [fetchDashboardData]);
```

**Step 2: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 3: Commit**

```bash
git add society-mobile/src/app/(app)/index.tsx
git commit -m "perf(mobile): add data staleness check to dashboard

- Skip refetch if data is less than 30 seconds old
- Reduces network traffic and re-renders on tab switches
- Force refresh still works via pull-to-refresh

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Memoize Inline Style Objects in Dashboard

**Files:**
- Modify: `society-mobile/src/app/(app)/index.tsx:236-238`

**Step 1: Add pre-computed background colors to stats**

Update the stats useMemo to include the computed background color:
```typescript
const stats = React.useMemo(
  () => [
    {
      labelKey: 'hirer.dashboard.stats.upcoming',
      value: String(upcomingCount),
      icon: Calendar,
      color: colors.rose[400],
      bgColor: `${colors.rose[400]}20`,
    },
    {
      labelKey: 'hirer.dashboard.stats.favorites',
      value: String(favoritesCount),
      icon: Heart,
      color: colors.lavender[400],
      bgColor: `${colors.lavender[400]}20`,
    },
    {
      labelKey: 'hirer.dashboard.stats.completed',
      value: String(completedBookingsCount),
      icon: Star,
      color: colors.teal[400],
      bgColor: `${colors.teal[400]}20`,
    },
  ],
  [upcomingCount, favoritesCount, completedBookingsCount]
);
```

**Step 2: Use the pre-computed bgColor in render**

Change line 238 from:
```typescript
style={{ backgroundColor: `${stat.color}20` }}
```

To:
```typescript
style={{ backgroundColor: stat.bgColor }}
```

**Step 3: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 4: Commit**

```bash
git add society-mobile/src/app/(app)/index.tsx
git commit -m "perf(mobile): pre-compute stat card background colors

- Move backgroundColor computation to useMemo
- Prevents new object creation on every render

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Memoize Booking Card Date Calculations

**Files:**
- Modify: `society-mobile/src/app/(app)/index.tsx:310-420`

**Step 1: Extract BookingCard as a memoized component**

Add a new memoized component before the HirerDashboard function:
```typescript
type BookingCardProps = {
  booking: UpcomingBooking;
  onPress: () => void;
  t: (key: string) => string;
};

const BookingCard = React.memo(function BookingCard({
  booking,
  onPress,
  t,
}: BookingCardProps) {
  const { dateString, timeString, companionPhoto } = React.useMemo(() => {
    const startTime = new Date(booking.startDatetime);
    const endTime = new Date(booking.endDatetime);
    const now = new Date();

    const isToday = startTime.toDateString() === now.toDateString();
    const dateStr = isToday
      ? t('common.today')
      : startTime.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });

    const timeStr = `${startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })} - ${endTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })}`;

    const photo =
      getPrimaryPhotoUrl(booking.companion.photos) ||
      booking.companion.avatar ||
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120';

    return { dateString: dateStr, timeString: timeStr, companionPhoto: photo };
  }, [booking.startDatetime, booking.endDatetime, booking.companion, t]);

  return (
    <Pressable
      onPress={onPress}
      testID={`booking-card-${booking.id}`}
      className="flex-row gap-4 rounded-2xl bg-white p-4"
    >
      <Image
        source={{ uri: companionPhoto }}
        className="size-14 rounded-full"
        contentFit="cover"
      />
      <View className="flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-midnight">
            {booking.companion.displayName}
          </Text>
          <Badge
            label={
              booking.displayStatus === 'active'
                ? t('common.status.active')
                : booking.displayStatus === 'pending'
                  ? t('common.status.pending')
                  : t('common.status.upcoming')
            }
            variant={
              booking.displayStatus === 'active'
                ? 'teal'
                : booking.displayStatus === 'pending'
                  ? 'pending'
                  : 'rose'
            }
            size="sm"
          />
        </View>
        <Text className="mt-1 text-sm text-rose-400">
          {booking.occasion
            ? `${booking.occasion.emoji} ${booking.occasion.name}`
            : t('common.occasion')}
        </Text>
        <View className="mt-2 flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Clock color={colors.text.tertiary} width={14} height={14} />
            <Text className="text-xs text-text-tertiary">
              {dateString}, {timeString}
            </Text>
          </View>
        </View>
        <View className="mt-1 flex-row items-center gap-1">
          <MapPin color={colors.text.tertiary} width={14} height={14} />
          <Text className="text-xs text-text-tertiary" numberOfLines={1}>
            {booking.locationAddress}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
```

**Step 2: Update the booking list render to use BookingCard**

Replace the inline booking card render (lines 312-418) with:
```typescript
{upcomingBookings.map((booking) => (
  <BookingCard
    key={booking.id}
    booking={booking}
    onPress={() => handleBookingPress(booking)}
    t={t}
  />
))}
```

Note: Also remove the MotiView wrapper with index-based delays.

**Step 3: Verify no TypeScript errors**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 4: Commit**

```bash
git add society-mobile/src/app/(app)/index.tsx
git commit -m "perf(mobile): extract and memoize BookingCard component

- Move date formatting to useMemo inside BookingCard
- Remove index-based MotiView animation delays
- Memoize entire card to prevent re-renders

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Final Type Check and Lint

**Files:**
- All modified files

**Step 1: Run full type check**

Run: `cd society-mobile && pnpm type-check`
Expected: No errors

**Step 2: Run lint**

Run: `cd society-mobile && pnpm lint`
Expected: No errors (or only pre-existing warnings)

**Step 3: Commit any lint fixes if needed**

```bash
git add -A
git commit -m "chore(mobile): fix any lint issues from performance refactor

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Summary of Changes

| File | Change | Impact |
|------|--------|--------|
| `badge.tsx` | Add React.memo | Prevents re-renders in lists |
| `companion-card.tsx` | Add React.memo | Prevents re-renders in browse/favorites |
| `chat/index.tsx` | React.memo + FlashList | Better scroll performance |
| `favorites/index.tsx` | React.memo + FlashList | Better scroll performance |
| `tab-bar.tsx` | Memoize handlers | Faster tab switching |
| `progress-bar.tsx` | scaleX instead of width | GPU-accelerated animation |
| `(app)/index.tsx` | Data staleness + memoization | Reduced network + re-renders |

## Testing Checklist

After implementation, manually test:

- [ ] Tab bar navigation feels responsive
- [ ] Chat list scrolls smoothly
- [ ] Favorites list scrolls smoothly
- [ ] Dashboard loads without visible jank
- [ ] Pull-to-refresh works on all screens
- [ ] Progress bars animate smoothly
- [ ] No TypeScript or lint errors
