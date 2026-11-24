"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { setUserStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/providers/toast-provider";

export function UserStatusControls({
  userId,
  status,
  isSelf,
  isSuperAdmin,
}: {
  userId: string;
  status: "ACTIVE" | "SUSPENDED" | "BANNED";
  isSelf: boolean;
  isSuperAdmin: boolean;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function run(next: "ACTIVE" | "SUSPENDED" | "BANNED") {
    const formData = new FormData();
    formData.set("userId", userId);
    formData.set("status", next);
    startTransition(async () => {
      const result = await setUserStatusAction(formData);
      toast(result.message, result.ok ? "success" : "error");
    });
  }

  if (isSelf || isSuperAdmin) return <span className="text-xs text-ink-400">Protected</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {status !== "ACTIVE" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("ACTIVE")}>
          {pending ? <Loader2 className="animate-spin" /> : null} Activate
        </Button>
      )}
      {status !== "SUSPENDED" && (
        <Button size="sm" variant="signal" disabled={pending} onClick={() => run("SUSPENDED")}>Suspend</Button>
      )}
      {status !== "BANNED" && (
        <Button size="sm" variant="destructive" disabled={pending} onClick={() => run("BANNED")}>Ban</Button>
      )}
    </div>
  );
}
