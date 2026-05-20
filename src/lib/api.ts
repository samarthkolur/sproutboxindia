import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(error: string, code = "BAD_REQUEST", status = 400) {
  return NextResponse.json({ success: false, error, code }, { status });
}

export function parseError(error: unknown) {
  if (error instanceof ZodError) {
    return fail(error.issues[0]?.message || "Invalid request", "VALIDATION_ERROR", 422);
  }

  console.error(error);
  return fail("Internal server error", "INTERNAL_SERVER_ERROR", 500);
}
