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
  setDoc,
  serverTimestamp, 
  orderBy,
  limit
} from "firebase/firestore";

export async function POST(request: NextRequest) {
  // 1. Verify User Token
  const authUser = await verifyAuthToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { keyword, location, projectId, maxResults, resultsCount, status } = body;

    if (!keyword) {
      return NextResponse.json({ error: "Keyword is required." }, { status: 400 });
    }

    // 2. Identify if there is an active run log for this search query that we should update
    const activeQuery = query(
      collection(db, "history"),
      where("userId", "==", authUser.uid),
      where("keyword", "==", keyword),
      where("location", "==", location),
      where("projectId", "==", projectId || ""),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    
    const activeSnap = await getDocs(activeQuery);
    
    // If an active record exists and is not fully terminal, update the stats
    if (!activeSnap.empty) {
      const activeDoc = activeSnap.docs[0];
      const activeData = activeDoc.data();
      
      const isTerminal = ["completed", "stopped"].includes(activeData.status);
      
      if (!isTerminal || status === "completed" || status === "stopped") {
        await setDoc(doc(db, "history", activeDoc.id), {
          resultsCount: resultsCount || 0,
          status: status || "collecting",
          timestamp: serverTimestamp() // update last active timestamp
        }, { merge: true });
        
        return NextResponse.json({ success: true, updated: true, id: activeDoc.id });
      }
    }

    // 3. Otherwise, create a new history log entry
    const docRef = await addDoc(collection(db, "history"), {
      userId: authUser.uid,
      projectId: projectId || "",
      keyword,
      location: location || "N/A",
      maxResults: maxResults || 50,
      resultsCount: resultsCount || 0,
      status: status || "ready",
      timestamp: serverTimestamp()
    });

    return NextResponse.json({ success: true, updated: false, id: docRef.id });
  } catch (error) {
    console.error("POST /api/scrape/history error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const authUser = await verifyAuthToken(request);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const q = query(
      collection(db, "history"),
      where("userId", "==", authUser.uid),
      orderBy("timestamp", "desc"),
      limit(1)
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      const docData = snap.docs[0].data();
      return NextResponse.json({
        id: snap.docs[0].id,
        keyword: docData.keyword || "",
        location: docData.location || "",
        projectId: docData.projectId || "",
        maxResults: docData.maxResults || 50,
        leadsCount: docData.resultsCount || 0,
        status: docData.status || "ready"
      });
    }
    return NextResponse.json({ status: "ready", leadsCount: 0 });
  } catch (error: any) {
    console.error("GET /api/scrape/history error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
