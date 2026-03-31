import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
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

import { ScheduleTimeline } from "@/components/ScheduleTimeline";
import { useApp } from "@/context/AppContext";
import { useCalendar } from "@/context/CalendarContext";
import { useColors } from "@/hooks/useColors";
import { scheduleTasks } from "@/utils/scheduler";

export default function ScheduleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { tasks, availability, updateTask } = useApp();
  const { isConnected, events, isLoading: calLoading, refreshEvents, createEvent } = useCalendar();
  const [isScheduling, setIsScheduling] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  useEffect(() => {
    if (isConnected) {
      const now = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 30);
      refreshEvents(now, end);
    }
  }, [isConnected]);

  const scheduled = useMemo(() => {
    return scheduleTasks(tasks, availability, events);
  }, [tasks, availability, events]);

  const scheduledIds = useMemo(() => new Set(scheduled.map((s) => s.task.id)), [scheduled]);
  const unscheduled = tasks.filter((t) => !t.isCompleted && !scheduledIds.has(t.id));

  const handleAutoSchedule = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsScheduling(true);
    try {
      for (const entry of scheduled) {
        const updates: Partial<typeof entry.task> = {
          scheduledStart: entry.start.toISOString(),
          scheduledEnd: entry.end.toISOString(),
        };

        if (isConnected) {
          const eventId = await createEvent({
            title: `[Task] ${entry.task.title}`,
            start: entry.start.toISOString(),
            end: entry.end.toISOString(),
            description: entry.task.description || undefined,
          });
          if (eventId) updates.googleEventId = eventId;
        }

        await updateTask(entry.task.id, updates);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Schedule Applied",
        `${scheduled.length} task${scheduled.length !== 1 ? "s" : ""} have been scheduled${isConnected ? " and added to your Google Calendar" : ""}!`,
        [{ text: "OK" }]
      );
    } catch (e) {
      Alert.alert("Error", "Something went wrong while scheduling.");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={[styles.header, { paddingTop: topPad + 16 }]}
      >
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Schedule</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Smart task scheduling
          </Text>
        </View>
        {calLoading && <ActivityIndicator color={colors.primary} />}
      </Animated.View>

      {isConnected && (
        <View style={[styles.calendarBanner, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <Feather name="check-circle" size={14} color={colors.primary} />
          <Text style={[styles.calendarBannerText, { color: colors.accentForeground }]}>
            Google Calendar connected · {events.length} events loaded
          </Text>
        </View>
      )}

      {!isConnected && (
        <View style={[styles.calendarBanner, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.calendarBannerText, { color: colors.mutedForeground }]}>
            Connect Google Calendar in Settings to avoid conflicts
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 84 : 100) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={[styles.summaryNum, { color: colors.primary }]}>{scheduled.length}</Text>
              <Text style={[styles.summaryLabel, { color: colors.foreground }]}>Can be scheduled</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.primary + "30" }]} />
            <View>
              <Text style={[styles.summaryNum, { color: colors.mutedForeground }]}>{unscheduled.length}</Text>
              <Text style={[styles.summaryLabel, { color: colors.foreground }]}>Cannot fit</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.scheduleBtn,
              { backgroundColor: colors.primary },
              isScheduling && { opacity: 0.7 },
            ]}
            onPress={handleAutoSchedule}
            disabled={isScheduling || scheduled.length === 0}
          >
            {isScheduling ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <>
                <Feather name="zap" size={16} color={colors.primaryForeground} />
                <Text style={[styles.scheduleBtnText, { color: colors.primaryForeground }]}>
                  Apply Schedule{isConnected ? " & Create Calendar Events" : ""}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <ScheduleTimeline scheduled={scheduled} unscheduled={unscheduled} />
      </ScrollView>
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
  calendarBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  calendarBannerText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
    paddingTop: 4,
  },
  summaryCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  summaryNum: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    borderRadius: 1,
  },
  scheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  scheduleBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
