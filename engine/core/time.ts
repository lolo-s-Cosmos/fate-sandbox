import type { State } from "./state";

import { advanceIsoTime, diffMinutes, isDifferentGameDate } from "./date-time";

export type TimeActivityKind =
  | "高压行动"
  | "低压行动"
  | "休息"
  | "睡眠"
  | "治疗"
  | "魔术治疗"
  | "安全屋整备"
  | "补魔";

export interface TimeState {
  开局时间: string;
  当前时间: string;
  当天休息分钟: number;
  当天高压分钟: number;
  当天低压分钟: number;
}

export interface TimeSegmentInput {
  minutes: number;
  activityKind: TimeActivityKind;
}

export interface TimeSegmentResult {
  beforeTime: string;
  afterTime: string;
  elapsedMinutes: number;
  crossedMidnight: boolean;
}

export function advanceTimeSegment(state: State, input: TimeSegmentInput): TimeSegmentResult {
  const beforeTime = state.时间.当前时间;
  const afterTime = advanceIsoTime(beforeTime, input.minutes);
  const crossedMidnight = isDifferentGameDate(beforeTime, afterTime);

  state.时间.当前时间 = afterTime;
  if (crossedMidnight) {
    state.时间.当天休息分钟 = 0;
    state.时间.当天高压分钟 = 0;
    state.时间.当天低压分钟 = 0;
  }
  addActivityMinutes(state.时间, input.activityKind, input.minutes);

  return {
    beforeTime,
    afterTime,
    elapsedMinutes: elapsedGameMinutes(state),
    crossedMidnight,
  };
}

export function elapsedGameMinutes(state: State): number {
  return diffMinutes(state.时间.开局时间, state.时间.当前时间);
}

function addActivityMinutes(time: TimeState, kind: TimeActivityKind, minutes: number): void {
  switch (kind) {
    case "高压行动":
      time.当天高压分钟 += minutes;
      break;
    case "低压行动":
      time.当天低压分钟 += minutes;
      break;
    case "休息":
    case "睡眠":
    case "治疗":
    case "魔术治疗":
    case "安全屋整备":
    case "补魔":
      time.当天休息分钟 += minutes;
      break;
    default: {
      const exhaustive: never = kind;
      throw new Error(`未处理的时间段类型: ${String(exhaustive)}`);
    }
  }
}
