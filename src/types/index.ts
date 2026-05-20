import type {
  BatchStatus,
  DeliveryStatus,
  OrderStatus,
  PayoutStatus,
  Prisma,
  QCResult,
  Role,
  TaskStatus,
} from "@prisma/client";

// ── Extended session types ──────────────────────────────────────────────────
declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      email?: string | null;
      name: string | null;
      image: string | null;
      role: Role;
    };
  }
}

// ── Prisma payload helpers ──────────────────────────────────────────────────
export type UserSessionRole = Role;
export type OrderWithRestaurant = Prisma.OrderGetPayload<{
  include: { restaurant: true; productionPlan: true; delivery: true; feedback: true };
}>;
export type TaskWithBatches = Prisma.TaskGetPayload<{ include: { batches: true } }>;
export type BatchWithTask = Prisma.BatchGetPayload<{
  include: { task: { include: { grower: { include: { user: true; cluster: true } } } }; checkIns: true };
}>;

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
  trayCount: number;
  growerName?: string;
  compositeScore?: number;
}

// ── QC types ────────────────────────────────────────────────────────────────
export interface QCSubmission {
  batchId: string;
  checkInId: string;
  result: QCResult;
  notes: string;
}

export interface ProductionPlanInputOrder {
  cropType: string;
  quantityKg: number;
}

export interface GrowerAllocationInput {
  id: string;
  clusterId: string | null;
  isActive: boolean;
  compositeScore: number;
}

export interface ApiError {
  error: string;
  code: string;
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

export type {
  BatchStatus,
  DeliveryStatus,
  OrderStatus,
  PayoutStatus,
  QCResult,
  Role,
  TaskStatus,
};
