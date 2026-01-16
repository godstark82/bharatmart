"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Category } from "@/types/categories";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (category) {
      setName(category.name || "");
      setImage(category.image || "");
    } else {
      setName("");
      setImage("");
    }
  }, [category, open]);

  const addCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; image: string }) => {
      await addDoc(collection(db, "categories"), {
        name: data.name.trim(),
        image: data.image.trim() || undefined,
        createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onOpenChange(false);
      setName("");
      setImage("");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; image: string }) => {
      if (!category) return;
      await updateDoc(doc(db, "categories", category.id), {
        name: data.name.trim(),
        image: data.image.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Category name is required");
      return;
    }

    if (category) {
      updateCategoryMutation.mutate({ name, image });
    } else {
      addCategoryMutation.mutate({ name, image });
    }
  };

  const isLoading = addCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "Add New Category"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Update the category details below."
              : "Create a new category for your products."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Electronics, Clothing, Books"
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL (Optional)</Label>
              <Input
                id="image"
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                disabled={isLoading}
              />
              {image && (
                <div className="mt-2">
                  <img
                    src={image}
                    alt="Category preview"
                    className="w-20 h-20 object-cover rounded border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : category
                ? "Update Category"
                : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
