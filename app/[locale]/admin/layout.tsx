import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/site-footer";

type Props = { children: React.ReactNode };

export default function AdminLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <SiteHeader />
      <div className="flex-1 pt-14">{children}</div>
      <SiteFooter />
    </div>
  );
}
