import { prisma, withDbRetry } from "@/lib/db";

/**
 * Fetch all page content sections for a given page key from SiteSetting.
 * Returns a map of sectionKey -> parsed JSON content.
 */
export async function getPageContent(pageKey: string): Promise<Record<string, any>> {
  const prefix = `page.${pageKey}.`;
  const settings = await withDbRetry(() =>
    prisma.siteSetting.findMany({
      where: { key: { startsWith: prefix } },
    })
  );

  const content: Record<string, any> = {};
  for (const setting of settings) {
    const sectionKey = setting.key.slice(prefix.length);
    try {
      content[sectionKey] = JSON.parse(setting.value);
    } catch {
      content[sectionKey] = setting.value;
    }
  }
  return content;
}

/**
 * Fetch all active footer content sections, grouped by section name.
 */
export async function getFooterContent(): Promise<Record<string, any>> {
  const items = await withDbRetry(() =>
    prisma.footerContent.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    })
  );

  const grouped: Record<string, any> = {};
  for (const item of items) {
    if (!grouped[item.section]) {
      grouped[item.section] = [];
    }
    let links: any[] = [];
    if (item.linksJson) {
      try {
        links = typeof item.linksJson === "string" ? JSON.parse(item.linksJson) : item.linksJson;
      } catch {
        links = [];
      }
    }
    grouped[item.section].push({
      id: item.id,
      title: item.title,
      description: item.description,
      htmlContent: item.htmlContent,
      links: links,
      imageUrl: item.imageUrl,
      sortOrder: item.sortOrder,
    });
  }
  return grouped;
}
