import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SKIP_AUTH_KEY } from "@/constants/auth";

const NAVY = "#1A2D4F";
const BORDER = "#dde3ee";
const MUTED = "#6b7a99";

function GoogleLogo() {
  return (
    <View style={styles.googleLogoWrap}>
      <Text style={styles.googleLogoText}>G</Text>
    </View>
  );
}

export default function StartupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SKIP_AUTH_KEY)
      .then((val) => {
        if (val === "1") {
          router.replace("/(tabs)");
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        setChecking(false);
      });
  }, []);

  const handleContinueWithout = async () => {
    try {
      await AsyncStorage.setItem(SKIP_AUTH_KEY, "1");
    } catch {}
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
      <View style={[styles.loading, { backgroundColor: "#f5f7fa" }]}>
        <ActivityIndicator color={NAVY} size="large" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 40),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      {/* Logo image */}
      <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.brandSection}>
        <View style={styles.logoCard}>
          <Image
            source={require("../assets/aviate-logo.png")}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>
        <Text style={styles.tagline}>Smart scheduling, perfectly prioritized</Text>
      </Animated.View>

      <View style={styles.spacer} />

      {/* Auth buttons */}
      <Animated.View
        entering={FadeInUp.delay(250).duration(500).springify()}
        style={styles.authSection}
      >
        {/* Google */}
        <Pressable style={styles.googleBtn} onPress={handleGoogle}>
          <GoogleLogo />
          <Text style={styles.googleBtnText}>Continue with Google</Text>
          <View style={styles.authBtnSpacer} />
        </Pressable>

        {/* Apple — iOS only */}
        {Platform.OS === "ios" && (
          <Pressable style={styles.appleBtn} onPress={handleApple}>
            <Text style={styles.appleLogoText}>{"\uF8FF"}</Text>
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
            <View style={styles.authBtnSpacer} />
          </Pressable>
        )}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Guest */}
        <Pressable onPress={handleContinueWithout} style={styles.guestBtn}>
          <Text style={styles.guestText}>Continue without signing in</Text>
        </Pressable>

        {/* Terms */}
        <Text style={styles.terms}>
          {"By continuing you agree to our "}
          <Text style={{ color: NAVY }}>Terms of Service</Text>
          {" and "}
          <Text style={{ color: NAVY }}>Privacy Policy</Text>
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
    backgroundColor: "#f5f7fa",
  },
  brandSection: {
    alignItems: "center",
    gap: 20,
    paddingTop: 60,
    paddingHorizontal: 28,
  },
  logoCard: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#1A2D4F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  logo: {
    width: 300,
    height: 180,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
  },
  spacer: {
    flex: 1,
  },
  authSection: {
    width: "100%",
    paddingHorizontal: 28,
    gap: 12,
    alignItems: "center",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: "#ffffff",
    borderColor: BORDER,
  },
  googleBtnText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#0a1628",
  },
  appleBtn: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: NAVY,
  },
  appleBtnText: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#ffffff",
  },
  appleLogoText: {
    width: 28,
    fontSize: 20,
    textAlign: "center",
    color: "#ffffff",
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
    backgroundColor: BORDER,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: MUTED,
  },
  guestBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
  },
  guestText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: MUTED,
  },
  terms: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    textAlign: "center",
    lineHeight: 16,
    maxWidth: 280,
    marginTop: 4,
  },
});
