export default function Loading() {
  return (
    <div className="min-h-screen bg-zinc-50 p-4">
      <div className="mx-auto max-w-6xl grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="h-[520px] animate-pulse rounded-lg border border-zinc-200 bg-white" />
        <div className="h-[520px] animate-pulse rounded-lg border border-zinc-200 bg-white" />
      </div>
    </div>
  );
}

