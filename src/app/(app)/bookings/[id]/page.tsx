import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { updateBookingStatus, addPayment } from "../actions";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);

  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      lead: true,
      unit: { include: { floor: { include: { tower: true } } } },
      project: true,
      salesExecutive: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking || !allowedProjectIds.includes(booking.projectId)) notFound();

  const totalPaid = booking.payments.filter((p) => p.status === "PAID").reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = Number(booking.totalPrice) - totalPaid;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            Booking · {booking.unit.floor.tower.name} {booking.unit.unitNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            <Link href={`/leads/${booking.leadId}`} className="hover:underline">
              {booking.lead.name}
            </Link>{" "}
            · {booking.project.name}
          </p>
        </div>
        <Badge>{booking.status}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-xl font-semibold">{formatCurrency(Number(booking.totalPrice))}</div>
          <div className="text-xs text-muted-foreground">Total Price</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl font-semibold">{formatCurrency(totalPaid)}</div>
          <div className="text-xs text-muted-foreground">Paid</div>
        </Card>
        <Card className="p-4">
          <div className="text-xl font-semibold">{formatCurrency(balance)}</div>
          <div className="text-xs text-muted-foreground">Balance</div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Payments</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <form action={addPayment.bind(null, booking.id)} className="flex items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Amount</label>
                <Input name="amount" type="number" required className="w-32" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Mode</label>
                <Select name="mode" className="w-36" defaultValue="Bank Transfer">
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                  <option>UPI</option>
                  <option>Cash</option>
                  <option>Home Loan Disbursement</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Reference</label>
                <Input name="reference" className="w-36" />
              </div>
              <Button type="submit" variant="secondary">
                Record Payment
              </Button>
            </form>
            <div className="flex flex-col gap-2">
              {booking.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                  <div>
                    <div className="font-medium">{formatCurrency(Number(payment.amount))}</div>
                    <div className="text-xs text-muted-foreground">
                      {payment.mode} {payment.reference && `· ${payment.reference}`}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {payment.paidAt ? formatDateTime(payment.paidAt) : "Pending"}
                  </div>
                </div>
              ))}
              {booking.payments.length === 0 && (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Booking Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <form action={updateBookingStatus.bind(null, booking.id)} className="flex gap-2">
                <Select name="status" defaultValue={booking.status} className="flex-1">
                  <option value="TOKEN">Token</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="AGREEMENT">Agreement</option>
                  <option value="REGISTERED">Registered</option>
                  <option value="CANCELLED">Cancelled</option>
                </Select>
                <Button type="submit" variant="secondary">
                  Update
                </Button>
              </form>
              <div className="flex flex-col gap-1 text-sm">
                <Row label="Booking Date" value={formatDate(booking.bookingDate)} />
                <Row label="Executive" value={booking.salesExecutive?.name ?? "-"} />
                <Row label="Commission" value={formatCurrency(booking.commissionAmount ? Number(booking.commissionAmount) : null)} />
                <Row label="Commission Status" value={booking.commissionStatus} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
