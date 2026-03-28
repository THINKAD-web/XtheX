"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type DailyChartData = { date: string; count: number }[];

export interface AdminDashboardChartsProps {
  inquiryData: DailyChartData;
  viewData: DailyChartData;
  className?: string;
}

const PRIMARY_STROKE = "hsl(var(--primary))";

function formatTickDate(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

export function AdminDashboardCharts({
  inquiryData,
  viewData,
  className,
}: AdminDashboardChartsProps) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-2", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Daily inquiries (last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] min-h-[240px] w-full pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={inquiryData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="adminInquiryGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PRIMARY_STROKE} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={PRIMARY_STROKE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatTickDate}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--card-foreground))",
                }}
                labelFormatter={(label) => formatTickDate(String(label))}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke={PRIMARY_STROKE}
                strokeWidth={2}
                fill="url(#adminInquiryGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Daily media views (last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] min-h-[240px] w-full pt-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={viewData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatTickDate}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                  color: "hsl(var(--card-foreground))",
                }}
                labelFormatter={(label) => formatTickDate(String(label))}
              />
              <Bar dataKey="count" fill={PRIMARY_STROKE} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
