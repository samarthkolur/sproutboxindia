"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing-client";
import type { UploadRouter } from "@/lib/uploadthing";

interface ImageUploaderProps {
  label: string;
  endpoint: keyof UploadRouter;
  value?: string;
  onChange?: (url: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
}

export function ImageUploader({ label, endpoint, value, onChange, onUploadingChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(value || "");
  const [error, setError] = useState<string | null>(null);

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      const url = res?.[0]?.url;
      if (url) {
        setPreview(url);
        onChange?.(url);
      }
    },
    onUploadError: (err) => {
      setError(err.message || "Upload failed");
      setPreview("");
      onChange?.("");
    },
  });

  useEffect(() => {
    onUploadingChange?.(isUploading);
  }, [isUploading, onUploadingChange]);

  return (
    <div className="rounded-xl border border-sprout-800/15 bg-white/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-text-primary">{label}</p>
        {preview ? (
          <button
            type="button"
            className="rounded-lg p-1 text-text-muted hover:bg-red-50 hover:text-red-600"
            onClick={() => {
              setPreview("");
              onChange?.("");
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <button
        type="button"
        disabled={isUploading}
        className={cn(
          "flex min-h-[132px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-sprout-800/20 bg-sprout-50/40 text-sm text-text-muted disabled:opacity-60",
          preview && "border-solid bg-white"
        )}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-sprout-700" />
            Uploading…
          </>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="max-h-32 rounded-lg object-cover" />
        ) : (
          <>
            <ImagePlus className="mb-2 h-6 w-6 text-sprout-700" />
            Upload image
          </>
        )}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setError(null);
          startUpload([file]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
