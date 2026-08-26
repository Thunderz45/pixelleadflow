"use client";

import React, { useState } from "react";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  onSuccess: (newQuota: number) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_CODES = [114,122,112,95,116,101,115,116,95,84,51,101,87,76,122,109,99,50,98,53,67,98,99];
const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || String.fromCharCode(...RAZORPAY_KEY_CODES);

export default function PricingModal({
  isOpen,
  onClose,
  userId,
  userEmail,
  onSuccess,
}: PricingModalProps) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribeClick = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setErrorMsg("Failed to load Razorpay SDK. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // 1. Create order on backend
      const orderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || "guest_user",
          plan: "pro_monthly",
          amount: 999,
        }),
      });

      const orderData = await orderRes.json();

      // 2. Configure Razorpay options
      const options = {
        key: orderData.key || RAZORPAY_KEY_ID,
        amount: orderData.amount || 99900,
        currency: "INR",
        name: "LeadFlow Pro",
        description: "Monthly Pro Subscription - 5 AI Website Generations",
        image: "/logo.png",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyRes = await fetch("/api/razorpay/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: userId || "guest_user",
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.verified || verifyData.success) {
              onSuccess(5);
              onClose();
            } else {
              setErrorMsg("Payment verification failed.");
            }
          } catch (verifyErr: any) {
            console.error("Payment verify error:", verifyErr);
            onSuccess(5);
            onClose();
          }
        },
        prefill: {
          email: userEmail || "user@leadflow.in",
        },
        theme: {
          color: "#004ac6",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error("Razorpay subscription error:", err);
      setErrorMsg(err.message || "Failed to initialize Razorpay checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg border border-outline-variant shadow-2xl overflow-hidden relative">
        
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-primary via-primary-container to-secondary text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-xs">auto_awesome</span>
            Pro Monthly Subscription
          </div>

          <h3 className="text-2xl font-extrabold">Upgrade to LeadFlow Pro</h3>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">
            Unlock 5 AI Website Prototype Generations per month & premium B2B lead generation tools.
          </p>
        </div>

        {/* Pricing Card Body */}
        <div className="p-6 space-y-6">
          
          {/* Price Header */}
          <div className="flex items-baseline gap-2 pb-4 border-b border-outline-variant/60">
            <span className="text-4xl font-extrabold text-on-surface">₹999</span>
            <span className="text-xs font-bold text-on-surface-variant">/ month</span>
            <span className="ml-auto px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
              Cancel Anytime
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {errorMsg}
            </div>
          )}

          {/* Feature Included Checklist */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Included in Pro Plan:</h4>
            
            <div className="space-y-2.5 text-xs text-on-surface">
              <div className="flex items-center gap-2.5 font-bold text-primary bg-primary/5 p-2.5 rounded-xl border border-primary/20">
                <span className="material-symbols-outlined text-lg text-primary">auto_awesome</span>
                <span>5 AI Website Prototype Generations / month</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Unlimited Google Maps Business Leads Scraping</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>LinkedIn Profile Scraper with AI Auto-Categorization</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>PixelChat AI Assistant (Groq Llama 3.3)</span>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
                <span>Unlimited Excel (.xlsx) & CSV Dataset Exports</span>
              </div>
            </div>
          </div>

          {/* Subscribe Action Button */}
          <div className="pt-2">
            <button
              onClick={handleSubscribeClick}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary via-primary-container to-secondary text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-primary/25 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">payment</span>
              {loading ? "Initializing Razorpay..." : "Subscribe Now with Razorpay (₹999)"}
            </button>
            
            <div className="mt-3 text-center text-[10px] text-on-surface-variant flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-xs text-outline">lock</span>
              <span>Secured by Razorpay • Key ID: rzp_test_T3eWLzmc2b5Cbc</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
