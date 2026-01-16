"use client";

import { useEffect, useState, useCallback } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import auth from "@/lib/firebase/auth";
import db from "@/lib/firebase/firestore";
import { User } from "@/types/users";

interface AuthState {
  user: FirebaseUser | null;
  role: "admin" | "seller" | null;
  loading: boolean;
  userData: User | null;
}

async function fetchUserData(firebaseUser: FirebaseUser) {
  try {
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data() as Omit<User, "uid">;
      return {
        user: firebaseUser,
        role: userData.role || null,
        loading: false,
        userData: {
          uid: firebaseUser.uid,
          ...userData,
        },
      };
    } else {
      return {
        user: firebaseUser,
        role: null,
        loading: false,
        userData: null,
      };
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return {
      user: firebaseUser,
      role: null,
      loading: false,
      userData: null,
    };
  }
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    loading: true,
    userData: null,
  });

  const refreshUserData = useCallback(async () => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      const newState = await fetchUserData(firebaseUser);
      setAuthState(newState);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const newState = await fetchUserData(firebaseUser);
        setAuthState(newState);
      } else {
        setAuthState({
          user: null,
          role: null,
          loading: false,
          userData: null,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return {
    ...authState,
    logout,
    refreshUserData,
    isAdmin: authState.role === "admin",
    isSeller: authState.role === "seller",
    isAuthenticated: !!authState.user,
  };
}
