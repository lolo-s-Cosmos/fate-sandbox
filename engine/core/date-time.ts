import { Temporal } from "@js-temporal/polyfill";

const GAME_TIME_ZONE = "Asia/Tokyo";
const CHINESE_LOCALE = "zh-CN";
const DATE_TIME_FORMAT = new Intl.DateTimeFormat(CHINESE_LOCALE, {
  timeZone: GAME_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export interface HumanTimeParts {
  iso: string;
  date: string;
  time: string;
  weekday: string;
  display: string;
}

export function nowIso(): string {
  return Temporal.Now.instant().toString({ smallestUnit: "millisecond" });
}

export function normalizeIsoInstant(value: string, fieldName: string): string {
  try {
    return Temporal.Instant.from(value).toString({ smallestUnit: "millisecond" });
  } catch (error) {
    throw new Error(`非法${fieldName}: ${value}。${fieldName}必须是 ISO 时间字符串。`, {
      cause: error,
    });
  }
}

export function advanceIsoTime(isoTime: string, minutes: number): string {
  return parseInstant(isoTime, "推进时间")
    .add({ minutes })
    .toString({ smallestUnit: "millisecond" });
}

export function diffMinutes(fromIso: string, toIso: string): number {
  const from = parseInstant(fromIso, "起始时间");
  const to = parseInstant(toIso, "结束时间");
  const duration = from.until(to, { largestUnit: "minutes", smallestUnit: "minutes" });
  return duration.minutes;
}

export function isDifferentGameDate(beforeIso: string, afterIso: string): boolean {
  const beforeDate = toGamePlainDate(beforeIso);
  const afterDate = toGamePlainDate(afterIso);
  return !beforeDate.equals(afterDate);
}

export function formatHumanTime(isoTime: string): HumanTimeParts {
  const instant = parseInstant(isoTime, "显示时间");
  const zoned = instant.toZonedDateTimeISO(GAME_TIME_ZONE);
  const parts = DATE_TIME_FORMAT.formatToParts(new Date(instant.epochMilliseconds));
  const weekday = readDateTimePart(parts, "weekday");
  const date = `${zoned.year}年${pad2(zoned.month)}月${pad2(zoned.day)}日`;
  const time = `${pad2(zoned.hour)}:${pad2(zoned.minute)}`;
  return {
    iso: instant.toString({ smallestUnit: "millisecond" }),
    date,
    time,
    weekday,
    display: `${date} ${weekday} ${time}`,
  };
}

function parseInstant(isoTime: string, fieldName: string): Temporal.Instant {
  try {
    return Temporal.Instant.from(isoTime);
  } catch (error) {
    throw new Error(`无法解析${fieldName}: ${isoTime}`, { cause: error });
  }
}

function toGamePlainDate(isoTime: string): Temporal.PlainDate {
  return parseInstant(isoTime, "游戏日期").toZonedDateTimeISO(GAME_TIME_ZONE).toPlainDate();
}

function readDateTimePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  const part = parts.find((item) => item.type === type);
  if (!part) {
    throw new Error(`Intl.DateTimeFormat 未返回 ${type} 字段。`);
  }
  return part.value;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
