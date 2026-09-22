import { GlassCard } from "@/components/shared/GlassCard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserCircle, MapPin, CreditCard, Phone, ShieldCheck, ShieldAlert } from "lucide-react";

async function getGrowerProfile(userId: string) {
  try {
    const grower = await prisma.grower.findUnique({
      where: { userId },
      include: { user: { select: { name: true, email: true } } },
    });
    return grower;
  } catch {
    return null;
  }
}

export default async function GrowerProfilePage() {
  const session = await auth();
  const userId = session?.user?.id || "";
  const grower = await getGrowerProfile(userId);

  const fields = [
    { label: "Name", value: grower?.user.name || "—", icon: UserCircle },
    { label: "Email", value: session?.user?.email || "—", icon: UserCircle },
    { label: "Phone", value: grower?.phone || "—", icon: Phone },
    { label: "Address", value: grower?.address || "—", icon: MapPin },
    { label: "City", value: grower?.city || "—", icon: MapPin },
    { label: "Pincode", value: grower?.pincode || "—", icon: MapPin },
    { label: "Kit Size", value: grower?.kitSize ? `${grower.kitSize} trays` : "—", icon: CreditCard },
    { label: "FSSAI Registration Number", value: grower?.fssaiRegNumber || "—", icon: ShieldCheck },
    { label: "UPI ID", value: grower?.upiId || "—", icon: CreditCard },
    { label: "Bank Account", value: grower?.bankAccount || "—", icon: CreditCard },
    { label: "IFSC", value: grower?.bankIFSC || "—", icon: CreditCard },
  ];

  return (
    <div>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">Profile</h1>
        <p className="text-sm sm:text-base text-text-secondary mt-1">Your account and payment details</p>
      </div>

      {/* FSSAI compliance status */}
      {grower && (
        <GlassCard className="mb-6">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                grower.fssaiVerifiedAt ? "bg-sprout-100" : "bg-amber-50"
              }`}
            >
              {grower.fssaiVerifiedAt ? (
                <ShieldCheck className="h-5 w-5 text-sprout-700" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary">
                {grower.fssaiVerifiedAt
                  ? "FSSAI compliance verified"
                  : grower.fssaiRegNumber
                    ? "FSSAI number on file — pending admin verification"
                    : "FSSAI registration required"}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {grower.fssaiRegNumber || "Not submitted yet."} Indian food safety law requires
                every home-based grower to hold an FSSAI registration before supplying
                restaurants commercially.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Score cards */}
      {grower && (
        <div className="mb-6 grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Yield Score", value: Math.round(grower.yieldScore * 100) },
            { label: "Quality Score", value: Math.round(grower.qualityScore * 100) },
            { label: "Timeliness", value: Math.round(grower.timelinessScore * 100) },
          ].map((s) => (
            <GlassCard key={s.label} padding="sm">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-2xl font-black text-sprout-800">{s.value}%</p>
            </GlassCard>
          ))}
        </div>
      )}

      <GlassCard>
        <h2 className="text-lg font-bold text-text-primary mb-5">Account Details</h2>
        <div className="space-y-4">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.label} className="flex items-center gap-4 rounded-xl border border-white/40 bg-white/50 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sprout-50">
                  <Icon className="w-5 h-5 text-sprout-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{field.label}</p>
                  <p className="break-words text-sm font-medium text-text-primary">{field.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
