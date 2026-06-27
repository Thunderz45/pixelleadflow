import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-verify";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

export async function GET(request: NextRequest) {
  // 1. Verify User Token
  const authUser = await verifyAuthToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Query projects
    const q = query(
      collection(db, "projects"),
      where("userId", "==", authUser.uid),
      orderBy("createdAt", "desc")
    );

    const snap = await getDocs(q);
    const projects: any[] = [];
    snap.forEach((doc) => {
      projects.push({
        id: doc.id,
        name: doc.data().name,
        description: doc.data().description || ""
      });
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
