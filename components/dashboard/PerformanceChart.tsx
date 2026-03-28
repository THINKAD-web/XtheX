"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

type LineDatum = Record<string, string | number>;
type BarDatum = Record<string, string | number>;
type PieDatum = { name: string; value: number };

type CommonProps = {
  title: string;
  subtitle?: string;
  loading?: boolean;
  className?: string;
};

type LineProps = CommonProps & {
  type: "line";
  data: LineDatum[];
  xKey: string;
  lines: { key: string; color: string; name?: string }[];
};

type BarProps = CommonProps & {
  type: "bar";
  data: BarDatum[];
  xKey: string;
  bars: { key: string; color: string; name?: string }[];
};

type PieProps = CommonProps & {
  type: "pie";
  data: PieDatum[];
  colors: string[];
};

type Props = LineProps | BarProps | PieProps;

function ChartShell({
  title,
  subtitle,
  loading,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.04] dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/[0.06]",
        className,
      )}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {subtitle}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="h-[280px] w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      ) : (
        <div className="h-[280px] w-full">{children}</div>
      )}
    </section>
  );
}

export function PerformanceChart(props: Props) {
  if (props.type === "line") {
    return (
      <ChartShell {...props}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={props.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.35)" />
            <XAxis dataKey={props.xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            {props.lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.name ?? l.key}
                stroke={l.color}
                strokeWidth={2.5}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  if (props.type === "bar") {
    return (
      <ChartShell {...props}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={props.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(161,161,170,0.35)" />
            <XAxis dataKey={props.xKey} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            {props.bars.map((b) => (
              <Bar
                key={b.key}
                dataKey={b.key}
                name={b.name ?? b.key}
                fill={b.color}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartShell>
    );
  }

  return (
    <ChartShell {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Legend />
          <Pie
            data={props.data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={3}
          >
            {props.data.map((_, i) => (
              <Cell key={i} fill={props.colors[i % props.colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

