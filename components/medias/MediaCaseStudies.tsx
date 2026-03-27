"use client";

import * as React from "react";
import { Pencil } from "lucide-react";
import { AdminCaseStudyEditModal, type CaseStudyData } from "./AdminCaseStudyEditModal";

export type CaseStudyItem = {
  id?: string;
  titleKo: string;
  titleEn: string;
  descriptionKo: string;
  descriptionEn: string;
  client?: string;
  result?: string;
  imageUrl?: string;
  images?: string[];
};

type Props = {
  caseStudies: CaseStudyItem[];
  locale: string;
  className?: string;
  adminButton?: React.ReactNode;
  isAdmin?: boolean;
};

export function MediaCaseStudies({ caseStudies, locale, className, adminButton, isAdmin }: Props) {
  const isKo = locale === "ko";
  const [editingCase, setEditingCase] = React.useState<CaseStudyData | null>(null);

  if (caseStudies.length === 0) {
    return (
      <section
        className={
          className ??
          "rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 ring-1 ring-zinc-800"
        }
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {isKo ? "실제 집행 사례" : "Case studies"}
          </h2>
          {adminButton}
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          {isKo
            ? "해당 매체의 집행 사례가 등록되면 여기에 표시됩니다."
            : "Case studies for this media will appear here when available."}
        </p>
        <div className="mt-4 flex gap-3">
          <div className="h-24 w-32 flex-shrink-0 rounded-lg bg-zinc-800/80" />
          <div className="h-24 w-32 flex-shrink-0 rounded-lg bg-zinc-800/80" />
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className={
          className ??
          "rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 ring-1 ring-zinc-800"
        }
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            {isKo ? "실제 집행 사례" : "Case studies"}
          </h2>
          {adminButton}
        </div>
        <ul className="mt-4 space-y-4">
          {caseStudies.map((item, i) => (
            <li key={item.id ?? i} className="flex gap-4 group">
              {item.imageUrl && (
                <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={isKo ? item.titleKo : item.titleEn}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-medium text-zinc-200">
                    {isKo ? item.titleKo : item.titleEn}
                  </h3>
                  {isAdmin && item.id && (
                    <button
                      onClick={() => setEditingCase({
                        id: item.id!,
                        title: item.titleKo || item.titleEn,
                        description: item.descriptionKo || item.descriptionEn || null,
                        client: item.client || null,
                        result: item.result || null,
                        images: item.images ?? (item.imageUrl ? [item.imageUrl] : []),
                      })}
                      className="flex-shrink-0 p-1 text-zinc-500 hover:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {item.client && (
                  <p className="text-xs text-zinc-500">
                    {isKo ? "클라이언트" : "Client"}: {item.client}
                  </p>
                )}
                <p className="mt-1 text-xs text-zinc-400">
                  {isKo ? item.descriptionKo : item.descriptionEn}
                </p>
                {item.result && (
                  <p className="mt-1 text-xs font-medium text-emerald-400">
                    {isKo ? "성과" : "Result"}: {item.result}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {editingCase && (
        <AdminCaseStudyEditModal
          caseStudy={editingCase}
          onClose={() => setEditingCase(null)}
        />
      )}
    </>
  );
}
