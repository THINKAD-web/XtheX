export default function AdminReviewLoading() {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 h-5 w-48 animate-pulse rounded bg-zinc-800" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-xl border border-zinc-800 bg-zinc-950"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
