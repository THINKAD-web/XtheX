"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MediaCategory } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { createMediaAction } from "@/app/[locale]/admin/medias/new/actions";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<MediaCategory, string> = {
  [MediaCategory.BILLBOARD]: "Billboard",
  [MediaCategory.DIGITAL_BOARD]: "Digital board",
  [MediaCategory.TRANSIT]: "Transit",
  [MediaCategory.STREET_FURNITURE]: "Street furniture",
  [MediaCategory.WALL]: "Wall",
  [MediaCategory.ETC]: "Other",
};

const optionalCoordString = z
  .string()
  .optional()
  .refine((s) => !s?.trim() || Number.isFinite(Number(s.trim())), {
    message: "Enter a valid number",
  });

const optionalNonNegString = z
  .string()
  .optional()
  .refine((s) => !s?.trim() || Number.isFinite(Number(s.trim())), {
    message: "Enter a valid number",
  })
  .refine((s) => !s?.trim() || Number(s.trim()) >= 0, {
    message: "Must be 0 or greater",
  });

const imageRowSchema = z.object({
  url: z
    .string()
    .refine(
      (s) => !s.trim() || z.string().url().safeParse(s.trim()).success,
      { message: "Enter a valid URL or leave empty" },
    ),
});

const mediaWizardSchema = z.object({
  mediaName: z.string().min(2, "Name must be at least 2 characters"),
  category: z.nativeEnum(MediaCategory),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  district: z.string().optional(),
  lat: optionalCoordString,
  lng: optionalCoordString,
  price: optionalNonNegString,
  cpm: optionalNonNegString,
  dailyTraffic: z.string().optional(),
  monthlyImpressions: z.string().optional(),
  images: z.array(imageRowSchema).min(1, "Add at least one image row"),
});

export type MediaWizardFormValues = z.infer<typeof mediaWizardSchema>;

const STEP_FIELDS: FieldPath<MediaWizardFormValues>[][] = [
  ["mediaName", "category", "description"],
  ["address", "district", "lat", "lng"],
  ["price", "cpm", "dailyTraffic", "monthlyImpressions"],
  ["images"],
];

const STEP_TITLES = [
  "Basic info",
  "Location",
  "Price & exposure",
  "Images",
  "Confirmation",
] as const;

