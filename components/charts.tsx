/*
  Small charts for the Overview, drawn as SVG/HTML so they follow the theme tokens and need no library.
  · Ring: one percentage (reply rate).
  · Funnel: how far people get, from on your list to interested.
  · WeekBars: emails per day for the past week plus the scheduled ones ahead, today marked.
*/

export function Ring({ value, label, sub }: { value: number; label: string; sub: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" width={112} height={112} className="shrink-0" role="img" aria-label={`${label}: ${Math.round(v * 100)}%`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke="var(--accent-500)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`} transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dasharray 1s var(--soft)" }}
        />
        <text x="60" y="66" textAnchor="middle" style={{ font: "900 26px var(--font)", fill: "var(--ink)" }}>
          {Math.round(v * 100)}%
        </text>
      </svg>
      <div>
        <div className="font-extrabold text-ink">{label}</div>
        <p className="mt-1 max-w-[22ch] text-body-s text-muted">{sub}</p>
      </div>
    </div>
  );
}

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((s, i) => (
        <li key={s.label} className="grid grid-cols-[92px_1fr_28px] items-center gap-3 text-body-s">
          <span className="truncate text-muted">{s.label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-surface-2">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${(s.value / max) * 100}%`,
                background: `color-mix(in srgb, var(--accent-500) ${100 - i * 14}%, var(--accent-200))`,
              }}
            />
          </span>
          <span className="tabular text-right font-extrabold text-ink">{s.value}</span>
        </li>
      ))}
    </ol>
  );
}

export function WeekBars({ days }: { days: { label: string; sent: number; scheduled: number; today?: boolean }[] }) {
  const max = Math.max(1, ...days.map((d) => d.sent + d.scheduled));
  return (
    <div>
      <div className="flex h-[132px] items-end gap-2" role="img" aria-label={`Emails per day: ${days.map((d) => `${d.label} ${d.sent} sent${d.scheduled ? `, ${d.scheduled} scheduled` : ""}`).join("; ")}`}>
        {days.map((d) => (
          <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="tabular text-label font-extrabold text-ink">{d.sent + d.scheduled || ""}</span>
            <div className="flex w-full max-w-[38px] flex-col justify-end overflow-hidden rounded-[10px]" style={{ height: `${((d.sent + d.scheduled) / max) * 100}%`, minHeight: 6 }}>
              {d.scheduled ? (
                <span className="block w-full border-2 border-dashed border-accent-500 bg-accent-50" style={{ height: `${(d.scheduled / (d.sent + d.scheduled)) * 100}%`, borderRadius: d.sent ? "10px 10px 0 0" : 10 }} />
              ) : null}
              {d.sent ? <span className="block w-full flex-1 bg-accent-500" /> : null}
              {!d.sent && !d.scheduled ? <span className="block h-[6px] w-full rounded-full bg-surface-2" /> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        {days.map((d) => (
          <span key={d.label} className={`flex-1 text-center text-label ${d.today ? "font-extrabold text-accent-600" : "text-muted"}`}>
            {d.label}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-4 text-label text-muted">
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px] bg-accent-500" /> Sent</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px] border-2 border-dashed border-accent-500" /> Scheduled</span>
      </div>
    </div>
  );
}
