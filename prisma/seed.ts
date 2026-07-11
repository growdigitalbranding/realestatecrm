import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { generateApiKey, hashApiKey } from "../src/lib/api-keys";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const PASSWORD = "Password123!";

async function main() {
  console.log("Seeding RealtyFlow CRM demo data...");

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const builder = await db.builder.create({
    data: {
      name: "VSK Housing India",
      slug: "vsk-housing",
      plan: "enterprise",
    },
  });

  const projectGreen = await db.project.create({
    data: {
      builderId: builder.id,
      name: "VSK Green Meadows",
      slug: "green-meadows",
      city: "Bengaluru",
      state: "Karnataka",
      address: "Sarjapur Road, Bengaluru",
      reraNumber: "PRM/KA/RERA/1251/446/PR/110125/001",
      status: "ACTIVE",
      minBudget: 4500000,
      maxBudget: 9500000,
    },
  });

  const projectLake = await db.project.create({
    data: {
      builderId: builder.id,
      name: "VSK Lake View Residency",
      slug: "lake-view-residency",
      city: "Pune",
      state: "Maharashtra",
      address: "Baner, Pune",
      reraNumber: "P52100029876",
      status: "UPCOMING",
      minBudget: 6000000,
      maxBudget: 14000000,
    },
  });

  const projects = [projectGreen, projectLake];

  // ---------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------
  const superAdmin = await db.user.create({
    data: {
      builderId: builder.id,
      name: "Aditi Rao",
      email: "sales@vskhousingindia.com",
      passwordHash,
      role: "SUPER_ADMIN",
      isCompanyWide: true,
      phone: "+91 98765 43210",
    },
  });

  const builderAdmin = await db.user.create({
    data: {
      builderId: builder.id,
      name: "Rohan Mehta",
      email: "rohan.mehta@vskhousingindia.com",
      passwordHash,
      role: "BUILDER_ADMIN",
      isCompanyWide: true,
      phone: "+91 98765 43211",
    },
  });

  const salesManagerGreen = await db.user.create({
    data: {
      builderId: builder.id,
      name: "Priya Nair",
      email: "priya.nair@vskhousingindia.com",
      passwordHash,
      role: "SALES_MANAGER",
      phone: "+91 98765 43212",
    },
  });

  const salesManagerLake = await db.user.create({
    data: {
      builderId: builder.id,
      name: "Karan Malhotra",
      email: "karan.malhotra@vskhousingindia.com",
      passwordHash,
      role: "SALES_MANAGER",
      phone: "+91 98765 43213",
    },
  });

  await db.user.create({
    data: {
      builderId: builder.id,
      name: "Sana Sheikh",
      email: "sana.sheikh@vskhousingindia.com",
      passwordHash,
      role: "MARKETING_MANAGER",
      isCompanyWide: true,
      phone: "+91 98765 43214",
    },
  });

  const telecallers = await Promise.all(
    ["Neha Kulkarni", "Amit Verma"].map((name, i) =>
      db.user.create({
        data: {
          builderId: builder.id,
          name,
          email: `${name.toLowerCase().replace(" ", ".")}@vskhousingindia.com`,
          passwordHash,
          role: "TELECALLER",
          phone: `+91 98765 4322${i}`,
        },
      }),
    ),
  );

  const executives = await Promise.all(
    ["Vikram Singh", "Ananya Iyer", "Farhan Sheikh", "Divya Menon"].map(
      (name, i) =>
        db.user.create({
          data: {
            builderId: builder.id,
            name,
            email: `${name.toLowerCase().replace(" ", ".")}@vskhousingindia.com`,
            passwordHash,
            role: "SALES_EXECUTIVE",
            phone: `+91 98765 4324${i}`,
          },
        }),
    ),
  );

  // Project access scoping
  await db.userProjectAccess.createMany({
    data: [
      { userId: salesManagerGreen.id, projectId: projectGreen.id },
      { userId: salesManagerLake.id, projectId: projectLake.id },
      { userId: telecallers[0].id, projectId: projectGreen.id },
      { userId: telecallers[1].id, projectId: projectLake.id },
      { userId: executives[0].id, projectId: projectGreen.id },
      { userId: executives[1].id, projectId: projectGreen.id },
      { userId: executives[2].id, projectId: projectLake.id },
      { userId: executives[3].id, projectId: projectLake.id },
    ],
  });

  // ---------------------------------------------------------------------
  // Inventory: towers -> floors -> units
  // ---------------------------------------------------------------------
  const unitTypes = ["2BHK", "3BHK", "3BHK Premium", "4BHK"];
  const facings = ["East", "West", "North", "South"];

  for (const project of projects) {
    for (let t = 1; t <= 2; t++) {
      const tower = await db.tower.create({
        data: { projectId: project.id, name: `Tower ${String.fromCharCode(64 + t)}` },
      });
      for (let f = 1; f <= 5; f++) {
        const floor = await db.floor.create({
          data: { towerId: tower.id, number: f, name: `Floor ${f}` },
        });
        for (let u = 1; u <= 4; u++) {
          const type = unitTypes[(f + u) % unitTypes.length];
          const basePrice = project.id === projectGreen.id ? 5200000 : 7800000;
          await db.unit.create({
            data: {
              floorId: floor.id,
              unitNumber: `${tower.name.slice(-1)}${f}0${u}`,
              unitType: type,
              areaSqft: 950 + u * 150,
              facing: facings[(f + u) % facings.length],
              price: basePrice + f * 150000 + u * 80000,
              bookingAmount: 250000,
              status: "AVAILABLE",
            },
          });
        }
      }
    }
  }

  const allUnits = await db.unit.findMany({
    include: { floor: { include: { tower: true } } },
  });
  const unitsForProject = (projectId: string) =>
    allUnits.filter((u) => u.floor.tower.projectId === projectId);

  // ---------------------------------------------------------------------
  // Assignment rules
  // ---------------------------------------------------------------------
  await db.assignmentRule.createMany({
    data: [
      {
        projectId: projectGreen.id,
        name: "Round robin - general leads",
        type: "ROUND_ROBIN",
        config: { executiveIds: [executives[0].id, executives[1].id] },
        priority: 1,
      },
      {
        projectId: projectGreen.id,
        name: "Luxury leads (>75L) to senior exec",
        type: "BUDGET_BASED",
        config: { minBudget: 7500000, executiveId: executives[1].id },
        priority: 10,
      },
      {
        projectId: projectLake.id,
        name: "Round robin - general leads",
        type: "ROUND_ROBIN",
        config: { executiveIds: [executives[2].id, executives[3].id] },
        priority: 1,
      },
    ],
  });

  // ---------------------------------------------------------------------
  // Marketing sources, campaigns
  // ---------------------------------------------------------------------
  const metaSource = await db.marketingSource.create({
    data: {
      builderId: builder.id,
      name: "Meta Lead Ads",
      platform: "META",
      config: { pixelId: "1234567890" },
    },
  });
  const googleSource = await db.marketingSource.create({
    data: {
      builderId: builder.id,
      name: "Google Ads",
      platform: "GOOGLE",
      config: { conversionId: "AW-000000000" },
    },
  });

  const campaignGreenMeta = await db.campaign.create({
    data: {
      projectId: projectGreen.id,
      marketingSourceId: metaSource.id,
      platform: "META",
      name: "Green Meadows - Instant Form - July",
      externalId: "cmp_meta_green_001",
      spend: 185000,
    },
  });
  const campaignGreenGoogle = await db.campaign.create({
    data: {
      projectId: projectGreen.id,
      marketingSourceId: googleSource.id,
      platform: "GOOGLE",
      name: "Green Meadows - Search - July",
      externalId: "cmp_google_green_001",
      spend: 96000,
    },
  });
  const campaignLakeMeta = await db.campaign.create({
    data: {
      projectId: projectLake.id,
      marketingSourceId: metaSource.id,
      platform: "META",
      name: "Lake View - Instant Form - July",
      externalId: "cmp_meta_lake_001",
      spend: 142000,
    },
  });

  // ---------------------------------------------------------------------
  // Message templates
  // ---------------------------------------------------------------------
  await db.messageTemplate.createMany({
    data: [
      {
        builderId: builder.id,
        name: "New Lead Welcome",
        channel: "WHATSAPP",
        content: "Hi {{name}}, thank you for your interest in {{project}}! Our executive will call you shortly.",
        approvalStatus: "APPROVED",
      },
      {
        builderId: builder.id,
        name: "Site Visit Reminder",
        channel: "SMS",
        content: "Reminder: Your site visit for {{project}} is scheduled on {{date}} at {{time}}.",
        approvalStatus: "APPROVED",
      },
      {
        builderId: builder.id,
        name: "Post Visit Follow-up",
        channel: "WHATSAPP",
        content: "Hi {{name}}, thanks for visiting {{project}} today! Let us know if you have any questions.",
        approvalStatus: "APPROVED",
      },
    ],
  });

  // ---------------------------------------------------------------------
  // Leads
  // ---------------------------------------------------------------------
  const statuses = [
    "NEW",
    "CONTACTED",
    "INTERESTED",
    "SITE_VISIT_SCHEDULED",
    "SITE_VISIT_DONE",
    "NEGOTIATION",
    "BOOKING_TOKEN",
    "BOOKED",
    "LOST",
  ] as const;

  const realSources = [
    "META_LEAD_ADS",
    "GOOGLE_LEAD_FORM",
    "WEBSITE_FORM",
    "WHATSAPP_CLICK_TO_CHAT",
    "MAGICBRICKS",
    "ACRES99",
    "WALK_IN",
    "REFERRAL",
    "CHANNEL_PARTNER",
  ] as const;

  const firstNames = [
    "Arjun", "Sneha", "Rahul", "Pooja", "Vivek", "Kavya", "Manoj", "Ritu",
    "Suresh", "Anjali", "Deepak", "Meera", "Sanjay", "Nisha", "Rajesh",
    "Swati", "Gaurav", "Priyanka", "Naveen", "Shreya", "Kunal", "Isha",
    "Harish", "Divya", "Ashok", "Lata", "Vinay", "Preeti", "Mohit", "Reena",
  ];
  const lastNames = [
    "Sharma", "Reddy", "Gupta", "Iyer", "Patel", "Nair", "Joshi", "Chauhan",
    "Kapoor", "Bhatt", "Menon", "Rao", "Desai", "Pillai", "Agarwal",
  ];

  const cities = ["Bengaluru", "Pune", "Mumbai", "Hyderabad", "Chennai"];

  const leadRecords = [];
  for (let i = 0; i < 60; i++) {
    const project = projects[i % 2];
    const status = statuses[i % statuses.length];
    const source = realSources[i % realSources.length];
    const first = firstNames[i % firstNames.length];
    const last = lastNames[(i * 3) % lastNames.length];
    const isMeta = source === "META_LEAD_ADS";
    const isGoogle = source === "GOOGLE_LEAD_FORM";
    const exec = project.id === projectGreen.id ? executives[i % 2] : executives[2 + (i % 2)];
    const campaign = project.id === projectGreen.id
      ? (isMeta ? campaignGreenMeta : campaignGreenGoogle)
      : campaignLakeMeta;

    leadRecords.push({
      builderId: builder.id,
      projectId: project.id,
      name: `${first} ${last}`,
      mobile: `9${(700000000 + i * 137).toString().slice(0, 9)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com`,
      city: cities[i % cities.length],
      state: project.state,
      budgetMin: 4500000 + (i % 5) * 500000,
      budgetMax: 6500000 + (i % 5) * 700000,
      source,
      sourceDetail: source === "CHANNEL_PARTNER" ? "Square Yards" : undefined,
      campaign: isMeta || isGoogle ? campaign.name : undefined,
      adset: isMeta ? `AdSet_${(i % 4) + 1}BHK` : undefined,
      ad: isMeta ? `Creative_${(i % 3) + 1}` : undefined,
      utmSource: isMeta ? "facebook" : isGoogle ? "google" : source === "WEBSITE_FORM" ? "website" : undefined,
      utmMedium: isMeta ? "paid_social" : isGoogle ? "cpc" : undefined,
      utmCampaign: (isMeta || isGoogle) ? campaign.externalId ?? undefined : undefined,
      device: i % 3 === 0 ? "Mobile" : i % 3 === 1 ? "Desktop" : "Tablet",
      browser: i % 2 === 0 ? "Chrome" : "Safari",
      landingPage: `https://vskhousingindia.com/${project.slug}`,
      gclid: isGoogle ? `Cj0KEQ${i}gclid` : undefined,
      fbclid: isMeta ? `IwAR${i}fbclid` : undefined,
      ipAddress: `103.21.${i % 255}.${(i * 7) % 255}`,
      status,
      lostReason: status === "LOST" ? ["Budget mismatch", "Bought elsewhere", "Not interested", "Unresponsive"][i % 4] : undefined,
      assignedToId: exec.id,
      createdById: exec.id,
      nextFollowUpAt: status === "LOST" || status === "BOOKED" ? undefined : new Date(Date.now() + ((i % 7) - 2) * 24 * 60 * 60 * 1000),
      lastContactedAt: status === "NEW" ? undefined : new Date(Date.now() - (i % 10) * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - (60 - i) * 12 * 60 * 60 * 1000),
    });
  }

  const createdLeads = [];
  for (const data of leadRecords) {
    const lead = await db.lead.create({ data });
    createdLeads.push(lead);
  }

  // Activities + tasks for a subset of leads
  for (const lead of createdLeads) {
    await db.leadActivity.create({
      data: {
        leadId: lead.id,
        userId: lead.assignedToId,
        type: "SYSTEM",
        content: `Lead captured via ${lead.source.replaceAll("_", " ").toLowerCase()}`,
        createdAt: lead.createdAt,
      },
    });

    if (lead.status !== "NEW") {
      await db.leadActivity.create({
        data: {
          leadId: lead.id,
          userId: lead.assignedToId,
          type: "CALL",
          content: "Discussed project details and budget expectations.",
          createdAt: new Date(lead.createdAt.getTime() + 3600 * 1000),
        },
      });
    }

    if (lead.nextFollowUpAt) {
      await db.task.create({
        data: {
          leadId: lead.id,
          assignedToId: lead.assignedToId!,
          title: `Follow up with ${lead.name}`,
          dueAt: lead.nextFollowUpAt,
          status: lead.nextFollowUpAt < new Date() ? "OVERDUE" : "PENDING",
        },
      });
    }
  }

  // Site visits for leads at or beyond SITE_VISIT_SCHEDULED
  const siteVisitStatuses = ["SITE_VISIT_SCHEDULED", "SITE_VISIT_DONE", "NEGOTIATION", "BOOKING_TOKEN", "BOOKED"];
  const siteVisitLeads = createdLeads.filter((l) => siteVisitStatuses.includes(l.status));
  for (const lead of siteVisitLeads) {
    await db.siteVisit.create({
      data: {
        leadId: lead.id,
        projectId: lead.projectId,
        executiveId: lead.assignedToId,
        scheduledAt: new Date(lead.createdAt.getTime() + 3 * 24 * 60 * 60 * 1000),
        status: lead.status === "SITE_VISIT_SCHEDULED" ? "SCHEDULED" : "COMPLETED",
        familyMembers: 2,
        feedback: lead.status === "SITE_VISIT_SCHEDULED" ? undefined : "Liked the layout, considering budget options.",
      },
    });
  }

  // ---------------------------------------------------------------------
  // Bookings for BOOKING_TOKEN / BOOKED leads
  // ---------------------------------------------------------------------
  const bookingLeads = createdLeads.filter((l) => l.status === "BOOKING_TOKEN" || l.status === "BOOKED");
  const unitCursor: Record<string, number> = { [projectGreen.id]: 0, [projectLake.id]: 0 };
  for (const lead of bookingLeads) {
    const units = unitsForProject(lead.projectId);
    const unit = units[unitCursor[lead.projectId] % units.length];
    unitCursor[lead.projectId]++;

    const booking = await db.booking.create({
      data: {
        leadId: lead.id,
        unitId: unit.id,
        projectId: lead.projectId,
        salesExecutiveId: lead.assignedToId,
        totalPrice: unit.price ?? 5500000,
        bookingAmount: unit.bookingAmount ?? 250000,
        status: lead.status === "BOOKED" ? "CONFIRMED" : "TOKEN",
        commissionAmount: Number(unit.price ?? 5500000) * 0.015,
        commissionStatus: "PENDING",
      },
    });

    await db.unit.update({
      where: { id: unit.id },
      data: { status: lead.status === "BOOKED" ? "BOOKED" : "BLOCKED" },
    });

    await db.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.bookingAmount,
        mode: "Bank Transfer",
        reference: `TXN${Math.floor(Math.random() * 1000000)}`,
        status: "PAID",
        paidAt: booking.createdAt,
      },
    });
  }

  // ---------------------------------------------------------------------
  // Conversion events (Meta / Google CAPI feedback loop)
  // ---------------------------------------------------------------------
  for (const lead of createdLeads.filter((l) => l.source === "META_LEAD_ADS" || l.source === "GOOGLE_LEAD_FORM").slice(0, 20)) {
    await db.conversionEvent.create({
      data: {
        leadId: lead.id,
        eventType: "LEAD",
        platform: lead.source === "META_LEAD_ADS" ? "META" : "GOOGLE",
        status: "SENT",
        sentAt: lead.createdAt,
        payload: { email: lead.email, phone: lead.mobile },
      },
    });
    if (["BOOKING_TOKEN", "BOOKED", "NEGOTIATION", "SITE_VISIT_DONE"].includes(lead.status)) {
      await db.conversionEvent.create({
        data: {
          leadId: lead.id,
          eventType: "QUALIFIED_LEAD",
          platform: lead.source === "META_LEAD_ADS" ? "META" : "GOOGLE",
          status: "SENT",
          sentAt: new Date(lead.createdAt.getTime() + 24 * 60 * 60 * 1000),
        },
      });
    }
    if (lead.status === "BOOKED") {
      await db.conversionEvent.create({
        data: {
          leadId: lead.id,
          eventType: "PURCHASE",
          platform: lead.source === "META_LEAD_ADS" ? "META" : "GOOGLE",
          status: "SENT",
          value: 250000,
          sentAt: new Date(lead.createdAt.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // ---------------------------------------------------------------------
  // Automation rules (examples from PRD)
  // ---------------------------------------------------------------------
  await db.automationRule.createMany({
    data: [
      {
        builderId: builder.id,
        projectId: projectGreen.id,
        name: "Route high-budget leads to senior exec",
        triggerType: "LEAD_CREATED",
        conditions: { field: "budgetMax", operator: "gt", value: 7500000 },
        actions: [{ type: "ASSIGN_TO", executiveId: executives[1].id }],
      },
      {
        builderId: builder.id,
        name: "WhatsApp reminder after site visit without booking",
        triggerType: "SITE_VISIT_COMPLETED",
        conditions: { noBookingWithinHours: 24 },
        actions: [{ type: "SEND_WHATSAPP", templateName: "Post Visit Follow-up" }],
      },
      {
        builderId: builder.id,
        name: "Escalate missed follow-ups to manager",
        triggerType: "FOLLOW_UP_MISSED",
        conditions: {},
        actions: [{ type: "NOTIFY_MANAGER" }],
      },
    ],
  });

  // ---------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------
  await db.notification.createMany({
    data: [
      {
        userId: executives[0].id,
        type: "NEW_LEAD",
        title: "New lead assigned",
        message: `You have a new lead in ${projectGreen.name}.`,
        link: "/leads",
      },
      {
        userId: salesManagerGreen.id,
        type: "FOLLOW_UP_MISSED",
        title: "Follow-up overdue",
        message: "One or more leads have overdue follow-ups.",
        link: "/leads?filter=overdue",
      },
    ],
  });

  // ---------------------------------------------------------------------
  // API key for webhook / lead capture integrations
  // ---------------------------------------------------------------------
  const { raw, prefix } = generateApiKey();
  await db.apiKey.create({
    data: {
      builderId: builder.id,
      name: "Website & Ad Platform Webhook",
      keyHash: await hashApiKey(raw),
      keyPrefix: prefix,
    },
  });

  console.log("Seed complete.");
  console.log(`Builder: ${builder.name}`);
  console.log(`Login as ${superAdmin.email} / ${builderAdmin.email} / ${salesManagerGreen.email} etc.`);
  console.log(`Password for all demo users: ${PASSWORD}`);
  console.log(`Webhook API key (save this, shown once): ${raw}`);
  console.log(`Webhook endpoint: POST /api/leads/webhook  (header: x-api-key)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
