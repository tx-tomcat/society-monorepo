import * as React from 'react';
import { View as RNView } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type PhotoProgressBarProps = {
  total: number;
  current: number;
  isPaused: boolean;
  duration: number; // ms per photo
};

export const PhotoProgressBar = React.memo(function PhotoProgressBar({
  total,
  current,
  isPaused,
  duration,
}: PhotoProgressBarProps) {
  if (total <= 1) return null;

  return (
    <RNView className="absolute left-0 right-0 top-4 flex-row gap-1 px-4" style={{ zIndex: 10 }}>
      {Array.from({ length: Math.min(total, 6) }).map((_, index) => (
        <ProgressSegment
          key={index}
          index={index}
          current={current}
          isPaused={isPaused}
          duration={duration}
        />
      ))}
    </RNView>
  );
});

function ProgressSegment({
  index,
  current,
  isPaused,
  duration,
}: {
  index: number;
  current: number;
  isPaused: boolean;
  duration: number;
}) {
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (index < current) {
      // Completed segments: full width
      progress.value = 1;
    } else if (index > current) {
      // Future segments: empty
      progress.value = 0;
    } else {
      // Current segment: animate
      progress.value = 0;
      if (!isPaused) {
        progress.value = withTiming(1, {
          duration,
          easing: Easing.linear,
        });
      }
    }
  }, [index, current, isPaused, duration, progress]);

  // Pause: keep current progress position
  React.useEffect(() => {
    if (index === current && isPaused) {
      // Cancel animation by setting to current value (Reanimated handles this)
      progress.value = progress.value;
    } else if (index === current && !isPaused) {
      // Resume from current position
      const remaining = (1 - progress.value) * duration;
      progress.value = withTiming(1, {
        duration: remaining,
        easing: Easing.linear,
      });
    }
  }, [isPaused, index, current, duration, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <RNView className="h-[3px] flex-1 overflow-hidden rounded-sm bg-white/30">
      <Animated.View
        className="h-full rounded-sm bg-white"
        style={animatedStyle}
      />
    </RNView>
  );
}
