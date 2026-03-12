"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 p-6">
      <div className="mx-auto max-w-2xl rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-semibold">Partner dashboard error</h1>
        <p className="mt-2 text-sm text-zinc-700">
          {error.message || "Something went wrong."}
        </p>
        <div className="mt-4">
          <Button type="button" onClick={reset}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

