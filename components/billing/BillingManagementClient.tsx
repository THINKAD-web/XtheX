"use client";

import * as React from "react";
import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  CreditCard,
  FileText,
  Landmark,
  Receipt,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { landing } from "@/lib/landing-theme";
import {
  BILLING_DEMO_PAYMENT_METHODS,
  BILLING_DEMO_TRANSACTIONS,
  type BillingDemoTx,
  type BillingPaymentMethod,
} from "@/lib/billing/demo-data";
import { openInvoicePrintWindow } from "@/lib/billing/invoice-print";
import {
  convertCurrency,
  formatCurrency,
  isSupportedCurrency,
  preferredCurrencyFromLocale,
  type SupportedCurrency,
} from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STORAGE_AUTOPAY = "xthex_billing_autopay";
const STORAGE_2FA = "xthex_billing_2fa";
const STORAGE_CURRENCY = "xthex_currency";

function intlLocaleForApp(locale: string): string {
  if (locale === "zh") return "zh-CN";
  if (locale === "ja") return "ja-JP";
  if (locale === "ko") return "ko-KR";
  return "en-US";
}

function readStoredCurrency(appLocale: string): SupportedCurrency {
  if (typeof window === "undefined") return preferredCurrencyFromLocale(appLocale);
  try {
    const raw = window.localStorage.getItem(STORAGE_CURRENCY);
    if (raw && isSupportedCurrency(raw)) return raw;
  } catch {
    // ignore
  }
  return preferredCurrencyFromLocale(appLocale);
}

