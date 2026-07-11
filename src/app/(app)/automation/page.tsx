import { redirect } from "next/navigation";
import { Workflow } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createAutomationRule, toggleAutomationRule } from "./actions";

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: "Lead Created",
  STATUS_CHANGED: "Status Changed",
  SITE_VISIT_COMPLETED: "Site Visit Completed",
  FOLLOW_UP_MISSED: "Follow-up Missed",
  BOOKING_CREATED: "Booking Created",
  NO_ACTIVITY: "No Activity",
};

export default async function AutomationPage() {
  const user = await requireUser();
  if (!can(user.role, "manageAutomation")) redirect("/dashboard");

  const allowedProjectIds = await scopedProjectIds(user);

  const [rules, projects] = await Promise.all([
    db.automationRule.findMany({
      where: { builderId: user.builderId },
      include: { project: true },
      orderBy: { createdAt: "desc" },
    }),
    db.project.findMany({ where: { id: { in: allowedProjectIds } } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Automation</h1>
        <p className="text-sm text-muted-foreground">Trigger → Condition → Action rules</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 flex flex-col gap-3">
          {rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                    <Workflow className="size-4.5" />
                  </div>
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {TRIGGER_LABELS[rule.triggerType]} · {rule.project?.name ?? "All projects"}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        if {JSON.stringify(rule.conditions)}
                      </code>
                      <code className="rounded bg-muted px-1.5 py-0.5">
                        then {JSON.stringify(rule.actions)}
                      </code>
                    </div>
                  </div>
                </div>
                <form action={toggleAutomationRule.bind(null, rule.id)}>
                  <input type="hidden" name="isActive" value={(!rule.isActive).toString()} />
                  <button type="submit">
                    <Badge variant={rule.isActive ? "success" : "muted"}>
                      {rule.isActive ? "Active" : "Paused"}
                    </Badge>
                  </button>
                </form>
              </div>
            </Card>
          ))}
          {rules.length === 0 && (
            <Card className="p-8 text-center text-sm text-muted-foreground">No automation rules yet.</Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>New Rule</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createAutomationRule} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Rule Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Route luxury leads" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="triggerType">Trigger</Label>
                <Select id="triggerType" name="triggerType" defaultValue="LEAD_CREATED">
                  {Object.entries(TRIGGER_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="projectId">Project (optional)</Label>
                <Select id="projectId" name="projectId" defaultValue="">
                  <option value="">All projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="conditions">Conditions (JSON)</Label>
                <Textarea id="conditions" name="conditions" rows={2} defaultValue='{ "field": "budgetMax", "operator": "gt", "value": 7500000 }' />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="actions">Actions (JSON)</Label>
                <Textarea id="actions" name="actions" rows={2} defaultValue='[{ "type": "NOTIFY_MANAGER" }]' />
              </div>
              <Button type="submit" size="sm" variant="secondary">
                Create Rule
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
