import { useRef, useEffect, useCallback } from "react";
import { Animated, Platform } from "react-native";
import { create } from "zustand";

const STORAGE_KEY = "demo-seen";
const DISMISSED_KEY = "demo-dismissed";

function loadJson(key: string): Record<string, boolean> {
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return {};
}

function persistJson(key: string, data: Record<string, boolean>) {
  if (Platform.OS === "web" && typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }
}

interface DemoSeenState {
  seen: Record<string, boolean>;
  dismissed: Record<string, boolean>;
  markSeen: (key: string) => void;
  dismiss: (key: string) => void;
  reset: () => void;
}

export const useDemoSeenStore = create<DemoSeenState>((set) => ({
  seen: loadJson(STORAGE_KEY),
  dismissed: loadJson(DISMISSED_KEY),
  markSeen: (key) =>
    set((state) => {
      const next = { ...state.seen, [key]: true };
      persistJson(STORAGE_KEY, next);
      return { seen: next };
    }),
  dismiss: (key) =>
    set((state) => {
      const next = { ...state.dismissed, [key]: true };
      persistJson(DISMISSED_KEY, next);
      return { dismissed: next };
    }),
  reset: () => {
    persistJson(STORAGE_KEY, {});
    persistJson(DISMISSED_KEY, {});
    set({ seen: {}, dismissed: {} });
  },
}));

/**
 * Returns Animated.Values for a staggered fade-in effect on demo pages.
 * - introOpacity + introTranslateY: slide-in from top for the intro tooltip
 * - contentOpacity: fades in the rest of the page 1 s after the tooltip appears
 * - dismissIntro: call to fade out the intro card (user tapped it)
 *
 * Only animates on the first visit per demo session. Subsequent visits
 * show everything instantly (opacity = 1, translateY = 0).
 * Dismissed cards stay hidden until the demo session is reset.
 */
export function useDemoFadeIn(pageKey: string) {
  const alreadySeen = useDemoSeenStore((s) => !!s.seen[pageKey]);
  const alreadyDismissed = useDemoSeenStore((s) => !!s.dismissed[pageKey]);
  const markSeen = useDemoSeenStore((s) => s.markSeen);
  const dismissStore = useDemoSeenStore((s) => s.dismiss);

  const introHidden = alreadyDismissed;
  const introVisible = alreadySeen && !alreadyDismissed;

  const introOpacity = useRef(new Animated.Value(introHidden ? 0 : introVisible ? 1 : 0)).current;
  const introTranslateY = useRef(new Animated.Value(introHidden ? -20 : introVisible ? 0 : -20)).current;
  const contentOpacity = useRef(new Animated.Value(alreadySeen ? 1 : 0)).current;

  useEffect(() => {
    if (!alreadySeen && !alreadyDismissed) {
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

  const dismissIntro = useCallback(() => {
    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(introTranslateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    dismissStore(pageKey);
  }, [introOpacity, introTranslateY, dismissStore, pageKey]);

  return { introOpacity, introTranslateY, contentOpacity, dismissIntro };
}
