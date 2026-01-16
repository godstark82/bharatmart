"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import db from "@/lib/firebase/firestore";
import { Category } from "@/types/categories";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash, Edit } from "lucide-react";
import Image from "next/image";

async function fetchCategories(): Promise<Category[]> {
  const snapshot = await getDocs(collection(db, "categories"));
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  })) as Category[];
}

interface CategoryTableProps {
  onEdit: (category: Category) => void;
}

export default function CategoryTable({ onEdit }: CategoryTableProps) {
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "categories", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm("Delete this category?")) {
      deleteCategoryMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <p className="text-gray-500">Loading categories...</p>;
  }

  return (
    <div className="overflow-x-auto border rounded-lg bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-500">
                No categories yet
              </TableCell>
            </TableRow>
          ) : (
            categories.map((cat) => (
              <TableRow key={cat.id} className="hover:bg-gray-50 transition">
                <TableCell>
                  {cat.image ? (
                    <div className="relative w-12 h-12">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-400">No image</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {cat.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(cat)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(cat.id)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
