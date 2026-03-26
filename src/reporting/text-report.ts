import { ComplianceReport, CheckStatus, Severity } from '../types';

export function generateTextReport(report: ComplianceReport): string {
  const lines: string[] = [];

  lines.push('═'.repeat(80));
  lines.push('  DAZN SPONSOR URL COMPLIANCE VALIDATOR - COMPLIANCE REPORT');
  lines.push('═'.repeat(80));
  lines.push('');

  lines.push('📋 VALIDATION METADATA');
  lines.push('─'.repeat(80));
  lines.push(`URL:                ${report.url}`);
  lines.push(`Device Profile:     ${report.device}`);
  lines.push(`Validation Date:    ${report.timestamp}`);
  lines.push(`Execution Time:     ${report.executionTime}ms`);
  lines.push(`Total Checks Run:   ${report.checks.length}`);
  lines.push('');

  lines.push('📊 COMPLIANCE SCORE');
  lines.push('─'.repeat(80));
  lines.push(`Verdict:            ${report.verdict.toUpperCase()}`);
  lines.push(`Total Score:        ${report.totalScore}/${report.maxScore} points`);
  lines.push(`Percentage:         ${report.percentage.toFixed(1)}%`);
  lines.push('');

  lines.push('✅ DETAILED CHECK RESULTS');
  lines.push('─'.repeat(80));
  
  report.checks.forEach((check) => {
    const icon = check.passed ? '✅' : '❌';
    lines.push(`${icon} [${check.id}] ${check.name}`);
    lines.push(`   Category:    ${check.category}`);
    lines.push(`   Status:      ${check.status}`);
    lines.push(`   Severity:    ${check.severity}`);
    lines.push(`   Details:     ${check.details}`);
    lines.push('');
  });

  lines.push('═'.repeat(80));

  return lines.join('\n');
}
