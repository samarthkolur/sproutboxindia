import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, businessName, phone, address, city, gstNumber } = body;

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

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: "RESTAURANT",
        restaurant: {
          create: {
            businessName: businessName || name,
            contactName: name,
            phone: phone || "",
            address: address || "",
            city: city || "",
            pincode: "",
            gstin: gstNumber || null,
          },
        },
      },
      include: { restaurant: true },
    });

    return NextResponse.json(
      { message: "Restaurant registered successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Restaurant registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
