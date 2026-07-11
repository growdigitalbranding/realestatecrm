import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { can } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { createMarketingSource, createCampaign } from "./actions";

export default async function MarketingPage() {
  const user = await requireUser();
  if (!can(user.role, "manageMarketing")) redirect("/dashboard");

  const allowedProjectIds = await scopedProjectIds(user);

  const [sources, campaigns, projects, leads] = await Promise.all([
    db.marketingSource.findMany({ where: { builderId: user.builderId } }),
    db.campaign.findMany({
      where: { projectId: { in: allowedProjectIds } },
      include: { project: true, marketingSource: true },
      orderBy: { createdAt: "desc" },
    }),
    db.project.findMany({ where: { id: { in: allowedProjectIds } } }),
    db.lead.findMany({
      where: { projectId: { in: allowedProjectIds } },
      select: { campaign: true, status: true },
    }),
  ]);

  const leadCountByCampaign = leads.reduce<Record<string, number>>((acc, l) => {
    if (!l.campaign) return acc;
    acc[l.campaign] = (acc[l.campaign] ?? 0) + 1;
    return acc;
  }, {});
  const bookedCountByCampaign = leads.reduce<Record<string, number>>((acc, l) => {
    if (!l.campaign || !["BOOKING_TOKEN", "BOOKED", "AGREEMENT", "REGISTERED", "POSSESSION"].includes(l.status)) return acc;
    acc[l.campaign] = (acc[l.campaign] ?? 0) + 1;
    return acc;
  }, {});

  const totalSpend = campaigns.reduce((sum, c) => sum + Number(c.spend ?? 0), 0);
  const totalLeadsFromCampaigns = campaigns.reduce((sum, c) => sum + (leadCountByCampaign[c.name] ?? 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Marketing</h1>
        <p className="text-sm text-muted-foreground">Sources, campaigns and cost-per-lead</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xl font-semibold">{formatCurrency(totalSpend)}</div>
          <div className="text-xs text-muted-foreground">Total Spend</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl font-semibold">{totalLeadsFromCampaigns}</div>
          <div className="text-xs text-muted-foreground">Leads from Campaigns</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl font-semibold">
            {totalLeadsFromCampaigns > 0 ? formatCurrency(totalSpend / totalLeadsFromCampaigns) : "-"}
          </div>
          <div className="text-xs text-muted-foreground">Avg. Cost per Lead</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl font-semibold">{sources.length}</div>
          <div className="text-xs text-muted-foreground">Connected Sources</div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Leads</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Cost / Lead</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => {
                const leadCount = leadCountByCampaign[c.name] ?? 0;
                const cpl = leadCount > 0 && c.spend ? Number(c.spend) / leadCount : null;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.project.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.platform}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{formatCurrency(c.spend ? Number(c.spend) : null)}</TableCell>
                    <TableCell className="text-sm">{leadCount}</TableCell>
                    <TableCell className="text-sm">{bookedCountByCampaign[c.name] ?? 0}</TableCell>
                    <TableCell className="text-sm">{cpl ? formatCurrency(cpl) : "-"}</TableCell>
                  </TableRow>
                );
              })}
              {campaigns.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No campaigns yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Add Source</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createMarketingSource} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="platform">Platform</Label>
                  <Select id="platform" name="platform" defaultValue="META">
                    <option value="META">Meta</option>
                    <option value="GOOGLE">Google</option>
                    <option value="ORGANIC">Organic</option>
                    <option value="PORTAL">Portal</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>
                <Button type="submit" size="sm" variant="secondary">
                  Add Source
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createCampaign} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="campaignName">Name</Label>
                  <Input id="campaignName" name="name" required />
                </div>
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
                  <Label htmlFor="marketingSourceId">Source</Label>
                  <Select id="marketingSourceId" name="marketingSourceId" defaultValue="" required>
                    <option value="" disabled>
                      Select source
                    </option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="spend">Spend (₹)</Label>
                  <Input id="spend" name="spend" type="number" />
                </div>
                <Button type="submit" size="sm" variant="secondary">
                  Add Campaign
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
