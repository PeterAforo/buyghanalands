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
