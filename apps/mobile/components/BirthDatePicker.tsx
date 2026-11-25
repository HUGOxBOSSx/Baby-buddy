import {
  calculateAgeMonthsFromBirthDate,
  formatChildAgeMx,
} from '@baby-buddy/core';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useThemeContext } from './ThemeProvider';

const MONTHS_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function clampDate(year: number, month: number, day: number): string {
  const now = new Date();
  const maxY = now.getFullYear();
  const safeY = Math.min(maxY, Math.max(maxY - 6, year));
  const maxM = safeY === maxY ? now.getMonth() + 1 : 12;
  const safeM = Math.min(maxM, Math.max(1, month));
  const daysInMonth = new Date(safeY, safeM, 0).getDate();
  const maxD =
    safeY === maxY && safeM === now.getMonth() + 1
      ? Math.min(daysInMonth, now.getDate())
      : daysInMonth;
  const safeD = Math.min(maxD, Math.max(1, day));
  return `${safeY}-${pad2(safeM)}-${pad2(safeD)}`;
}

export interface BirthDatePickerProps {
  readonly value: string;
  readonly onChange: (ymd: string) => void;
  readonly label?: string;
}

export function BirthDatePicker({
  value,
  onChange,
  label = 'Fecha de nacimiento',
}: BirthDatePickerProps) {
  const { palette } = useThemeContext();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  const years = Array.from({ length: 7 }, (_, i) => currentYear - i);

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  const selYear = match ? Number(match[1]) : currentYear;
  const selMonth = match ? Number(match[2]) : currentMonth;
  const selDay = match ? Number(match[3]) : currentDay;

  const maxMonth = selYear === currentYear ? currentMonth : 12;
  const daysInMonth = new Date(selYear, selMonth, 0).getDate();
  const maxDay =
    selYear === currentYear && selMonth === currentMonth
      ? Math.min(daysInMonth, currentDay)
      : daysInMonth;

  const ageLabel =
    match !== null
      ? (() => {
          try {
            return formatChildAgeMx(calculateAgeMonthsFromBirthDate(value));
          } catch {
            return null;
          }
        })()
      : null;

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between flex-wrap gap-1">
        <Text className="text-xs font-bold" style={{ color: palette.textPrimary }}>
          {label}
        </Text>
        <Text className="text-xs font-semibold" style={{ color: palette.brandText }}>
          {match
            ? `${selDay} ${MONTHS_ES[selMonth - 1]} ${selYear}${ageLabel ? ` · ${ageLabel}` : ''}`
            : 'Toca año, mes y día'}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5">
          {years.map((y) => {
            const active = match !== null && selYear === y;
            return (
              <Pressable
                key={y}
                onPress={() => onChange(clampDate(y, selMonth, selDay))}
                className="rounded-full border px-3 py-1.5 justify-center"
                style={{
                  minHeight: 36,
                  backgroundColor: active ? palette.brandPrimary : palette.bgCard,
                  borderColor: active
                    ? palette.brandPrimary
                    : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-bold"
                  style={{
                    color: active ? palette.onBrandPrimary : palette.textPrimary,
                  }}
                >
                  {y}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5">
          {MONTHS_ES.slice(0, maxMonth).map((mLabel, idx) => {
            const mNum = idx + 1;
            const active = match !== null && selMonth === mNum;
            return (
              <Pressable
                key={mLabel}
                onPress={() => onChange(clampDate(selYear, mNum, selDay))}
                className="rounded-full border px-3 py-1.5 justify-center"
                style={{
                  minHeight: 36,
                  backgroundColor: active ? palette.brandPrimary : palette.bgCard,
                  borderColor: active
                    ? palette.brandPrimary
                    : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: active ? palette.onBrandPrimary : palette.textPrimary,
                  }}
                >
                  {mLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row gap-1.5">
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => {
            const active = match !== null && selDay === d;
            return (
              <Pressable
                key={d}
                onPress={() => onChange(clampDate(selYear, selMonth, d))}
                className="rounded-full border px-2.5 py-1.5 justify-center items-center"
                style={{
                  minWidth: 36,
                  minHeight: 36,
                  backgroundColor: active ? palette.brandPrimary : palette.bgCard,
                  borderColor: active
                    ? palette.brandPrimary
                    : palette.borderInteractive,
                }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{
                    color: active ? palette.onBrandPrimary : palette.textPrimary,
                  }}
                >
                  {d}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
