import { CheckResult, ComplianceReport, Severity, CheckStatus } from './types';
import { runSecurityChecks } from './checks/security';
import { runPerformanceChecks } from './checks/performance';
import { runResponsiveChecks } from './checks/responsive';
import { runJavaScriptChecks } from './checks/javascript';
import { runCookieChecks } from './checks/cookies';
import { runTrackingChecks } from './checks/tracking';
import { runAccessibilityChecks } from './checks/accessibility';
import { runNavigationChecks } from './checks/navigation';

export async function runValidation(url: string, device: string): Promise<ComplianceReport> {
  console.log(`\n🚀 Starting validation for ${url} on ${device}\n`);

  const checks: CheckResult[] = [];

  console.log('📡 Running security checks...');
  checks.push(...(await runSecurityChecks(url)));

  console.log('⚡ Running performance checks...');
  checks.push(...(await runPerformanceChecks(url, device)));

  console.log('📱 Running responsive checks...');
  checks.push(...(await runResponsiveChecks(url, device)));

  console.log('⚙️  Running JavaScript checks...');
  checks.push(...(await runJavaScriptChecks(url, device)));

  console.log('🍪 Running cookie checks...');
  checks.push(...(await runCookieChecks(url, device)));

  console.log('🔗 Running tracking checks...');
  checks.push(...(await runTrackingChecks(url, device)));

  console.log('♿ Running accessibility checks...');
  checks.push(...(await runAccessibilityChecks(url, device)));

  console.log('🧭 Running navigation checks...');
  checks.push(...(await runNavigationChecks(url, device)));

  const passedChecks = checks.filter((c) => c.passed).length;
  const totalChecks = checks.length;
  const maxScore = totalChecks * 10;
  const totalScore = passedChecks * 10;
  const percentage = (totalScore / maxScore) * 100;

  let verdict: 'APPROVED' | 'CONDITIONAL' | 'NEEDS_WORK' | 'REJECTED' = 'APPROVED';
  const criticalFailures = checks.filter((c) => !c.passed && c.severity === Severity.CRITICAL);
  
  if (criticalFailures.length > 0) {
    verdict = 'REJECTED';
  } else if (percentage < 60) {
    verdict = 'NEEDS_WORK';
  } else if (percentage < 80) {
    verdict = 'CONDITIONAL';
  }

  const report: ComplianceReport = {
    url,
    device,
    timestamp: new Date().toISOString(),
    executionTime: 0,
    checks,
    totalScore,
    maxScore,
    percentage,
    verdict,
  };

  return report;
}
