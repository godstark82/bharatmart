"use client";

import { useState } from "react";
import db from "@/lib/firebase/firestore";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function CategoryForm() {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const addCategoryMutation = useMutation({
    mutationFn: async (categoryName: string) => {
      await addDoc(collection(db, "categories"), {
        name: categoryName,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setName("");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Category name is required");
      return;
    }
    addCategoryMutation.mutate(name.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Electronics, Clothing, Books"
          required
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={addCategoryMutation.isPending}
      >
        {addCategoryMutation.isPending ? "Saving..." : "Add Category"}
      </Button>
    </form>
  );
}
