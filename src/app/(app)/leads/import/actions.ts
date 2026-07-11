"use server";

import { db } from "@/lib/db";
import { requireUser, scopedProjectIds } from "@/lib/auth-helpers";
import { resolveAssignment } from "@/lib/assignment";
import { runAutomation } from "@/lib/automation";
import { writeAuditLog } from "@/lib/audit";
import { csvToRecords } from "@/lib/csv";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 2000;

export interface ImportResult {
  imported: number;
  duplicates: number;
  errors: string[];
}

export async function importLeadsCsv(
  _prevState: ImportResult | null,
  formData: FormData,
): Promise<ImportResult> {
  const user = await requireUser();
  const projectId = String(formData.get("projectId"));
  const allowed = await scopedProjectIds(user);
  if (!allowed.includes(projectId)) {
    return { imported: 0, duplicates: 0, errors: ["You do not have access to this project."] };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { imported: 0, duplicates: 0, errors: ["Please choose a CSV file."] };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { imported: 0, duplicates: 0, errors: ["File is too large (max 5MB)."] };
  }

  const text = await file.text();
  const records = csvToRecords(text).slice(0, MAX_ROWS);

  const result: ImportResult = { imported: 0, duplicates: 0, errors: [] };

  for (const [index, record] of records.entries()) {
    const rowNumber = index + 2; // account for header row
    const name = record.name || record.Name || record["full name"];
    const mobile = record.mobile || record.Mobile || record.phone || record.Phone;

    if (!name || !mobile) {
      result.errors.push(`Row ${rowNumber}: missing name or mobile.`);
      continue;
    }

    const existing = await db.lead.findFirst({
      where: {
        projectId,
        mobile,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    if (existing) {
      result.duplicates++;
      continue;
    }

    const budgetMax = record.budgetMax || record["budget max"];
    const budgetMin = record.budgetMin || record["budget min"];

    const lead = await db.lead.create({
      data: {
        builderId: user.builderId,
        projectId,
        name,
        mobile,
        email: record.email || undefined,
        city: record.city || undefined,
        state: record.state || undefined,
        budgetMin: budgetMin ? Number(budgetMin) || undefined : undefined,
        budgetMax: budgetMax ? Number(budgetMax) || undefined : undefined,
        source: "CSV_IMPORT",
        sourceDetail: record.source || undefined,
        createdById: user.id,
        status: "NEW",
      },
    });

    const assignedToId = await resolveAssignment(projectId, {
      budgetMax: lead.budgetMax ? Number(lead.budgetMax) : null,
      city: lead.city,
    });
    if (assignedToId) {
      await db.lead.update({ where: { id: lead.id }, data: { assignedToId } });
    }

    await db.leadActivity.create({
      data: { leadId: lead.id, userId: user.id, type: "SYSTEM", content: `Imported from CSV by ${user.name}` },
    });

    const finalLead = await db.lead.findUniqueOrThrow({ where: { id: lead.id } });
    await runAutomation("LEAD_CREATED", finalLead);

    result.imported++;
  }

  await writeAuditLog({
    builderId: user.builderId,
    userId: user.id,
    action: "lead.csv_import",
    entityType: "Lead",
    metadata: { projectId, imported: result.imported, duplicates: result.duplicates, errorCount: result.errors.length },
  });

  return result;
}
