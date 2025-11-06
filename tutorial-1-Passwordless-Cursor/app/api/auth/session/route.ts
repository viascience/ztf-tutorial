import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserByKeycloakSub, createUser, updateUserLastLogin, getUserById } from "@/lib/db/queries";

export async function GET() {
  try {
    const session = await getSession();

    if (!session.userId) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Get user from database
    const user = await getUserById(session.userId);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, accessToken, idToken, expiresAt } = body;

    if (!userId || !accessToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create user in database (userId is Keycloak sub)
    let user = await getUserByKeycloakSub(userId);
    
    if (!user) {
      // Create new user in database
      console.log("Creating new user in database for Keycloak sub:", userId);
      user = await createUser(userId, email, name || email);
    } else {
      // Update last login
      console.log("User exists, updating last login");
      await updateUserLastLogin(user.id);
    }

    // Store session in encrypted cookie
    const session = await getSession();
    session.userId = user.id; // Use database user ID, not Keycloak sub
    session.email = email;
    session.name = name;
    session.accessToken = accessToken;
    session.idToken = idToken;
    session.expiresAt = expiresAt;
    session.sessionId = crypto.randomUUID();

    await session.save();

    console.log("Server-side session created for user:", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

