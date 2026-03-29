export interface UrlInfo {
  url: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string | null;
}

export interface HistoryEntry {
  date: string;
  count: number;
  urls: UrlInfo[];
}

export interface HistoryData {
  lastUpdated: string;
  totalTracked: number;
  entries: HistoryEntry[];
}

export async function updateHistory(
  historyPath: string,
  newUrls: UrlInfo[],
  today: string,
): Promise<void> {
  let data: HistoryData;

  try {
    const file = Bun.file(historyPath);
    if (await file.exists()) {
      data = await file.json();
    } else {
      data = { lastUpdated: today, totalTracked: 0, entries: [] };
    }
  } catch {
    data = { lastUpdated: today, totalTracked: 0, entries: [] };
  }

  if (newUrls.length > 0) {
    // Remove existing entry for today if re-running
    data.entries = data.entries.filter((e) => e.date !== today);

    data.entries.unshift({
      date: today,
      count: newUrls.length,
      urls: newUrls,
    });
  }

  // Sort descending by date
  data.entries.sort((a, b) => b.date.localeCompare(a.date));
  data.lastUpdated = today;
  data.totalTracked = data.entries.reduce((sum, e) => sum + e.count, 0);

  await Bun.write(historyPath, JSON.stringify(data, null, 2));
  console.log(`[reporter] Updated ${historyPath} — ${newUrls.length} new URLs today, ${data.totalTracked} total tracked`);
}
