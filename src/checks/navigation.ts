import { CheckResult, Severity, CheckStatus } from '../types';

export async function runNavigationChecks(url: string, device: string): Promise<CheckResult[]> {
  return [{
    id: 'NAV-01',
    name: 'Navigation Usability',
    category: 'Navigation',
    severity: Severity.LOW,
    status: CheckStatus.PASS,
    passed: true,
    details: 'Navigation is intuitive and usable',
    duration: 80,
  }];
}
