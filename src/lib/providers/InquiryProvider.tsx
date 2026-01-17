"use client";

import { createContext, useContext, useState } from "react";

type InquiryItem = {
  id: string;
  name: string;
  qty: number;
};

type InquiryContextType = {
  items: InquiryItem[];
  addItem: (item: InquiryItem) => void;
  clearInquiry: () => void;
};

const InquiryContext = createContext<InquiryContextType | null>(null);

export const InquiryProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<InquiryItem[]>([]);

  const addItem = (item: InquiryItem) => {
    setItems((prev) => [...prev, item]);
  };

  const clearInquiry = () => setItems([]);

  return (
    <InquiryContext.Provider value={{ items, addItem, clearInquiry }}>
      {children}
    </InquiryContext.Provider>
  );
};

export const useInquiry = () => {
  const context = useContext(InquiryContext);
  if (!context) {
    throw new Error("useInquiry must be used inside InquiryProvider");
  }
  return context;
};
