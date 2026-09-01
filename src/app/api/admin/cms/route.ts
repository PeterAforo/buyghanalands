import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma, withDbRetry } from "@/lib/db";
import { serializeForJson } from "@/lib/serialize";

async function isAdmin(userId: string): Promise<boolean> {
  const user = await withDbRetry(() => prisma.user.findUnique({ where: { id: userId }, select: { roles: true } }));
  return user?.roles.some((r) => ["ADMIN", "MODERATOR"].includes(r)) || false;
}

// GET — list all CMS content in one call
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const [newsArticles, supportCategories, faqItems, homepageStats, siteSettings, testimonials, homepageSteps, homepageLandTypes, homepageProfessionals, homepageRegions, trustBarItems, heroContent, contactMessages, footerContent] = await withDbRetry(() => Promise.all([
      prisma.newsArticle.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.supportCategory.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.faqItem.findMany({ orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }] }),
      prisma.homepageStat.findMany({ orderBy: { displayOrder: "asc" } }),
      prisma.siteSetting.findMany({ orderBy: { key: "asc" } }),
      prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.homepageStep.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.homepageLandType.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.homepageProfessional.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.homepageRegion.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.trustBarItem.findMany({ orderBy: { sortOrder: "asc" } }),
      prisma.heroContent.findMany({ orderBy: { updatedAt: "desc" } }),
      prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.footerContent.findMany({ orderBy: { sortOrder: "asc" } }),
    ]));

    return NextResponse.json(serializeForJson({
      newsArticles,
      supportCategories,
      faqItems,
      homepageStats,
      siteSettings,
      testimonials,
      homepageSteps,
      homepageLandTypes,
      homepageProfessionals,
      homepageRegions,
      trustBarItems,
      heroContent,
      contactMessages,
      footerContent,
    }));
  } catch (error) {
    console.error("Error fetching CMS content:", error);
    return NextResponse.json({ error: "Failed to fetch CMS content" }, { status: 500 });
  }
}

// POST — create or update any CMS entity
const cmsSchema = z.object({
  entityType: z.enum([
    "news", "faq", "supportCategory", "homepageStat", "siteSetting", "pageContent",
    "testimonial", "homepageStep", "homepageLandType", "homepageProfessional",
    "homepageRegion", "trustBarItem", "heroContent", "contactMessage", "footerContent",
  ]),
  id: z.string().optional(),
  data: z.any(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { entityType, id, data } = cmsSchema.parse(body);

    let result;

    switch (entityType) {
      case "news": {
        if (id) {
          result = await withDbRetry(() => prisma.newsArticle.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.newsArticle.create({ data }));
        }
        break;
      }
      case "faq": {
        if (id) {
          result = await withDbRetry(() => prisma.faqItem.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.faqItem.create({ data }));
        }
        break;
      }
      case "supportCategory": {
        if (id) {
          result = await withDbRetry(() => prisma.supportCategory.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.supportCategory.create({ data }));
        }
        break;
      }
      case "homepageStat": {
        if (id) {
          result = await withDbRetry(() => prisma.homepageStat.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.homepageStat.create({ data }));
        }
        break;
      }
      case "siteSetting": {
        // Upsert by key
        result = await withDbRetry(() => prisma.siteSetting.upsert({
          where: { key: data.key },
          create: { key: data.key, value: data.value, type: data.type || "text" },
          update: { value: data.value, type: data.type || "text" },
        }));
        break;
      }
      case "pageContent": {
        // Store structured page content as JSON in SiteSetting
        // Key format: "page.{pageKey}.{sectionKey}"
        const key = `page.${data.pageKey}.${data.sectionKey}`;
        result = await withDbRetry(() => prisma.siteSetting.upsert({
          where: { key },
          create: { key, value: JSON.stringify(data.content), type: "json" },
          update: { value: JSON.stringify(data.content), type: "json" },
        }));
        break;
      }
      case "testimonial": {
        if (id) {
          result = await withDbRetry(() => prisma.testimonial.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.testimonial.create({ data }));
        }
        break;
      }
      case "homepageStep": {
        if (id) {
          result = await withDbRetry(() => prisma.homepageStep.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.homepageStep.create({ data }));
        }
        break;
      }
      case "homepageLandType": {
        if (id) {
          result = await withDbRetry(() => prisma.homepageLandType.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.homepageLandType.create({ data }));
        }
        break;
      }
      case "homepageProfessional": {
        if (id) {
          result = await withDbRetry(() => prisma.homepageProfessional.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.homepageProfessional.create({ data }));
        }
        break;
      }
      case "homepageRegion": {
        if (id) {
          result = await withDbRetry(() => prisma.homepageRegion.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.homepageRegion.create({ data }));
        }
        break;
      }
      case "trustBarItem": {
        if (id) {
          result = await withDbRetry(() => prisma.trustBarItem.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.trustBarItem.create({ data }));
        }
        break;
      }
      case "heroContent": {
        if (id) {
          result = await withDbRetry(() => prisma.heroContent.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.heroContent.create({ data }));
        }
        break;
      }
      case "contactMessage": {
        if (id) {
          result = await withDbRetry(() => prisma.contactMessage.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.contactMessage.create({ data }));
        }
        break;
      }
      case "footerContent": {
        if (id) {
          result = await withDbRetry(() => prisma.footerContent.update({ where: { id }, data }));
        } else {
          result = await withDbRetry(() => prisma.footerContent.create({ data }));
        }
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    // Audit log
    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "CMS_CONTENT",
        entityId: id || entityType,
        actorType: "USER",
        actorUserId: session.user.id,
        action: id ? "UPDATE" : "CREATE",
        diff: { entityType, id, data },
      },
    }));

    return NextResponse.json(serializeForJson(result));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.issues }, { status: 400 });
    }
    console.error("Error saving CMS content:", error);
    return NextResponse.json({ error: "Failed to save CMS content" }, { status: 500 });
  }
}

