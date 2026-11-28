import {
  computeTimerElapsedSec,
  formatTimerClock,
} from '@baby-buddy/core';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useThemeContext } from './ThemeProvider';

export function ActiveTimerBanner() {
  const router = useRouter();
  const { palette, activeFeedTimer, activeSleepStartMs, childProfile } =
    useThemeContext();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const hasActiveFeed = activeFeedTimer !== null;
  const hasActiveSleep = activeSleepStartMs !== null;

  useEffect(() => {
    if (!hasActiveFeed && !hasActiveSleep) {
      return;
    }
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [hasActiveFeed, hasActiveSleep]);

  if (!hasActiveFeed && !hasActiveSleep) {
    return null;
  }

  const babySummary = childProfile ? childProfile.nicknameMx : '';

  const feedLabel = activeFeedTimer
    ? `${activeFeedTimer.side === 'breast_left' ? 'Toma Izq' : 'Toma Der'}${activeFeedTimer.paused ? ' (pausa)' : ''} ${formatTimerClock(computeTimerElapsedSec(activeFeedTimer, nowMs))}`
    : null;

  const sleepLabel =
    activeSleepStartMs !== null
      ? `Siesta ${formatTimerClock(Math.max(0, Math.floor((nowMs - activeSleepStartMs) / 1000)))}`
      : null;

  const timerText = [feedLabel, sleepLabel].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={() => router.push('/(tabs)')}
      className="flex-row items-center justify-between gap-2 px-3 py-1 border-t"
      style={{
        backgroundColor: palette.brandSurface,
        borderTopColor: palette.brandPrimary,
      }}
      accessibilityRole="button"
      accessibilityLabel={`Cronómetro activo: ${timerText}`}
    >
      <Text
        numberOfLines={1}
        className="flex-1 text-[11px] font-bold"
        style={{ color: palette.brandText }}
      >
        {timerText}
        {babySummary ? ` · ${babySummary}` : ''}
      </Text>
      <Text className="text-[11px] font-bold" style={{ color: palette.brandText }}>
        Ver →
      </Text>
    </Pressable>
  );
}
