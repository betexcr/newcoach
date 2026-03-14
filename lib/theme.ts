import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

const brandColors = {
  primary: "#4F46E5",
  primaryLight: "#818CF8",
  primaryDark: "#3730A3",
  secondary: "#10B981",
  secondaryLight: "#34D399",
  accent: "#F59E0B",
  error: "#EF4444",
  success: "#22C55E",
  warning: "#F59E0B",
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: brandColors.primary,
    primaryContainer: "#EEF2FF",
    secondary: brandColors.secondary,
    secondaryContainer: "#D1FAE5",
    error: brandColors.error,
    errorContainer: "#FEE2E2",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    surfaceVariant: "#F1F5F9",
    onBackground: "#0F172A",
    onSurface: "#0F172A",
    onSurfaceVariant: "#64748B",
    outline: "#CBD5E1",
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level0: "#FFFFFF",
      level1: "#F8FAFC",
      level2: "#F1F5F9",
    },
  },
  custom: brandColors,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brandColors.primaryLight,
    primaryContainer: "#312E81",
    secondary: brandColors.secondaryLight,
    secondaryContainer: "#065F46",
    error: "#F87171",
    errorContainer: "#7F1D1D",
    background: "#0F172A",
    surface: "#1E293B",
    surfaceVariant: "#334155",
    onBackground: "#F8FAFC",
    onSurface: "#F8FAFC",
    onSurfaceVariant: "#94A3B8",
    outline: "#475569",
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level0: "#0F172A",
      level1: "#1E293B",
      level2: "#334155",
    },
  },
  custom: brandColors,
};

export type AppTheme = typeof lightTheme;
