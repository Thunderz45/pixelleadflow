"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signOut, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile to Firestore
  const syncUserProfile = async (firebaseUser: User) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    try {
      const userSnap = await getDoc(userRef);
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        lastLogin: serverTimestamp(),
      };

      if (!userSnap.exists()) {
        // New user creation
        await setDoc(userRef, {
          ...userData,
          createdAt: serverTimestamp(),
          role: "user",
          tier: "free",
        });
      } else {
        // Existing user update
        await setDoc(userRef, userData, { merge: true });
      }
    } catch (error) {
      console.error("Error syncing user profile to Firestore:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await syncUserProfile(firebaseUser);
        // Write token to cookie/localStorage for extension compatibility
        const token = await firebaseUser.getIdToken();
        localStorage.setItem("leadflow_auth_token", token);
        localStorage.setItem("leadflow_user_email", firebaseUser.email || "");
        localStorage.setItem("leadflow_user_id", firebaseUser.uid);
        document.cookie = `leadflow_auth_token=${token}; path=/; max-age=3600; SameSite=Lax`;
      } else {
        setUser(null);
        localStorage.removeItem("leadflow_auth_token");
        localStorage.removeItem("leadflow_user_email");
        localStorage.removeItem("leadflow_user_id");
        document.cookie = "leadflow_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (emailStr: string, passwordStr: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, emailStr, passwordStr);
    } catch (error: any) {
      // If user does not exist, automatically register them!
      if (error.code === "auth/user-not-found" || error.code === "auth/invalid-credential") {
        try {
          await createUserWithEmailAndPassword(auth, emailStr, passwordStr);
        } catch (signUpError) {
          console.error("Auto sign-up failed:", signUpError);
          setLoading(false);
          throw signUpError;
        }
      } else {
        console.error("Email login failed:", error);
        setLoading(false);
        throw error;
      }
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign-Out Error:", error);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
