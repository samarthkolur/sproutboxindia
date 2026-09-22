import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseError } from "@/lib/api";
import { growerRegisterSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = growerRegisterSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      return fail("A user with this email already exists", "EMAIL_EXISTS", 409);
    }

    const hashedPassword = await hash(input.password, 12);

    // Map kit name to tray count
    const kitSizeMap: Record<string, number> = { Starter: 5, Standard: 15, Pro: 40 };

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: hashedPassword,
        role: "GROWER",
        grower: {
          create: {
            phone: input.phone,
            city: input.city,
            address: input.address,
            pincode: input.pincode,
            kitSize: kitSizeMap[input.kit] || 5,
            spaceAvailable: input.spaceAvailable || input.areaSize || null,
            spacePhotoUrl: input.spacePhotoUrl || null,
            upiId: input.upiId || null,
            fssaiRegNumber: input.fssaiRegNumber || null,
          },
        },
      },
      include: { grower: true },
    });

    return ok({ message: "Grower registered successfully", userId: user.id }, 201);
  } catch (error) {
    return parseError(error);
  }
}
