type Item = {
  label: string;
  value: number;
  displayValue?: string;
};

export function BarBreakdown({ items }: { items: Item[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="mt-4 space-y-2.5">
      {items.map((item) => {
        const pct = Math.round((item.value / max) * 100);
        return (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="tabular-nums text-slate-500">
                {item.displayValue ?? item.value}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: "var(--viz-sequential)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
