import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import type { TrackInteractionInput } from '@/lib/api/services/recommendations.service';
import { recommendationsService } from '@/lib/api/services/recommendations.service';

const FLUSH_INTERVAL = 5000; // Flush every 5 seconds

export function useInteractionTracker(sessionId: string) {
  const queueRef = useRef<TrackInteractionInput[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flush = useCallback(async () => {
    if (queueRef.current.length === 0) return;

    const events = [...queueRef.current];
    queueRef.current = [];

    try {
      await recommendationsService.trackBatchInteractions({
        sessionId,
        events,
      });
    } catch {
      // Best-effort: log and discard on failure
      if (__DEV__) {
        console.warn('[InteractionTracker] Batch flush failed, discarding', events.length, 'events');
      }
    }
  }, [sessionId]);

  // Periodic flush
  useEffect(() => {
    timerRef.current = setInterval(flush, FLUSH_INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      flush(); // Flush remaining on unmount
    };
  }, [flush]);

  // Flush on app background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background' || state === 'inactive') {
        flush();
      }
    });
    return () => subscription.remove();
  }, [flush]);

  const track = useCallback(
    (event: Omit<TrackInteractionInput, 'sessionId'>) => {
      queueRef.current.push({ ...event, sessionId });
    },
    [sessionId],
  );

  const trackDwell = useCallback(
    (companionId: string, dwellTimeMs: number) => {
      if (dwellTimeMs < 2000) {
        track({ companionId, eventType: 'SKIP', dwellTimeMs });
      } else {
        track({ companionId, eventType: 'DWELL_VIEW', dwellTimeMs });
      }
    },
    [track],
  );

  return { track, trackDwell, flush };
}
