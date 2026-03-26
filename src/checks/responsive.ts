import { CheckResult, Severity, CheckStatus } from '../types';

export async function runResponsiveChecks(url: string, device: string): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // Fetch the HTML once and reuse it
  let html = '';
  try {
    const response = await fetch(url, { redirect: 'follow' });
    html = await response.text();
  } catch (err: any) {
    return [{
      id: 'RESP-01',
      name: 'Viewport Meta Tag',
      category: 'Responsive',
      severity: Severity.HIGH,
      status: CheckStatus.FAIL,
      passed: false,
      details: `Could not fetch page HTML: ${err.message}`,
      duration: 0,
    }];
  }

  // RESP-01: Viewport Meta Tag
  results.push(checkViewportMeta(html));

  // RESP-06: Font Size Check (basic)
  results.push(checkFontDeclarations(html));

  // RESP-02: Fixed Width Elements (basic HTML scan)
  results.push(checkFixedWidths(html));

  return results;
}

function checkViewportMeta(html: string): CheckResult {
  const start = Date.now();
  const hasViewport = /meta\s+[^>]*name\s*=\s*["']viewport["']/i.test(html);
  const hasWidthDevice = /width\s*=\s*device-width/i.test(html);
  const passed = hasViewport && hasWidthDevice;

  return {
    id: 'RESP-01',
    name: 'Viewport Meta Tag',
    category: 'Responsive',
    severity: Severity.HIGH,
    status: passed ? CheckStatus.PASS : CheckStatus.FAIL,
    passed,
    details: passed
      ? 'Viewport meta tag found with width=device-width. Page is configured for mobile rendering.'
      : hasViewport
        ? 'Viewport meta tag found but missing width=device-width. Add: <meta name="viewport" content="width=device-width, initial-scale=1">'
        : 'No viewport meta tag found. Page will not render correctly on mobile. Add: <meta name="viewport" content="width=device-width, initial-scale=1">',
    duration: Date.now() - start,
  };
}

function checkFontDeclarations(html: string): CheckResult {
  const start = Date.now();
  // Look for very small font sizes in inline styles
  const smallFonts = html.match(/font-size\s*:\s*(\d+)\s*px/gi) || [];
  const tooSmall = smallFonts.filter((match) => {
    const size = parseInt(match.replace(/[^0-9]/g, ''), 10);
    return size > 0 && size < 14;
  });

  const passed = tooSmall.length === 0;
  return {
    id: 'RESP-06',
    name: 'Font Legibility',
    category: 'Responsive',
    severity: Severity.MEDIUM,
    status: passed ? CheckStatus.PASS : CheckStatus.WARN,
    passed,
    details: passed
      ? `No inline font sizes below 14px detected. (Note: full CSS analysis requires browser-based testing)`
      : `Found ${tooSmall.length} inline font declaration(s) below 14px: ${tooSmall.slice(0, 3).join(', ')}. Minimum recommended size is 14px for mobile readability.`,
    duration: Date.now() - start,
  };
}

function checkFixedWidths(html: string): CheckResult {
  const start = Date.now();
  // Look for large fixed pixel widths in inline styles that could break mobile
  const fixedWidths = html.match(/width\s*:\s*(\d+)\s*px/gi) || [];
  const tooWide = fixedWidths.filter((match) => {
    const width = parseInt(match.replace(/[^0-9]/g, ''), 10);
    return width > 500;
  });

  const passed = tooWide.length === 0;
  return {
    id: 'RESP-05',
    name: 'No Fixed-Width Elements',
    category: 'Responsive',
    severity: Severity.MEDIUM,
    status: passed ? CheckStatus.PASS : CheckStatus.WARN,
    passed,
    details: passed
      ? 'No large fixed-width inline styles detected. (Note: full layout analysis requires browser-based testing)'
      : `Found ${tooWide.length} inline style(s) with width > 500px which may break mobile layout: ${tooWide.slice(0, 3).join(', ')}`,
    duration: Date.now() - start,
  };
}
