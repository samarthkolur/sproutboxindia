import Link from "next/link";
import { format } from "date-fns";
import { ShieldAlert, ShieldCheck, Sprout } from "lucide-react";
import { auth } from "@/lib/auth";
import { PerformanceRadar } from "@/components/grower/PerformanceRadar";
import { ProfileSection } from "@/components/grower/ProfileSection";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusChip } from "@/components/ui/status-chip";
import { fssaiState, qcTile } from "@/lib/grower";
import { getGrowerProfile } from "@/lib/grower-data";

const pct = (score: number) => `${Math.round(score * 100)}%`;

export default async function GrowerProfilePage() {
  const session = await auth();
  const profile = await getGrowerProfile(session?.user?.id ?? "");

  if (!profile) {
    return (
      <>
        <PageHeader title="Profile" subtitle="Your account and payment details." />
        <EmptyState
          icon={Sprout}
          title="No grower profile found"
          description="Finish joining as a grower and your details will appear here."
          action={
            <Link href="/join/grower" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-ink">
              Join as a grower
            </Link>
          }
        />
      </>
    );
  }

  const { grower, scoredTrays } = profile;
  const fssai = fssaiState(grower);
  const reviewed = scoredTrays > 0;
  const qc = qcTile(grower.qualityScore, scoredTrays);

  return (
    <>
      <PageHeader title="Profile" subtitle="Keep your contact and payout details current so payments reach you." />

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <div className="min-w-0 space-y-4">
          <Panel>
            <PanelHeader title="Account" subtitle="Your sign-in details" />
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-micro text-ink-muted">Name</dt>
                <dd className="mt-0.5 text-sm font-medium text-ink">{grower.user.name || "Not added"}</dd>
              </div>
              <div className="min-w-0 sm:col-span-2">
                <dt className="text-micro text-ink-muted">Email</dt>
                <dd className="mt-0.5 break-words text-sm font-medium text-ink">{grower.user.email}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-micro text-ink-muted">Member since</dt>
                <dd className="mt-0.5 text-sm font-medium text-ink">
                  <time dateTime={grower.joinedAt.toISOString()}>{format(grower.joinedAt, "d MMM yyyy")}</time>
                </dd>
              </div>
            </dl>
          </Panel>

          <ProfileSection
            section="contact"
            title="Contact and address"
            subtitle="Where we reach you and collect your trays"
            values={{ phone: grower.phone, address: grower.address, city: grower.city, pincode: grower.pincode }}
            fields={[
              { name: "phone", label: "Phone", inputMode: "tel", autoComplete: "tel" },
              { name: "city", label: "City", autoComplete: "address-level2" },
              { name: "address", label: "Address", autoComplete: "street-address" },
              { name: "pincode", label: "PIN code", inputMode: "numeric", autoComplete: "postal-code" },
            ]}
          />

          <ProfileSection
            section="payout"
            title="Payout details"
            subtitle="Where your earnings are sent. Bank details stay hidden until you show them."
            values={{ upiId: grower.upiId ?? "", bankAccount: grower.bankAccount ?? "", bankIFSC: grower.bankIFSC ?? "" }}
            fields={[
              { name: "upiId", label: "UPI ID", hint: "Like name@upi", optional: true },
              { name: "bankAccount", label: "Bank account number", inputMode: "numeric", masked: true, optional: true },
              { name: "bankIFSC", label: "IFSC code", masked: false, optional: true },
            ]}
          />

          <ProfileSection
            section="space"
            title="Space and kit"
            subtitle="What you grow with"
            values={{ spaceAvailable: grower.spaceAvailable ? String(grower.spaceAvailable) : "" }}
            fields={[{ name: "spaceAvailable", label: "Growing area", inputMode: "numeric", suffix: "sq ft", hint: "Square feet you can use for trays" }]}
          >
            <p className="mt-4 text-sm text-ink-soft">{`Your kit holds ${grower.kitSize} trays.`}</p>
          </ProfileSection>
        </div>

        <div className="min-w-0 space-y-4">
          <ProfileSection
            section="fssai"
            title="FSSAI registration"
            subtitle="Food safety law requires it before you supply restaurants"
            values={{ fssaiRegNumber: grower.fssaiRegNumber ?? "" }}
            fields={[{ name: "fssaiRegNumber", label: "FSSAI registration number", inputMode: "numeric", hint: "14 digits. Our team checks each number." }]}
            locked={fssai === "FSSAI_VERIFIED"}
            lockedNote="This number is verified. Contact the team if it needs to change."
          >
            <div className="mt-4 flex items-start gap-3 rounded-tile bg-inset/50 p-3">
              {fssai === "FSSAI_VERIFIED" ? (
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-good" aria-hidden="true" />
              ) : (
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-watch" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <StatusChip status={fssai} />
                <p className="mt-1.5 text-sm text-ink-soft">
                  {fssai === "FSSAI_VERIFIED"
                    ? "Verified by the SproutBox team."
                    : fssai === "FSSAI_PENDING"
                      ? "Your number is with the team for verification."
                      : "Add your registration number so the team can verify it."}
                </p>
              </div>
            </div>
          </ProfileSection>

          <Panel>
            <PanelHeader title="Performance" subtitle="How restaurants and the team see your trays" />
            {reviewed ? (
              <PerformanceRadar yieldScore={grower.yieldScore} qualityScore={grower.qualityScore} timelinessScore={grower.timelinessScore} />
            ) : null}
            <div className="mt-2 grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
              <StatTile label="Yield" value={reviewed ? pct(grower.yieldScore) : "—"} caption="Harvest weight vs expected" className="!p-3" />
              <StatTile label="Quality" value={qc.value} caption="Finished trays that passed" tone={qc.tone} className="!p-3" />
              <StatTile label="Timing" value={reviewed ? pct(grower.timelinessScore) : "—"} caption="Trays harvested by their due date" className="!p-3" />
            </div>
            {!reviewed ? <p className="mt-3 text-micro text-ink-muted">Scores appear after your first finished tray.</p> : null}
          </Panel>
        </div>
      </div>
    </>
  );
}
