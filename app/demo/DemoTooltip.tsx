import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import {
  View,
  Pressable,
  Animated,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { AppTheme } from "@/lib/theme";

type DemoTooltipCtx = { show: () => void };

const Ctx = createContext<DemoTooltipCtx>({ show: () => {} });

export function useDemoTooltip() {
  return useContext(Ctx);
}

export function DemoTooltipProvider({ children }: { children: ReactNode }) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  const show = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    opacity.setValue(0);
    translateY.setValue(20);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    timer.current = setTimeout(hide, 2500);
  }, [opacity, translateY, hide]);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Pressable onPress={hide} style={{ position: "absolute", bottom: 100, left: 24, right: 24 }}>
          <Animated.View
            style={[
              s.toast,
              {
                backgroundColor: theme.colors.inverseSurface,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <MaterialCommunityIcons
              name="lock-outline"
              size={16}
              color={theme.colors.inverseOnSurface}
            />
            <Text
              variant="bodySmall"
              style={{
                color: theme.colors.inverseOnSurface,
                marginLeft: 8,
                flex: 1,
              }}
            >
              {t("demo.limitedFeature")}
            </Text>
          </Animated.View>
        </Pressable>
      </View>
    </Ctx.Provider>
  );
}

/**
 * Drop-in Pressable replacement for non-functional demo elements.
 * Shows a tooltip indicating limited functionality on press.
 */
export function DemoPress({
  children,
  style,
  ...rest
}: Omit<PressableProps, "onPress"> & { style?: StyleProp<ViewStyle> }) {
  const { show } = useDemoTooltip();
  return (
    <Pressable {...rest} style={style} onPress={show}>
      {children}
    </Pressable>
  );
}

const s = StyleSheet.create({
  toast: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
