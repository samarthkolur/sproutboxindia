"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { controlClass } from "@/components/ui/field";
import { FEEDBACK_TAGS, composeFeedbackNotes, type FeedbackTag } from "@/lib/restaurant";
import { cn } from "@/lib/utils";

const RATING_WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

// One rating per order: a big star row, quick tags and optional notes. If the order already
// has feedback the form opens with it filled in, and saving updates it.
export function FeedbackForm({
  orderId,
  existing,
}: {
  orderId: string;
  existing: { rating: number; tags: FeedbackTag[]; text: string } | null;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [tags, setTags] = useState<string[]>(existing?.tags ?? []);
  const [notes, setNotes] = useState(existing?.text ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (rating === 0) return setError("Choose a star rating first.");
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/restaurant/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, notes: composeFeedbackNotes(tags, notes) || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not send your feedback");
      }
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your feedback");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" className="py-8 text-center">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-leaf-soft">
          <CheckCircle2 className="h-8 w-8 text-good" aria-hidden="true" />
        </span>
        <p className="text-lg font-medium text-ink">Thank you for your feedback</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">It helps us keep every delivery fresh, and it goes straight to the growers who supplied your order.</p>
        <Link href="/restaurant/orders" className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-brand-ink transition-opacity hover:opacity-90">
          Back to my orders
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ink">How was your delivery?</legend>
        <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
              data-no-global-loading
              onClick={() => setRating(value)}
              className="rounded-full p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 motion-reduce:transition-none"
            >
              <Star className={cn("h-9 w-9", value <= rating ? "fill-watch text-watch" : "text-hairline")} aria-hidden="true" />
            </button>
          ))}
          <span aria-live="polite" className="ml-2 text-sm text-ink-soft">{RATING_WORDS[rating]}</span>
        </div>
      </fieldset>

      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-medium text-ink">What stood out?</legend>
        <div className="flex flex-wrap gap-2">
          {FEEDBACK_TAGS.map((tag) => {
            const on = tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                data-no-global-loading
                aria-pressed={on}
                onClick={() => setTags((current) => (on ? current.filter((t) => t !== tag) : [...current, tag]))}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                  on ? "border-transparent bg-brand text-brand-ink" : "border-hairline bg-panel/60 text-ink-soft hover:text-ink"
                )}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor="feedback-notes" className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
          <span>Anything else?</span>
          <span className="text-micro font-normal text-ink-muted">Optional</span>
        </label>
        <textarea
          id="feedback-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          maxLength={900}
          placeholder="Tell us how the crop looked, tasted and arrived"
          className={cn(controlClass, "resize-none")}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-tile bg-risk-soft px-3 py-2 text-sm font-medium text-risk">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        data-no-global-loading
        disabled={submitting}
        className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand px-5 text-base font-medium text-brand-ink transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Sending…
          </>
        ) : existing ? (
          "Update feedback"
        ) : (
          "Send feedback"
        )}
      </button>
    </form>
  );
}
