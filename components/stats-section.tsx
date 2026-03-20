import type { LucideIcon } from "lucide-react";
import { CheckCircle, FileText, Globe, Users } from "lucide-react";
import { CountUp } from "@/components/count-up";
import { landing } from "@/lib/landing-theme";

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
      ? `${landing.section} bg-white dark:bg-zinc-950`
      : `${landing.sectionAlt} bg-gradient-to-b from-white to-zinc-50/90 dark:from-zinc-950 dark:to-zinc-900/50`;

  return (
    <section className={sectionClass}>
      <div className={landing.container}>
        <h2 className={landing.h2}>{title}</h2>
        <p className={landing.lead}>{subtitle}</p>
        <div className={landing.grid4}>
          {items.map(({ end, suffix, duration, icon: Icon, label }) => (
            <div
              key={label}
              className={`${landing.card} flex flex-col items-center gap-4 px-6 py-10 text-center`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <Icon className="h-7 w-7" />
              </div>
              <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                <CountUp
                  end={end}
                  duration={duration}
                  suffix={suffix}
                  startOnView
                  ease={ease}
                />
              </span>
              <p className="text-pretty text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
