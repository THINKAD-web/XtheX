"use client";

import * as React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

type Props = {
  locale: string;
  /** Path part like `/${locale}/campaigns/${id}` */
  campaignPath: string;
  filename?: string;
};

export function CampaignQrDownload({
  locale,
  campaignPath,
  filename = "campaign-qr.png",
}: Props) {
  const isKo = locale === "ko";
  const { toast } = useToast();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [fullUrl, setFullUrl] = React.useState<string>("");

  React.useEffect(() => {
    try {
      const origin = window.location.origin;
      setFullUrl(`${origin}${campaignPath}`);
    } catch {
      setFullUrl(campaignPath);
    }
  }, [campaignPath]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({
        title: isKo ? "QR PNG 다운로드 시작" : "Downloading QR PNG",
        description: fullUrl,
      });
    } catch {
      toast({
        variant: "destructive",
        title: isKo ? "다운로드 실패" : "Download failed",
        description: isKo ? "브라우저에서 PNG 생성에 실패했어요." : "Failed to generate PNG in browser.",
      });
    }
  };

  if (!fullUrl) return null;

  return (
    <Card className="border-zinc-800 bg-zinc-950 text-zinc-100 shadow-none">
      <CardHeader className="p-4">
        <CardTitle className="text-base">
          {isKo ? "캠페인 QR 코드" : "Campaign QR code"}
        </CardTitle>
        <p className="mt-1 text-xs text-zinc-400">
          {isKo
            ? "캠페인 URL로 QR을 자동 생성하고 PNG로 저장할 수 있어요."
            : "Auto-generate a QR for the campaign URL and download as PNG."}
        </p>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4 p-4 pt-0">
        <div className="rounded-lg border border-zinc-800 bg-white p-3">
          <QRCodeCanvas
            value={fullUrl}
            size={160}
            includeMargin
            level="M"
            ref={(node) => {
              // qrcode.react forwards the canvas element
              canvasRef.current = node as unknown as HTMLCanvasElement | null;
            }}
          />
        </div>
        <div className="min-w-[220px] flex-1 space-y-2">
          <div className="break-all rounded-md border border-zinc-800 bg-zinc-900/40 p-2 text-xs text-zinc-300">
            {fullUrl}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-orange-600 text-white hover:bg-orange-700"
              onClick={download}
            >
              {isKo ? "QR PNG 다운로드" : "Download QR PNG"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-zinc-700 bg-zinc-950 text-zinc-200 hover:bg-zinc-900"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(fullUrl);
                  toast({ title: isKo ? "URL 복사됨" : "URL copied", description: fullUrl });
                } catch {
                  toast({
                    variant: "destructive",
                    title: isKo ? "복사 실패" : "Copy failed",
                    description: isKo ? "클립보드 권한을 확인해 주세요." : "Check clipboard permission.",
                  });
                }
              }}
            >
              {isKo ? "URL 복사" : "Copy URL"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

