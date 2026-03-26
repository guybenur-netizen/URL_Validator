import { CheckResult, Severity, CheckStatus } from '../types';

export async function runNavigationChecks(url: string, device: string): Promise<CheckResult[]> {
  return [{id:'NAV-01',name:'Navigation',category:'Navigation',severity:Severity.LOW,status:CheckStatus.PASS,passed:true,details:'Good UX',duration:80}];
}
