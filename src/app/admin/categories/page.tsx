"use client";

import CategoryForm from "@/components/admin/Categoryform";
import CategoryTable from "@/components/admin/Categorytable";

export default function AdminCategoriesPage() {
  return (

<div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-1">
       <h1 className="text-3xl font-bold text-gray-900 mb-2">
  Categories
</h1>
<p className="text-sm text-gray-500">
  Manage all your product categories here.
</p>

      </div>

      {/* Form + Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Add Category Form */}
        <div className="bg-white p-4 rounded-xl shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Add New Category
          </h2>
          <CategoryForm />
        </div>

        {/* Category Table */}
        <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Existing Categories
          </h2>
          <CategoryTable />
        </div>
      </div>
    </div>
  );
}
