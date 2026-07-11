import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { can, ROLE_LABELS } from "@/lib/permissions";
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
import { formatDate, initials } from "@/lib/utils";
import { createTeamMember, toggleUserActive } from "./actions";

export default async function UsersPage() {
  const user = await requireUser();
  if (!can(user.role, "manageUsers")) redirect("/dashboard");

  const [users, projects] = await Promise.all([
    db.user.findMany({
      where: { builderId: user.builderId },
      include: { projectAccess: { include: { project: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.project.findMany({ where: { builderId: user.builderId } }),
  ]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Team</h1>
        <p className="text-sm text-muted-foreground">{users.length} users across {user.builderName}</p>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(u.name)}
                      </div>
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ROLE_LABELS[u.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.isCompanyWide
                      ? "Company-wide"
                      : u.projectAccess.map((a) => a.project.name).join(", ") || "None"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    {u.id === user.id ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <form action={toggleUserActive.bind(null, u.id)}>
                        <input type="hidden" name="isActive" value={(!u.isActive).toString()} />
                        <button type="submit">
                          <Badge variant={u.isActive ? "success" : "muted"}>
                            {u.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createTeamMember} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Temporary Password</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role">Role</Label>
                <Select id="role" name="role" defaultValue="SALES_EXECUTIVE">
                  {Object.entries(ROLE_LABELS)
                    .filter(([value]) => value !== "SUPER_ADMIN")
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isCompanyWide" className="size-4" />
                Company-wide access
              </label>
              <div className="flex flex-col gap-1.5">
                <Label>Project Access</Label>
                <div className="flex flex-col gap-1 rounded-md border border-border p-2">
                  {projects.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="projectIds" value={p.id} className="size-4" />
                      {p.name}
                    </label>
                  ))}
                </div>
              </div>
              <Button type="submit" className="mt-1">
                Add User
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
