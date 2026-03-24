import { Suspense } from "react";
import { AppSiteChrome } from "@/components/layout/AppSiteChrome";
import {
  appContentPanelClass,
  appMainContainerClass,
} from "@/lib/layout/app-chrome";
import { SignupForm } from "@/components/auth/signup-form";

function SignupFallback() {
  return (
    <div
      className="mx-auto h-[28rem] max-w-md animate-pulse rounded-2xl bg-muted/60"
      aria-hidden
    />
  );
}

export default async function SignupPage() {
  return (
    <AppSiteChrome>
      <main className={appMainContainerClass}>
        <div className={`${appContentPanelClass} mx-auto max-w-lg`}>
          <Suspense fallback={<SignupFallback />}>
            <SignupForm
              loginHref="/login"
              title="회원가입"
              nameLabel="이름"
              emailLabel="이메일"
              passwordLabel="비밀번호 (8자 이상)"
              roleLabel="가입 유형"
              roleAdvertiser="광고주"
              roleMediaOwner="매체사"
              submitLabel="가입하고 시작하기"
              loadingLabel="처리 중…"
              hasAccount="이미 계정이 있으신가요?"
            />
          </Suspense>
        </div>
      </main>
    </AppSiteChrome>
  );
}
