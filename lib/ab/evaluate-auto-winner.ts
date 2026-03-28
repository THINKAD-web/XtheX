import type { AbVariantKey } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AbAggregates = {
  impressionA: number;
  impressionB: number;
  conversionA: number;
  conversionB: number;
};

export async function aggregateAbExperiment(
  experimentId: string,
): Promise<AbAggregates> {
  const rows = await prisma.abEvent.groupBy({
    by: ["variant", "type"],
    where: { experimentId },
    _count: { _all: true },
  });

  const out: AbAggregates = {
    impressionA: 0,
    impressionB: 0,
    conversionA: 0,
    conversionB: 0,
  };
  for (const r of rows) {
    const n = r._count._all;
    if (r.variant === "A" && r.type === "IMPRESSION") out.impressionA = n;
    if (r.variant === "B" && r.type === "IMPRESSION") out.impressionB = n;
    if (r.variant === "A" && r.type === "CONVERSION") out.conversionA = n;
    if (r.variant === "B" && r.type === "CONVERSION") out.conversionB = n;
  }
  return out;
}

export type AutoWinnerResult =
  | {
      applied: true;
      winner: AbVariantKey;
      reason: string;
      aggregates: AbAggregates;
    }
  | {
      applied: false;
      reason: string;
      aggregates: AbAggregates;
    };

/**
 * 변형별 최소 노출이 채워지면 전환율이 높은 쪽을 승자로 두고 실험을 CONCLUDED로 둡니다.
 */
export async function evaluateAndApplyAbWinner(
  experimentId: string,
  minImpressionsPerVariant: number,
): Promise<AutoWinnerResult> {
  const aggregates = await aggregateAbExperiment(experimentId);
  const { impressionA, impressionB, conversionA, conversionB } = aggregates;

  if (
    impressionA < minImpressionsPerVariant ||
    impressionB < minImpressionsPerVariant
  ) {
    return {
      applied: false,
      reason: "min_impressions_not_met",
      aggregates,
    };
  }

  const rateA = conversionA / Math.max(impressionA, 1);
  const rateB = conversionB / Math.max(impressionB, 1);

  let winner: AbVariantKey;
  if (rateA > rateB) winner = "A";
  else if (rateB > rateA) winner = "B";
  else if (conversionA !== conversionB) {
    winner = conversionA > conversionB ? "A" : "B";
  } else if (impressionA !== impressionB) {
    winner = impressionA >= impressionB ? "A" : "B";
  } else {
    winner = "A";
  }

  await prisma.abExperiment.update({
    where: { id: experimentId },
    data: {
      status: "CONCLUDED",
      winnerVariant: winner,
    },
  });

  return {
    applied: true,
    winner,
    reason: "auto_by_conversion_rate",
    aggregates,
  };
}
