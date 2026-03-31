import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

import { useCalendar } from "@/context/CalendarContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isConnected, events, isLoading, connect, disconnect, refreshEvents } = useCalendar();
  const [isConnecting, setIsConnecting] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleConnect = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsConnecting(true);
    try {
      connect();
      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 30);
      await refreshEvents(now, end);
    } catch (e) {
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      "Disconnect Google Calendar",
      "Your scheduled tasks will remain, but new schedules won't check Google Calendar.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await disconnect();
          },
        },
      ]
    );
  };

  const handleRefresh = async () => {
    Haptics.selectionAsync();
    const now = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 30);
    await refreshEvents(now, end);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
      </Animated.View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GOOGLE CALENDAR</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.calendarHeader}>
              <View style={[styles.calendarIcon, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="calendar" size={22} color={colors.primary} />
              </View>
              <View style={styles.calendarInfo}>
                <Text style={[styles.calendarTitle, { color: colors.foreground }]}>Google Calendar</Text>
                <Text style={[styles.calendarStatus, { color: isConnected ? colors.success : colors.mutedForeground }]}>
                  {isConnected ? `Connected · ${events.length} events` : "Not connected"}
                </Text>
              </View>
              {isLoading && <ActivityIndicator color={colors.primary} size="small" />}
            </View>

            {isConnected ? (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.border, backgroundColor: colors.muted }]}
                  onPress={handleRefresh}
                >
                  <Feather name="refresh-cw" size={14} color={colors.foreground} />
                  <Text style={[styles.secondaryBtnText, { color: colors.foreground }]}>Refresh</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.destructive + "40", backgroundColor: colors.destructive + "10" }]}
                  onPress={handleDisconnect}
                >
                  <Feather name="link-2-off" size={14} color={colors.destructive} />
                  <Text style={[styles.secondaryBtnText, { color: colors.destructive }]}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.connectBtn, { backgroundColor: colors.primary }, isConnecting && { opacity: 0.7 }]}
                onPress={handleConnect}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <ActivityIndicator color={colors.primaryForeground} size="small" />
                ) : (
                  <>
                    <Feather name="link" size={16} color={colors.primaryForeground} />
                    <Text style={[styles.connectBtnText, { color: colors.primaryForeground }]}>
                      Connect Google Calendar
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <View style={[styles.infoBox, { backgroundColor: colors.muted }]}>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {isConnected
                  ? "The scheduler reads your calendar events to avoid placing tasks during busy periods and creates new events for scheduled tasks."
                  : "Connect your Google Calendar so the scheduler can check your existing events and create task reminders automatically."}
              </Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>HOW IT WORKS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { icon: "list", title: "Add your tasks", desc: "Enter title, priority, deadline, and estimated time" },
              { icon: "clock", title: "Set your availability", desc: "Define which hours you're free each day of the week" },
              { icon: "zap", title: "Auto-schedule", desc: "The algorithm schedules by priority & urgency, avoiding calendar conflicts" },
              { icon: "calendar", title: "Calendar events", desc: "Creates Google Calendar events with the scheduled times" },
            ].map((item, i) => (
              <View
                key={i}
                style={[styles.howRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <View style={[styles.howIcon, { backgroundColor: colors.accent }]}>
                  <Feather name={item.icon as any} size={16} color={colors.primary} />
                </View>
                <View style={styles.howText}>
                  <Text style={[styles.howTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.howDesc, { color: colors.mutedForeground }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
  },
  calendarIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarInfo: {
    flex: 1,
    gap: 2,
  },
  calendarTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  calendarStatus: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  connectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 13,
    borderRadius: 12,
  },
  connectBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  infoBox: {
    margin: 16,
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  howRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
  },
  howIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  howText: {
    flex: 1,
    gap: 2,
  },
  howTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  howDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
