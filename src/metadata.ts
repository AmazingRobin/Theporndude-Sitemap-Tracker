/**
 * 从站点中文详情页 /zh/数字ID/站点名 抓取 og:title, og:description, og:image
 */

const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BASE = "https://theporndude.com";

export interface SiteMeta {
  name: string;
  description: string;
  thumbnail: string;
}

function extractMeta(html: string): SiteMeta {
  const title = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/)?.[1] || "";
  const desc = html.match(/<meta\s+(?:property="og:description"|name="description")\s+content="([^"]*)"/)?.[1] || "";
  const img = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/)?.[1] || "";

  let name = title.split("&amp;")[0].split("&")[0].trim();
  if (!name) name = title;

  const decode = (s: string) =>
    s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
     .replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)));

  return { name: decode(name), description: decode(desc), thumbnail: img };
}

/** 将英文 URL 转为中文版 URL：/566/pornhub → /zh/566/pornhub */
function toZhUrl(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname.split("/").filter(Boolean);
    if (segs.length >= 2 && /^\d+$/.test(segs[0])) {
      u.pathname = "/zh/" + segs.join("/");
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

export function isSiteDetailUrl(url: string): boolean {
  try {
    const segs = new URL(url).pathname.split("/").filter(Boolean);
    if (segs.length === 2 && /^\d+$/.test(segs[0])) return true;
    if (segs.length === 3 && segs[0].length === 2 && /^\d+$/.test(segs[1])) return true;
    return false;
  } catch {
    return false;
  }
}

export function extractNameFromUrl(url: string): string {
  try {
    const segs = new URL(url).pathname.split("/").filter(Boolean);
    if (segs.length >= 2 && /^\d+$/.test(segs[0]))
      return segs[1].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (segs.length >= 3 && segs[0].length === 2 && /^\d+$/.test(segs[1]))
      return segs[2].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const last = segs[segs.length - 1] || "";
    return last.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  } catch {
    return url;
  }
}

export async function fetchMetaBatch(
  urls: string[],
  maxFetch: number = 100,
): Promise<Map<string, SiteMeta>> {
  const result = new Map<string, SiteMeta>();

  const detailUrls = urls.filter(isSiteDetailUrl);
  const otherUrls = urls.filter(u => !isSiteDetailUrl(u));

  for (const url of otherUrls) {
    result.set(url, { name: extractNameFromUrl(url), description: "", thumbnail: "" });
  }

  if (detailUrls.length <= maxFetch) {
    console.log(`[metadata] Fetching zh meta for ${detailUrls.length} sites...`);
    const BATCH = 5;
    for (let i = 0; i < detailUrls.length; i += BATCH) {
      const batch = detailUrls.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(async (url) => {
        try {
          // 抓取中文版页面
          const zhUrl = toZhUrl(url);
          const res = await fetch(zhUrl, { headers: { "User-Agent": UA } });
          if (!res.ok) return { url, meta: null };
          const html = await res.text();
          return { url, meta: extractMeta(html) };
        } catch {
          return { url, meta: null };
        }
      }));
      for (const { url, meta } of results) {
        result.set(url, meta?.name ? meta : { name: extractNameFromUrl(url), description: "", thumbnail: "" });
      }
      if (i + BATCH < detailUrls.length) await Bun.sleep(200);
    }
  } else {
    console.log(`[metadata] Too many URLs (${detailUrls.length}), using URL-based names`);
    for (const url of detailUrls) {
      result.set(url, { name: extractNameFromUrl(url), description: "", thumbnail: "" });
    }
  }

  return result;
}
