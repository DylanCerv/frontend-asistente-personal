import Ionicons from '@react-native-vector-icons/ionicons';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import {
  APP_ACCENT,
  APP_BORDER,
  APP_SURFACE,
  APP_SURFACE_SOFT,
  APP_TEXT_DIM,
  APP_TEXT_MUTED,
} from '@/constants/app-colors';

const CYAN = '#2DD4BF';
const CYAN_SOFT = 'rgba(45, 212, 191, 0.14)';
const CYAN_BORDER = 'rgba(45, 212, 191, 0.55)';

type TaskRowProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  active?: boolean;
  delay?: number;
};

function TaskRow({ icon, title, subtitle, active = false, delay = 0 }: TaskRowProps) {
  const glow = useSharedValue(active ? 0.45 : 0);

  useEffect(() => {
    if (!active) return;
    glow.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.85, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.4, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        true,
      ),
    );
  }, [active, delay, glow]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(480).delay(delay).easing(Easing.out(Easing.cubic))}
      style={[styles.taskRow, active ? styles.taskRowActive : styles.taskRowIdle]}>
      {active ? <Animated.View pointerEvents="none" style={[styles.taskGlow, glowStyle]} /> : null}

      <View style={[styles.taskIcon, active ? styles.taskIconActive : null]}>
        <Ionicons name={icon} size={17} color={active ? CYAN : '#5A5A5A'} />
      </View>

      <View style={styles.taskCopy}>
        <Text style={[styles.taskTitle, !active && styles.taskTitleIdle]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.taskSubtitle, !active && styles.taskSubtitleIdle]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {active ? <View style={styles.activeDot} /> : <View style={styles.idleDot} />}
    </Animated.View>
  );
}

type MiniCardProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  delay?: number;
};

function MiniCard({ icon, iconColor, iconBg, title, description, delay = 0 }: MiniCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(480).delay(delay).easing(Easing.out(Easing.cubic))}
      style={styles.miniCard}>
      <View style={[styles.miniIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.miniTitle}>{title}</Text>
      <Text style={styles.miniDescription}>{description}</Text>
    </Animated.View>
  );
}

export function OnboardingPrioritiesVisual() {
  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.ambientGlow} />

      <Animated.View entering={FadeIn.duration(500)} style={styles.mainCard}>
        <View style={styles.mainHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={14} color={CYAN} />
            <Text style={styles.mainHeaderLabel}>ANÁLISIS EN TIEMPO REAL</Text>
          </View>
          <View style={styles.activeBadge}>
            <View style={styles.activeBadgeDot} />
            <Text style={styles.activeBadgeText}>ACTIVO</Text>
          </View>
        </View>

        <View style={styles.taskList}>
          <TaskRow
            active
            delay={140}
            icon="alert-circle-outline"
            title="Revisar propuesta de diseño"
            subtitle="Vence en 2 horas • Alta prioridad"
          />
          <TaskRow
            delay={240}
            icon="mail-outline"
            title="Responder correos pendientes"
            subtitle="Sin fecha límite"
          />
          <TaskRow
            delay={340}
            icon="time-outline"
            title="Actualizar backlog mensual"
            subtitle="Mañana"
          />
        </View>
      </Animated.View>

      <View style={styles.miniRow}>
        <MiniCard
          delay={420}
          icon="flash"
          iconColor={APP_ACCENT}
          iconBg="rgba(196, 181, 253, 0.14)"
          title="Enfoque Total"
          description="Reduce distracciones eliminando el ruido visual."
        />
        <MiniCard
          delay={500}
          icon="hardware-chip-outline"
          iconColor={CYAN}
          iconBg={CYAN_SOFT}
          title="Adaptativo"
          description="Aprende de tus hábitos para mejorar las sugerencias."
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  ambientGlow: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: CYAN,
    opacity: 0.06,
  },
  mainCard: {
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2A2A32',
    backgroundColor: '#121218',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  mainHeaderLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: CYAN_SOFT,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  activeBadgeDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: CYAN,
  },
  activeBadgeText: {
    color: CYAN,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  taskList: {
    gap: 8,
  },
  taskRow: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 11,
  },
  taskRowActive: {
    borderColor: CYAN_BORDER,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  taskRowIdle: {
    borderColor: 'transparent',
    backgroundColor: '#0C0C10',
    opacity: 0.55,
  },
  taskGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(45, 212, 191, 0.08)',
  },
  taskIcon: {
    height: 34,
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: APP_SURFACE_SOFT,
  },
  taskIconActive: {
    backgroundColor: CYAN_SOFT,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
  },
  taskCopy: {
    flex: 1,
    gap: 3,
  },
  taskTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  taskTitleIdle: {
    color: '#9A9A9A',
  },
  taskSubtitle: {
    color: APP_TEXT_MUTED,
    fontSize: 11,
    lineHeight: 14,
  },
  taskSubtitleIdle: {
    color: '#5C5C5C',
  },
  activeDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: CYAN,
    shadowColor: CYAN,
    shadowOpacity: 0.95,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  idleDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
    backgroundColor: '#2E2E2E',
  },
  miniRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniCard: {
    flex: 1,
    gap: 8,
    minHeight: 118,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A32',
    backgroundColor: APP_SURFACE,
    paddingHorizontal: 13,
    paddingVertical: 13,
  },
  miniIconWrap: {
    height: 32,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  miniTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  miniDescription: {
    color: APP_TEXT_DIM,
    fontSize: 11,
    lineHeight: 15,
  },
});
