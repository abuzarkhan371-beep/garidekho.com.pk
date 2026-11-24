"use client";

import { useState, useTransition } from "react";
import { Check, Eye, Loader2, X } from "lucide-react";
import { resolveReportAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/providers/toast-provider";

export function ReportControls({ reportId }: { reportId: string }) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [resolution, setResolution] = useState("");

  function run(decision: "IN_REVIEW" | "RESOLVE" | "DISMISS") {
    const formData = new FormData();
    formData.set("reportId", reportId);
    formData.set("decision", decision);
    if (resolution.trim()) formData.set("resolution", resolution.trim());
    startTransition(async () => {
      const result = await resolveReportAction(formData);
      toast(result.message, result.ok ? "success" : "error");
    });
  }

  return (
    <div className="mt-3 grid gap-2">
      <Textarea
        rows={2}
        maxLength={1000}
        value={resolution}
        onChange={(event) => setResolution(event.target.value)}
        placeholder="Resolution note (required to resolve or dismiss)"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={pending} onClick={() => run("IN_REVIEW")}>
          {pending ? <Loader2 className="animate-spin" /> : <Eye />} In review
        </Button>
        <Button size="sm" disabled={pending || !resolution.trim()} onClick={() => run("RESOLVE")}>
          {pending ? <Loader2 className="animate-spin" /> : <Check />} Resolve
        </Button>
        <Button size="sm" variant="ghost" disabled={pending || !resolution.trim()} onClick={() => run("DISMISS")}>
          {pending ? <Loader2 className="animate-spin" /> : <X />} Dismiss
        </Button>
      </div>
    </div>
  );
}
