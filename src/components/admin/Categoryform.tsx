"use client";

import { useState, useEffect } from "react";
import db from "@/lib/firebase/firestore";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import { Category } from "@/types/categories";

export default function CategoryForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-generate slug
  useEffect(() => {
    setSlug(
      name
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "")
    );
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newCategory: Omit<Category, "id" | "createdAt" | "updatedAt"> = {
      name,
      slug,
      description,
      icon,
      metaTitle,
      metaDescription,
      keywords: keywords.split(",").map((k) => k.trim()),
    };

    try {
      await addDoc(collection(db, "categories"), {
        ...newCategory,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setName("");
      setSlug("");
      setDescription("");
      setIcon("");
      setMetaTitle("");
      setMetaDescription("");
      setKeywords("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow-lg max-w-3xl mx-auto space-y-6"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
          Add Category
        </h2>

        {/* Name + Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Consumer Electronics"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="consumer-electronics"
              required
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description about category"
            rows={3}
          />
        </div>

        {/* Icon */}
        <div className="space-y-1">
          <Label htmlFor="icon">Icon URL</Label>
          <Input
            id="icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="https://example.com/icons/electronics.png"
          />
        </div>

        {/* SEO Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="Buy Consumer Electronics Online | BharatMart"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="metaDescription">Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Best consumer electronics products available at BharatMart."
              rows={2}
            />
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-1">
          <Label htmlFor="keywords">Keywords</Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="electronics, gadgets, consumer electronics"
          />
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 text-lg font-semibold"
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Category"}
        </Button>
      </form>
    </div>
  );
}
