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
    <div className="rounded-tile border border-hairline bg-panel/60 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-ink">{label}</p>
        {preview ? (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            className="rounded-full p-1.5 text-ink-muted transition-colors hover:bg-risk-soft hover:text-risk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
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
          "flex min-h-[132px] w-full flex-col items-center justify-center rounded-tile border border-dashed border-hairline bg-inset/40 text-sm text-ink-soft transition-colors hover:bg-inset/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-60",
          preview && "border-solid bg-panel-solid"
        )}
        onClick={() => inputRef.current?.click()}
      >
        {isUploading ? (
          <>
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-ink-muted motion-reduce:animate-none" />
            Uploading…
          </>
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="max-h-32 rounded-xl object-cover" />
        ) : (
          <>
            <ImagePlus className="mb-2 h-6 w-6 text-ink-muted" />
            Upload image
          </>
        )}
      </button>
      {error && <p role="alert" className="mt-2 text-micro font-medium text-risk">{error}</p>}
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
