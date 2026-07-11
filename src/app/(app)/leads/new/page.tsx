import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LEAD_SOURCE_LABELS } from "@/lib/lead-constants";
import { createLead } from "../actions";

export default async function NewLeadPage() {
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);

  const [projects, executives] = await Promise.all([
    db.project.findMany({ where: { id: { in: allowedProjectIds } } }),
    db.user.findMany({
      where: {
        builderId: user.builderId,
        role: { in: ["SALES_EXECUTIVE", "TELECALLER"] },
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Lead</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createLead} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" name="mobile" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="budgetMin">Budget Min (₹)</Label>
                <Input id="budgetMin" name="budgetMin" type="number" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="budgetMax">Budget Max (₹)</Label>
                <Input id="budgetMax" name="budgetMax" type="number" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="projectId">Project</Label>
                <Select id="projectId" name="projectId" required defaultValue="">
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
                <Label htmlFor="source">Source</Label>
                <Select id="source" name="source" defaultValue="WALK_IN">
                  {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="assignedToId">Assign to (optional — auto-assigned if left blank)</Label>
              <Select id="assignedToId" name="assignedToId" defaultValue="">
                <option value="">Auto-assign</option>
                {executives.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sourceDetail">Source detail (optional)</Label>
              <Input id="sourceDetail" name="sourceDetail" placeholder="e.g. Square Yards, referral name" />
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <Button type="submit">Create Lead</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
