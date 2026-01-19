"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Category } from "@/types/categories";

async function fetchCategories(): Promise<Category[]> {
  const snapshot = await getDocs(collection(db, "categories"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Category[];
}

type CategoriesContextType = {
  categories: Category[];
  isLoading: boolean;
};

const CategoriesContext = createContext<CategoriesContextType | null>(null);

const CATEGORIES_STALE_MS = 10 * 60 * 1000; // 10 minutes — avoid refetch on nav

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: CATEGORIES_STALE_MS,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return (
    <CategoriesContext.Provider value={{ categories, isLoading }}>
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error("useCategories must be used within CategoriesProvider");
  }
  return ctx;
}
