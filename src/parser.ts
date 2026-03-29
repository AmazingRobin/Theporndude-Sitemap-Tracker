import { XMLParser } from "fast-xml-parser";

export interface SitemapEntry {
  loc: string;
  changefreq?: string;
  priority?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  isArray: (_name, jpath) => jpath === "urlset.url" || jpath === "sitemapindex.sitemap",
});

export function parseSitemap(xml: string): SitemapEntry[] {
  const parsed = parser.parse(xml);

  // Standard <urlset> sitemap
  if (parsed.urlset?.url) {
    const entries: SitemapEntry[] = parsed.urlset.url.map((u: any) => ({
      loc: String(u.loc),
      changefreq: u.changefreq ? String(u.changefreq) : undefined,
      priority: u.priority != null ? String(u.priority) : undefined,
    }));
    console.log(`[parser] Parsed ${entries.length} URLs from <urlset>`);
    return entries;
  }

  // Sitemap index — log warning, not yet supported
  if (parsed.sitemapindex?.sitemap) {
    const count = parsed.sitemapindex.sitemap.length;
    console.warn(`[parser] Found <sitemapindex> with ${count} sub-sitemaps — recursive fetch not implemented`);
    return [];
  }

  throw new Error(`[parser] Unrecognized sitemap format. Root keys: ${Object.keys(parsed).join(", ")}`);
}
