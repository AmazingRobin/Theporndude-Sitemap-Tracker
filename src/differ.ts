import { urls } from "../db/schema";
import type { SitemapEntry } from "./parser";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import { getCategoryForUrl } from "./categories";

export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.protocol = "https:";
    if (u.port === "443" || u.port === "80") u.port = "";
    u.hash = "";
    let path = u.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }
    u.pathname = path;
    return u.toString();
  } catch {
    return raw.trim();
  }
}

function hashUrl(normalized: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(normalized);
  return hasher.digest("hex");
}

export function findAndStoreNewUrls(
  db: BunSQLiteDatabase,
  entries: SitemapEntry[],
  today: string,
  categoryMap: Map<string, string>,
): { url: string; category: string | null }[] {
  // 1. Load existing hashes from DB
  const existingRows = db.select({ urlHash: urls.urlHash }).from(urls).all();
  const existingHashes = new Set(existingRows.map((r) => r.urlHash));

  // 2. Build current URL map
  const currentMap = new Map<string, { url: string; category: string | null }>();
  for (const entry of entries) {
    const normalized = normalizeUrl(entry.loc);
    const hash = hashUrl(normalized);
    if (!currentMap.has(hash)) {
      const category = getCategoryForUrl(normalized, categoryMap);
      currentMap.set(hash, { url: normalized, category });
    }
  }

  // 3. Diff
  const currentHashes = new Set(currentMap.keys());
  let newHashes: Set<string>;
  if (typeof currentHashes.difference === "function") {
    newHashes = currentHashes.difference(existingHashes);
  } else {
    newHashes = new Set([...currentHashes].filter((h) => !existingHashes.has(h)));
  }

  if (newHashes.size === 0) {
    console.log(`[differ] No new URLs found`);
    return [];
  }

  console.log(`[differ] Found ${newHashes.size} new URLs`);

  // 4. Batch insert
  const newEntries: { url: string; category: string | null }[] = [];
  const batch: { url: string; urlHash: string; firstSeen: string; category: string | null }[] = [];

  for (const hash of newHashes) {
    const info = currentMap.get(hash)!;
    batch.push({ url: info.url, urlHash: hash, firstSeen: today, category: info.category });
    newEntries.push({ url: info.url, category: info.category });
  }

  const CHUNK = 500;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const chunk = batch.slice(i, i + CHUNK);
    db.insert(urls).values(chunk).run();
  }

  console.log(`[differ] Inserted ${batch.length} new URLs into DB`);
  return newEntries;
}
