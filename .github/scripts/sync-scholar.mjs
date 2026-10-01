import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Source of identity: the actual Google Scholar hyperlink in the supplied CV.
const AUTHOR_ID = 'GvFbddQAAAAJ';
const AUTHOR_NAME = 'Syed Mosaddik Hossain Ifty';
const PROFILE_URL = `https://scholar.google.com/citations?user=${AUTHOR_ID}&hl=en`;
const OUTPUT_FILE = 'site/data/scholar-citations.json';

export function verifiedCitationResult(result, checkedAt = new Date()) {
  const authorId = result?.search_parameters?.author_id;
  const authorName = result?.author?.name?.trim();
  const table = result?.cited_by?.table;
  const citations = Array.isArray(table)
    ? table.find(row => row && Object.hasOwn(row, 'citations'))?.citations?.all
    : null;

  if (result?.error || result?.search_metadata?.status !== 'Success') {
    throw new Error('Scholar provider did not return a successful author result');
  }
  if (authorId !== AUTHOR_ID || authorName?.toLowerCase() !== AUTHOR_NAME.toLowerCase()) {
    throw new Error('Scholar author identity did not match the verified CV link');
  }
  if (!Number.isSafeInteger(citations) || citations < 0 || citations > 10_000_000) {
    throw new Error('Scholar citation total was missing or invalid');
  }

  return {
    citations,
    checked_at: checkedAt.toISOString(),
    profile_url: PROFILE_URL,
  };
}

export async function syncScholar({ key = process.env.SERPAPI_KEY, outputFile = OUTPUT_FILE } = {}) {
  if (!key) throw new Error('SERPAPI_KEY is missing. Add it as a repository Actions secret.');

  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google_scholar_author');
  url.searchParams.set('author_id', AUTHOR_ID);
  url.searchParams.set('hl', 'en');
  url.searchParams.set('no_cache', 'true');
  url.searchParams.set('api_key', key);

  // Never log the URL: it contains the secret key.
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Scholar provider returned HTTP ${response.status}`);

  const verified = verifiedCitationResult(await response.json());
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, `${JSON.stringify(verified, null, 2)}\n`, 'utf8');
  console.info(`Scholar citation profile verified at ${verified.checked_at}`);
  return verified;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  syncScholar().catch(error => {
    // An error leaves the previous verified JSON untouched and stops deployment.
    console.error(error.message);
    process.exitCode = 1;
  });
}
