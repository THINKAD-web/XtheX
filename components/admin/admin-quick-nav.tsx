import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type TAdminHome = (key: string) => string;

const linkBase =
  "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-transparent px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background";

const linkPrimary = cn(linkBase, "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90");
const linkOutline = cn(linkBase, "border-border bg-background text-foreground hover:bg-muted");
const linkSoft = cn(linkBase, "bg-muted/80 text-foreground hover:bg-muted");

export function AdminQuickNav({ t }: { t: TAdminHome }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground">{t("nav_quick_title")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("nav_quick_hint")}</p>

      <div className="mt-6 space-y-8">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("nav_group_admin")}
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link href="/admin/medias" className={cn(linkOutline, "w-full sm:w-auto sm:min-w-[9.5rem]")}>
              {t("nav_medias")}
            </Link>
            <Link href="/admin/medias/new" className={cn(linkPrimary, "w-full sm:w-auto sm:min-w-[9.5rem]")}>
              {t("nav_newMedia")}
            </Link>
            <Link href="/admin/ai-upload" className={cn(linkPrimary, "w-full sm:w-auto sm:min-w-[9.5rem]")}>
              {t("nav_aiUpload")}
            </Link>
            <Link href="/admin/inquiries" className={cn(linkOutline, "w-full sm:w-auto sm:min-w-[9.5rem]")}>
              {t("nav_inquiries")}
            </Link>
            <Link href="/admin/reports" className={cn(linkOutline, "w-full sm:w-auto sm:min-w-[9.5rem]")}>
              {t("nav_reports")}
            </Link>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("nav_group_dashboard")}
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Link href="/dashboard/partner" className={cn(linkSoft, "w-full sm:w-auto sm:min-w-[9.5rem]")}>
              {t("nav_partner")}
            </Link>
            <Link href="/dashboard/performance" className={cn(linkSoft, "w-full sm:w-auto sm:min-w-[9.5rem]")}>
              {t("nav_performance")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
