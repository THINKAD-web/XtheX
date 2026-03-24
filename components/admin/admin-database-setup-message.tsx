import { cn } from "@/lib/utils";

const panel =
  "rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]";

/**
 * Shown when DATABASE_URL is not set or DB connection refused (ECONNREFUSED).
 */
export function AdminDatabaseSetupMessage({
  connectionRefused = false,
}: {
  connectionRefused?: boolean;
}) {
  return (
    <div className={cn(panel, "max-w-2xl space-y-4")}>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {connectionRefused ? "Database connection refused" : "Database not configured"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {connectionRefused ? (
          "Postgres is not running at the URL in .env.local, or the URL is wrong. Use Neon (below) or start Postgres with docker compose up -d."
        ) : (
          <>
            Add{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">DATABASE_URL</code> to{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">.env.local</code> in the project root.
          </>
        )}
      </p>
      <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
        <li>
          Go to{" "}
          <a
            href="https://neon.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-blue-600 underline dark:text-blue-400"
          >
            neon.tech
          </a>{" "}
          and create a project.
        </li>
        <li>
          Copy the <strong className="text-foreground">Connection string</strong> from the dashboard.
        </li>
        <li>
          In <code className="rounded bg-muted px-1 py-0.5 text-foreground">.env.local</code>, set{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">DATABASE_URL=</code> and paste the string.
        </li>
        <li>
          Run <code className="rounded bg-muted px-1 py-0.5 text-foreground">npx prisma db push</code> and restart the dev
          server.
        </li>
      </ol>
    </div>
  );
}
