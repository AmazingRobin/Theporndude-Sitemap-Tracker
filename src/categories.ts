/**
 * 从 theporndude.com 的分类页面抓取 站点ID → 分类名 的映射关系
 * 输出 data/categories.json 作为缓存
 */

const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BASE = "https://theporndude.com";

// 分类 slug → 中文名映射
const CATEGORY_LABELS: Record<string, string> = {
  "top-porn-tube-sites": "免费色情管站",
  "top-premium-sites": "付费色情站",
  "top-sex-cam-sites": "性爱直播",
  "free-sex-cam-sites": "免费直播",
  "best-dating-sites": "约会交友",
  "best-porn-games": "色情游戏",
  "free-sex-games": "免费游戏",
  "best-vr-porn-sites": "VR 色情",
  "ai-porn-sites": "AI 色情",
  "ai-porn-generator-sites-reviews": "AI 生成器",
  "undress-ai-sites": "AI 脱衣",
  "ai-sex-chat-sites": "AI 聊天",
  "ai-hentai-generator-sites-reviews": "AI 动漫生成",
  "ai-hentai-sites-reviews": "AI 动漫",
  "asian-ai-porn-sites-reviews": "AI 亚洲",
  "ai-erotic-story-generators-reviews": "AI 情色故事",
  "ai-trans-porn-sites-reviews": "AI 变性",
  "ebony-ai-porn-sites-reviews": "AI 黑人",
  "latina-ai-porn-sites-reviews": "AI 拉丁",
  "arab-ai-porn-sites-reviews": "AI 阿拉伯",
  "indian-ai-porn-sites-reviews": "AI 印度",
  "ar-porn-sites-reviews": "AR 色情",
  "hentai-porn-sites": "动漫色情",
  "hentai-streaming-sites": "动漫流媒体",
  "hentai-manga-sites": "动漫漫画",
  "best-premium-hentai-sites": "付费动漫",
  "premium-hentai-manga-sites": "付费动漫漫画",
  "manhwa-hentai-sites": "韩漫",
  "cartoon-porn-sites": "卡通色情",
  "premium-cartoon-porn-sites": "付费卡通",
  "3d-porn-sites": "3D 色情",
  "best-porn-comic-sites": "色情漫画",
  "premium-porn-comic-sites": "付费漫画",
  "onlyfans-porn-sites": "OnlyFans",
  "free-onlyfans-accounts": "免费 OnlyFans",
  "premium-onlyfans-account": "付费 OnlyFans",
  "premium-onlyfans-sites": "OnlyFans 平台",
  "sites-like-onlyfans-reviews": "类 OnlyFans",
  "best-onlyfans-girls-list": "OnlyFans 女孩",
  "best-fansly-girls-list-reviews": "Fansly 女孩",
  "best-loyalfans-girls-list-reviews": "LoyalFans 女孩",
  "best-mym-creators-reviews": "MYM 创作者",
  "best-f2f-girls-list-reviews": "F2F 女孩",
  "best-sextpanther-models-list-reviews": "SextPanther 模特",
  "twitter-porn-creators-reviews": "Twitter 创作者",
  "amateur-premium-sites": "业余付费",
  "top-amateur-porn-sites": "业余色情",
  "teen-porn-sites": "青少年色情",
  "teen-porn-premium-sites": "付费青少年",
  "mature-porn-sites": "熟女色情",
  "mature-porn-premium-sites": "付费熟女",
  "granny-porn-sites": "老年色情",
  "premium-granny-porn-sites": "付费老年",
  "best-lesbian-porn-sites": "女同色情",
  "lesbian-porn-premium-sites": "付费女同",
  "best-shemale-porn-sites": "变性色情",
  "shemale-porn-premium-sites": "付费变性",
  "trans-vr-porn-sites-reviews": "变性 VR",
  "best-gay-porn-sites": "男同色情",
  "anal-porn-sites": "肛交色情",
  "anal-porn-premium-sites": "付费肛交",
  "bbw-porn-sites": "BBW 色情",
  "premium-bbw-porn-sites": "付费 BBW",
  "big-tits-porn-sites": "大胸色情",
  "premium-big-tits-sites": "付费大胸",
  "feet-porn-sites-reviews": "恋足色情",
  "cosplay-porn-sites-reviews": "Cosplay",
  "massage-porn-sites-reviews": "按摩色情",
  "casting-porn-sites-reviews": "选角色情",
  "hairy-pussy-porn-sites-reviews": "毛茸色情",
  "pregnant-porn-sites-reviews": "孕妇色情",
  "goth-porn-sites-reviews": "哥特色情",
  "midget-porn-sites-reviews": "侏儒色情",
  "fisting-porn-sites-reviews": "拳交色情",
  "hypno-porn-sites-reviews": "催眠色情",
  "czech-porn-sites-reviews": "捷克色情",
  "german-porn-sites-reviews": "德国色情",
  "thai-porn-sites-reviews": "泰国色情",
  "interactive-porn-sites-reviews": "互动色情",
  "teacher-porn-sites-reviews": "教师色情",
  "pov-porn-sites": "POV 色情",
  "premium-pov-porn-sites": "付费 POV",
  "taboo-porn-sites": "禁忌色情",
  "taboo-porn-premium-sites": "付费禁忌",
  "interracial-porn-sites": "跨种族色情",
  "premium-interracial-porn-sites": "付费跨种族",
  "cuckold-porn-sites": "绿帽色情",
  "premium-cuckold-porn-sites": "付费绿帽",
  "gangbang-porn-sites": "群交色情",
  "premium-gangbang-porn-sites": "付费群交",
  "blowjob-porn-sites": "口交色情",
  "premium-blowjob-porn-sites": "付费口交",
  "handjob-porn-sites": "手交色情",
  "premium-handjob-porn-sites": "付费手交",
  "creampie-porn-sites": "内射色情",
  "premium-creampie-porn-sites": "付费内射",
  "facial-cumshot-porn-sites": "颜射色情",
  "premium-facial-cumshot-porn-sites": "付费颜射",
  "female-masturbation-porn-sites": "女性自慰",
  "premium-female-masturbation-porn-sites": "付费女性自慰",
  "voyeur-porn-sites": "偷窥色情",
  "premium-voyeur-porn-sites": "付费偷窥",
  "extreme-porn-websites": "极端色情",
  "premium-extreme-porn-sites": "付费极端",
  "asmr-porn-sites": "ASMR 色情",
  "premium-asmr-porn-sites": "付费 ASMR",
  "top-fetish-porn-tube-sites": "恋物管站",
  "fetish-porn-premium-sites": "付费恋物",
  "top-scat-porn-tube-sites": "排泄管站",
  "scat-and-piss-premium-porn": "付费排泄",
  "top-asian-porn-tube-sites": "亚洲管站",
  "asian-porn-premium-sites": "付费亚洲",
  "top-asian-sex-cams": "亚洲直播",
  "top-ebony-porn-tube-sites": "黑人管站",
  "ebony-porn-premium-sites": "付费黑人",
  "live-ebony-sex-cams": "黑人直播",
  "top-arab-porn-tube-sites": "阿拉伯管站",
  "arab-porn-premium-sites": "付费阿拉伯",
  "arab-sex-cams": "阿拉伯直播",
  "top-indian-porn-tube-sites": "印度管站",
  "indian-porn-premium-sites": "付费印度",
  "live-indian-sex-cams": "印度直播",
  "top-latin-porn-tube-sites": "拉丁管站",
  "latin-porn-premium-sites": "付费拉丁",
  "live-latina-sex-cams": "拉丁直播",
  "live-trans-sex-cams": "变性直播",
  "live-bdsm-sex-cams": "BDSM 直播",
  "live-squirt-cams": "潮吹直播",
  "live-bbw-sex-cams": "BBW 直播",
  "live-mature-sex-cams": "熟女直播",
  "live-teen-sex-cams": "青少年直播",
  "live-granny-sex-cams": "老年直播",
  "live-anal-sex-cams": "肛交直播",
  "live-voyeur-cams-sites": "偷窥直播",
  "free-cam-girl-video-sites": "免费直播录像",
  "porn-picture-sites": "色情图片",
  "premium-porn-pictures-sites": "付费图片",
  "best-gif-porn-sites": "GIF 色情",
  "full-porn-movies-sites": "完整影片",
  "adult-vod-sites": "成人点播",
  "deepfake-porn-sites": "Deepfake",
  "tiktok-porn-sites": "TikTok 色情",
  "porn-for-women": "女性向色情",
  "premium-porn-for-women-sites": "付费女性向",
  "the-fappening": "明星泄露",
  "premium-nude-celebrities": "付费明星裸照",
  "nude-celebrities-list": "明星裸照列表",
  "best-erotic-stories-sites": "情色故事",
  "best-adult-chat-sites": "成人聊天",
  "phone-sex-sites": "电话性爱",
  "best-porn-forums": "色情论坛",
  "best-funny-porn-sites": "搞笑色情",
  "best-vintage-porn-sites": "复古色情",
  "vintage-porn-premium-sites": "付费复古",
  "porn-parody-premium-sites": "付费恶搞",
  "popular-porn-blog": "色情博客",
  "porn-review-sites": "色情评测",
  "best-porn-tgp-sites": "TGP 站点",
  "free-porn-download-sites": "色情下载",
  "top-porn-torrents-sites": "色情种子",
  "porn-aggregators": "色情聚合",
  "top-porn-search-engines": "色情搜索",
  "best-nsfw-reddit-sites": "NSFW Reddit",
  "best-pornstars-list": "女优列表",
  "best-porn-channels": "色情频道",
  "top-pornstar-directories": "女优目录",
  "best-escort-sites": "伴游网站",
  "erotic-massage-sites": "情色按摩",
  "best-fleshlights-reviews": "飞机杯评测",
  "best-sex-toys-for-men-reviews": "男性玩具",
  "buy-used-panties": "二手内裤",
  "sex-doll-shops": "充气娃娃",
  "best-adult-online-shops": "成人商店",
  "male-enhancement-pills": "男性增强",
  "best-vpn-sites": "VPN 推荐",
  "useful-software": "实用软件",
  "how-to-become-a-cam-girl": "直播入门",
  "make-money-with-porn": "色情赚钱",
  "betting-sites": "博彩网站",
  "other-porn-categories": "其他分类",
};

