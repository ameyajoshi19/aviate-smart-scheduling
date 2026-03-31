import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AvailabilityEditor } from "@/components/AvailabilityEditor";
import { WeekAvailability, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function AvailabilityScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { availability, saveAvailability } = useApp();
  const [localAvailability, setLocalAvailability] = useState<WeekAvailability>(availability);
  const [isDirty, setIsDirty] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleChange = (avail: WeekAvailability) => {
    setLocalAvailability(avail);
    setIsDirty(true);
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveAvailability(localAvailability);
    setIsDirty(false);
    Alert.alert("Saved", "Your availability has been updated!");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Availability</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            When are you free each week?
          </Text>
        </View>
        {isDirty && (
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Save</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <Text style={[styles.infoText, { color: colors.accentForeground }]}>
            Set the hours you're generally available each day. The scheduler will only place tasks during these times, avoiding your Google Calendar events.
          </Text>
        </View>

        <AvailabilityEditor
          availability={localAvailability}
          onChange={handleChange}
        />
      </ScrollView>

      {isDirty && (
        <View style={[styles.saveBar, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: insets.bottom || 20 }]}>
          <TouchableOpacity
            style={[styles.saveBarBtn, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveBarBtnText, { color: colors.primaryForeground }]}>
              Save Availability
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
    paddingTop: 4,
  },
  infoBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  saveBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  saveBarBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveBarBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
