import { CheckResult, Severity, CheckStatus } from '../types';

export async function runCookieChecks(url: string, device: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  try {
    const response = await fetch(url, { redirect: 'follow' });
    const setCookieHeaders = response.headers.getSetCookie ? response.headers.getSetCookie() : [];

    // COOK-01: Cookie Inventory
    results.push(cookieInventory(setCookieHeaders));

    // COOK-04: Cookie Count
    results.push(cookieCount(setCookieHeaders));

    // COOK-05: Cookie Size
    results.push(cookieSize(setCookieHeaders));

    // COOK-03: Cookie Attributes
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
    details: `$${cookies.length} cookie(s) set on initial load BEFORE any user consent: $${cookieNames.join(', ')}. Verify these are all strictly necessary cookies. Non-essential cookies must not be set before consent.`,
    duration: Date.now() - start,
  };
}

function cookieCount(cookies: string[]): CheckResult {
  const start = Date.now();
  const
