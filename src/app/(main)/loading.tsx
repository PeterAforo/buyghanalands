export default function MainLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8f2]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-700" />
        <p className="text-sm font-medium text-gray-500">Loading…</p>
      </div>
    </div>
  );
}
