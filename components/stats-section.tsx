import type { LucideIcon } from "lucide-react";
import { CheckCircle, FileText, Globe, Users } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { Card, CardContent } from "@/components/ui/card";

const DEFAULT_ITEMS: Array<{
  end: number;
  suffix: string;
  duration: number;
  icon: LucideIcon;
  label: string;
}> = [
  {
    end: 1000,
    suffix: "+",
    duration: 2.5,
    icon: Users,
    label: "매체사 등록",
  },
  {
    end: 95,
    suffix: "%",
    duration: 2,
    icon: CheckCircle,
    label: "AI 검토 정확도",
  },
  {
    end: 50,
    suffix: "+",
    duration: 2,
    icon: Globe,
    label: "개국 이상 커버리지",
  },
  {
    end: 10000,
    suffix: "+",
    duration: 2.5,
    icon: FileText,
    label: "매월 제안서 처리",
  },
];

export type StatsSectionItem = {
  end: number;
  suffix: string;
  duration?: number;
  label: string;
};

type StatsSectionProps = {
  title?: string;
  subtitle?: string;
  firstStatEnd?: number;
  variant?: "default" | "calm";
  items?: StatsSectionItem[];
  ease?: "easeOut" | "easeInOut" | [number, number, number, number];
};

export function StatsSection({
  title = "XtheX by the Numbers",
  subtitle = "XtheX의 신뢰 지표",
  firstStatEnd = 1000,
  variant = "default",
  items: customItems,
  ease,
}: StatsSectionProps) {
  const items = customItems
    ? customItems.map((item, i) => ({
        ...DEFAULT_ITEMS[i],
        ...item,
        duration: item.duration ?? 2,
      }))
    : DEFAULT_ITEMS.map((item, i) =>
        i === 0 ? { ...item, end: firstStatEnd } : item
      );

  const sectionClass =
    variant === "calm"
      ? "relative border-t border-zinc-200 bg-white py-20 dark:border-zinc-800 dark:bg-zinc-950"
      : "relative border-t border-zinc-200 bg-gradient-to-b from-white to-zinc-50/80 py-20 dark:border-zinc-800 dark:from-zinc-950 dark:to-zinc-900/80";

  const cardClass =
    variant === "calm"
      ? "flex flex-col items-center border-zinc-200/80 bg-zinc-50/50 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
      : "flex flex-col items-center border-zinc-200/80 bg-white/60 text-center shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60";

  return (
    <section className={sectionClass}>
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {title}
        </h2>
        <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
          {subtitle}
        </p>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ end, suffix, duration, icon: Icon, label }) => (
            <Card key={label} className={cardClass}>
              <CardContent className="flex flex-col items-center gap-3 pt-8 pb-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                  <CountUp
                    end={end}
                    duration={duration}
                    suffix={suffix}
                    startOnView
                    ease={ease}
                  />
                </span>
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
