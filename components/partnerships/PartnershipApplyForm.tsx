"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { PartnershipType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  partnershipApplySchema,
  type PartnershipApplyInput,
} from "@/lib/partnerships/apply-schema";

const TYPE_ORDER: PartnershipType[] = [
  PartnershipType.MEDIA_NETWORK,
  PartnershipType.AGENCY,
  PartnershipType.TECH_PLATFORM,
  PartnershipType.BRAND,
  PartnershipType.OTHER,
];

export function PartnershipApplyForm() {
  const t = useTranslations("partnerships.apply");
  const [busy, setBusy] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PartnershipApplyInput>({
    resolver: zodResolver(partnershipApplySchema) as Resolver<PartnershipApplyInput>,
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      website: "",
      type: PartnershipType.OTHER,
      message: "",
    },
    mode: "onBlur",
  });

  const typeVal = watch("type");

  const onSubmit = async (values: PartnershipApplyInput) => {
    setBusy(true);
    try {
      const res = await fetch("/api/partnerships/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          website: values.website?.trim() || undefined,
          phone: values.phone?.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(t("toast_error"), { description: json.error });
        return;
      }
      toast.success(t("toast_ok"));
      reset({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        website: "",
        type: PartnershipType.OTHER,
        message: "",
      });
    } catch {
      toast.error(t("toast_error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("company")}</label>
          <Input {...register("companyName")} autoComplete="organization" />
          <FormMessage>{errors.companyName?.message}</FormMessage>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("contact_name")}</label>
          <Input {...register("contactName")} autoComplete="name" />
          <FormMessage>{errors.contactName?.message}</FormMessage>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("email")}</label>
          <Input type="email" {...register("email")} autoComplete="email" />
          <FormMessage>{errors.email?.message}</FormMessage>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("phone")}</label>
          <Input {...register("phone")} autoComplete="tel" />
          <FormMessage>{errors.phone?.message}</FormMessage>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("website")}</label>
          <Input {...register("website")} placeholder="https://" />
          <FormMessage>{errors.website?.message}</FormMessage>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("type_label")}</label>
          <Select
            value={typeVal}
            onValueChange={(v) => setValue("type", v as PartnershipType, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_ORDER.map((tp) => (
                <SelectItem key={tp} value={tp}>
                  {t(`types.${tp}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage>{errors.type?.message}</FormMessage>
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">{t("message")}</label>
        <Textarea rows={6} {...register("message")} />
        <FormMessage>{errors.message?.message}</FormMessage>
      </div>
      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
