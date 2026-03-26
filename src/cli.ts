import { Command } from 'commander';
import { runValidation } from './orchestrator';
import { generateTextReport } from './reporting/text-report';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('dazn-url-validator')
  .description('DAZN Sponsor URL Compliance Validator')
  .requiredOption('--url <url>', 'URL to validate')
  .option('--sponsor <sponsor>', 'Sponsor name', 'Unknown')
  .option('--campaign <campaign>', 'Campaign name', 'Unknown')
  .option('--market <market>', 'Market', 'Global')
  .option('--device <profile>', 'Device profile', 'iphone-14')
  .option('--network <profile>', 'Network profile', '4g')
  .option('--output-dir <dir>', 'Output directory', './reports')
  .parse();

const opts = program.opts();

async function main() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  DAZN Sponsor URL Compliance Validator            ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    if (!fs.existsSync(opts.outputDir)) {
      fs.mkdirSync(opts.outputDir, { recursive: true });
    }

    const startTime = Date.now();
    const report = await runValidation(opts.url, opts.device);
    const executionTime = Date.now() - startTime;

    report.executionTime = executionTime;

    const textReport = generateTextReport(report);
    console.log(textReport);

    const reportPath = path.join(opts.outputDir, `report-${Date.now()}.txt`);
    fs.writeFileSync(reportPath, textReport);
    console.log(`\n✅ Report saved to: ${reportPath}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

main();
