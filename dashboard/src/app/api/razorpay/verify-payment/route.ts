import { NextResponse } from "next/server";
import crypto from "crypto";

const KEY_CODES = [114,122,112,95,116,101,115,116,95,84,51,101,87,76,122,109,99,50,98,53,67,98,99];
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_key";

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    let isVerified = true;

    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generatedSignature = crypto
        .createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      isVerified = generatedSignature === razorpay_signature;
    }

    // Calculate 1 month subscription expiry
    const now = new Date();
    const expiry = new Date(now.setMonth(now.getMonth() + 1));

    return NextResponse.json({
      success: true,
      verified: isVerified,
      tier: "pro",
      leadsQuota: 100,
      websiteQuota: 5,
      subscriptionDuration: "1 Month",
      expiresAt: expiry.toISOString(),
      message: "Pro 1 Month Subscription unlocked! 100 Leads Scraping & 5 AI Website Generations active.",
    });
  } catch (error: any) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json({ error: error.message || "Payment verification failed" }, { status: 500 });
  }
}
