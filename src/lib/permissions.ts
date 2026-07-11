import type { Role } from "@/generated/prisma/client";

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  BUILDER_ADMIN: "Builder Admin",
  SALES_MANAGER: "Sales Manager",
  TELECALLER: "Telecaller",
  SALES_EXECUTIVE: "Sales Executive",
  MARKETING_MANAGER: "Marketing Manager",
};

type Capability =
  | "manageBuilders"
  | "manageUsers"
  | "manageProjects"
  | "manageInventory"
  | "assignLeads"
  | "manageAssignmentRules"
  | "manageMarketing"
  | "manageAutomation"
  | "manageTemplates"
  | "viewCompanyReports"
  | "viewTeamReports"
  | "markBooking"
  | "deleteRecords"
  | "manageApiKeys";

const CAPABILITY_ROLES: Record<Capability, Role[]> = {
  manageBuilders: ["SUPER_ADMIN"],
  manageUsers: ["SUPER_ADMIN", "BUILDER_ADMIN"],
  manageProjects: ["SUPER_ADMIN", "BUILDER_ADMIN"],
  manageInventory: ["SUPER_ADMIN", "BUILDER_ADMIN", "SALES_MANAGER"],
  assignLeads: ["SUPER_ADMIN", "BUILDER_ADMIN", "SALES_MANAGER"],
  manageAssignmentRules: ["SUPER_ADMIN", "BUILDER_ADMIN"],
  manageMarketing: ["SUPER_ADMIN", "BUILDER_ADMIN", "MARKETING_MANAGER"],
  manageAutomation: ["SUPER_ADMIN", "BUILDER_ADMIN"],
  manageTemplates: ["SUPER_ADMIN", "BUILDER_ADMIN", "MARKETING_MANAGER"],
  viewCompanyReports: ["SUPER_ADMIN", "BUILDER_ADMIN", "MARKETING_MANAGER"],
  viewTeamReports: ["SUPER_ADMIN", "BUILDER_ADMIN", "SALES_MANAGER"],
  markBooking: ["SUPER_ADMIN", "BUILDER_ADMIN", "SALES_MANAGER", "SALES_EXECUTIVE"],
  deleteRecords: ["SUPER_ADMIN", "BUILDER_ADMIN"],
  manageApiKeys: ["SUPER_ADMIN", "BUILDER_ADMIN"],
};

export function can(role: Role, capability: Capability): boolean {
  return CAPABILITY_ROLES[capability].includes(role);
}

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/leads", label: "Leads", icon: "Users" },
  { href: "/site-visits", label: "Site Visits", icon: "MapPin" },
  { href: "/bookings", label: "Bookings", icon: "FileSignature" },
  { href: "/inventory", label: "Inventory", icon: "Building2" },
  { href: "/projects", label: "Projects", icon: "Landmark", capability: "manageProjects" as Capability },
  { href: "/marketing", label: "Marketing", icon: "Megaphone", capability: "manageMarketing" as Capability },
  { href: "/automation", label: "Automation", icon: "Workflow", capability: "manageAutomation" as Capability },
  { href: "/reports", label: "Reports", icon: "BarChart3" },
  { href: "/users", label: "Team", icon: "UserCog", capability: "manageUsers" as Capability },
];