// DELETE — remove a CMS entity
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await isAdmin(session.user.id))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const id = searchParams.get("id");

    if (!entityType || !id) {
      return NextResponse.json({ error: "entityType and id are required" }, { status: 400 });
    }

    switch (entityType) {
      case "news":
        await withDbRetry(() => prisma.newsArticle.delete({ where: { id } }));
        break;
      case "faq":
        await withDbRetry(() => prisma.faqItem.delete({ where: { id } }));
        break;
      case "supportCategory":
        await withDbRetry(() => prisma.supportCategory.delete({ where: { id } }));
        break;
      case "homepageStat":
        await withDbRetry(() => prisma.homepageStat.delete({ where: { id } }));
        break;
      case "siteSetting":
        await withDbRetry(() => prisma.siteSetting.delete({ where: { key: id } }));
        break;
      case "pageContent":
        await withDbRetry(() => prisma.siteSetting.delete({ where: { key: id } }));
        break;
      case "testimonial":
        await withDbRetry(() => prisma.testimonial.delete({ where: { id } }));
        break;
      case "homepageStep":
        await withDbRetry(() => prisma.homepageStep.delete({ where: { id } }));
        break;
      case "homepageLandType":
        await withDbRetry(() => prisma.homepageLandType.delete({ where: { id } }));
        break;
      case "homepageProfessional":
        await withDbRetry(() => prisma.homepageProfessional.delete({ where: { id } }));
        break;
      case "homepageRegion":
        await withDbRetry(() => prisma.homepageRegion.delete({ where: { id } }));
        break;
      case "trustBarItem":
        await withDbRetry(() => prisma.trustBarItem.delete({ where: { id } }));
        break;
      case "heroContent":
        await withDbRetry(() => prisma.heroContent.delete({ where: { id } }));
        break;
      case "contactMessage":
        await withDbRetry(() => prisma.contactMessage.delete({ where: { id } }));
        break;
      case "footerContent":
        await withDbRetry(() => prisma.footerContent.delete({ where: { id } }));
        break;
      default:
        return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    await withDbRetry(() => prisma.auditLog.create({
      data: {
        entityType: "CMS_CONTENT",
        entityId: id,
        actorType: "USER",
        actorUserId: session.user.id,
        action: "DELETE",
        diff: { entityType },
      },
    }));

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Error deleting CMS content:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
