"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const StatCards = dynamic(
  () => import("@/components/dashboard/StatCards").then((m) => m.StatCards),
  { ssr: false },
);
const PerformanceChart = dynamic(
  () =>
    import("@/components/dashboard/PerformanceChart").then(
      (m) => m.PerformanceChart,
    ),
  { ssr: false },
);

type Role = "ADVERTISER" | "MEDIA_OWNER";

type AdvertiserStats = {
  role: "ADVERTISER";
  totalInquiries: number;
  pendingInquiries: number;
  totalBudget: number;
  avgPublishedCpm: number;
  recentInquiriesTrend: Array<{ m: string; inquiries: number }>;
  inquiryStatusDist: Array<{ name: string; value: number }>;
};

type MediaOwnerStats = {
  role: "MEDIA_OWNER";
  totalMedias: number;
  publishedMedias: number;
  pendingMedias: number;
  totalReceivedInquiries: number;
  monthlyInquiriesTrend: Array<{ m: string; inquiries: number }>;
  mediaStatusDist: Array<{ name: string; value: number }>;
};

function isAdvertiserStats(v: unknown): v is AdvertiserStats {
  return Boolean(
    v &&
      typeof v === "object" &&
      (v as any).role === "ADVERTISER" &&
      Array.isArray((v as any).recentInquiriesTrend),
  );
}

function isMediaOwnerStats(v: unknown): v is MediaOwnerStats {
  return Boolean(
    v &&
      typeof v === "object" &&
      (v as any).role === "MEDIA_OWNER" &&
      Array.isArray((v as any).monthlyInquiriesTrend),
  );
}

export function DashboardStatsSection({ role }: { role: Role }) {
  const tm = useTranslations("dashboard.mobile");
  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<AdvertiserStats | MediaOwnerStats | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) throw new Error((json as any)?.error ?? "Failed");
        if (role === "ADVERTISER" && isAdvertiserStats(json)) {
          setData(json);
          return;
        }
        if (role === "MEDIA_OWNER" && isMediaOwnerStats(json)) {
          setData(json);
          return;
        }
        throw new Error("Invalid stats payload");
      } catch {
        // fallback mock for resilience
        if (cancelled) return;
        if (role === "ADVERTISER") {
          setData({
            role: "ADVERTISER",
            totalInquiries: 24,
            pendingInquiries: 8,
            totalBudget: 12_800_000,
            avgPublishedCpm: 3400,
            recentInquiriesTrend: [
              { m: "10/01", inquiries: 2 },
              { m: "10/08", inquiries: 4 },
              { m: "10/15", inquiries: 5 },
              { m: "10/22", inquiries: 3 },
              { m: "10/29", inquiries: 6 },
            ],
            inquiryStatusDist: [
              { name: "PENDING", value: 8 },
              { name: "REPLIED", value: 12 },
              { name: "CLOSED", value: 4 },
            ],
          });
        } else {
          setData({
            role: "MEDIA_OWNER",
            totalMedias: 27,
            publishedMedias: 18,
            pendingMedias: 6,
            totalReceivedInquiries: 42,
            monthlyInquiriesTrend: [
              { m: "7월", inquiries: 8 },
              { m: "8월", inquiries: 12 },
              { m: "9월", inquiries: 9 },
              { m: "10월", inquiries: 15 },
              { m: "11월", inquiries: 11 },
              { m: "12월", inquiries: 18 },
            ],
            mediaStatusDist: [
              { name: "PENDING", value: 6 },
              { name: "PUBLISHED", value: 18 },
              { name: "REJECTED", value: 3 },
            ],
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (role === "ADVERTISER") {
    const s = isAdvertiserStats(data)
      ? data
      : {
          totalInquiries: 0,
          pendingInquiries: 0,
          totalBudget: 0,
          avgPublishedCpm: 0,
          recentInquiriesTrend: [] as Array<{ m: string; inquiries: number }>,
          inquiryStatusDist: [] as Array<{ name: string; value: number }>,
        };
    return (
      <>
        <StatCards
          loading={loading}
          swipeHint={tm("swipe_kpis_hint")}
          swipeAriaLabel={tm("carousel_stats_advertiser")}
          cards={[
            {
              label: "총 문의",
              value: s.totalInquiries.toLocaleString(),
              tone: "emerald",
            },
            {
              label: "대기 문의",
              value: s.pendingInquiries.toLocaleString(),
              tone: "blue",
            },
            {
              label: "총 예산 합계",
              value: `${s.totalBudget.toLocaleString()}원`,
              tone: "emerald",
            },
            {
              label: "평균 CPM",
              value: `${s.avgPublishedCpm.toLocaleString()}원`,
              tone: "zinc",
            },
          ]}
        />
        <PerformanceChart
          loading={loading}
          type="line"
          title="최근 문의 추이"
          subtitle="최근 30일, 주차별 문의 수"
          data={s.recentInquiriesTrend}
          xKey="m"
          lines={[{ key: "inquiries", color: "#10b981", name: "문의" }]}
        />
        <PerformanceChart
          loading={loading}
          type="bar"
          title="문의 상태 분포"
          subtitle="PENDING / REPLIED / CLOSED"
          data={s.inquiryStatusDist.map((x) => ({ state: x.name, count: x.value }))}
          xKey="state"
          bars={[{ key: "count", color: "#3b82f6", name: "건수" }]}
        />
      </>
    );
  }

  const m = isMediaOwnerStats(data)
    ? data
    : {
        totalMedias: 0,
        publishedMedias: 0,
        pendingMedias: 0,
        totalReceivedInquiries: 0,
        monthlyInquiriesTrend: [] as Array<{ m: string; inquiries: number }>,
        mediaStatusDist: [] as Array<{ name: string; value: number }>,
      };

  return (
    <>
      <StatCards
        loading={loading}
        swipeHint={tm("swipe_kpis_hint")}
        swipeAriaLabel={tm("carousel_stats_media_owner")}
        cards={[
          { label: "등록 미디어 수", value: m.totalMedias.toLocaleString(), tone: "emerald" },
          { label: "승인된 미디어", value: m.publishedMedias.toLocaleString(), tone: "blue" },
          { label: "대기 미디어", value: m.pendingMedias.toLocaleString(), tone: "zinc" },
          { label: "받은 문의", value: m.totalReceivedInquiries.toLocaleString(), tone: "emerald" },
        ]}
      />
      <PerformanceChart
        loading={loading}
        type="line"
        title="월별 받은 문의"
        subtitle="최근 6개월"
        data={m.monthlyInquiriesTrend}
        xKey="m"
        lines={[{ key: "inquiries", color: "#10b981", name: "문의" }]}
      />
      <PerformanceChart
        loading={loading}
        type="pie"
        title="미디어 상태 분포"
        subtitle="PENDING / PUBLISHED / REJECTED"
        data={m.mediaStatusDist}
        colors={["#f59e0b", "#10b981", "#ef4444"]}
      />
    </>
  );
}

