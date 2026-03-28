import { Megaphone, MessageSquare, Monitor, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface AdminDashboardStatsProps {
  totalMedia: number;
  totalInquiries: number;
  newUsers: number;
  activeCampaigns: number;
  className?: string;
}

function formatStat(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}

export function AdminDashboardStats({
  totalMedia,
  totalInquiries,
  newUsers,
  activeCampaigns,
  className,
}: AdminDashboardStatsProps) {
  const items = [
    {
      label: "Total media",
      value: totalMedia,
      icon: Monitor,
    },
    {
      label: "Total inquiries",
      value: totalInquiries,
      icon: MessageSquare,
    },
    {
      label: "New users",
      value: newUsers,
      icon: Users,
    },
    {
      label: "Active campaigns",
      value: activeCampaigns,
      icon: Megaphone,
    },
  ] as const;

  return (
    <div className={cn("grid grid-cols-2 gap-4 lg:grid-cols-4", className)}>
      {items.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {formatStat(value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
