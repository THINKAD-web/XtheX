"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

const isDatabaseUrlMissing = (msg: string) =>
  /Missing DATABASE_URL|DATABASE_URL/.test(msg);

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const msg = error.message || "Something went wrong.";
  const showDbSetup = isDatabaseUrlMissing(msg);

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-900">
      <div className="mx-auto max-w-2xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800">
        <h1 className="text-xl font-semibold">
          {showDbSetup ? "Database not configured" : "Admin page error"}
        </h1>
        {showDbSetup ? (
          <div className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
            <p>Add <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">DATABASE_URL</code> to <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">.env.local</code> in the project root.</p>
            <ol className="list-inside list-decimal space-y-1">
              <li>Go to <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline dark:text-blue-400">neon.tech</a> and create a project.</li>
              <li>Copy the <strong>Connection string</strong> from the dashboard.</li>
              <li>In <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">.env.local</code>, set <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">DATABASE_URL=</code> and paste the string.</li>
              <li>Run <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">npx prisma db push</code> and restart the dev server.</li>
            </ol>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{msg}</p>
        )}
        <div className="mt-4">
          <Button type="button" onClick={reset}>
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}

