// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.fn();
const findUnique = vi.fn();
const update = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: () => auth() }));
vi.mock("@/lib/prisma", () => ({ prisma: { grower: { findUnique: (a: unknown) => findUnique(a), update: (a: unknown) => update(a) } } }));

import { PATCH } from "@/app/api/grower/profile/route";

const patch = (body: unknown) => PATCH(new Request("http://localhost/api/grower/profile", { method: "PATCH", body: JSON.stringify(body) }));

describe("PATCH /api/grower/profile", () => {
  beforeEach(() => {
    auth.mockReset().mockResolvedValue({ user: { id: "user-1", role: "GROWER" } });
    findUnique.mockReset().mockResolvedValue({ fssaiRegNumber: "11111111111111" });
    update.mockReset().mockImplementation(async ({ data }) => ({ id: "g1", ...data }));
  });

  it("is for signed-in growers only", async () => {
    auth.mockResolvedValue({ user: { id: "u", role: "RESTAURANT" } });
    expect((await patch({ city: "Mysuru" })).status).toBe(401);
    auth.mockResolvedValue(null);
    expect((await patch({ city: "Mysuru" })).status).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });

  it("updates only the caller's own row", async () => {
    await patch({ city: "Mysuru" });
    expect(update).toHaveBeenCalledWith({ where: { userId: "user-1" }, data: { city: "Mysuru" } });
  });

  it("rejects invalid input with a message", async () => {
    const res = await patch({ phone: "1" });
    expect(res.status).toBe(422);
    expect(update).not.toHaveBeenCalled();
  });

  it("clears the verification when the FSSAI number changes", async () => {
    await patch({ fssaiRegNumber: "22222222222222" });
    expect(update).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      data: { fssaiRegNumber: "22222222222222", fssaiVerifiedAt: null },
    });
  });

  it("keeps the verification when the same number is sent again", async () => {
    await patch({ fssaiRegNumber: "11111111111111" });
    expect(update).toHaveBeenCalledWith({ where: { userId: "user-1" }, data: { fssaiRegNumber: "11111111111111" } });
  });

  it("does not touch the verification for edits that do not mention FSSAI", async () => {
    await patch({ upiId: "asha@upi" });
    expect(findUnique).not.toHaveBeenCalled();
    expect(update.mock.calls[0][0].data).not.toHaveProperty("fssaiVerifiedAt");
  });
});
