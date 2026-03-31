import { Suspense } from "react";
import { AdminGateForm } from "./AdminGateForm";

export default function AdminSiteGatePage() {
  return (
    <Suspense fallback={<p className="px-4 py-16 text-center text-sm text-muted-foreground">Loading…</p>}>
      <AdminGateForm />
    </Suspense>
  );
}
