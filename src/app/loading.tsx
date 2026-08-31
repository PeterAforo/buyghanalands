export default function Loading() {
  return (
    <div className="min-h-screen bg-[#faf8f2] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
        <p className="text-sm font-medium text-gray-500">Loading…</p>
      </div>
    </div>
  );
}