export function BillingManagementClient() {
  const t = useTranslations("billing");
  const params = useParams();
  const pathname = usePathname();
  const appLocale = (params?.locale as string) ?? "ko";
  const intlLocale = intlLocaleForApp(appLocale);
  const { status } = useSession();

  const [currency, setCurrency] = React.useState<SupportedCurrency>(() =>
    preferredCurrencyFromLocale(appLocale),
  );
  const [autopay, setAutopay] = React.useState(false);
  const [twoFactor, setTwoFactor] = React.useState(false);
  const [methods, setMethods] = React.useState<BillingPaymentMethod[]>(BILLING_DEMO_PAYMENT_METHODS);
  const [addOpen, setAddOpen] = React.useState(false);
  const [twoFaDialogOpen, setTwoFaDialogOpen] = React.useState(false);
  const [otp, setOtp] = React.useState("");
  const [newBrand, setNewBrand] = React.useState("Visa");
  const [newLast4, setNewLast4] = React.useState("");
  const [newExp, setNewExp] = React.useState("");

  React.useEffect(() => {
    setCurrency(readStoredCurrency(appLocale));
    try {
      setAutopay(window.localStorage.getItem(STORAGE_AUTOPAY) === "1");
      setTwoFactor(window.localStorage.getItem(STORAGE_2FA) === "1");
    } catch {
      // ignore
    }
  }, [appLocale]);

  React.useEffect(() => {
    function onCurrencyChange(e: Event) {
      const d = (e as CustomEvent<string>).detail;
      if (d && isSupportedCurrency(d)) setCurrency(d);
    }
    window.addEventListener("xthex:currency-change", onCurrencyChange);
    return () => window.removeEventListener("xthex:currency-change", onCurrencyChange);
  }, []);

  const formatFromKrw = React.useCallback(
    (amountKrw: number) => {
      const conv = convertCurrency(amountKrw, "KRW", currency);
      return formatCurrency(conv, currency, intlLocale);
    },
    [currency, intlLocale],
  );

  const totalPaidKrw = React.useMemo(
    () => BILLING_DEMO_TRANSACTIONS.filter((r) => r.status === "PAID").reduce((s, r) => s + r.amountKrw, 0),
    [],
  );
  const outstandingKrw = React.useMemo(
    () => BILLING_DEMO_TRANSACTIONS.filter((r) => r.status === "PENDING").reduce((s, r) => s + r.amountKrw, 0),
    [],
  );

  const onDownloadInvoice = (row: BillingDemoTx) => {
    openInvoicePrintWindow({
      companyName: t("invoice_company"),
      invoiceTitle: t("invoice_doc_title"),
      invoiceIdLabel: t("table_invoice"),
      dateLabel: t("table_date"),
      descLabel: t("table_desc"),
      amountLabel: t("table_amount"),
      statusLabel: t("table_status"),
      paidLabel: t("status_paid"),
      pendingLabel: t("status_pending"),
      footerNote: t("invoice_footer"),
      tx: row,
      description: t(row.descKey as never),
      amountDisplay: formatFromKrw(row.amountKrw),
    });
    toast.info(t("pdf_print_hint"));
  };

  const setDefaultMethod = (id: string) => {
    setMethods((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
    toast.success(t("method_default_updated"));
  };

  const toggleAutopay = () => {
    const next = !autopay;
    setAutopay(next);
    try {
      window.localStorage.setItem(STORAGE_AUTOPAY, next ? "1" : "0");
    } catch {
      // ignore
    }
    toast.success(next ? t("autopay_on_toast") : t("autopay_off_toast"));
  };

  const requestEnable2FA = () => {
    setOtp("");
    setTwoFaDialogOpen(true);
  };

  const confirm2FA = () => {
    if (!/^\d{6}$/.test(otp.trim())) {
      toast.error(t("two_factor_invalid"));
      return;
    }
    setTwoFactor(true);
    try {
      window.localStorage.setItem(STORAGE_2FA, "1");
    } catch {
      // ignore
    }
    setTwoFaDialogOpen(false);
    toast.success(t("two_factor_enabled_toast"));
  };

  const disable2FA = () => {
    setTwoFactor(false);
    try {
      window.localStorage.setItem(STORAGE_2FA, "0");
    } catch {
      // ignore
    }
    toast.success(t("two_factor_disabled_toast"));
  };

  const saveNewMethod = () => {
    const last4 = newLast4.replace(/\D/g, "").slice(0, 4);
    if (last4.length !== 4 || !/^\d{2}\/\d{2}$/.test(newExp.trim())) {
      toast.error(t("add_card_invalid"));
      return;
    }
    const id = `pm_${Date.now()}`;
    setMethods((prev) => {
      const next = prev.map((m) => ({ ...m, isDefault: false }));
      return [...next, { id, brand: newBrand, last4, exp: newExp.trim(), isDefault: true }];
    });
    setAddOpen(false);
    setNewLast4("");
    setNewExp("");
    toast.success(t("add_card_saved"));
  };

  const dateFmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat(intlLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [intlLocale],
  );

  return (
    <div className={`${landing.container} py-10 lg:py-14`}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <Receipt className="h-5 w-5" aria-hidden />
            {t("kicker")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {status === "unauthenticated" ? (
        <div className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          {t("demo_banner")}{" "}
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(pathname || `/${appLocale}/billing`)}`}
            className="font-semibold underline underline-offset-2"
          >
            {t("sign_in_cta")}
          </Link>
        </div>
      ) : null}

      <p className="mb-6 text-xs text-muted-foreground">{t("currency_note")}</p>

      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("total_spent")}</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{formatFromKrw(totalPaidKrw)}</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 dark:border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("outstanding")}</CardTitle>
            <Landmark className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-400">
              {formatFromKrw(outstandingKrw)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg">{t("payments_title")}</CardTitle>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table_date")}</TableHead>
                    <TableHead>{t("table_desc")}</TableHead>
                    <TableHead className="text-right">{t("table_amount")}</TableHead>
                    <TableHead>{t("table_status")}</TableHead>
                    <TableHead className="w-[120px]">{t("table_invoice")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {BILLING_DEMO_TRANSACTIONS.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {dateFmt.format(new Date(`${row.date}T12:00:00`))}
                      </TableCell>
                      <TableCell>{t(row.descKey as never)}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatFromKrw(row.amountKrw)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === "PAID" ? "default" : "outline"}>
                          {row.status === "PAID" ? t("status_paid") : t("status_pending")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => onDownloadInvoice(row)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {t("download_pdf")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{t("payment_methods")}</CardTitle>
              <Button type="button" size="sm" onClick={() => setAddOpen(true)}>
                {t("add_method")}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {methods.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.brand} ··{m.last4}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.exp}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {m.isDefault ? (
                      <Badge variant="default" className="text-[10px]">
                        {t("default_method")}
                      </Badge>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setDefaultMethod(m.id)}>
                        {t("set_default")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">{t("change_method_hint")}</p>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">{t("autopay")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("autopay_desc")}</p>
              <button
                type="button"
                role="switch"
                aria-checked={autopay}
                onClick={toggleAutopay}
                className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/50"
              >
                <span>{autopay ? t("autopay_on") : t("autopay_off")}</span>
                <span
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors",
                    autopay ? "bg-emerald-600" : "bg-zinc-300 dark:bg-zinc-600",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                      autopay ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </span>
              </button>
            </CardContent>
          </Card>

          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader className="flex flex-row items-center gap-2 space-y-0">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
              <CardTitle className="text-base">{t("two_factor")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("two_factor_desc")}</p>
              {twoFactor ? (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">{t("two_factor_active")}</Badge>
                  <Button type="button" variant="outline" size="sm" onClick={disable2FA}>
                    {t("two_factor_disable")}
                  </Button>
                </div>
              ) : (
                <Button type="button" size="sm" onClick={requestEnable2FA}>
                  {t("two_factor_enable")}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("add_card_title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("add_card_brand")}</Label>
              <Select value={newBrand} onValueChange={setNewBrand}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="Mastercard">Mastercard</SelectItem>
                  <SelectItem value="Amex">Amex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="last4">{t("add_card_last4")}</Label>
              <Input
                id="last4"
                inputMode="numeric"
                maxLength={4}
                value={newLast4}
                onChange={(e) => setNewLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exp">{t("add_card_exp")}</Label>
              <Input
                id="exp"
                placeholder="MM/YY"
                value={newExp}
                onChange={(e) => setNewExp(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              {t("add_card_cancel")}
            </Button>
            <Button type="button" onClick={saveNewMethod}>
              {t("add_card_save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={twoFaDialogOpen} onOpenChange={setTwoFaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("two_factor_setup_title")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("two_factor_setup_body")}</p>
          <div className="space-y-2">
            <Label htmlFor="otp">{t("two_factor_code_label")}</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder={t("two_factor_code_ph")}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setTwoFaDialogOpen(false)}>
              {t("add_card_cancel")}
            </Button>
            <Button type="button" onClick={confirm2FA}>
              {t("two_factor_verify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
