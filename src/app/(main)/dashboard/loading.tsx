export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#faf8f2] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-emerald-950/10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-emerald-950/10 bg-white p-6"
            >
              <div className="h-12 w-12 animate-pulse rounded-xl bg-emerald-950/5" />
              <div className="mt-4 h-8 w-20 animate-pulse rounded bg-emerald-950/10" />
              <div className="mt-2 h-4 w-16 animate-pulse rounded bg-emerald-950/5" />
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-3xl border border-emerald-950/10 bg-white p-6 space-y-3"
            >
              <div className="h-6 w-32 animate-pulse rounded bg-emerald-950/10" />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-12 animate-pulse rounded-xl bg-emerald-950/5" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
