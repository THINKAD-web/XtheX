"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          background: "#fafafa",
          color: "#18181b",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "420px",
            margin: "0 auto",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          {/* Warning icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 24px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          {/* 500 number */}
          <p
            style={{
              fontSize: "64px",
              fontWeight: 800,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              margin: "0 0 12px",
              background: "linear-gradient(135deg, #059669, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            500
          </p>

          <h1
            style={{
              fontSize: "22px",
              fontWeight: 700,
              margin: "0 0 8px",
              color: "#18181b",
            }}
          >
            문제가 생겼어요
          </h1>

          <p
            style={{
              fontSize: "14px",
              color: "#71717a",
              margin: "0 0 32px",
              lineHeight: 1.6,
            }}
          >
            일시적인 오류입니다. 잠시 후 다시 시도해 주세요.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: "12px",
                color: "#a1a1aa",
                margin: "0 0 24px",
                fontFamily: "monospace",
              }}
            >
              오류 코드: {error.digest}
            </p>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#fff",
                background: "#059669",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseOver={(e) =>
                ((e.target as HTMLButtonElement).style.background = "#047857")
              }
              onMouseOut={(e) =>
                ((e.target as HTMLButtonElement).style.background = "#059669")
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              다시 시도
            </button>

            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error renders outside Next.js router */}
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 600,
                color: "#18181b",
                background: "transparent",
                border: "1px solid #e4e4e7",
                borderRadius: "8px",
                cursor: "pointer",
                textDecoration: "none",
                transition: "background 0.15s",
              }}
              onMouseOver={(e) =>
                ((e.target as HTMLAnchorElement).style.background = "#f4f4f5")
              }
              onMouseOut={(e) =>
                ((e.target as HTMLAnchorElement).style.background = "transparent")
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              홈으로
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
