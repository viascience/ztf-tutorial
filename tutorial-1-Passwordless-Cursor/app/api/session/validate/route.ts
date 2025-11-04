import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { validateSession } from "@/lib/auth/session-validator";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { valid: false, reason: "no_session" },
        { status: 401 }
      );
    }

    // Validate session is still active
    const isValid = await validateSession(session);

    if (!isValid) {
      return NextResponse.json(
        { valid: false, reason: "token_invalid" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      valid: true,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { valid: false, reason: "validation_error" },
      { status: 500 }
    );
  }
}

