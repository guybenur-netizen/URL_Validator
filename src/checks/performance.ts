import { CheckResult, Severity, CheckStatus } from '../types';

export async function runPerformanceChecks(url: string, device: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // PERF-01: Page Load Time
  results.push(await checkLoadTime(url));

  // PERF-02: Total Page Weight
  results.push(await checkPageWeight(url));

  // PERF-03: Response Status
  results.push(await checkResponseStatus(url));

  // PERF-09: Compression
  results.push(await checkCompression(url));

  // PERF-10: Cache Headers
  results.push(await checkCacheHeaders(url));

  return results;
}

async function checkLoadTime(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    await fetch(url, { redirect: 'follow' });
    const loadTime = Date.now() - start;
    const passed = loadTime < 2000;

    return {
      id: 'PERF-01',
      name: 'Page Load Time',
      category: 'Performance',
      severity: Severity.HIGH,
      status: passed ? CheckStatus.PASS : CheckStatus.FAIL,
      passed,
      details: `Server responded in ${loadTime}ms. ${passed ? 'Within 2 second threshold.' : 'Exceeds 2 second threshold. Optimize server response time.'}`,
      duration: loadTime,
    };
  } catch (err: any) {
    return {
      id: 'PERF-01',
      name: 'Page Load Time',
      category: 'Performance',
      severity: Severity.HIGH,
      status: CheckStatus.FAIL,
      passed: false,
      details: `Failed to load page: ${err.message}`,
      duration: Date.now() - start,
    };
  }
}

async function checkPageWeight(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const contentLength = response.headers.get('content-length');
    const body = await response.text();
    const size = contentLength ? parseInt(contentLength, 10) : body.length;
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    const passed = size < 5 * 1024 * 1024;

    return {
      id: 'PERF-02',
      name: 'Total Page Weight',
      category: 'Performance',
      severity: Severity.MEDIUM,
      status: passed ? CheckStatus.PASS : CheckStatus.FAIL,
      passed,
      details: `HTML document size: ${sizeMB}MB. ${passed ? 'Within 5MB limit.' : 'Exceeds 5MB limit. Optimize page size.'} (Note: full page weight including assets requires browser-based testing)`,
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      id: 'PERF-02',
      name: 'Total Page Weight',
      category: 'Performance',
      severity: Severity.MEDIUM,
      status: CheckStatus.WARN,
      passed: false,
      details: `Could not measure page weight: ${err.message}`,
      duration: Date.now() - start,
    };
  }
}

async function checkResponseStatus(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const passed = response.ok;

    return {
      id: 'PERF-03',
      name: 'Response Status OK',
      category: 'Performance',
      severity: Severity.HIGH,
      status: passed ? CheckStatus.PASS : CheckStatus.FAIL,
      passed,
      details: `HTTP status: ${response.status} ${response.statusText}. ${passed ? 'Server responds correctly.' : 'Server returned an error status.'}`,
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      id: 'PERF-03',
      name: 'Response Status OK',
      category: 'Performance',
      severity: Severity.HIGH,
      status: CheckStatus.FAIL,
      passed: false,
      details: `Could not reach server: ${err.message}`,
      duration: Date.now() - start,
    };
  }
}

async function checkCompression(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const encoding = response.headers.get('content-encoding') || '';
    const hasCompression = encoding.includes('gzip') || encoding.includes('br') || encoding.includes('deflate');

    return {
      id: 'PERF-09',
      name: 'Compression Enabled',
      category: 'Performance',
      severity: Severity.MEDIUM,
      status: hasCompression ? CheckStatus.PASS : CheckStatus.WARN,
      passed: hasCompression,
      details: hasCompression
        ? `Compression enabled: ${encoding}`
        : 'No compression detected. Enable gzip or Brotli compression to reduce transfer size.',
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      id: 'PERF-09',
      name: 'Compression Enabled',
      category: 'Performance',
      severity: Severity.MEDIUM,
      status: CheckStatus.WARN,
      passed: false,
      details: `Could not check compression: ${err.message}`,
      duration: Date.now() - start,
    };
  }
}

async function checkCacheHeaders(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const cacheControl = response.headers.get('cache-control');
    const etag = response.headers.get('etag');
    const lastModified = response.headers.get('last-modified');
    const hasCache = !!(cacheControl || etag || lastModified);

    const found: string[] = [];
    if (cacheControl) found.push(`Cache-Control: ${cacheControl}`);
    if (etag) found.push(`ETag: ${etag}`);
    if (lastModified) found.push(`Last-Modified: ${lastModified}`);

    return {
      id: 'PERF-10',
      name: 'Cache Headers Present',
      category: 'Performance',
      severity: Severity.MEDIUM,
      status: hasCache ? CheckStatus.PASS : CheckStatus.WARN,
      passed: hasCache,
      details: hasCache
        ? `Cache headers found: ${found.join('; ')}`
        : 'No cache headers found. Add Cache-Control, ETag, or Last-Modified headers for better performance.',
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      id: 'PERF-10',
      name: 'Cache Headers Present',
      category: 'Performance',
      severity: Severity.MEDIUM,
      status: CheckStatus.WARN,
      passed: false,
      details: `Could not check cache headers: ${err.message}`,
      duration: Date.now() - start,
    };
  }
}
