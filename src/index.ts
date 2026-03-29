import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { sql } from "drizzle-orm";
import { fetchSitemapUrl, fetchSitemapXml } from "./fetcher";
import { parseSitemap } from "./parser";
import { findAndStoreNewUrls } from "./differ";
import { updateHistory } from "./reporter";
import { urls } from "../db/schema";

const DB_PATH = "data/tracker.db";
const HISTORY_PATH = "public/history.json";

async function main() {
  const today = new Date().toISOString().split("T")[0];
  console.log(`\n=== Sitemap-New-Tracker [${today}] ===\n`);

  // 1. Init DB
  const sqlite = new Database(DB_PATH, { create: true });
  sqlite.run("PRAGMA journal_mode = WAL;");
  const db = drizzle(sqlite);

  // 2. Run migrations
  migrate(db, { migrationsFolder: "./drizzle" });

  try {
    // 3. Fetch sitemap
    const sitemapUrl = await fetchSitemapUrl();
    const xml = await fetchSitemapXml(sitemapUrl);

    // 4. Parse
    const entries = parseSitemap(xml);
    if (entries.length === 0) {
      console.log("[main] No entries parsed, exiting.");
      return;
    }

    // 5. Diff & store
    const newUrls = findAndStoreNewUrls(db, entries, today);

    // 6. Get total count
    const [{ count }] = db.select({ count: sql<number>`count(*)` }).from(urls).all();

    // 7. Update history
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
