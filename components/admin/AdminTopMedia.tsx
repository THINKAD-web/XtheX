import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TopMediaRow {
  id: string;
  mediaName: string;
  category: string;
  viewCount: number;
  inquiryCount: number;
}

export interface AdminTopMediaProps {
  medias: TopMediaRow[];
  className?: string;
}

function formatCount(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}

export function AdminTopMedia({ medias, className }: AdminTopMediaProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Top media</CardTitle>
      </CardHeader>
      <CardContent>
        {medias.length === 0 ? (
          <p className="text-sm text-muted-foreground">No media data yet.</p>
        ) : (
          <ol className="space-y-4">
            {medias.map((item, index) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{item.mediaName}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
                      )}
                    >
                      {item.category}
                    </span>
                  </div>
                </div>
                <dl className="flex shrink-0 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Views</dt>
                    <dd className="font-medium tabular-nums text-foreground">
                      {formatCount(item.viewCount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Inquiries</dt>
                    <dd className="font-medium tabular-nums text-foreground">
                      {formatCount(item.inquiryCount)}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
