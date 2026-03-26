import { CheckResult, Severity, CheckStatus } from '../types';
import * as tls from 'tls';
import * as http from 'http';

export async function runSecurityChecks(url: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const parsedUrl = new URL(url);

  // SEC-01: HTTPS Enforced
  results.push(await checkHttps(parsedUrl));

  // SEC-02: Valid SSL Certificate
  results.push(await checkSSLCert(parsedUrl));

  // SEC-03: TLS Version
  results.push(await checkTLSVersion(parsedUrl));

  // SEC-04: Mixed Content Headers
  results.push(await checkMixedContent(url));

  // SEC-05: Security Headers
  results.push(await checkSecurityHeaders(url));

  // SEC-06: Open Redirects
  results.push(await checkOpenRedirects(url));

  return results;
}

async function checkHttps(parsedUrl: URL): Promise<CheckResult> {
  const start = Date.now();
  try {
    const isHttps = parsedUrl.protocol === 'https:';

    if (!isHttps) {
      return {
        id: 'SEC-01',
        name: 'HTTPS Enforced',
        category: 'Security',
        severity: Severity.CRITICAL,
        status: CheckStatus.FAIL,
        passed: false,
        details: `URL uses ${parsedUrl.protocol} instead of https:. All URLs must be served over HTTPS.`,
        duration: Date.now() - start,
      };
    }

    // Also check if HTTP redirects to HTTPS
    const httpRedirects = await new Promise<boolean>((resolve) => {
      const httpUrl = parsedUrl.href.replace('https://', 'http://');
      const req = http.get(httpUrl, { timeout: 5000 }, (res) => {
        const location = res.headers.location || '';
        resolve(
          res.statusCode !== undefined &&
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          location.startsWith('https://')
        );
        req.destroy();
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    });

    return {
      id: 'SEC-01',
      name: 'HTTPS Enforced',
      category: 'Security',
      severity: Severity.CRITICAL,
      status: CheckStatus.PASS,
      passed: true,
      details: httpRedirects
        ? 'URL uses HTTPS. HTTP correctly redirects to HTTPS.'
        : 'URL uses HTTPS. HTTP redirect could not be confirmed (may be blocked, which is acceptable).',
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      id: 'SEC-01',
      name: 'HTTPS Enforced',
      category: 'Security',
      severity: Severity.CRITICAL,
      status: CheckStatus.WARN,
      passed: parsedUrl.protocol === 'https:',
      details: `HTTPS check partially completed: ${err.message}`,
      duration: Date.now() - start,
    };
  }
}

async function checkSSLCert(parsedUrl: URL): Promise<CheckResult> {
  const start = Date.now();
  return new Promise<CheckResult>((resolve) => {
    try {
      const socket = tls.connect(
        { host: parsedUrl.hostname, port: 443, servername: parsedUrl.hostname, timeout: 10000 },
        () => {
          const cert = socket.getPeerCertificate();
          const authorized = socket.authorized;
          const validTo = new Date(cert.valid_to);
          const daysUntilExpiry = Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          socket.destroy();

          const passed = authorized && daysUntilExpiry > 7;
          resolve({
            id: 'SEC-02',
            name: 'Valid SSL Certificate',
            category: 'Security',
            severity: Severity.CRITICAL,
            status: passed ? CheckStatus.PASS : CheckStatus.FAIL,
            passed,
            details: `Authorized: ${authorized}, Expires: ${validTo.toISOString().slice(0, 10)} (${daysUntilExpiry} days remaining), Issuer: ${cert.issuer?.O || 'Unknown'}`,
            duration: Date.now() - start,
          });
        }
      );
      socket.on('error', (err) => {
        resolve({
          id: 'SEC-02',
          name: 'Valid SSL Certificate',
          category: 'Security',
          severity: Severity.CRITICAL,
          status: CheckStatus.FAIL,
          passed: false,
          details: `SSL connection error: ${err.message}`,
          duration: Date.now() - start,
        });
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          id: 'SEC-02',
          name: 'Valid SSL Certificate',
          category: 'Security',
          severity: Severity.CRITICAL,
          status: CheckStatus.FAIL,
          passed: false,
          details: 'SSL connection timed out after 10 seconds',
          duration: Date.now() - start,
        });
      });
    } catch (err: any) {
      resolve({
        id: 'SEC-02',
        name: 'Valid SSL Certificate',
        category: 'Security',
        severity: Severity.CRITICAL,
        status: CheckStatus.FAIL,
        passed: false,
        details: `SSL check failed: ${err.message}`,
        duration: Date.now() - start,
      });
    }
  });
}

