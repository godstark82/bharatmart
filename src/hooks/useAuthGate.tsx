"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthRequiredDialog } from "@/components/auth/AuthRequiredDialog";

export function useAuthGate(options?: { title?: string; description?: string }) {
  const { isAuthenticated, loading } = useAuth();
  const [open, setOpen] = useState(false);

  const ensureAuth = useCallback(
    (fn: () => void) => {
      // Avoid flashing login prompts while Firebase auth is still resolving.
      if (loading) return;
      if (!isAuthenticated) {
        setOpen(true);
        return;
      }
      fn();
    },
    [isAuthenticated, loading]
  );

  const AuthDialog = useMemo(
    () => (
      <AuthRequiredDialog
        open={open}
        onOpenChange={setOpen}
        title={options?.title}
        description={options?.description}
      />
    ),
    [open, options?.title, options?.description]
  );

  const openAuthDialog = useCallback(() => {
    if (loading) return;
    if (!isAuthenticated) setOpen(true);
  }, [isAuthenticated, loading]);

  return { ensureAuth, openAuthDialog, AuthDialog, isAuthenticated, loading };
}

