import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, phone, city, address, pincode, areaSize, kit, upiId } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    // Map kit name to tray count
    const kitSizeMap: Record<string, number> = { Starter: 5, Standard: 15, Pro: 40 };

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: "GROWER",
        grower: {
          create: {
            phone: phone || "",
            city: city || "",
            address: address || "",
            pincode: pincode || "",
            kitSize: kitSizeMap[kit] || 5,
            spaceAvailable: areaSize ? parseInt(areaSize) : null,
            upiId: upiId || null,
          },
        },
      },
      include: { grower: true },
    });

    return NextResponse.json(
      { message: "Grower registered successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Grower registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
