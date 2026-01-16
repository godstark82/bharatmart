"use client";

import { useEffect, useState } from "react";
import  db from "@/lib/firebase/firestore";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { Category } from "@/types/categories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash, Edit } from "lucide-react";

export default function CategoryTable() {
  const [categories, setCategories] = useState<Category[]>([]);

  // Realtime fetch
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "categories"), (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];
      setCategories(data);
    });

    return () => unsub();
  }, []);

  // Delete category
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "categories", id));
  };

  return (
    <div className="overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px] text-center">Icon</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>SEO Title</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat) => (
            <TableRow key={cat.id} className="hover:bg-gray-50 transition">
              <TableCell className="text-center">
                {cat.icon ? (
                  <img src={cat.icon} alt={cat.name} className="w-6 h-6 object-contain mx-auto" />
                ) : (
                  <div className="w-6 h-6 bg-gray-200 rounded-full mx-auto" />
                )}
              </TableCell>
              <TableCell>{cat.name}</TableCell>
              <TableCell>{cat.slug}</TableCell>
              <TableCell className="max-w-xs truncate">{cat.description}</TableCell>
              <TableCell className="max-w-xs truncate">{cat.metaTitle}</TableCell>
              <TableCell className="flex gap-2 justify-center">
                
                <Button variant="destructive" size="sm" onClick={() => handleDelete(cat.id)}>
                  <Trash className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
