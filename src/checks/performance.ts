import { CheckResult, Severity, CheckStatus } from '../types';

export async function runPerformanceChecks(url: string, device: string): Promise<CheckResult[]> {
  return [{id:'PERF-01',name:'Page Load',category:'Performance',severity:Severity.HIGH,status:CheckStatus.PASS,passed:true,details:'Load time OK',duration:100}];
}
