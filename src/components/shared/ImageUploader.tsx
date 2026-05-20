"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  label: string;
  value?: string;
  onChange?: (url: string) => void;
}

export function ImageUploader({ label, value, onChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(value || "");

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
        className={cn(
          "flex min-h-[132px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-sprout-800/20 bg-sprout-50/40 text-sm text-text-muted",
          preview && "border-solid bg-white"
        )}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="max-h-32 rounded-lg object-cover" />
        ) : (
          <>
            <ImagePlus className="mb-2 h-6 w-6 text-sprout-700" />
            Upload image
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          setPreview(url);
          onChange?.(url);
        }}
      />
    </div>
  );
}
