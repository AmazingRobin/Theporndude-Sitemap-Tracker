/**
 * 从 theporndude.com/zh 按分类采集所有站点信息
 * 从 img alt 提取站点名，从 data-src 提取缩略图
 * 输出 public/sites.json
 */

const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BASE = "https://theporndude.com";

interface SiteItem {
  id: string;
  enName: string;
  zhName: string;
  thumbnail: string;
  siteUrl: string;  // 实际网站地址
}

interface CategoryGroup {
  slug: string;
  zhLabel: string;
  sites: SiteItem[];
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchCategorySites(slug: string): Promise<{ zhLabel: string; sites: SiteItem[] }> {
  const zhHtml = await fetchPage(`${BASE}/zh/${slug}`);
  if (!zhHtml) return { zhLabel: slug, sites: [] };

  // 分类中文名
  const h1 = zhHtml.match(/<h1[^>]*>\s*([^<]+)/);
  const zhLabel = h1 ? h1[1].trim().split(" - ")[0].split("--")[0].trim() : slug;

  const sites: SiteItem[] = [];
  const seenIds = new Set<string>();

  // 从 zh 页面提取: data-visit-site-id + img alt + data-src + href 中的 slug
  // 格式: href="...com/zh/566/pornhub" data-visit-site-id="566" ><img ... alt="PornHub, 免费色情视频网站" data-src="...png"
  const regex = /href="https:\/\/theporndude\.com\/zh\/(\d+)\/([^"]+)"[^>]*data-visit-site-id="\d+"[^>]*><img[^>]*alt="([^"]*)"[^>]*data-src="([^"]*)"/g;
  for (const m of zhHtml.matchAll(regex)) {
    const id = m[1];
    const enSlug = m[2];
    const alt = m[3];  // "PornHub, 免费色情视频网站"
    const thumb = m[4];

    if (seenIds.has(id)) continue;
    seenIds.add(id);

    // alt 格式: "英文名, 中文分类" — 取逗号前面的部分作为英文名
    const enName = alt.split(",")[0].trim();
    // 中文名从英文页面的 alt 不同，这里 alt 里的就是英文名
    // 中文名需要另外获取，但 alt 里的英文名已经够用

    sites.push({
      id,
      enName,
      zhName: enName, // 先用英文名，后面从英文页面补充
      thumbnail: thumb.replace("_small.", "_watermark."),
      siteUrl: "",
    });
  }

  // 如果上面的正则没匹配到（HTML 结构可能不同），用宽松匹配
  if (sites.length === 0) {
    const looseRegex = /data-visit-site-id="(\d+)"[^>]*><img[^>]*alt="([^"]*)"[^>]*data-src="([^"]*)"/g;
    for (const m of zhHtml.matchAll(looseRegex)) {
      const id = m[1];
      const alt = m[2];
      const thumb = m[3];
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      const enName = alt.split(",")[0].trim();
      sites.push({ id, enName, zhName: enName, thumbnail: thumb.replace("_small.", "_watermark."), siteUrl: "" });
    }
  }

  // 从英文页面补充: 实际网站地址 (data-site-link) 和英文 alt
  const enHtml = await fetchPage(`${BASE}/${slug}`);
  if (enHtml) {
    // 提取 data-site-link
    const linkRegex = /href="https:\/\/theporndude\.com\/(\d+)\/[^"]*"[^>]*data-site-link="([^"]*)"/g;
    const siteLinks = new Map<string, string>();
    for (const m of enHtml.matchAll(linkRegex)) {
      siteLinks.set(m[1], m[2]);
    }
    // 提取英文 alt
    const enAltRegex = /data-visit-site-id="(\d+)"[^>]*><img[^>]*alt="([^"]*)"/g;
    const enAlts = new Map<string, string>();
    for (const m of enHtml.matchAll(enAltRegex)) {
      enAlts.set(m[1], m[2].split(",")[0].trim());
    }
    for (const site of sites) {
      if (siteLinks.has(site.id)) site.siteUrl = siteLinks.get(site.id)!;
      if (enAlts.has(site.id)) site.enName = enAlts.get(site.id)!;
    }
  }

  return { zhLabel, sites };
}

