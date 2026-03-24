import { cn } from "@/lib/utils";
import { appPageShellClass } from "@/lib/layout/app-chrome";
import { SiteHeader } from "@/components/layout/SiteHeader";

type Props = {
  children: React.ReactNode;
  /** `pt-14` 아래 영역에 추가 클래스 (예: `pb-24`, `min-h-[50vh]`) */
  mainClassName?: string;
};

/**
 * 전역과 동일한 상단 헤더(SiteHeader) + 배경.
 * 로그인/회원가입/탐색/About 등 공개 페이지에 사용.
 */
export function AppSiteChrome({ children, mainClassName }: Props) {
  return (
    <div className={appPageShellClass}>
      <SiteHeader />
      <div className={cn("pt-14", mainClassName)}>{children}</div>
    </div>
  );
}
