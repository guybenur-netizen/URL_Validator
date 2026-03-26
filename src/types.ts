export enum Severity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum CheckStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARN = 'WARN',
}

export interface CheckResult {
  id: string;
  name: string;
  category: string;
  severity: Severity;
  status: CheckStatus;
  passed: boolean;
  details: string;
  duration: number;
}

export interface ComplianceReport {
  url: string;
  device: string;
  timestamp: string;
  executionTime: number;
  checks: CheckResult[];
  totalScore: number;
  maxScore: number;
  percentage: number;
  verdict: 'APPROVED' | 'CONDITIONAL' | 'NEEDS_WORK' | 'REJECTED';
}
