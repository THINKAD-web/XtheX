import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface InquiryRow {
  id: string;
  mediaName: string;
  advertiserEmail: string;
  status: string;
  budget: number | null;
  createdAt: string;
}

export interface AdminRecentInquiriesProps {
  inquiries: InquiryRow[];
  className?: string;
}

function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  return cn(
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
    s === "PENDING" &&
      "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
    s === "REPLIED" &&
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
    s === "CLOSED" &&
      "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
    !["PENDING", "REPLIED", "CLOSED"].includes(s) &&
      "border-border bg-muted text-muted-foreground",
  );
}

function formatBudget(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCreatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AdminRecentInquiries({ inquiries, className }: AdminRecentInquiriesProps) {
  const rows = inquiries.slice(0, 5);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent inquiries</CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">Media</TableHead>
              <TableHead className="text-muted-foreground">Advertiser</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Budget</TableHead>
              <TableHead className="text-right text-muted-foreground">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No inquiries yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="max-w-[140px] truncate font-medium text-foreground">
                    {row.mediaName}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate text-muted-foreground">
                    {row.advertiserEmail}
                  </TableCell>
                  <TableCell>
                    <span className={statusBadgeClass(row.status)}>{row.status}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatBudget(row.budget)}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-xs sm:text-sm">
                    {formatCreatedAt(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
