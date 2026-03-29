import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const urls = sqliteTable("urls", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  url: text("url").notNull().unique(),
  urlHash: text("url_hash").notNull().unique(),
  firstSeen: text("first_seen").notNull(),
  category: text("category"),
});
