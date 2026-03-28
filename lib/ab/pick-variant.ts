import { createHash } from "node:crypto";
import type { AbExperimentStatus, AbVariantKey } from "@prisma/client";

type ExperimentRow = {
  id: string;
  status: AbExperimentStatus;
  trafficSplitA: number;
  winnerVariant: AbVariantKey | null;
};

/**
 * 결론 난 실험은 승자만, 실행 중은 subjectKey 기준 결정적 분배.
 */
export function pickAbVariant(
  experiment: ExperimentRow | null,
  subjectKey: string,
): AbVariantKey {
  if (!experiment) return "A";
  if (experiment.status === "CONCLUDED" && experiment.winnerVariant) {
    return experiment.winnerVariant;
  }
  if (experiment.status !== "RUNNING") {
    return "A";
  }
  const split = Math.min(100, Math.max(0, experiment.trafficSplitA));
  const h = createHash("sha256").update(`${subjectKey}:${experiment.id}`).digest();
  const bucket = h.readUInt32BE(0) % 100;
  return bucket < split ? "A" : "B";
}
