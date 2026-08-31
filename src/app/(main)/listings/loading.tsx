export default function ListingsLoading() {
  return (
    <div className="min-h-screen bg-[#faf8f2] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-emerald-950/10" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-emerald-950/5" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-3xl border border-emerald-950/10 bg-white"
            >
              <div className="aspect-[4/3] animate-pulse bg-emerald-950/5" />
              <div className="p-5 space-y-3">
                <div className="h-5 w-3/4 animate-pulse rounded bg-emerald-950/10" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-emerald-950/5" />
                <div className="h-6 w-1/3 animate-pulse rounded bg-emerald-950/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
