"use client";

import dynamic from "next/dynamic";

/**
 * framer-motion / motion-dom을 서버 번들에서 분리해 login 등 라우트의
 * vendor-chunks 누락(Runtime) 오류를 방지합니다.
 */
const OmniCartShell = dynamic(
  () =>
    import("./OmniCartShell").then((m) => ({ default: m.OmniCartShell })),
  { ssr: false, loading: () => null },
);

export function OmniCartShellLazy() {
  return <OmniCartShell />;
}
