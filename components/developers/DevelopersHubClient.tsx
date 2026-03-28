"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { landing } from "@/lib/landing-theme";
import { toast } from "sonner";
import {
  BookOpen,
  ClipboardCopy,
  Code2,
  FlaskConical,
  Link2,
  Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SampleLang = "curl" | "fetch" | "node";

const TRY_KEYS = ["stats", "weather", "autocomplete", "explore"] as const;
type TryKey = (typeof TRY_KEYS)[number];

const TRY_PATHS: Record<TryKey, string> = {
  stats: "/api/stats",
  weather: "/api/weather?city=Seoul",
  autocomplete: "/api/search/autocomplete?q=seoul",
  explore: "/api/explore?take=5",
};

const ENDPOINT_ROWS: Array<{
  method: string;
  path: string;
  authKey: "auth_none" | "auth_session" | "auth_admin" | "auth_optional";
  descKey: string;
}> = [
  { method: "GET", path: "/api/stats", authKey: "auth_none", descKey: "endpoint_stats" },
  { method: "GET", path: "/api/weather?city=", authKey: "auth_none", descKey: "endpoint_weather" },
  { method: "GET", path: "/api/explore", authKey: "auth_none", descKey: "endpoint_explore" },
  { method: "GET", path: "/api/search/autocomplete?q=", authKey: "auth_none", descKey: "endpoint_autocomplete" },
  { method: "POST", path: "/api/recommend", authKey: "auth_session", descKey: "endpoint_recommend" },
  { method: "POST", path: "/api/feedback", authKey: "auth_none", descKey: "endpoint_feedback" },
  { method: "POST", path: "/api/inquiry", authKey: "auth_session", descKey: "endpoint_inquiry" },
  { method: "GET", path: "/api/campaign/list", authKey: "auth_session", descKey: "endpoint_campaign_list" },
  { method: "GET", path: "/api/wishlist", authKey: "auth_session", descKey: "endpoint_wishlist" },
  { method: "GET", path: "/api/onboarding/status", authKey: "auth_optional", descKey: "endpoint_onboarding" },
  { method: "GET/POST", path: "/api/auth/[...nextauth]", authKey: "auth_optional", descKey: "endpoint_nextauth" },
  { method: "POST", path: "/api/chat", authKey: "auth_session", descKey: "endpoint_chat" },
];

const navLinkClass =
  "rounded-full border border-transparent bg-muted/50 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

export function DevelopersHubClient() {
  const t = useTranslations("developers");
  const [sampleLang, setSampleLang] = useState<SampleLang>("curl");
  const [tryKey, setTryKey] = useState<TryKey>("stats");
  const [tryLoading, setTryLoading] = useState(false);
  const [tryStatus, setTryStatus] = useState<number | null>(null);
  const [tryBody, setTryBody] = useState<string>("");
  const [tryError, setTryError] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://xthex.com";

  const sampleText = useMemo(() => {
    const base = `${origin}/api/stats`;
    if (sampleLang === "curl") {
      return `curl -sS "${base}"`;
    }
    if (sampleLang === "fetch") {
      return `const res = await fetch("/api/stats");\nconst data = await res.json();\nconsole.log(data);`;
    }
    return `const base = process.env.XTHEX_API_BASE ?? "${origin}";\nconst res = await fetch(\`\${base}/api/stats\`);\nconst data = await res.json();\nconsole.log(data);`;
  }, [origin, sampleLang]);

  const copySample = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sampleText);
      toast.success(t("copy_ok"));
    } catch {
      toast.error(t("copy_fail"));
    }
  }, [sampleText, t]);

  const runTry = useCallback(async () => {
    setTryLoading(true);
    setTryError(null);
    setTryStatus(null);
    setTryBody("");
    try {
      const path = TRY_PATHS[tryKey];
      const res = await fetch(path, { method: "GET", credentials: "same-origin" });
      setTryStatus(res.status);
      const text = await res.text();
      try {
        const parsed = JSON.parse(text) as unknown;
        setTryBody(JSON.stringify(parsed, null, 2));
      } catch {
        setTryBody(text);
      }
    } catch (e) {
      setTryError(e instanceof Error ? e.message : String(e));
    } finally {
      setTryLoading(false);
    }
  }, [tryKey]);

  return (
    <div className={`${landing.container} py-16 lg:py-24`}>
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium text-primary">{t("kicker")}</p>
        <h1 className={`${landing.h1} mt-2`}>{t("hero_title")}</h1>
        <p className={landing.lead}>{t("hero_subtitle")}</p>
      </header>

      <nav
        className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2"
        aria-label={t("nav_aria")}
      >
        <a href="#overview" className={navLinkClass}>
          {t("nav_overview")}
        </a>
        <a href="#endpoints" className={navLinkClass}>
          {t("nav_endpoints")}
        </a>
        <a href="#samples" className={navLinkClass}>
          {t("nav_samples")}
        </a>
        <a href="#try" className={navLinkClass}>
          {t("nav_try")}
        </a>
        <a href="#integrations" className={navLinkClass}>
          {t("nav_integrations")}
        </a>
        <a href="#guide" className={navLinkClass}>
          {t("nav_guide")}
        </a>
      </nav>

      <div className="mx-auto mt-16 max-w-5xl space-y-16 lg:space-y-20">
        <section id="overview" className="scroll-mt-24">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle>{t("section_overview")}</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{t("overview_lead")}</p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
              <p>{t("overview_p1")}</p>
              <p>{t("overview_p2")}</p>
              <Alert>
                <Link2 className="h-4 w-4" />
                <AlertTitle>{t("section_base_url")}</AlertTitle>
                <AlertDescription>
                  <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">{origin}</code>
                  <span className="mt-2 block">{t("base_url_hint")}</span>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </section>

        <section id="endpoints" className="scroll-mt-24">
          <div className="mb-4 flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" aria-hidden />
            <h2 className={landing.h3}>{t("section_endpoints")}</h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">{t("endpoints_note")}</p>
          <Card>
            <CardContent className="p-0 pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px]">{t("table_method")}</TableHead>
                    <TableHead>{t("table_path")}</TableHead>
                    <TableHead className="w-[120px]">{t("table_auth")}</TableHead>
                    <TableHead>{t("table_description")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ENDPOINT_ROWS.map((row) => (
                    <TableRow key={`${row.method}-${row.path}`}>
                      <TableCell>
                        <Badge variant={row.method === "GET" ? "outline" : "default"}>{row.method}</Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs sm:text-sm">{row.path}</code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t(row.authKey)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t(row.descKey)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section id="samples" className="scroll-mt-24">
          <div className="mb-4 flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" aria-hidden />
            <h2 className={landing.h3}>{t("section_samples")}</h2>
          </div>
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-pretty text-sm text-muted-foreground">{t("sample_note")}</p>
              <div className="flex flex-wrap gap-2">
                {(["curl", "fetch", "node"] as const).map((lang) => (
                  <Button
                    key={lang}
                    type="button"
                    variant={sampleLang === lang ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSampleLang(lang)}
                  >
                    {t(`sample_${lang}`)}
                  </Button>
                ))}
                <Button type="button" variant="secondary" size="sm" onClick={copySample}>
                  <ClipboardCopy className="mr-1.5 h-4 w-4" />
                  {t("copy")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="max-h-[320px] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed sm:text-sm">
                <code>{sampleText}</code>
              </pre>
            </CardContent>
          </Card>
        </section>

        <section id="try" className="scroll-mt-24">
          <div className="mb-4 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" aria-hidden />
            <h2 className={landing.h3}>{t("section_try")}</h2>
          </div>
          <Card>
            <CardHeader>
              <p className="text-sm text-muted-foreground">{t("try_note")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <label htmlFor="api-try-select" className="text-sm font-medium">
                    {t("try_select")}
                  </label>
                  <Select value={tryKey} onValueChange={(v) => setTryKey(v as TryKey)}>
                    <SelectTrigger id="api-try-select" className="w-full sm:max-w-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRY_KEYS.map((key) => (
                        <SelectItem key={key} value={key}>
                          {t(`try_path_${key}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={runTry} disabled={tryLoading}>
                  {tryLoading ? t("try_loading") : t("try_run")}
                </Button>
              </div>
              {tryError ? (
                <Alert
                  variant="warning"
                  className="border-red-300 bg-red-50 text-red-950 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
                >
                  <AlertTitle>{t("try_error")}</AlertTitle>
                  <AlertDescription>{tryError}</AlertDescription>
                </Alert>
              ) : null}
              {tryStatus !== null ? (
                <p className="text-sm text-muted-foreground">
                  {t("try_status", { status: tryStatus })}
                </p>
              ) : null}
              {tryBody ? (
                <pre className="max-h-[360px] overflow-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
                  <code>{tryBody}</code>
                </pre>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section id="integrations" className="scroll-mt-24">
          <div className="mb-4 flex items-center gap-2">
            <Plug className="h-5 w-5 text-primary" aria-hidden />
            <h2 className={landing.h3}>{t("section_integrations")}</h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ga">
              <AccordionTrigger>{t("int_ga_title")}</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>{t("int_ga_p1")}</p>
                <p>{t("int_ga_p2")}</p>
                <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs">
                  <code>{t("int_ga_snippet")}</code>
                </pre>
                <p>{t("int_ga_p3")}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="sf">
              <AccordionTrigger>{t("int_sf_title")}</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>{t("int_sf_p1")}</p>
                <p>{t("int_sf_p2")}</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>{t("int_sf_li1")}</li>
                  <li>{t("int_sf_li2")}</li>
                  <li>{t("int_sf_li3")}</li>
                </ul>
                <p>{t("int_sf_p3")}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section id="guide" className="scroll-mt-24">
          <div className="mb-4 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" aria-hidden />
            <h2 className={landing.h3}>{t("section_guide")}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {(
              [
                ["guide_step1_title", "guide_step1_body"],
                ["guide_step2_title", "guide_step2_body"],
                ["guide_step3_title", "guide_step3_body"],
              ] as const
            ).map(([titleKey, bodyKey]) => (
              <Card key={titleKey}>
                <CardHeader>
                  <CardTitle className="text-lg">{t(titleKey)}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  {t(bodyKey)}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
