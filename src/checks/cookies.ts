import { CheckResult, Severity, CheckStatus } from '../types';

export async function runCookieChecks(url: string, device: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  try {
    const response = await fetch(url, { redirect: 'follow' });
    const setCookieHeaders = response.headers.getSetCookie ? response.headers.getSetCookie() : [];

    results.push(cookieInventory(setCookieHeaders));
    results.push(cookieCount(setCookieHeaders));
    results.push(cookieSize(setCookieHeaders));
    results.push(cookieAttributes(setCookieHeaders));

  } catch (err: any) {
    results.push({
      id: 'COOK-01',
      name: 'Cookie Inventory',
      category: 'Cookies & Consent',
      severity: Severity.HIGH,
      status: CheckStatus.WARN,
      passed: false,
      details: `Could not analyze cookies: ${err.message}`,
      duration: 0,
    });
  }

  return results;
}

function cookieInventory(cookies: string[]): CheckResult {
  const start = Date.now();
  if (cookies.length === 0) {
    return {
      id: 'COOK-01',
      name: 'Cookie Inventory',
      category: 'Cookies & Consent',
      severity: Severity.HIGH,
      status: CheckStatus.PASS,
      passed: true,
      details: 'No cookies set on initial page load. This is ideal for consent compliance.',
      duration: Date.now() - start,
    };
  }

  const cookieNames = cookies.map((c) => c.split('=')[0].trim());
  return {
    id: 'COOK-01',
    name: 'Cookie Inventory',
    category: 'Cookies & Consent',
    severity: Severity.HIGH,
    status: CheckStatus.WARN,
    passed: false,
    details: `${cookies.length} cookie(s) set on initial load BEFORE any user consent: ${cookieNames.join(', ')}. Verify these are all strictly necessary cookies.`,
    duration: Date.now() - start,
  };
}

function cookieCount(cookies: string[]): CheckResult {
  const start = Date.now();
  const count = cookies.length;
  const passed = count < 20;

  return {
    id: 'COOK-04',
    name: 'Cookie Count',
    category: 'Cookies & Consent',
    severity: Severity.MEDIUM,
    status: passed ? CheckStatus.PASS : CheckStatus.FAIL,
    passed,
    details: passed
      ? `${count} cookie(s) found. Within the limit of 20.`
      : `${count} cookies found. Exceeds recommended limit of 20. Reduce unnecessary cookies.`,
    duration: Date.now() - start,
  };
}

function cookieSize(cookies: string[]): CheckResult {
  const start = Date.now();
  const oversized = cookies.filter((c) => c.length > 4096);
  const passed = oversized.length === 0;

  return {
    id: 'COOK-05',
    name: 'Cookie Size',
    category: 'Cookies & Consent',
    severity: Severity.MEDIUM,
    status: passed ? CheckStatus.PASS : CheckStatus.WARN,
    passed,
    details: passed
      ? `All cookies are within the 4KB size limit.`
      : `${oversized.length} cookie(s) exceed the 4KB size limit. Large cookies slow down every request.`,
    duration: Date.now() - start,
  };
}

function cookieAttributes(cookies: string[]): CheckResult {
  const start = Date.now();
  if (cookies.length === 0) {
    return {
      id: 'COOK-03',
      name: 'Cookie Security Attributes',
      category: 'Cookies & Consent',
      severity: Severity.MEDIUM,
      status: CheckStatus.PASS,
      passed: true,
      details: 'No cookies to check.',
      duration: Date.now() - start,
    };
  }

  const issues: string[] = [];
  for (const cookie of cookies) {
    const name = cookie.split('=')[0].trim();
    const lower = cookie.toLowerCase();
    if (!lower.includes('secure')) {
      issues.push(`${name}: missing Secure flag`);
    }
    if (!lower.includes('samesite')) {
      issues.push(`${name}: missing SameSite attribute`);
    }
  }

  const passed = issues.length === 0;
  return {
    id: 'COOK-03',
    name: 'Cookie Security Attributes',
    category: 'Cookies & Consent',
    severity: Severity.MEDIUM,
    status: passed ? CheckStatus.PASS : CheckStatus.WARN,
    passed,
    details: passed
      ? 'All cookies have Secure and SameSite attributes set.'
      : `Cookie attribute issues found: ${issues.join('; ')}`,
    duration: Date.now() - start,
  };
}
