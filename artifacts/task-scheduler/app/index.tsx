import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Zap } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export const SKIP_AUTH_KEY = "@skip_auth";

function GoogleLogo() {
  return (
    <View style={styles.googleLogoWrap}>
      <Text style={styles.googleLogoText}>G</Text>
    </View>
  );
}

export default function StartupScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SKIP_AUTH_KEY).then((val) => {
      if (val === "1") {
        router.replace("/(tabs)");
      } else {
        setChecking(false);
      }
    });
  }, []);

  const handleContinueWithout = async () => {
    await AsyncStorage.setItem(SKIP_AUTH_KEY, "1");
    router.replace("/(tabs)");
  };

  const handleGoogle = () => {
    Alert.alert("Coming Soon", "Google sign-in will be available in a future update.", [
      { text: "OK" },
    ]);
  };

  const handleApple = () => {
    Alert.alert("Coming Soon", "Apple sign-in will be available in a future update.", [
      { text: "OK" },
    ]);
  };

  if (checking) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          paddingTop: Math.max(insets.top, 40),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      {/* Logo & branding */}
      <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.brandSection}>
        <View style={[styles.iconOuter, { backgroundColor: colors.primary + "18" }]}>
          <View style={[styles.iconInner, { backgroundColor: colors.primary }]}>
            <Zap size={36} color="#ffffff" fill="#ffffff" />
          </View>
        </View>
        <Text style={[styles.appName, { color: colors.foreground }]}>APP NAME</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Smart scheduling for everything that matters
        </Text>
      </Animated.View>

      <View style={styles.spacer} />

      {/* Auth buttons */}
      <Animated.View
        entering={FadeInUp.delay(250).duration(500).springify()}
        style={[styles.authSection, { paddingHorizontal: 28 }]}
      >
        {/* Google */}
        <Pressable
          style={[styles.authBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleGoogle}
        >
          <GoogleLogo />
          <Text style={[styles.authBtnText, { color: colors.foreground }]}>
            Continue with Google
          </Text>
          <View style={styles.authBtnSpacer} />
        </Pressable>

        {/* Apple — iOS only */}
        {Platform.OS === "ios" && (
          <Pressable
            style={[styles.authBtn, { backgroundColor: colors.foreground, borderColor: "transparent" }]}
            onPress={handleApple}
          >
            <Text style={[styles.appleLogoText, { color: colors.background }]}>
              {"\uF8FF"}
            </Text>
            <Text style={[styles.authBtnText, { color: colors.background }]}>
              Continue with Apple
            </Text>
            <View style={styles.authBtnSpacer} />
          </Pressable>
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Guest */}
        <Pressable
          onPress={handleContinueWithout}
          style={[styles.guestBtn, { borderColor: colors.border }]}
        >
          <Text style={[styles.guestText, { color: colors.mutedForeground }]}>
            Continue without signing in
          </Text>
        </Pressable>

        {/* Terms */}
        <Text style={[styles.terms, { color: colors.mutedForeground }]}>
          {"By continuing you agree to our "}
          <Text style={{ color: colors.primary }}>Terms of Service</Text>
          {" and "}
          <Text style={{ color: colors.primary }}>Privacy Policy</Text>
          {"."}
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
  },
  brandSection: {
    alignItems: "center",
    gap: 16,
    paddingTop: 60,
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginTop: 8,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 22,
  },
  spacer: {
    flex: 1,
  },
  authSection: {
    width: "100%",
    gap: 12,
    alignItems: "center",
  },
  authBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  authBtnText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  authBtnSpacer: {
    width: 28,
  },
  googleLogoWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLogoText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#4285F4",
  },
  appleLogoText: {
    width: 28,
    fontSize: 20,
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  guestBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  guestText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  terms: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 280,
    marginTop: 4,
  },
});
