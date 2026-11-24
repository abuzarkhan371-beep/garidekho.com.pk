"use client";

import { useTransition } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { verifySellerAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

export function SellerVerifyControl({
  userId,
  verified,
  canManage,
}: {
  userId: string;
  verified: boolean;
  canManage: boolean;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-link dark:text-link-soft">
        <BadgeCheck className="size-4" /> Verified
      </span>
    );
  }
  if (!canManage) return <span className="text-xs text-ink-400">Unverified</span>;

  function verify() {
    const formData = new FormData();
    formData.set("userId", userId);
    startTransition(async () => {
      const result = await verifySellerAction(formData);
      toast(result.message, result.ok ? "success" : "error");
    });
  }

  return (
    <Button size="sm" variant="outline" disabled={pending} onClick={verify}>
      {pending ? <Loader2 className="animate-spin" /> : <BadgeCheck />}
      Verify seller
    </Button>
  );
}
