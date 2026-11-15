"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { TextField } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { FieldErrors } from "@/lib/join-validation";
import { maskValue } from "@/lib/grower";
import { profilePayload, validateProfileSection, type ProfileSection as Section } from "@/lib/grower-profile";

export interface ProfileFieldSpec {
  name: string;
  label: string;
  hint?: string;
  inputMode?: "text" | "tel" | "numeric";
  autoComplete?: string;
  /** Shown as dots until the person chooses to reveal it (bank details). */
  masked?: boolean;
  optional?: boolean;
  suffix?: string;
}

// One group of editable profile fields (V5: Edit sits beside the group it changes).
// View mode is a definition list; edit mode is a form that saves just this group through
// PATCH /api/grower/profile, then refreshes the page so every panel shows the saved data.
export function ProfileSection({
  section,
  title,
  subtitle,
  fields,
  values,
  locked,
  lockedNote,
  children,
}: {
  section: Section;
  title: string;
  subtitle?: string;
  fields: ProfileFieldSpec[];
  values: Record<string, string>;
  /** Read-only: no Edit button (a verified FSSAI number). */
  locked?: boolean;
  lockedNote?: string;
  /** Extra content under the fields in view mode (the FSSAI status). */
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(values);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function startEditing() {
    setDraft(values);
    setErrors({});
    setServerError(null);
    setEditing(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const found = validateProfileSection(section, draft);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    setServerError(null);
    try {
      const res = await fetch("/api/grower/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profilePayload(section, draft)),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Could not save your changes");
      }
      toast.success("Saved");
      setEditing(false);
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Could not save your changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel>
      <PanelHeader
        title={title}
        subtitle={subtitle}
        actions={
          !editing && !locked ? (
            <button
              type="button"
              data-no-global-loading
              onClick={startEditing}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-panel/60 px-3.5 py-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edit</span>
              <span className="sr-only">{title}</span>
            </button>
          ) : null
        }
      />

      {editing ? (
        <form onSubmit={save} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <TextField
                key={field.name}
                label={field.label}
                hint={field.hint}
                optional={field.optional}
                error={errors[field.name]}
                inputMode={field.inputMode}
                autoComplete={field.autoComplete ?? "off"}
                value={draft[field.name] ?? ""}
                onChange={(event) => setDraft((current) => ({ ...current, [field.name]: event.target.value }))}
                className={field.name === "address" ? "sm:col-span-2" : undefined}
              />
            ))}
          </div>
          {serverError ? (
            <p role="alert" className="mt-4 rounded-tile bg-risk-soft px-3 py-2 text-sm font-medium text-risk">
              {serverError}
            </p>
          ) : null}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              data-no-global-loading
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-full border border-hairline bg-panel/60 px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              data-no-global-loading
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-ink hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : null}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      ) : (
        <>
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {fields.map((field) => {
              const raw = values[field.name] ?? "";
              const shown = field.masked && !revealed[field.name] ? maskValue(raw) : raw;
              return (
                <div key={field.name} className={field.name === "address" ? "min-w-0 sm:col-span-2" : "min-w-0"}>
                  <dt className="text-micro text-ink-muted">{field.label}</dt>
                  <dd className="mt-0.5 flex items-center gap-2 text-sm font-medium text-ink">
                    {raw ? (
                      <span className="min-w-0 break-words tabular-nums">
                        {shown}
                        {field.suffix ? <span className="font-normal text-ink-soft">{` ${field.suffix}`}</span> : null}
                      </span>
                    ) : (
                      <span className="font-normal text-ink-muted">Not added</span>
                    )}
                    {field.masked && raw ? (
                      <button
                        type="button"
                        data-no-global-loading
                        onClick={() => setRevealed((current) => ({ ...current, [field.name]: !current[field.name] }))}
                        aria-pressed={Boolean(revealed[field.name])}
                        aria-label={`${revealed[field.name] ? "Hide" : "Show"} ${field.label}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                      >
                        {revealed[field.name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    ) : null}
                  </dd>
                </div>
              );
            })}
          </dl>
          {locked && lockedNote ? <p className="mt-4 text-micro text-ink-muted">{lockedNote}</p> : null}
          {children}
        </>
      )}
    </Panel>
  );
}
