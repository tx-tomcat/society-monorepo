import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const DEFAULT_INTERVAL = 3500; // 3.5 seconds per photo

type UsePhotoAutoAdvanceOptions = {
  totalPhotos: number;
  interval?: number;
  isActive: boolean; // only run when this card is the current page
};

export function usePhotoAutoAdvance({
  totalPhotos,
  interval = DEFAULT_INTERVAL,
  isActive,
}: UsePhotoAutoAdvanceOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => subscription.remove();
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Reset when becoming active
  useEffect(() => {
    if (isActive) {
      setCurrentIndex(0);
      setIsPaused(false);
    } else {
      clearTimer();
    }
  }, [isActive, clearTimer]);

  // Auto-advance timer
  useEffect(() => {
    clearTimer();

    if (!isActive || isPaused || reduceMotion || totalPhotos <= 1) {
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalPhotos);
    }, interval);

    return clearTimer;
  }, [isActive, isPaused, reduceMotion, totalPhotos, interval, clearTimer]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const goToPhoto = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalPhotos) {
        setCurrentIndex(index);
      }
    },
    [totalPhotos],
  );

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, totalPhotos - 1));
  }, [totalPhotos]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  return {
    currentIndex,
    isPaused,
    reduceMotion,
    togglePause,
    goToPhoto,
    goNext,
    goPrev,
    totalPhotos,
    interval,
  };
}
