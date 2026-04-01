import React from "react";
import Svg, { Path } from "react-native-svg";

interface AviateLogoIconProps {
  size?: number;
  color?: string;
}

/**
 * Geometric paper-plane icon matching the Aviate brand mark.
 * Wireframe / stroke-only style.
 */
export function AviateLogoIcon({ size = 64, color = "#ffffff" }: AviateLogoIconProps) {
  const sw = (size / 100) * 4.5;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Outer silhouette: nose → wing → tail → back */}
      <Path
        d="M90,8 L8,42 L22,90 Z"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Upper wing fold — inner V showing the crease */}
      <Path
        d="M8,42 L32,28 L90,8"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Center crease — nose down to belly fold */}
      <Path
        d="M90,8 L48,58"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Tail crease — tail up to belly fold */}
      <Path
        d="M22,90 L48,58"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Underside fold — wing tip to belly (shows the folded paper edge) */}
      <Path
        d="M8,42 L48,58"
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
      />
    </Svg>
  );
}
