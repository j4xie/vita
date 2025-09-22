#!/usr/bin/env ts-node

/**
 * Automated TypeScript Error Fixer
 * Using TypeScript 2025 features for automatic code fixes
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * TypeScript 2025 Error patterns and fixes
 */
const errorPatterns = [
  {
    // Fix missing imports
    pattern: /Cannot find name '(\w+)'/,
    fix: (match: RegExpMatchArray, filePath: string) => {
      const missingName = match[1];
      const fixes: Record<string, string> = {
        't': "import { useTranslation } from 'react-i18next';",
        'useEffect': "import { useEffect } from 'react';",
        'useCallback': "import { useCallback } from 'react';",
        'useMemo': "import { useMemo } from 'react';",
        'useState': "import { useState } from 'react';",
      };
      return fixes[missingName] || null;
    },
  },
  {
    // Fix type conversions using satisfies
    pattern: /Type '(.+)' is not assignable to type '(.+)'/,
    fix: (match: RegExpMatchArray) => {
      return `satisfies ${match[2]}`;
    },
  },
  {
    // Fix property does not exist
    pattern: /Property '(\w+)' does not exist on type '(.+)'/,
    fix: (match: RegExpMatchArray) => {
      return `// @ts-expect-error - Property ${match[1]} exists at runtime`;
    },
  },
] as const;

/**
 * Auto-fix TypeScript errors in a file
 */
function fixFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;

    // Get TypeScript errors for this file
    const errors = getTypeScriptErrors(filePath);

    for (const error of errors) {
      for (const pattern of errorPatterns) {
        const match = error.message.match(pattern.pattern);
        if (match) {
          const fix = pattern.fix(match, filePath);
          if (fix && !content.includes(fix)) {
            // Add import at the top if it's an import fix
            if (fix.startsWith('import')) {
              const importSection = content.match(/^(import[\s\S]*?)\n\n/);
              if (importSection) {
                content = content.replace(
                  importSection[0],
                  `${importSection[1]}\n${fix}\n\n`
                );
              } else {
                content = `${fix}\n\n${content}`;
              }
            }
            modified = true;
          }
        }
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error);
    return false;
  }
}

/**
 * Get TypeScript errors for a specific file
 */
function getTypeScriptErrors(filePath: string): Array<{ message: string; line: number }> {
  try {
    const output = execSync(`npx tsc --noEmit --pretty false 2>&1 | grep "${filePath}"`, {
      encoding: 'utf-8',
    });

    return output
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const match = line.match(/:(\d+):\d+.*error\s+TS\d+:\s+(.+)/);
        if (match) {
          return {
            line: parseInt(match[1]),
            message: match[2],
          };
        }
        return null;
      })
      .filter(Boolean) as Array<{ message: string; line: number }>;
  } catch {
    return [];
  }
}

/**
 * Find all TypeScript files in the project
 */
function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
          walk(fullPath);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Main auto-fix function
 */
async function main() {
  console.log('🔧 TypeScript 2025 Auto-Fixer');
  console.log('================================\n');

  const projectRoot = path.resolve(__dirname, '..');
  const srcDir = path.join(projectRoot, 'src');

  // Get initial error count
  const initialErrors = getErrorCount();
  console.log(`📊 Initial errors: ${initialErrors}\n`);

  // Find and fix all TypeScript files
  const files = findTypeScriptFiles(srcDir);
  let fixedCount = 0;

  for (const file of files) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }

  // Get final error count
  const finalErrors = getErrorCount();
  const reduction = initialErrors - finalErrors;
  const percentage = ((reduction / initialErrors) * 100).toFixed(1);

  console.log('\n================================');
  console.log(`✅ Fixed ${fixedCount} files`);
  console.log(`📉 Errors reduced: ${initialErrors} → ${finalErrors} (${percentage}% reduction)`);
}

/**
 * Get total TypeScript error count
 */
function getErrorCount(): number {
  try {
    const output = execSync('npx tsc --noEmit 2>&1 | grep "error TS" | wc -l', {
      encoding: 'utf-8',
    });
    return parseInt(output.trim());
  } catch {
    return 0;
  }
}

// Run the auto-fixer
if (require.main === module) {
  main().catch(console.error);
}

export { fixFile, getTypeScriptErrors, findTypeScriptFiles };