"use client";

import Link from "next/link";
import Image from "next/image";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function AuthRequiredDialog({
  open,
  onOpenChange,
  title = "Sign in required",
  description = "Please sign in or create an account to continue.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-full md:w-[220px] flex justify-center">
            <Image
              src="/cart-empty.svg"
              alt="Sign in required"
              width={260}
              height={160}
              className="h-auto w-full max-w-[240px]"
              priority
            />
          </div>

          <div className="flex-1 min-w-0">
            <DialogHeader>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <Link
              href="/"
              onClick={() => onOpenChange(false)}
              className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Shop today's deals
            </Link>

            <DialogFooter className="mt-5 gap-2 sm:gap-2 sm:justify-start sm:flex-wrap">
              <Link href="/login" onClick={() => onOpenChange(false)}>
                <Button type="button" className="bg-yellow-400 text-black hover:bg-yellow-500">
                  Sign in to your account
                </Button>
              </Link>
              <Link href="/signup" onClick={() => onOpenChange(false)}>
                <Button variant="outline" type="button">
                  Sign up now
                </Button>
              </Link>
              <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                Not now
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

