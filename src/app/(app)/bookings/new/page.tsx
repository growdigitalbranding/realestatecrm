import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { createBooking } from "../actions";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);

  if (!params.leadId) {
    return (
      <Card className="mx-auto max-w-lg p-6 text-center text-sm text-muted-foreground">
        Start a booking from a lead&apos;s detail page using the &quot;Mark Booking&quot; action.
      </Card>
    );
  }

  const lead = await db.lead.findUnique({ where: { id: params.leadId }, include: { assignedTo: true } });
  if (!lead || !allowedProjectIds.includes(lead.projectId)) notFound();

  const [availableUnits, executives] = await Promise.all([
    db.unit.findMany({
      where: { status: "AVAILABLE", floor: { tower: { projectId: lead.projectId } } },
      include: { floor: { include: { tower: true } } },
      orderBy: { unitNumber: "asc" },
    }),
    db.user.findMany({
      where: { builderId: user.builderId, role: { in: ["SALES_EXECUTIVE", "SALES_MANAGER"] } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Booking for {lead.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBooking} className="flex flex-col gap-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="unitId">Unit</Label>
              <Select id="unitId" name="unitId" required defaultValue="">
                <option value="" disabled>
                  Select an available unit
                </option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.floor.tower.name} · {unit.unitNumber} ({unit.unitType}) — {formatCurrency(unit.price ? Number(unit.price) : null)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totalPrice">Total Price (₹)</Label>
                <Input id="totalPrice" name="totalPrice" type="number" placeholder="Defaults to unit price" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="bookingAmount">Booking Amount (₹)</Label>
                <Input id="bookingAmount" name="bookingAmount" type="number" placeholder="Defaults to unit booking amount" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="salesExecutiveId">Sales Executive</Label>
              <Select id="salesExecutiveId" name="salesExecutiveId" defaultValue={lead.assignedToId ?? ""}>
                <option value="">Unassigned</option>
                {executives.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="mt-2 flex justify-end">
              <Button type="submit">Create Booking</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
