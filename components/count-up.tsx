"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type EaseOption = "easeOut" | "easeInOut" | [number, number, number, number];

type CountUpProps = {
  end: number;
  duration?: number;
  suffix?: string;
  startOnView?: boolean;
  ease?: EaseOption;
};

export function CountUp({
  end,
  duration = 2,
  suffix = "",
  startOnView = true,
  ease = "easeOut",
}: CountUpProps) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  const easeValue = ease === "easeOut" || ease === "easeInOut" ? ease : ease;

  useEffect(() => {
    let controls: { stop: () => void } | null = null;

    if (!startOnView) {
      controls = animate(0, end, {
        duration,
        ease: easeValue,
        onUpdate: (v) => setDisplay(v),
      });
      return () => controls?.stop();
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (hasStarted.current) return;
        if (!entries[0]?.isIntersecting) return;
        hasStarted.current = true;
        controls = animate(0, end, {
          duration,
          ease: easeValue,
          onUpdate: (v) => setDisplay(v),
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      controls?.stop();
    };
  }, [end, duration, startOnView, easeValue]);

  const formatted = Math.round(display).toLocaleString();

  return (
    <span ref={ref} className="tabular-nums">
      {formatted}
      {suffix}
    </span>
  );
}