async function checkTLSVersion(parsedUrl: URL): Promise<CheckResult> {
  const start = Date.now();
  return new Promise<CheckResult>((resolve) => {
    try {
      const socket = tls.connect(
        { host: parsedUrl.hostname, port: 443, servername: parsedUrl.hostname, timeout: 10000 },
        () => {
          const protocol = socket.getProtocol();
          socket.destroy();
          const acceptable = ['TLSv1.2', 'TLSv1.3'];
          const passed = protocol !== null && acceptable.includes(protocol);
          resolve({
            id: 'SEC-03',
            name: 'TLS Version >= 1.2',
            category: 'Security',
            severity: Severity.HIGH,
            status: passed ? CheckStatus.PASS : CheckStatus.FAIL,
            passed,
            details: `TLS version: ${protocol || 'unknown'}. ${passed ? 'Meets minimum requirement.' : 'Must use TLS 1.2 or higher.'}`,
            duration: Date.now() - start,
          });
        }
      );
      socket.on('error', (err) => {
        resolve({
          id: 'SEC-03',
          name: 'TLS Version >= 1.2',
          category: 'Security',
          severity: Severity.HIGH,
          status: CheckStatus.WARN,
          passed: false,
          details: `TLS version check error: ${err.message}`,
          duration: Date.now() - start,
        });
      });
    } catch (err: any) {
      resolve({
        id: 'SEC-03',
        name: 'TLS Version >= 1.2',
        category: 'Security',
        severity: Severity.HIGH,
        status: CheckStatus.WARN,
        passed: false,
        details: `TLS check failed: ${err.message}`,
        duration: Date.now() - start,
      });
    }
  });
}

async function checkMixedContent(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const csp = response.headers.get('content-security-policy') || '';
    const hasUpgrade = csp.includes('upgrade-insecure-requests');
    const hasBlock = csp.includes('block-all-mixed-content');
    const passed = hasUpgrade || hasBlock;

    return {
      id: 'SEC-04',
      name: 'Mixed Content Protection',
      category: 'Security',
      severity: Severity.HIGH,
      status: passed ? CheckStatus.PASS : CheckStatus.WARN,
      passed,
      details: passed
        ? `CSP includes ${hasUpgrade ? 'upgrade-insecure-requests' : 'block-all-mixed-content'} directive.`
        : 'No CSP mixed content directives found. Recommend adding: Content-Security-Policy: upgrade-insecure-requests',
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      id: 'SEC-04',
      name: 'Mixed Content Protection',
      category: 'Security',
      severity: Severity.HIGH,
      status: CheckStatus.WARN,
      passed: false,
      details: `Could not check mixed content headers: ${err.message}`,
      duration: Date.now() - start,
    };
  }
}

async function checkSecurityHeaders(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const response = await fetch(url, { redirect: 'follow' });
    const checks = [
      { name: 'Strict-Transport-Security', key: 'strict-transport-security' },
      { name: 'X-Content-Type-Options', key: 'x-content-type-options' },
      { name: 'X-Frame-Options', key: 'x-frame-options' },
    ];

    const present: string[] = [];
    const missing: string[] = [];

    for (const h of checks) {
      const value = response.headers.get(h.key);
      if (value) {
        present.push(`${h.name}: ${value}`);
      } else {
        missing.push(h.name);
      }
    }

    const passed = missing.length === 0;
    return {
      id: 'SEC-05',
      name: 'Security Headers Present',
      category: 'Security',
      severity: Severity.LOW,
      status: passed ? CheckStatus.PASS : CheckStatus.WARN,
      passed,
      details: passed
        ? `All security headers present: ${present.join('; ')}`
        : `Missing: ${missing.join(', ')}. Present: ${present.length > 0 ? present.join('; ') : 'none'}`,
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      id: 'SEC-05',
      name: 'Security Headers Present',
      category: 'Security',
      severity: Severity.LOW,
      status: CheckStatus.WARN,
      passed: false,
      details: `Could not check security headers: ${err.message}`,
      duration: Date.now() - start,
    };
  }
}

async function checkOpenRedirects(url: string): Promise<CheckResult> {
  const start = Date.now();
  try {
    const originalDomain = new URL(url).hostname.replace(/^www\./, '');
    const response = await fetch(url, { redirect: 'follow' });
    const finalDomain = new URL(response.url).hostname.replace(/^www\./, '');
    const passed = finalDomain === originalDomain || finalDomain.endsWith('.' + originalDomain);

    return {
      id: 'SEC-06',
      name: 'No Open Redirects',
      category: 'Security',
      severity: Severity.LOW,
      status: passed ? CheckStatus.PASS : CheckStatus.FAIL,
      passed,
      details: passed
        ? `URL stays on declared domain: ${finalDomain}`
        : `URL redirects to different domain! Original: ${originalDomain}, Final: ${finalDomain}`,
      duration: Date.now() - start,
    };
  } catch (err: any) {
    return {
      id: 'SEC-06',
      name: 'No Open Redirects',
      category: 'Security',
      severity: Severity.LOW,
      status: CheckStatus.WARN,
      passed: false,
      details: `Could not check redirects: ${err.message}`,
      duration: Date.now() - start,
    };
  }
}
