import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { sql } from "drizzle-orm";
import { fetchSitemapUrl, fetchSitemapXml } from "./fetcher";
import { parseSitemap } from "./parser";
import { findAndStoreNewUrls } from "./differ";
import { updateHistory } from "./reporter";
import { buildCategoryMap } from "./categories";
import { buildSiteCatalog } from "./catalog";
import { urls } from "../db/schema";

const DB_PATH = "data/tracker.db";
const HISTORY_PATH = "public/history.json";
const CATEGORY_CACHE_PATH = "data/categories.json";
const CATALOG_PATH = "public/sites.json";

async function main() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`\n=== Sitemap-New-Tracker [${today}] ===\n`);

  const sqlite = new Database(DB_PATH, { create: true });
  sqlite.run("PRAGMA journal_mode = WAL;");
  const db = drizzle(sqlite);

  migrate(db, { migrationsFolder: "./drizzle" });

  try {
    // Build category map
    const categoryMap = await buildCategoryMap(CATEGORY_CACHE_PATH);

    // Build site catalog (cached per day)
    await buildSiteCatalog(CATALOG_PATH);

    // Fetch sitemap
    const sitemapUrl = await fetchSitemapUrl();
    const xml = await fetchSitemapXml(sitemapUrl);

    const entries = parseSitemap(xml);
    if (entries.length === 0) {
      console.log("[main] No entries parsed, exiting.");
      return;
    }

    const newUrls = await findAndStoreNewUrls(db, entries, today, categoryMap);

    const [{ count }] = db.select({ count: sql<number>`count(*)` }).from(urls).all();

    await updateHistory(HISTORY_PATH, newUrls, today);

    console.log(`\n[main] Done — ${newUrls.length} new, ${count} total in DB\n`);
  } finally {
    sqlite.close();
  }
}

main().catch((err) => {
  console.error("[main] Fatal error:", err);
  process.exit(1);
});