function parseOptionalNumber(s: string | undefined): number | undefined {
  const t = s?.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function buildActionPayload(values: MediaWizardFormValues) {
  return {
    mediaName: values.mediaName.trim(),
    category: values.category,
    description: values.description?.trim() || undefined,
    address: values.address.trim(),
    district: values.district?.trim() || undefined,
    lat: parseOptionalNumber(values.lat),
    lng: parseOptionalNumber(values.lng),
    price: parseOptionalNumber(values.price),
    cpm: parseOptionalNumber(values.cpm),
    dailyTraffic: values.dailyTraffic?.trim() || undefined,
    monthlyImpressions: values.monthlyImpressions?.trim() || undefined,
    images: values.images.map((row) => row.url.trim()).filter(Boolean),
  };
}

export function MediaWizard({ locale }: { locale: string }) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const form = useForm<MediaWizardFormValues>({
    resolver: zodResolver(mediaWizardSchema),
    defaultValues: {
      mediaName: "",
      category: MediaCategory.BILLBOARD,
      description: "",
      address: "",
      district: "",
      lat: "",
      lng: "",
      price: "",
      cpm: "",
      dailyTraffic: "",
      monthlyImpressions: "",
      images: [{ url: "" }, { url: "" }, { url: "" }],
    },
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const mediasListHref = `/${locale}/admin/medias`;

  async function goNext() {
    const fieldsToValidate = STEP_FIELDS[step];
    const ok = await form.trigger(fieldsToValidate, { shouldFocus: true });
    if (ok) setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }

  function goPrev() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function onSubmit(values: MediaWizardFormValues) {
    setSubmitting(true);
    try {
      const payload = buildActionPayload(values);
      await createMediaAction(payload);
      setSuccess(true);
      toast.success("Media created", {
        description: "The listing was saved and is pending review.",
      });
      router.refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      if (msg === "DUPLICATE_MEDIA_NAME") {
        toast.error("Duplicate name", {
          description: "A media with this name already exists. Choose another name.",
        });
        return;
      }
      if (msg === "Forbidden") {
        toast.error("Forbidden", {
          description: "You do not have permission to create media.",
        });
        return;
      }
      toast.error("Could not create media", {
        description: msg,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Media registered</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p className="text-sm text-foreground">
            Your media was created successfully and is in pending review.
          </p>
          <Link
            href={mediasListHref}
            className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to admin medias
          </Link>
        </CardContent>
      </Card>
    );
  }

  const values = form.watch();
  const lastStepIndex = STEP_TITLES.length - 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Register new media
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete each step to add a media listing to the catalog.
        </p>
      </div>

      <nav aria-label="Progress" className="w-full">
        <ol className="flex items-center">
          {STEP_TITLES.map((title, i) => {
            const isActive = i === step;
            const isComplete = i < step;
            return (
              <li key={title} className="flex flex-1 items-center">
                <div className="flex w-full flex-col items-center gap-2">
                  <div className="flex w-full items-center">
                    {i > 0 ? (
                      <div
                        className={cn(
                          "h-px flex-1",
                          isComplete || isActive ? "bg-primary/60" : "bg-border",
                        )}
                        aria-hidden
                      />
                    ) : (
                      <div className="flex-1" />
                    )}
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                        isActive &&
                          "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30",
                        isComplete && !isActive && "bg-primary/80 text-primary-foreground",
                        !isActive &&
                          !isComplete &&
                          "bg-muted text-muted-foreground",
                      )}
                      aria-current={isActive ? "step" : undefined}
                    >
                      {i + 1}
                    </span>
                    {i < STEP_TITLES.length - 1 ? (
                      <div
                        className={cn(
                          "h-px flex-1",
                          isComplete ? "bg-primary/60" : "bg-border",
                        )}
                        aria-hidden
                      />
                    ) : (
                      <div className="flex-1" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "hidden text-center text-xs font-medium sm:block",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {title}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                {STEP_TITLES[step]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 0 && (
                <>
                  <FormField
                    control={form.control}
                    name="mediaName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Media name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Gangnam Station LED"
                            className="border-border bg-background text-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="border-border bg-background text-foreground">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(MediaCategory).map((c) => (
                              <SelectItem key={c} value={c}>
                                {CATEGORY_LABELS[c]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Short description of the placement"
                            className="min-h-[100px] border-border bg-background text-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 1 && (
                <>
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Street, city, country"
                            className="border-border bg-background text-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>District (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Gangnam-gu"
                            className="border-border bg-background text-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="lat"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="37.…"
                              className="border-border bg-background text-foreground"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lng"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="127.…"
                              className="border-border bg-background text-foreground"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (KRW, optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              className="border-border bg-background text-foreground"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cpm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPM (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              inputMode="numeric"
                              placeholder="0"
                              className="border-border bg-background text-foreground"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="dailyTraffic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily traffic (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 120,000 vehicles"
                            className="border-border bg-background text-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyImpressions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly impressions (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. 2.4M"
                            className="border-border bg-background text-foreground"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      Add one or more image URLs. Empty rows are ignored.
                    </p>
                    <button
                      type="button"
                      onClick={() => append({ url: "" })}
                      className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      Add URL row
                    </button>
                  </div>
                  {fields.map((row, index) => (
                    <FormField
                      key={row.id}
                      control={form.control}
                      name={`images.${index}.url`}
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              {index === 0 ? (
                                <FormLabel>Image URL</FormLabel>
                              ) : (
                                <Label className="sr-only">
                                  Image URL {index + 1}
                                </Label>
                              )}
                              <FormControl>
                                <Input
                                  placeholder="https://…"
                                  className="mt-1 border-border bg-background text-foreground"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </div>
                            {fields.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="self-end rounded-md border border-border px-2 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                                aria-label={`Remove image row ${index + 1}`}
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

              {step === 4 && (
                <dl className="divide-y divide-border text-sm">
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">Name</dt>
                    <dd className="text-foreground sm:col-span-2">
                      {values.mediaName || "—"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">
                      Category
                    </dt>
                    <dd className="text-foreground sm:col-span-2">
                      {CATEGORY_LABELS[values.category]}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">
                      Description
                    </dt>
                    <dd className="whitespace-pre-wrap text-foreground sm:col-span-2">
                      {values.description?.trim() || "—"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">
                      Address
                    </dt>
                    <dd className="text-foreground sm:col-span-2">
                      {values.address || "—"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">
                      District
                    </dt>
                    <dd className="text-foreground sm:col-span-2">
                      {values.district?.trim() || "—"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">
                      Coordinates
                    </dt>
                    <dd className="text-foreground sm:col-span-2">
                      {values.lat?.trim() || values.lng?.trim()
                        ? `${values.lat?.trim() || "—"}, ${values.lng?.trim() || "—"}`
                        : "—"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">Price</dt>
                    <dd className="text-foreground sm:col-span-2">
                      {values.price?.trim() || "—"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">CPM</dt>
                    <dd className="text-foreground sm:col-span-2">
                      {values.cpm?.trim() || "—"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">
                      Daily traffic
                    </dt>
                    <dd className="text-foreground sm:col-span-2">
                      {values.dailyTraffic?.trim() || "—"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">
                      Monthly impressions
                    </dt>
                    <dd className="text-foreground sm:col-span-2">
                      {values.monthlyImpressions?.trim() || "—"}
                    </dd>
                  </div>
                  <div className="grid gap-1 py-3 sm:grid-cols-3">
                    <dt className="font-medium text-muted-foreground">
                      Images
                    </dt>
                    <dd className="space-y-1 text-foreground sm:col-span-2">
                      {values.images
                        .map((r) => r.url.trim())
                        .filter(Boolean).length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <ul className="list-inside list-disc break-all">
                          {values.images
                            .map((r) => r.url.trim())
                            .filter(Boolean)
                            .map((u, idx) => (
                              <li key={`${idx}-${u}`}>{u}</li>
                            ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={step === 0 || submitting}
              className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex gap-2">
              {step < lastStepIndex ? (
                <button
                  type="button"
                  onClick={() => void goNext()}
                  disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
