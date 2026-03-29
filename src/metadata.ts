/**
 * 从站点详情页抓取 og:title, og:description, og:image
 * 仅对 /数字ID/站点名 格式的 URL 有效
 */

const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

export interface SiteMeta {
  name: string;
  description: string;
  thumbnail: string;
}

function extractMeta(html: string): SiteMeta {
  const title = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/)?.[1] || "";
  const desc = html.match(/<meta\s+(?:property="og:description"|name="description")\s+content="([^"]*)"/)?.[1] || "";
  const img = html.match(/<meta\s+property="og:image"\s+content="([^"]*)"/)?.[1] || "";

  // og:title 通常是 "SiteName & 167+ Free Porn Tube Sites Like xxx.com"
  // 取 & 前面的部分作为站点名
  let name = title.split("&amp;")[0].split("&")[0].trim();
  if (!name) {
    name = title;
  }

  return {
    name: name.replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c))),
    description: desc.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c))),
    thumbnail: img,
  };
}

/** 判断 URL 是否是站点详情页（/数字ID/站点名 格式） */
export function isSiteDetailUrl(url: string): boolean {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    // 可能是 /数字/名称 或 /语言代码/数字/名称
    if (segments.length === 2 && /^\d+$/.test(segments[0])) return true;
    if (segments.length === 3 && segments[0].length === 2 && /^\d+$/.test(segments[1])) return true;
    return false;
  } catch {
    return false;
  }
}

/** 从 URL 路径提取站点名（不抓取页面，作为 fallback） */
export function extractNameFromUrl(url: string): string {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    // /数字/名称 → 名称
    if (segments.length >= 2 && /^\d+$/.test(segments[0])) {
      return segments[1].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
    // /语言/数字/名称
    if (segments.length >= 3 && segments[0].length === 2 && /^\d+$/.test(segments[1])) {
      return segments[2].replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
    // 分类页面等
    const last = segments[segments.length - 1];
    return last.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  } catch {
    return url;
  }
}

/**
 * 批量抓取站点 meta 信息
 * 对大量 URL 只用 URL 提取名称（不抓页面），对少量新增才逐个抓取
 */
export async function fetchMetaBatch(
  urls: string[],
  maxFetch: number = 100,
): Promise<Map<string, SiteMeta>> {
  const result = new Map<string, SiteMeta>();

  // 分出站点详情页 URL
  const detailUrls = urls.filter(isSiteDetailUrl);
  const otherUrls = urls.filter(u => !isSiteDetailUrl(u));

  // 非详情页直接用 URL 提取名称
  for (const url of otherUrls) {
    result.set(url, {
      name: extractNameFromUrl(url),
      description: "",
      thumbnail: "",
    });
  }

  // 详情页：如果数量 <= maxFetch，逐个抓取 meta；否则用 URL 提取
  if (detailUrls.length <= maxFetch) {
    console.log(`[metadata] Fetching meta for ${detailUrls.length} site pages...`);
    const BATCH = 5;
    for (let i = 0; i < detailUrls.length; i += BATCH) {
      const batch = detailUrls.slice(i, i + BATCH);
      const results = await Promise.all(batch.map(async (url) => {
        try {
          const res = await fetch(url, { headers: { "User-Agent": UA } });
          if (!res.ok) return { url, meta: null };
          const html = await res.text();
          return { url, meta: extractMeta(html) };
        } catch {
          return { url, meta: null };
        }
      }));

      for (const { url, meta } of results) {
        if (meta && meta.name) {
          result.set(url, meta);
        } else {
          result.set(url, {
            name: extractNameFromUrl(url),
            description: "",
            thumbnail: "",
          });
        }
      }

      if (i + BATCH < detailUrls.length) {
        await Bun.sleep(200);
      }
    }
  } else {
    console.log(`[metadata] Too many URLs (${detailUrls.length}), using URL-based names`);
    for (const url of detailUrls) {
      result.set(url, {
        name: extractNameFromUrl(url),
        description: "",
        thumbnail: "",
      });
    }
  }

  return result;
}
