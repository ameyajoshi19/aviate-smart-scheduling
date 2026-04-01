import { useTheme } from "@/context/ThemeContext";

/**
 * Returns the design tokens for the current color scheme.
 * Respects the user's stored preference (Light / Dark / Auto).
 * Falls back to light palette when no preference is set.
 */
export function useColors() {
  const { colors } = useTheme();
  return colors;
}
