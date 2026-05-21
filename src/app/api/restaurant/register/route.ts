import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { fail, ok, parseError } from "@/lib/api";
import { restaurantRegisterSchema } from "@/lib/schemas";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = restaurantRegisterSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      return fail("A user with this email already exists", "EMAIL_EXISTS", 409);
    }

    const hashedPassword = await hash(input.password, 12);
    const customer = stripe
      ? await stripe.customers.create({
          email: input.email,
          name: input.businessName,
          phone: input.phone,
        })
      : null;

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: hashedPassword,
        role: "RESTAURANT",
        restaurant: {
          create: {
            businessName: input.businessName,
            contactName: input.name,
            phone: input.phone,
            address: input.address,
            city: input.city,
            pincode: input.pincode,
            lat: input.lat ?? null,
            lng: input.lng ?? null,
            gstin: input.gstin || input.gstNumber || null,
            cuisineType: input.cuisineType || null,
            stripeCustomerId: customer?.id || null,
          },
        },
      },
      include: { restaurant: true },
    });

    return ok({ message: "Restaurant registered successfully", userId: user.id }, 201);
  } catch (error) {
    return parseError(error);
  }
}
