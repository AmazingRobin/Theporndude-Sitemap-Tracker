const UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const BASE = "https://theporndude.com";
const MAX_RETRIES = 3;

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });

    if (res.ok) {
      const text = await res.text();
      if (!text.includes("<urlset") && !text.includes("<?xml") && !text.includes("Sitemap:") && !text.includes("User-agent")) {
        throw new Error(`Response from ${url} is not XML/robots.txt — likely a Cloudflare challenge page`);
      }
      return text;
    }

    if ((res.status === 429 || res.status === 503) && i < retries) {
      const delay = Math.pow(2, i) * 1000;
      console.warn(`[fetcher] ${res.status} from ${url}, retrying in ${delay}ms (${i + 1}/${retries})`);
      await Bun.sleep(delay);
      continue;
    }

    throw new Error(`[fetcher] HTTP ${res.status} from ${url} after ${i + 1} attempt(s)`);
  }
  throw new Error(`[fetcher] Exhausted retries for ${url}`);
}

export async function fetchSitemapUrl(): Promise<string> {
  try {
    const robotsTxt = await fetchWithRetry(`${BASE}/robots.txt`);
    for (const line of robotsTxt.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith("sitemap:")) {
        const url = trimmed.slice("sitemap:".length).trim();
        if (url) {
          console.log(`[fetcher] Found sitemap in robots.txt: ${url}`);
          return url;
        }
      }
    }
  } catch (e) {
    console.warn(`[fetcher] Failed to fetch robots.txt, using default sitemap URL:`, e);
  }
  const fallback = `${BASE}/sitemap.xml`;
  console.log(`[fetcher] Using fallback sitemap URL: ${fallback}`);
  return fallback;
}

export async function fetchSitemapXml(url: string): Promise<string> {
  console.log(`[fetcher] Downloading sitemap: ${url}`);
  const xml = await fetchWithRetry(url);
  console.log(`[fetcher] Downloaded ${(xml.length / 1024).toFixed(1)} KB`);
  return xml;
}
