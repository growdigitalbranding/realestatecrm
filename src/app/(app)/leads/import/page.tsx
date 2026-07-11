import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportForm } from "./import-form";

export default async function ImportLeadsPage() {
  const user = await requireUser();
  const allowedProjectIds = await scopedProjectIds(user);
  const projects = await db.project.findMany({ where: { id: { in: allowedProjectIds } } });

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Import Leads from CSV</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportForm projects={projects.map((p) => ({ id: p.id, name: p.name }))} />
        </CardContent>
      </Card>
    </div>
  );
}
