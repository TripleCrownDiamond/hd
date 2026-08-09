/**
 * Shared HTTP fetcher for scraping.
 * - Respects robots.txt (fetched once per origin)
 * - Rate-limits per origin (default 1 req / 3 s)
 * - Retries with exponential backoff on 429/503
 * - Disk cache (24 h) at data/scraped/<source>/_cache/<sha256(url)>
 */

import { fetch } from "undici";
import robotsParser from "robots-parser";
import PQueue from "p-queue";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname } from "node:path";

const USER_AGENT = "HOLZKRAFT-Catalog-Bot/1.0 (contact@holzkraft.de)";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_INTERVAL_MS = 3000;

const originQueues = new Map();
const robotsCache = new Map();

function originOf(url) {
  return new URL(url).origin;
}

function sha256(s) {
  return createHash("sha256").update(s).digest("hex");
}

function getQueueFor(origin, intervalMs) {
  if (!originQueues.has(origin)) {
    originQueues.set(
      origin,
      // Start at most one request per interval while allowing slow responses to
      // finish concurrently. This preserves the documented request rate.
      new PQueue({ concurrency: 4, interval: intervalMs, intervalCap: 1 }),
    );
  }
  return originQueues.get(origin);
}

async function loadRobots(origin) {
  if (robotsCache.has(origin)) return robotsCache.get(origin);
  const url = `${origin}/robots.txt`;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      redirect: "follow",
    });
    const body = await res.text();
    const parser = robotsParser(url, body);
    robotsCache.set(origin, parser);
    return parser;
  } catch {
    const parser = robotsParser(url, "User-agent: *\nAllow: /");
    robotsCache.set(origin, parser);
    return parser;
  }
}

async function readCache(cacheDir, cacheKey) {
  if (!cacheDir) return null;
  const path = `${cacheDir}/${sha256(cacheKey)}`;
  if (!existsSync(path)) return null;
  const st = await stat(path);
  if (Date.now() - st.mtimeMs > CACHE_TTL_MS) return null;
  return readFile(path, "utf8");
}

async function writeCache(cacheDir, cacheKey, body) {
  if (!cacheDir) return;
  const path = `${cacheDir}/${sha256(cacheKey)}`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body);
}

/**
 * Fetch a URL with all safety mechanisms applied.
 *
 * @param {string} url
 * @param {object} [options]
 * @param {string} [options.cacheDir] disable caching by passing null
 * @param {number} [options.intervalMs] override the per-origin interval
 * @param {number} [options.maxAttempts=4]
 * @param {'text'|'buffer'} [options.as='text']
 * @param {boolean} [options.checkRobots=true]
 * @param {'GET'|'POST'} [options.method='GET']
 * @param {string} [options.requestBody]
 * @param {Record<string,string>} [options.headers]
 * @param {string} [options.cacheKey]
 * @returns {Promise<{status:number,body:string|Buffer,fromCache:boolean,headers:object}>}
 */
export async function fetchUrl(url, options = {}) {
  const {
    cacheDir,
    intervalMs = DEFAULT_INTERVAL_MS,
    maxAttempts = 4,
    as = "text",
    checkRobots = true,
    method = "GET",
    requestBody,
    headers = {},
    cacheKey = requestBody ? `${url}\n${requestBody}` : url,
  } = options;

  if (checkRobots) {
    const robots = await loadRobots(originOf(url));
    if (!robots.isAllowed(url, USER_AGENT.split("/")[0])) {
      throw new Error(`Disallowed by robots.txt: ${url}`);
    }
  }

  if (as === "text") {
    const cached = await readCache(cacheDir, cacheKey);
    if (cached !== null) {
      return { status: 200, body: cached, fromCache: true, headers: {} };
    }
  }

  const queue = getQueueFor(originOf(url), intervalMs);
  return queue.add(async () => {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempt++;
      try {
        const res = await fetch(url, {
          method,
          body: requestBody,
          headers: {
            "user-agent": USER_AGENT,
            "accept-language": "de-DE,de;q=0.9",
            ...headers,
          },
          redirect: "follow",
        });
        if (res.status === 429 || res.status === 503) {
          if (attempt >= maxAttempts) {
            throw new Error(`HTTP ${res.status} after ${attempt} attempts: ${url}`);
          }
          const backoff = 30_000 * 2 ** (attempt - 1);
          console.warn(`  ${res.status} on ${url} — sleeping ${backoff / 1000}s`);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        if (res.status >= 400) {
          throw new Error(`HTTP ${res.status}: ${url}`);
        }
        const body =
          as === "buffer" ? Buffer.from(await res.arrayBuffer()) : await res.text();
        if (as === "text") await writeCache(cacheDir, cacheKey, body);
        return {
          status: res.status,
          body,
          fromCache: false,
          headers: Object.fromEntries(res.headers.entries()),
        };
      } catch (err) {
        if (attempt >= maxAttempts) throw err;
        const backoff = 5_000 * attempt;
        console.warn(`  error on ${url}: ${err.message} — retrying in ${backoff / 1000}s`);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  });
}

export function contentHash(body) {
  return `sha256:${sha256(body)}`;
}
