"use client";

import * as React from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import {
  MediaProposalFormValues,
  mediaProposalSchema,
  mediaTypeValues,
} from "@/components/partner/media-proposal-schema";
import { createMediaProposal } from "@/app/[locale]/dashboard/partner/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlacesAutocomplete } from "@/components/partner/places-autocomplete";
import { CloudinaryMultiUpload } from "@/components/partner/cloudinary-upload";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type ProposalFormProps = {
  onCreated?: (id: string, values: { title: string; mediaType: string }) => void;
};

function isErrorKey(msg: string): msg is `errors.${string}` {
  return typeof msg === "string" && msg.startsWith("errors.");
}

export function ProposalForm({ onCreated }: ProposalFormProps) {
  const t = useTranslations("dashboard.partner");
  const { toast } = useToast();
  const [submitting, setSubmitting] = React.useState(false);

  const errMsg = (message: string | undefined) =>
    !message ? "" : isErrorKey(message) ? t(message) : message;

  const form = useForm<MediaProposalFormValues>({
    resolver: zodResolver(mediaProposalSchema) as Resolver<MediaProposalFormValues>,
    defaultValues: {
      title: "",
      description: "",
      location: { lat: 0, lng: 0, address: "" },
      mediaType: "BILLBOARD",
      size: "",
      priceMin: 0,
      priceMax: 0,
      imageUrls: [],
    },
    mode: "onBlur",
  });

  async function onSubmit(values: MediaProposalFormValues) {
    setSubmitting(true);
    try {
      const result = await createMediaProposal(values);
      if (onCreated && result?.id) {
        onCreated(result.id, {
          title: values.title,
          mediaType: values.mediaType,
        });
      }
      toast({
        title: t("toast_created"),
      });
      form.reset({
        title: "",
        description: "",
        location: { lat: 0, lng: 0, address: "" },
        mediaType: "BILLBOARD",
        size: "",
        priceMin: 0,
        priceMax: 0,
        imageUrls: [],
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: t("errors.submit_failed"),
        description:
          e instanceof Error ? e.message : t("errors.submit_failed"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = form;

  const location = watch("location");
  const imageUrls = watch("imageUrls");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {t("upload_title")}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t("upload_subtitle")}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("title_label")}
          </label>
          <Input
            placeholder={t("title_placeholder")}
            {...register("title")}
          />
          {errors.title ? (
            <p className="text-sm text-red-600">
              {errMsg(errors.title.message)}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("description_label")}
          </label>
          <Textarea
            placeholder={t("description_placeholder")}
            {...register("description")}
          />
          {errors.description ? (
            <p className="text-sm text-red-600">
              {errMsg(errors.description.message)}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("location_label")}
          </label>
          <PlacesAutocomplete
            value={location}
            onChange={(v) =>
              setValue("location", v, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
          {errors.location?.address ? (
            <p className="text-sm text-red-600">
              {errMsg(errors.location.address.message)}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("media_type_label")}
          </label>
          <select
            className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-300 dark:focus-visible:ring-offset-zinc-950"
            {...register("mediaType")}
          >
            {mediaTypeValues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          {errors.mediaType ? (
            <p className="text-sm text-red-600">
              {errMsg(errors.mediaType.message)}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("size_label")}
          </label>
          <Input
            placeholder={t("size_placeholder")}
            {...register("size")}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("price_min_label")}
            </label>
            <Input
              type="number"
              inputMode="numeric"
              {...register("priceMin", { valueAsNumber: true })}
            />
            {errors.priceMin ? (
              <p className="text-sm text-red-600">
                {errMsg(errors.priceMin.message)}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("price_max_label")}
            </label>
            <Input
              type="number"
              inputMode="numeric"
              {...register("priceMax", { valueAsNumber: true })}
            />
            {errors.priceMax ? (
              <p className="text-sm text-red-600">
                {errMsg(errors.priceMax.message)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("images_label")}
          </label>
          <CloudinaryMultiUpload
            value={imageUrls}
            onChange={(urls) =>
              setValue("imageUrls", urls, {
                shouldValidate: true,
                shouldDirty: true,
              })
            }
          />
          {errors.imageUrls ? (
            <p className="text-sm text-red-600">
              {errMsg(errors.imageUrls.message)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("loading")}</span>
            </span>
          ) : (
            t("submit")
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => form.reset()}
          disabled={submitting}
        >
          {t("reset")}
        </Button>
      </div>
    </form>
  );
}

