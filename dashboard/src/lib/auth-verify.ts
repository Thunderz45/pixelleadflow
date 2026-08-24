import { NextRequest } from "next/server";

const API_KEY = "AIzaSyDIk2DNHfsjc6wnOKZePobT2920henqVJc";

export interface AuthenticatedUser {
  uid: string;
  email: string;
}

export async function verifyAuthToken(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    // Call Firebase Auth REST API to lookup user profile details using the ID Token
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });

    if (!res.ok) {
      console.warn("Token validation failed with Firebase Auth REST API.");
      return null;
    }

    const data = await res.json();
    if (data && data.users && data.users.length > 0) {
      const fbUser = data.users[0];
      return {
        uid: fbUser.localId,
        email: fbUser.email || ""
      };
    }
  } catch (err) {
    console.error("Token verification exception:", err);
  }

  return null;
}
