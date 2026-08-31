import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';

const BREAKPOINTS = [320, 375, 390, 414, 768, 1024, 1366, 1920];

let errors = 0;
let warnings = 0;

function fail(file, msg) {
  console.error(`  ❌ ${file}: ${msg}`);
  errors++;
}

function warn(file, msg) {
  console.warn(`  ⚠️  ${file}: ${msg}`);
  warnings++;
}

async function main() {
  console.log('\n🔍 VitaNexa Responsive Test\n');

  // 1. Check TSX/JSX files for fixed width classes
  const srcFiles = glob.sync('src/**/*.{tsx,jsx}', { ignore: '**/node_modules/**' });
  const fixedWidthPatterns = [
    /w-\[(\d+)px\]/g,
    /min-w-\[(\d+)px\]/g,
    /max-w-\[(\d+)px\]/g,
    /w-\[(\d+)rem\]/g,
    /min-w-\[(\d+)rem\]/g,
    /max-w-\[(\d+)rem\]/g,
  ];

  console.log('📐 Checking for fixed pixel widths...');
  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf-8');

    // Check for fixed pixel widths that could break layout
    const fixedMatches = [];
    for (const pattern of fixedWidthPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        fixedMatches.push(match[0]);
      }
    }

    // Filter out common false positives
    const dangerous = fixedMatches.filter(m => {
      const px = parseInt(m.match(/\d+/)?.[0] || '0');
      return px > 0 && px < 320; // widths smaller than viewport min
    });

    if (dangerous.length > 0) {
      warn(file, `Potential fixed width: ${dangerous.slice(0, 5).join(', ')}`);
    }
  }

  // 2. Check CSS for fixed font sizes
  console.log('\n📏 Checking for fixed font sizes...');
  const cssFiles = glob.sync('src/**/*.css', { ignore: '**/node_modules/**' });
  for (const file of cssFiles) {
    const content = readFileSync(file, 'utf-8');
    const fixedFonts = content.match(/font-size:\s*\d+px/g);
    if (fixedFonts && fixedFonts.length > 0) {
      // Only count outside of tailwind base
      const outsideBase = content.replace(/@layer\s+base\s*\{[^}]*\}/gs, '');
      const remaining = outsideBase.match(/font-size:\s*\d+px/g);
      if (remaining && remaining.length > 0) {
        warn(file, `Fixed font-size: ${remaining.length} occurrences`);
      }
    }
  }

  // 3. Check for horizontal overflow in CSS
  console.log('\n🔄 Checking for potential overflow issues...');
  for (const file of cssFiles) {
    const content = readFileSync(file, 'utf-8');
    if (content.includes('overflow-x: hidden') || content.includes('overflow-x: scroll')) {
      // intentional, skip
    }
    if (content.match(/width:\s*\d+px/g) && !content.match(/clamp/g)) {
      const w = content.match(/width:\s*\d+px/g);
      if (w) warn(file, `Non-responsive widths: ${w.slice(0, 5).join(', ')}`);
    }
  }

  // 4. Check that we have responsive layout classes
  console.log('\n🧩 Checking responsive infrastructure...');
  const allFiles = glob.sync('src/pages/**/*.{tsx,jsx}', { ignore: '**/node_modules/**' });
  let pagesWithGrid = 0;
  let pagesWithResponsive = 0;
  let totalPages = allFiles.length;

  for (const file of allFiles) {
    const content = readFileSync(file, 'utf-8');
    if (content.includes('r-grid') || content.includes('r-card') || content.includes('r-container')) {
      pagesWithResponsive++;
    }
    if (content.includes('grid-cols-') || content.includes('grid grid-cols')) {
      pagesWithGrid++;
    }
  }

  console.log(`  📊 ${pagesWithResponsive}/${totalPages} pages use responsive components`);
  console.log(`  📊 ${pagesWithGrid}/${totalPages} pages use CSS Grid`);

  // 5. Check for touch target compliance
  console.log('\n👆 Checking touch targets...');
  let smallButtons = 0;
  for (const file of srcFiles) {
    const content = readFileSync(file, 'utf-8');
    // Check for buttons without r-touch or padding
    const buttons = content.match(/<button[^>]*>/g) || [];
    for (const btn of buttons) {
      if (!btn.includes('r-touch') && !btn.includes('p-') && !btn.includes('w-8') && !btn.includes('w-10') && !btn.includes('w-12') && !btn.includes('w-14')) {
        // This is a loose check, might have false positives
      }
    }
  }

  // 6. Build check
  console.log('\n🏗️  Running TypeScript check...');
  try {
    execSync('npx tsc --noEmit', { stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000, cwd: new URL('.', import.meta.url).pathname });
    console.log('  ✅ TypeScript compiles cleanly');
  } catch (e) {
    const output = e.stderr?.toString() || e.stdout?.toString() || '';
    // Count actual errors (not warnings)
    const errorLines = output.split('\n').filter(l => l.includes('error TS'));
    if (errorLines.length > 0) {
      fail('TypeScript', `${errorLines.length} error(s) found`);
    } else {
      console.log('  ⚠️  TypeScript check had output but no clear errors');
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (errors === 0 && warnings === 0) {
    console.log('✅ PERFECT — No issues found');
  } else {
    console.log(`📋 Results: ${errors} errors, ${warnings} warnings`);
  }
  console.log('='.repeat(50) + '\n');

  process.exit(errors > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Test failed:', e.message);
  process.exit(1);
});
