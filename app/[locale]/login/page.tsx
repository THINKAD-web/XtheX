import { Suspense } from "react";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import {
  appContentPanelClass,
  appMainContainerClass,
} from "@/lib/layout/app-chrome";
import { LoginForm } from "@/components/auth/login-form";

function LoginFallback() {
  return (
    <div
      className="mx-auto h-96 max-w-md animate-pulse rounded-2xl bg-muted/60"
      aria-hidden
    />
  );
}

export default async function LoginPage() {
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );

  return (
    <AppSiteChrome>
      <main className={appMainContainerClass}>
        <div className={`${appContentPanelClass} mx-auto max-w-lg`}>
          <Suspense fallback={<LoginFallback />}>
            <LoginForm
              signupHref="/signup"
              title="로그인"
              emailLabel="이메일"
              passwordLabel="비밀번호"
              submitLabel="로그인"
              loadingLabel="처리 중…"
              googleLabel="Google로 계속하기"
              noAccount="계정이 없으신가요?"
              googleEnabled={googleEnabled}
            />
          </Suspense>
        </div>
      </main>
    </AppSiteChrome>
  );
}
