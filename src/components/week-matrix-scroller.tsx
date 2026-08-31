"use client";

import { useEffect, useRef } from "react";

export function WeekMatrixScroller({
  leadingWidth,
  weekWidth,
  monthWeekCounts,
  initialMonthIndex,
  children,
}: {
  leadingWidth: number;
  weekWidth: number;
  monthWeekCounts: number[];
  initialMonthIndex: number | null;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current || initialMonthIndex == null) return;
    const weeksBefore = monthWeekCounts.slice(0, initialMonthIndex).reduce((a, b) => a + b, 0);
    scrollRef.current.scrollLeft = Math.max(0, leadingWidth + weeksBefore * weekWidth - weekWidth);
    // Sadece ilk yüklemede — bağımlılık listesi kasıtlı olarak boş.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scrollByMonth(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * weekWidth * 4.4, behavior: "smooth" });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2 md:hidden print:hidden">
        <p className="text-xs text-slate-400">← Ayları görmek için kaydırın →</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => scrollByMonth(-1)}
            aria-label="Önceki aylar"
            className="rounded-md border border-slate-300 px-2.5 py-1 text-sm text-slate-600 active:bg-slate-100"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scrollByMonth(1)}
            aria-label="Sonraki aylar"
            className="rounded-md border border-slate-300 px-2.5 py-1 text-sm text-slate-600 active:bg-slate-100"
          >
            →
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="mt-1 max-h-[70vh] overflow-auto rounded-lg border border-slate-200 bg-white md:mt-6"
        style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorX: "contain" }}
      >
        {children}
      </div>
    </div>
  );
}
