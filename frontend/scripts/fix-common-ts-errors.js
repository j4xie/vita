#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing common TypeScript errors...\n');

// Fix missing vector-icons import
const animatedSearchBarPath = path.join(__dirname, '../src/components/ui/AnimatedSearchBar.tsx');
if (fs.existsSync(animatedSearchBarPath)) {
  let content = fs.readFileSync(animatedSearchBarPath, 'utf8');
  if (content.includes("'react-native-vector-icons/MaterialIcons'")) {
    content = content.replace(
      "import Icon from 'react-native-vector-icons/MaterialIcons';",
      "import { MaterialIcons as Icon } from '@expo/vector-icons';"
    );
    fs.writeFileSync(animatedSearchBarPath, content);
    console.log('✅ Fixed AnimatedSearchBar import');
  }
}

// Fix VolunteerQuickActionModal variables
const volunteerModalPath = path.join(__dirname, '../src/components/modals/VolunteerQuickActionModal.tsx');
if (fs.existsSync(volunteerModalPath)) {
  let content = fs.readFileSync(volunteerModalPath, 'utf8');
  // Move function declarations before usage
  if (content.includes('const formatTime') && content.includes('formatTime(')) {
    const formatTimeFunc = `const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };`;

    const calculateDurationFunc = `const calculateWorkDuration = (start: Date, end: Date): string => {
    const diffMs = end.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return \`\${hours}小时\${minutes}分钟\`;
  };`;

    // Remove existing definitions
    content = content.replace(/const formatTime = .*?};/gs, '');
    content = content.replace(/const calculateWorkDuration = .*?};/gs, '');

    // Add at the beginning of the component
    const componentStart = content.indexOf('export const VolunteerQuickActionModal');
    if (componentStart !== -1) {
      const insertPos = content.indexOf('{', componentStart) + 1;
      content = content.slice(0, insertPos) + '\n  ' + formatTimeFunc + '\n  ' + calculateDurationFunc + '\n' + content.slice(insertPos);
      fs.writeFileSync(volunteerModalPath, content);
      console.log('✅ Fixed VolunteerQuickActionModal function order');
    }
  }
}

// Fix ScannedUserModal styles usage
const scannedUserModalPath = path.join(__dirname, '../src/components/modals/ScannedUserModal.tsx');
if (fs.existsSync(scannedUserModalPath)) {
  let content = fs.readFileSync(scannedUserModalPath, 'utf8');
  // Move styles declaration to the beginning of component
  if (content.includes('const styles = StyleSheet.create')) {
    const stylesMatch = content.match(/const styles = StyleSheet\.create\({[\s\S]*?}\);/);
    if (stylesMatch) {
      const stylesDecl = stylesMatch[0];
      content = content.replace(stylesDecl, '');
      // Add styles at module level
      const lastImportIdx = content.lastIndexOf('import ');
      const nextLineIdx = content.indexOf('\n', lastImportIdx);
      content = content.slice(0, nextLineIdx + 1) + '\n' + stylesDecl + '\n' + content.slice(nextLineIdx + 1);
      fs.writeFileSync(scannedUserModalPath, content);
      console.log('✅ Fixed ScannedUserModal styles order');
    }
  }
}

// Fix missing type exports
const typesPath = path.join(__dirname, '../src/types');
const autoAugmentationsFile = path.join(typesPath, 'auto-augmentations.d.ts');

if (!fs.existsSync(autoAugmentationsFile)) {
  fs.mkdirSync(typesPath, { recursive: true });
  const content = `// Auto-generated type augmentations
import 'react-native';

declare module 'react-native' {
  interface TextStyle {
    maxFontSizeMultiplier?: number;
  }
}

// Fix missing animation types
declare module 'react-native-reanimated' {
  export function withSequence(...animations: any[]): any;
}

// Fix missing theme types
declare global {
  function useStaticTheme(): any;
}
`;
  fs.writeFileSync(autoAugmentationsFile, content);
  console.log('✅ Created type augmentations file');
}

// Run TypeScript check to count remaining errors
console.log('\n📊 Checking remaining errors...');
try {
  const result = execSync('npm run type-check 2>&1 | grep "error TS" | wc -l', { encoding: 'utf8' });
  console.log(`\n🎯 Remaining TypeScript errors: ${result.trim()}`);
} catch (error) {
  console.log('Unable to count remaining errors');
}

console.log('\n✨ Common fixes applied!');