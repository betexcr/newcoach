import { useRef, useEffect } from "react";
import { Animated, Platform } from "react-native";
import { create } from "zustand";

const STORAGE_KEY = "demo-seen";

function loadSeen(): Record<string, boolean> {
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return {};
}

function persistSeen(seen: Record<string, boolean>) {
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    } catch {}
  }
}

interface DemoSeenState {
  seen: Record<string, boolean>;
  markSeen: (key: string) => void;
  reset: () => void;
}

export const useDemoSeenStore = create<DemoSeenState>((set) => ({
  seen: loadSeen(),
  markSeen: (key) =>
    set((state) => {
      const next = { ...state.seen, [key]: true };
      persistSeen(next);
      return { seen: next };
    }),
  reset: () => {
    persistSeen({});
    set({ seen: {} });
  },
}));

/**
 * Returns Animated.Values for a staggered fade-in effect on demo pages.
 * - introOpacity + introTranslateY: slide-in from top for the intro tooltip
 * - contentOpacity: fades in the rest of the page 1 s after the tooltip appears
 *
 * Only animates on the first visit per demo session. Subsequent visits
 * show everything instantly (opacity = 1, translateY = 0).
 */
export function useDemoFadeIn(pageKey: string) {
  const alreadySeen = useDemoSeenStore((s) => !!s.seen[pageKey]);
  const markSeen = useDemoSeenStore((s) => s.markSeen);

  const introOpacity = useRef(new Animated.Value(alreadySeen ? 1 : 0)).current;
  const introTranslateY = useRef(new Animated.Value(alreadySeen ? 0 : -20)).current;
  const contentOpacity = useRef(new Animated.Value(alreadySeen ? 1 : 0)).current;

  useEffect(() => {
    if (!alreadySeen) {
      markSeen(pageKey);
      Animated.sequence([
        Animated.parallel([
          Animated.timing(introOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(introTranslateY, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(1000),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { introOpacity, introTranslateY, contentOpacity };
}