const SLUGS = [
  "top-porn-tube-sites","free-onlyfans-accounts","tiktok-porn-sites","ai-porn-sites",
  "undress-ai-sites","onlyfans-porn-sites","top-sex-cam-sites","ai-porn-generator-sites-reviews",
  "best-vr-porn-sites","top-premium-sites","best-dating-sites","amateur-premium-sites",
  "best-porn-games","free-sex-games","top-amateur-porn-sites","free-sex-cam-sites",
  "ai-sex-chat-sites","best-onlyfans-girls-list","premium-onlyfans-account","premium-onlyfans-sites",
  "best-fansly-girls-list-reviews","best-sextpanther-models-list-reviews","twitter-porn-creators-reviews",
  "best-loyalfans-girls-list-reviews","best-mym-creators-reviews","best-f2f-girls-list-reviews",
  "sites-like-onlyfans-reviews","ai-hentai-generator-sites-reviews","ai-hentai-sites-reviews",
  "asian-ai-porn-sites-reviews","ai-erotic-story-generators-reviews","ai-trans-porn-sites-reviews",
  "ebony-ai-porn-sites-reviews","latina-ai-porn-sites-reviews","arab-ai-porn-sites-reviews",
  "indian-ai-porn-sites-reviews","hentai-porn-sites","hentai-streaming-sites",
  "hentai-manga-sites","best-premium-hentai-sites","premium-hentai-manga-sites","manhwa-hentai-sites",
  "cartoon-porn-sites","premium-cartoon-porn-sites","3d-porn-sites","best-porn-comic-sites",
  "premium-porn-comic-sites","top-asian-porn-tube-sites","asian-porn-premium-sites","top-asian-sex-cams",
  "top-ebony-porn-tube-sites","ebony-porn-premium-sites","live-ebony-sex-cams",
  "top-arab-porn-tube-sites","arab-porn-premium-sites","arab-sex-cams",
  "top-indian-porn-tube-sites","indian-porn-premium-sites","live-indian-sex-cams",
  "top-latin-porn-tube-sites","latin-porn-premium-sites","live-latina-sex-cams",
  "teen-porn-sites","teen-porn-premium-sites","live-teen-sex-cams",
  "mature-porn-sites","mature-porn-premium-sites","live-mature-sex-cams",
  "granny-porn-sites","premium-granny-porn-sites","live-granny-sex-cams",
  "best-lesbian-porn-sites","lesbian-porn-premium-sites",
  "best-shemale-porn-sites","shemale-porn-premium-sites","live-trans-sex-cams",
  "best-gay-porn-sites","anal-porn-sites","anal-porn-premium-sites","live-anal-sex-cams",
  "bbw-porn-sites","premium-bbw-porn-sites","live-bbw-sex-cams",
  "big-tits-porn-sites","premium-big-tits-sites",
  "pov-porn-sites","premium-pov-porn-sites",
  "taboo-porn-sites","taboo-porn-premium-sites",
  "interracial-porn-sites","premium-interracial-porn-sites",
  "cuckold-porn-sites","premium-cuckold-porn-sites",
  "gangbang-porn-sites","premium-gangbang-porn-sites",
  "blowjob-porn-sites","premium-blowjob-porn-sites",
  "handjob-porn-sites","premium-handjob-porn-sites",
  "creampie-porn-sites","premium-creampie-porn-sites",
  "facial-cumshot-porn-sites","premium-facial-cumshot-porn-sites",
  "female-masturbation-porn-sites","premium-female-masturbation-porn-sites",
  "voyeur-porn-sites","premium-voyeur-porn-sites","live-voyeur-cams-sites",
  "extreme-porn-websites","premium-extreme-porn-sites",
  "asmr-porn-sites","premium-asmr-porn-sites",
  "top-fetish-porn-tube-sites","fetish-porn-premium-sites","live-bdsm-sex-cams","live-squirt-cams",
  "top-scat-porn-tube-sites","scat-and-piss-premium-porn",
  "deepfake-porn-sites","the-fappening","premium-nude-celebrities","nude-celebrities-list",
  "porn-picture-sites","premium-porn-pictures-sites","best-gif-porn-sites",
  "full-porn-movies-sites","adult-vod-sites",
  "free-cam-girl-video-sites","phone-sex-sites","best-adult-chat-sites",
  "best-erotic-stories-sites","porn-for-women","premium-porn-for-women-sites",
  "best-funny-porn-sites","best-vintage-porn-sites","vintage-porn-premium-sites","porn-parody-premium-sites",
  "best-porn-forums","best-nsfw-reddit-sites","popular-porn-blog","porn-review-sites",
  "porn-aggregators","top-porn-search-engines","best-porn-tgp-sites",
  "free-porn-download-sites","top-porn-torrents-sites",
  "best-pornstars-list","best-porn-channels","top-pornstar-directories",
  "best-escort-sites","erotic-massage-sites",
  "best-fleshlights-reviews","best-sex-toys-for-men-reviews","buy-used-panties","sex-doll-shops",
  "best-adult-online-shops","male-enhancement-pills",
  "best-vpn-sites","useful-software","how-to-become-a-cam-girl","make-money-with-porn","betting-sites",
];

