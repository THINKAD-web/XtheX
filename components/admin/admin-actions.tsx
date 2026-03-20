"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  adminApproveProposal,
  adminRejectProposal,
} from "@/app/[locale]/admin/actions";

export function AdminActions({ proposalId }: { proposalId: string }) {
  const t = useTranslations("admin.actions");
  const [pending, setPending] = React.useState<"approve" | "reject" | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  async function run(kind: "approve" | "reject") {
    setError(null);
    setPending(kind);
    try {
      if (kind === "approve") await adminApproveProposal(proposalId);
      else await adminRejectProposal(proposalId);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        onClick={() => void run("approve")}
        disabled={pending !== null}
      >
        {pending === "approve" ? t("approving") : t("approve")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => void run("reject")}
        disabled={pending !== null}
      >
        {pending === "reject" ? t("rejecting") : t("reject")}
      </Button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
