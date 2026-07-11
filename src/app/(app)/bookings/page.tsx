import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser, isFullAccess, scopedProjectIds } from "@/lib/auth-helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

const STATUS_BADGE: Record<string, "outline" | "warning" | "success" | "destructive"> = {
  TOKEN: "warning",
  CONFIRMED: "success",
  AGREEMENT: "success",
  REGISTERED: "success",
  CANCELLED: "destructive",
};

export default async function BookingsPage() {
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);

  const where: Prisma.BookingWhereInput = { projectId: { in: allowedProjectIds } };
  if (!isFullAccess(user.role) && !user.isCompanyWide) {
    where.salesExecutiveId = user.id;
  }

  const bookings = await db.booking.findMany({
    where,
    include: { lead: true, unit: true, project: true, salesExecutive: true },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = bookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((sum, b) => sum + Number(b.totalPrice), 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            {bookings.length} bookings · {formatCurrency(totalRevenue)} total value
          </p>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Project / Unit</TableHead>
              <TableHead>Executive</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <Link href={`/bookings/${booking.id}`} className="font-medium hover:underline">
                    {booking.lead.name}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">
                  {booking.project.name} · {booking.unit.unitNumber}
                </TableCell>
                <TableCell className="text-sm">{booking.salesExecutive?.name ?? "-"}</TableCell>
                <TableCell className="text-sm">{formatCurrency(Number(booking.totalPrice))}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_BADGE[booking.status]}>{booking.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(booking.bookingDate)}</TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No bookings yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