export async function buildSiteCatalog(outputPath: string): Promise<void> {
  // Check cache
  try {
    const file = Bun.file(outputPath);
    if (await file.exists()) {
      const cached = await file.json();
      if (Array.isArray(cached) && cached.length > 50 && cached[0]?.sites?.length > 0) {
        // Check if cached today (use file mtime)
        const stat = await file.stat();
        const today = new Date().toISOString().split("T")[0];
        const fileDate = new Date(stat.mtime).toISOString().split("T")[0];
        if (fileDate === today) {
          const total = cached.reduce((s: number, g: any) => s + g.sites.length, 0);
          console.log(`[catalog] Using cached catalog (${cached.length} categories, ${total} sites)`);
          return;
        }
      }
    }
  } catch {}

  console.log(`[catalog] Building site catalog from ${SLUGS.length} categories...`);

  const catalog: CategoryGroup[] = [];
  const seenIds = new Set<string>();
  const BATCH = 2; // 每批 2 个（每个分类要抓 zh + en 两个页面）

  for (let i = 0; i < SLUGS.length; i += BATCH) {
    const batch = SLUGS.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(slug => fetchCategorySites(slug)));

    for (let j = 0; j < batch.length; j++) {
      const { zhLabel, sites } = results[j];
      const uniqueSites = sites.filter(s => {
        if (seenIds.has(s.id)) return false;
        seenIds.add(s.id);
        return true;
      });
      // 保留分类即使去重后为空（但记录所有站点到分类下）
      catalog.push({ slug: batch[j], zhLabel, sites: uniqueSites });
    }

    if (i + BATCH < SLUGS.length) await Bun.sleep(300);
    process.stdout.write(`\r[catalog] ${Math.min(i + BATCH, SLUGS.length)}/${SLUGS.length} categories`);
  }
  console.log("");

  // 过滤掉空分类
  const nonEmpty = catalog.filter(g => g.sites.length > 0);
  const totalSites = nonEmpty.reduce((sum, g) => sum + g.sites.length, 0);
  console.log(`[catalog] ${nonEmpty.length} categories, ${totalSites} unique sites`);

  await Bun.write(outputPath, JSON.stringify(nonEmpty, null, 2));
  console.log(`[catalog] Saved to ${outputPath}`);
}
