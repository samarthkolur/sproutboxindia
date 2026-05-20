import { Role } from "@prisma/client";

// ── Extended session types ──────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      role: Role;
    };
  }
}

// ── Grower types ────────────────────────────────────────────────────────────
export interface GrowerWithUser {
  id: string;
  userId: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  clusterId: string | null;
  kitSize: number;
  spaceAvailable: number | null;
  yieldScore: number;
  qualityScore: number;
  timelinessScore: number;
  compositeScore: number;
  totalEarnings: number;
  isActive: boolean;
  user: {
    name: string | null;
    email: string;
    image: string | null;
  };
}

// ── Order + Production types ────────────────────────────────────────────────
export interface DemandSummary {
  cropType: string;
  totalKg: number;
  baseTrays: number;
  bufferTrays: number;
  totalTrays: number;
  sowDate: Date;
  harvestDate: Date;
}

export interface AllocationResult {
  growerId: string;
  growerName: string;
  compositeScore: number;
  trayCount: number;
}

// ── QC types ────────────────────────────────────────────────────────────────
export interface QCSubmission {
  batchId: string;
  checkInId: string;
  result: "PASS" | "RISK" | "REJECT";
  notes: string;
}

// ── Dashboard stat types ────────────────────────────────────────────────────
export interface KPIStat {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  href?: string;
}

// ── API response types ──────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ── Notification types ──────────────────────────────────────────────────────
export type NotificationType =
  | "QC_RESULT"
  | "TASK_ASSIGNED"
  | "PAYOUT"
  | "DELIVERY"
  | "FEEDBACK"
  | "SYSTEM";
