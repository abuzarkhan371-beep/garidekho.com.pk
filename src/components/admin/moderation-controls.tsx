"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2, Pencil, Star, Trash2, X } from "lucide-react";
import { deleteListingAction, moderateListingAction, toggleFeaturedAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { useToast } from "@/components/providers/toast-provider";

type ListingAction =
  | typeof moderateListingAction
  | typeof toggleFeaturedAction
  | typeof deleteListingAction;

export function ModerationControls({
  listingId,
  status,
  isFeatured,
  canModerate,
  canPromote,
  canEdit = false,
  canDelete = false,
}: {
  listingId: string;
  status: "DRAFT" | "PENDING" | "ACTIVE" | "REJECTED" | "EXPIRED" | "SOLD";
  isFeatured: boolean;
  canModerate: boolean;
  canPromote: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  function submit(formData: FormData, action: ListingAction, onDone?: () => void) {
    startTransition(async () => {
      const result = await action(formData);
      toast(result.message, result.ok ? "success" : "error");
      if (result.ok) onDone?.();
    });
  }

  const moderateFormData = (decision: "APPROVE" | "REJECT", rejectionReason?: string) => {
    const formData = new FormData();
    formData.set("listingId", listingId);
    formData.set("decision", decision);
    if (rejectionReason) formData.set("reason", rejectionReason);
    return formData;
  };

  const featureFormData = () => {
    const formData = new FormData();
    formData.set("listingId", listingId);
    formData.set("featured", String(!isFeatured));
    return formData;
  };

  const deleteFormData = (removalReason: string) => {
    const formData = new FormData();
    formData.set("listingId", listingId);
    formData.set("reason", removalReason);
    return formData;
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canModerate && status === "PENDING" && (
        <>
          <Button
            size="sm"
            disabled={pending}
            onClick={() => submit(moderateFormData("APPROVE"), moderateListingAction)}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Check />}
            Approve
          </Button>

          <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={pending}>
                <X /> Reject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject this listing</DialogTitle>
                <p className="text-sm text-ink-500">
                  The seller will see this reason in their dashboard. Keep it clear and actionable.
                </p>
              </DialogHeader>
              <label className="grid gap-2 text-sm font-semibold">
                Reason
                <Textarea
                  rows={4}
                  maxLength={500}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Example: Please add clear photos of the odometer and registration documents."
                />
              </label>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={pending}>Cancel</Button>
                <Button
                  variant="destructive"
                  disabled={pending || !reason.trim()}
                  onClick={() =>
                    submit(moderateFormData("REJECT", reason.trim()), moderateListingAction, () => {
                      setRejectOpen(false);
                      setReason("");
                    })
                  }
                >
                  {pending ? <Loader2 className="animate-spin" /> : <X />}
                  Confirm rejection
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {canPromote && status === "ACTIVE" && (
        <Button
          size="sm"
          variant={isFeatured ? "secondary" : "signal"}
          disabled={pending}
          onClick={() => submit(featureFormData(), toggleFeaturedAction)}
        >
          {pending ? <Loader2 className="animate-spin" /> : <Star />}
          {isFeatured ? "Unfeature" : "Feature"}
        </Button>
      )}

      {canEdit && (
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/listings/${listingId}/edit`}><Pencil /> Edit</Link>
        </Button>
      )}

      {canDelete && (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" disabled={pending} className="text-red-600 hover:text-red-700">
              <Trash2 /> Delete
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove this listing</DialogTitle>
              <p className="text-sm text-ink-500">
                This hides the ad everywhere, notifies the seller and keeps an audit record. This cannot be undone from the admin panel.
              </p>
            </DialogHeader>
            <label className="grid gap-2 text-sm font-semibold">
              Removal reason
              <Textarea
                rows={3}
                maxLength={500}
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                placeholder="Example: Duplicate listing or fraudulent contact details."
              />
            </label>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={pending}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={pending || deleteReason.trim().length < 5}
                onClick={() =>
                  submit(deleteFormData(deleteReason.trim()), deleteListingAction, () => {
                    setDeleteOpen(false);
                    setDeleteReason("");
                  })
                }
              >
                {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Remove listing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
