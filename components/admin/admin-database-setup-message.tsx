import { landing } from "@/lib/landing-theme";

/**
 * Shown when DATABASE_URL is not set or DB connection refused (ECONNREFUSED).
 */
export function AdminDatabaseSetupMessage({
  connectionRefused = false,
}: {
  connectionRefused?: boolean;
}) {
  return (
    <div
      className={`${landing.card} max-w-2xl space-y-4 hover:scale-100`}
    >
      <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
        {connectionRefused ? "Database connection refused" : "Database not configured"}
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {connectionRefused
          ? "Postgres is not running at the URL in .env.local, or the URL is wrong. Use Neon (below) or start Postgres with docker compose up -d."
          : (
            <>
              Add <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-700">DATABASE_URL</code> to{" "}
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-700">.env.local</code> in the project root.
            </>
          )}
      </p>
      <ol className="list-inside list-decimal space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <li>
          Go to{" "}
          <a
            href="https://neon.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline dark:text-blue-400"
          >
            neon.tech
          </a>{" "}
          and create a project.
        </li>
        <li>Copy the <strong>Connection string</strong> from the dashboard.</li>
        <li>
          In <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">.env.local</code>, set{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">DATABASE_URL=</code> and paste the string.
        </li>
        <li>
          Run <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-700">npx prisma db push</code> and restart the dev server.
        </li>
      </ol>
    </div>
  );
}
