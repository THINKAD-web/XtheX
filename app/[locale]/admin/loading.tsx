export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-white p-6" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-white p-4" />
          <div className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-white p-4" />
          <div className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-white p-4" />
        </div>
        <div className="h-96 animate-pulse rounded-lg border border-zinc-200 bg-white p-6" />
      </div>
    </div>
  );
}

