import { z } from "zod";
import { CROP_TYPES, DEFAULT_BUFFER_PERCENT } from "@/lib/constants";

const cropTypeSchema = z.enum(CROP_TYPES);

export const emailSchema = z.string().email().trim().toLowerCase();
export const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const optionalPositiveIntSchema = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().positive().optional()
);

export const growerRegisterSchema = z.object({
  name: z.string().min(2).trim(),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().min(7).trim(),
  city: z.string().min(2).trim(),
  address: z.string().min(5).trim(),
  pincode: z.string().min(4).trim(),
  areaSize: optionalPositiveIntSchema,
  spaceAvailable: optionalPositiveIntSchema,
  spacePhotoUrl: z.string().url().optional(),
  kit: z.enum(["Starter", "Standard", "Pro"]).default("Starter"),
  upiId: z.string().trim().optional(),
});

export const restaurantRegisterSchema = z.object({
  name: z.string().min(2).trim(),
  email: emailSchema,
  password: passwordSchema,
  businessName: z.string().min(2).trim(),
  phone: z.string().min(7).trim(),
  address: z.string().min(5).trim(),
  city: z.string().min(2).trim(),
  pincode: z.string().min(4).trim().default(""),
  gstNumber: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  cuisineType: z.string().trim().optional(),
});

export const createOrderSchema = z.object({
  cropType: cropTypeSchema,
  quantityKg: z.coerce.number().positive(),
  deliveryDate: z.coerce.date(),
  recurrence: z.enum(["weekly", "biweekly"]).nullable().optional(),
  notes: z.string().max(1000).optional(),
});

export const demandSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1),
  bufferPercent: z.coerce.number().min(0).max(1).default(DEFAULT_BUFFER_PERCENT),
  sowDate: z.coerce.date().optional(),
});

export const allocateSchema = z.object({
  planId: z.string().min(1),
  allocations: z.array(z.object({
    growerId: z.string().min(1),
    trayCount: z.coerce.number().int().nonnegative(),
  })).min(1),
});

export const checkinSchema = z.object({
  batchId: z.string().min(1),
  day: z.coerce.number().int().min(1),
  imageTopUrl: z.string().url().optional(),
  imageSideUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

export const harvestSchema = z.object({
  batchId: z.string().min(1),
  actualYieldGrams: z.coerce.number().int().nonnegative(),
  harvestImageUrl: z.string().url().optional(),
});

export const qcSchema = z.object({
  batchId: z.string().min(1),
  checkInId: z.string().min(1),
  result: z.enum(["PASS", "RISK", "REJECT"]),
  notes: z.string().max(1200).default(""),
});

export const feedbackSchema = z.object({
  orderId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  notes: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional(),
});

export const growerProfileSchema = z.object({
  phone: z.string().min(7).optional(),
  address: z.string().min(5).optional(),
  city: z.string().min(2).optional(),
  pincode: z.string().min(4).optional(),
  spaceAvailable: z.coerce.number().int().positive().optional(),
  bankAccount: z.string().optional(),
  bankIFSC: z.string().optional(),
  upiId: z.string().optional(),
});

export const hubCheckinSchema = z.object({
  hubId: z.string().min(1),
  batchId: z.string().min(1),
  actualKg: z.coerce.number().nonnegative(),
});

export const hubQcSchema = z.object({
  batchId: z.string().min(1),
  result: z.enum(["PASS", "REJECT"]),
  notes: z.string().max(1000).optional(),
});

export const deliveryDispatchSchema = z.object({
  orderId: z.string().min(1),
  hubId: z.string().min(1),
  driverName: z.string().min(2),
  driverPhone: z.string().min(7),
});

export const deliveryUpdateSchema = z.object({
  status: z.enum(["PREPARING", "PACKED", "IN_TRANSIT", "DELIVERED", "FAILED"]),
});

export const payoutApproveSchema = z.object({
  payoutIds: z.array(z.string().min(1)).min(1),
});
