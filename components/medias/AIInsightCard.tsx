import { Sparkles } from "lucide-react";

type Props = {
  title: string;
  points: string[];
};

export function AIInsightCard({ title, points }: Props) {
  return (
    <section className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-blue-50/90 to-cyan-50/70 p-5 shadow-sm dark:border-blue-900/50 dark:from-blue-950/40 dark:to-cyan-950/30">
      <h2 className="flex items-center gap-2 text-base font-semibold text-blue-900 dark:text-blue-100">
        <Sparkles className="h-4 w-4" />
        {title}
      </h2>
      <ul className="mt-3 space-y-2">
        {points.map((point, idx) => (
          <li
            key={`${idx}-${point}`}
            className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200"
          >
            - {point}
          </li>
        ))}
      </ul>
    </section>
  );
}
