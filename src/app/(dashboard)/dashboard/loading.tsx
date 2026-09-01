export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded-lg bg-emerald-950/10" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-emerald-950/[0.06] bg-white p-5"
          >
            <div className="h-11 w-11 animate-pulse rounded-xl bg-emerald-950/5" />
            <div className="mt-4 h-7 w-20 animate-pulse rounded bg-emerald-950/10" />
            <div className="mt-2 h-3 w-16 animate-pulse rounded bg-emerald-950/5" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-emerald-950/[0.06] bg-white p-5 space-y-3"
          >
            <div className="h-5 w-32 animate-pulse rounded bg-emerald-950/10" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="h-12 animate-pulse rounded-xl bg-emerald-950/5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
