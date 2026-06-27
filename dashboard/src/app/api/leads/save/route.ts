import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/auth-verify";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp, 
  increment 
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  // 1. Verify User Token
  const authUser = await verifyAuthToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, phone, website, email, address, rating, reviewsCount, projectId } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is a required field." }, { status: 400 });
    }

    // 2. Duplicate detection: Check if this business name and phone/address already exists for this user
    const dupQuery = query(
      collection(db, "businesses"),
      where("userId", "==", authUser.uid),
      where("name", "==", name)
    );
    const dupSnap = await getDocs(dupQuery);

    if (!dupSnap.empty) {
      return NextResponse.json({ success: true, duplicated: true, message: "Lead already exists." });
    }

    // 3. Save Lead
    await addDoc(collection(db, "businesses"), {
      userId: authUser.uid,
      projectId: projectId || "",
      name,
      phone: phone || "N/A",
      website: website || "",
      email: email || "N/A",
      address: address || "N/A",
      rating: parseFloat(rating) || 0,
      reviewsCount: parseInt(reviewsCount) || 0,
      createdAt: serverTimestamp()
    });

    // 4. Update the campaign's lead counter in Firestore if a projectId is selected
    if (projectId) {
      const projectRef = doc(db, "projects", projectId);
      await updateDoc(projectRef, {
        leadsCount: increment(1)
      }).catch((e) => console.error("Could not increment project count:", e));
    }

    return NextResponse.json({ success: true, duplicated: false });
  } catch (error: any) {
    console.error("POST /api/leads/save error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
