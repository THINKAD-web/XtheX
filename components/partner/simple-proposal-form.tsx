"use client";

import * as React from "react";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormMessage } from "@/components/ui/form";
import { useToast } from "@/components/ui/use-toast";
import { createProposal } from "@/app/[locale]/dashboard/partner/actions";

const formSchema = z.object({
  title: z.string().min(2, "제목은 최소 2자 이상이어야 합니다."),
  description: z.string().max(1000, "설명은 최대 1000자까지 입력 가능합니다."),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  onCreated?: (id: string, values: { title: string; mediaType: string }) => void;
};

export function SimpleProposalForm({ onCreated }: Props) {
  const { toast } = useToast();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
    mode: "onBlur",
  });

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    startTransition(async () => {
      try {
        const result = await createProposal(values);
        if (!result.ok) {
          const msg = result.error ?? "업로드에 실패했습니다.";
          setServerError(msg);
          toast({
            variant: "destructive",
            title: "업로드에 실패했습니다.",
            description: msg,
          });
          return;
        }

        if (onCreated && result.id) {
          onCreated(result.id, { title: values.title, mediaType: "OTHER" });
        }

        toast({
          title: "제안서가 업로드되었습니다!",
        });

        if (result.analysisError) {
          toast({
            variant: "destructive",
            title: "Grok 분석 중 오류가 발생했습니다.",
            description: result.analysisError,
          });
        }

        reset({
          title: "",
          description: "",
        });
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "업로드에 실패했습니다.";
        setServerError(msg);
        toast({
          variant: "destructive",
          title: "업로드에 실패했습니다.",
          description: msg,
        });
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          제목
        </label>
        <Input
          placeholder="제목을 입력하세요 (최소 2자)"
          {...register("title")}
        />
        <FormMessage>{errors.title?.message}</FormMessage>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          설명
        </label>
        <Textarea
          rows={4}
          placeholder="설명을 입력하세요 (최대 1000자)"
          {...register("description")}
        />
        <FormMessage>{errors.description?.message}</FormMessage>
      </div>

      <FormMessage>{serverError}</FormMessage>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50" />
              <span>업로드 중...</span>
            </span>
          ) : (
            "제안서 업로드"
          )}
        </Button>
      </div>
    </form>
  );
}

