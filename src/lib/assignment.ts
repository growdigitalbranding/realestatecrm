import { db } from "@/lib/db";

interface LeadForAssignment {
  budgetMax: number | null;
  city: string | null;
}

/** Evaluates active assignment rules for a project (highest priority first) and returns an executive id, or null. */
export async function resolveAssignment(
  projectId: string,
  lead: LeadForAssignment,
): Promise<string | null> {
  const rules = await db.assignmentRule.findMany({
    where: { projectId, isActive: true },
    orderBy: { priority: "desc" },
  });

  for (const rule of rules) {
    const config = rule.config as Record<string, unknown>;

    if (rule.type === "BUDGET_BASED") {
      const minBudget = Number(config.minBudget ?? 0);
      if (lead.budgetMax && lead.budgetMax >= minBudget && typeof config.executiveId === "string") {
        return config.executiveId;
      }
      continue;
    }

    if (rule.type === "AREA_BASED") {
      const areaMap = config.cityToExecutiveId as Record<string, string> | undefined;
      if (lead.city && areaMap?.[lead.city]) {
        return areaMap[lead.city];
      }
      continue;
    }

    if (rule.type === "ROUND_ROBIN") {
      const executiveIds = (config.executiveIds as string[] | undefined)?.filter(Boolean) ?? [];
      if (executiveIds.length === 0) continue;

      const leadCount = await db.lead.count({ where: { projectId } });
      return executiveIds[leadCount % executiveIds.length];
    }
  }

  return null;
}