interface CategoryMap {
  // siteId (numeric) -> category slug
  [siteId: string]: string[];
}

async function fetchCategoryPage(slug: string): Promise<string[]> {
  const url = `${BASE}/${slug}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return [];
    const html = await res.text();
    // Extract /数字ID/站点名 links
    const matches = html.matchAll(/href="https:\/\/theporndude\.com\/(\d+)\/([^"]+)"/g);
    const ids = new Set<string>();
    for (const m of matches) {
      ids.add(m[1]);
    }
    return [...ids];
  } catch {
    return [];
  }
}

export async function buildCategoryMap(cachePath: string): Promise<Map<string, string>> {
  // Try loading cache first
  try {
    const file = Bun.file(cachePath);
    if (await file.exists()) {
      const cached = await file.json() as { map: Record<string, string>; date: string };
      const today = new Date().toISOString().split("T")[0];
      if (cached.date === today) {
        console.log(`[categories] Using cached category map (${Object.keys(cached.map).length} entries)`);
        return new Map(Object.entries(cached.map));
      }
    }
  } catch {}

  console.log(`[categories] Building category map from ${Object.keys(CATEGORY_LABELS).length} category pages...`);

  // siteId -> first category slug found
  const siteToCategory = new Map<string, string>();
  const slugs = Object.keys(CATEGORY_LABELS);

  // Fetch in batches of 5 to avoid hammering
  const BATCH = 5;
  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async (slug) => {
      const ids = await fetchCategoryPage(slug);
      return { slug, ids };
    }));

    for (const { slug, ids } of results) {
      for (const id of ids) {
        if (!siteToCategory.has(id)) {
          siteToCategory.set(id, slug);
        }
      }
    }

    if (i + BATCH < slugs.length) {
      await Bun.sleep(300); // polite delay
    }
    const done = Math.min(i + BATCH, slugs.length);
    process.stdout.write(`\r[categories] Fetched ${done}/${slugs.length} category pages`);
  }
  console.log("");

  console.log(`[categories] Mapped ${siteToCategory.size} sites to categories`);

  // Save cache
  const cacheData = {
    date: new Date().toISOString().split("T")[0],
    map: Object.fromEntries(siteToCategory),
  };
  await Bun.write(cachePath, JSON.stringify(cacheData));

  return siteToCategory;
}

/**
 * Given a URL like https://theporndude.com/5759/sitename,
 * look up its category from the map using the numeric ID.
 * Returns the Chinese label.
 */
export function getCategoryForUrl(url: string, categoryMap: Map<string, string>): string | null {
  try {
    const segments = new URL(url).pathname.split("/").filter(Boolean);
    if (segments.length >= 1 && /^\d+$/.test(segments[0])) {
      const slug = categoryMap.get(segments[0]);
      if (slug) return CATEGORY_LABELS[slug] || slug;
    }
    return null;
  } catch {
    return null;
  }
}

/** Get all unique category labels that exist in the map */
export function getAllCategoryLabels(categoryMap: Map<string, string>): string[] {
  const slugs = new Set(categoryMap.values());
  const labels: string[] = [];
  for (const slug of slugs) {
    const label = CATEGORY_LABELS[slug];
    if (label) labels.push(label);
  }
  return labels.sort();
}
