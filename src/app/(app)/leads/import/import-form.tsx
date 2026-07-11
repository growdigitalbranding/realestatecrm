"use client";

import { useActionState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { importLeadsCsv, type ImportResult } from "./actions";

export function ImportForm({ projects }: { projects: { id: string; name: string }[] }) {
  const [result, formAction, isPending] = useActionState<ImportResult | null, FormData>(
    importLeadsCsv,
    null,
  );

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="projectId">Project</Label>
          <Select id="projectId" name="projectId" defaultValue="" required>
            <option value="" disabled>
              Select project
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="file">CSV file</Label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="rounded-md border border-border bg-card px-3 py-1.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-2 file:py-1 file:text-secondary-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Required columns: <code>name</code>, <code>mobile</code>. Optional: <code>email</code>, <code>city</code>,{" "}
            <code>state</code>, <code>budgetMin</code>, <code>budgetMax</code>, <code>source</code>.
          </p>
        </div>
        <div>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
            Import Leads
          </Button>
        </div>
      </form>

      {result && (
        <div className="rounded-md border border-border p-4 text-sm">
          <p className="font-medium">
            Imported {result.imported}, skipped {result.duplicates} duplicates
            {result.errors.length > 0 && `, ${result.errors.length} rows had errors`}.
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-xs text-red-600">
              {result.errors.slice(0, 20).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
