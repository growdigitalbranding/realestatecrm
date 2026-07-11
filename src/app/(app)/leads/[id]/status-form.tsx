"use client";

import { useState } from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LEAD_PIPELINE, LEAD_STATUS_LABELS, LOST_REASONS } from "@/lib/lead-constants";

export function StatusChangeForm({
  currentStatus,
  action,
}: {
  currentStatus: string;
  action: (formData: FormData) => void;
}) {
  const [status, setStatus] = useState(currentStatus);

  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Update status</label>
        <Select
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-52"
        >
          {[...LEAD_PIPELINE, "LOST"].map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>
      {status === "LOST" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Reason</label>
          <Select name="lostReason" className="w-48" defaultValue="">
            <option value="" disabled>
              Select reason
            </option>
            {LOST_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>
      )}
      <Button type="submit" variant="secondary">
        Update
      </Button>
    </form>
  );
}
