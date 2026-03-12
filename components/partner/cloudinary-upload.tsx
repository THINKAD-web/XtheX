"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
};

export function CloudinaryMultiUpload({ value, onChange }: Props) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function uploadFiles(files: FileList) {
    setError(null);
    setIsUploading(true);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) {
        throw new Error("Missing Cloudinary env: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET");
      }

      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        form.append("upload_preset", uploadPreset);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
          { method: "POST", body: form },
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Upload failed: ${text}`);
        }
        const json = (await res.json()) as { secure_url?: string };
        if (!json.secure_url) throw new Error("Upload failed: missing secure_url");
        uploaded.push(json.secure_url);
      }
      onChange([...value, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={isUploading}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) void uploadFiles(e.target.files);
            e.currentTarget.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange([])}
          disabled={isUploading || value.length === 0}
        >
          Clear
        </Button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {value.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((url) => (
            <div key={url} className="overflow-hidden rounded-md border border-zinc-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Uploaded" className="h-32 w-full object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Upload one or more images.</p>
      )}
    </div>
  );
}

