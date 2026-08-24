import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-verify";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export async function GET(request: NextRequest) {
  // 1. Verify User Token
  const authUser = await verifyAuthToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch Settings from Firestore
    const docRef = doc(db, "settings", authUser.uid);
    const docSnap = await getDoc(docRef);

    const defaultSettings = {
      defaultMaxResults: 50,
      autoScrollDelay: 1000,
      retryAttempts: 3,
      skipDuplicates: true,
    };

    if (docSnap.exists()) {
      return NextResponse.json(docSnap.data());
    } else {
      // Return default configuration if not set yet
      return NextResponse.json(defaultSettings);
    }
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // 1. Verify User Token
  const authUser = await verifyAuthToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { defaultMaxResults, autoScrollDelay, retryAttempts, skipDuplicates } = body;

    const newSettings = {
      defaultMaxResults: parseInt(defaultMaxResults) || 50,
      autoScrollDelay: parseInt(autoScrollDelay) || 1000,
      retryAttempts: parseInt(retryAttempts) || 0,
      skipDuplicates: !!skipDuplicates,
    };

    // 2. Save Settings to Firestore
    const docRef = doc(db, "settings", authUser.uid);
    await setDoc(docRef, newSettings, { merge: true });

    return NextResponse.json({ success: true, settings: newSettings });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
