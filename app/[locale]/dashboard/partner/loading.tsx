export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="h-24 animate-pulse rounded-lg border border-zinc-200 bg-white p-6" />
        <div className="h-64 animate-pulse rounded-lg border border-zinc-200 bg-white p-6" />
        <div className="h-72 animate-pulse rounded-lg border border-zinc-200 bg-white p-6" />
      </div>
    </div>
  );
}

