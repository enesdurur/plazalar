import { MONTH_NAMES, MONTH_WEEK_RANGES, isPastWeek } from "./weeks";

export interface PlanWeekEntryLike {
  itemId: string;
  week: number;
  completed: boolean | null;
}

export interface PlanItemLike {
  id: string;
  label: string;
  scheduledWeeks: number[];
}

export interface MissedOccurrence {
  itemId: string;
  itemLabel: string;
  week: number;
  month: string;
}

export interface PlanYearStats {
  totalScheduled: number;
  done: number;
  missed: number;
  pending: number;
  monthlyDone: number[];
  monthlyMissed: number[];
  monthlyPending: number[];
  missedList: MissedOccurrence[];
}

/** Bir plan modülü (Yıllık Bakım Planı / Periyodik (Fenni) Muayene) için, yalnızca Excel'de
 * işaretli (scheduledWeeks) haftaları sayarak yıl geneli ve ay ay yapıldı/yapılmadı/bekliyor
 * istatistiklerini hesaplar. Geçmiş aylardaki işaretli hafta, elle kayıt yoksa otomatik
 * "yapıldı" sayılır — matris sayfalarındaki görünümle birebir aynı mantık. */
export function computePlanYearStats(
  items: PlanItemLike[],
  entries: PlanWeekEntryLike[],
  year: number,
  now: Date = new Date()
): PlanYearStats {
  const entryMap = new Map(entries.map((e) => [`${e.itemId}-${e.week}`, e]));
  let done = 0;
  let missed = 0;
  let pending = 0;
  const monthlyDone = Array(12).fill(0);
  const monthlyMissed = Array(12).fill(0);
  const monthlyPending = Array(12).fill(0);
  const missedList: MissedOccurrence[] = [];

  for (const item of items) {
    for (const week of item.scheduledWeeks) {
      const entry = entryMap.get(`${item.id}-${week}`);
      const completed = entry?.completed ?? (isPastWeek(year, week, now) ? true : null);
      const monthIdx = MONTH_WEEK_RANGES.findIndex(
        (r) => week >= r.startWeek && week <= r.endWeek
      );

      if (completed === true) {
        done++;
        if (monthIdx !== -1) monthlyDone[monthIdx]++;
      } else if (completed === false) {
        missed++;
        if (monthIdx !== -1) monthlyMissed[monthIdx]++;
        missedList.push({
          itemId: item.id,
          itemLabel: item.label,
          week,
          month: monthIdx !== -1 ? MONTH_NAMES[monthIdx] : "",
        });
      } else {
        pending++;
        if (monthIdx !== -1) monthlyPending[monthIdx]++;
      }
    }
  }

  missedList.sort((a, b) => a.week - b.week);

  return {
    totalScheduled: done + missed + pending,
    done,
    missed,
    pending,
    monthlyDone,
    monthlyMissed,
    monthlyPending,
    missedList,
  };
}
