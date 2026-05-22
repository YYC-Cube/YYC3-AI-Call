#!/usr/bin/env node

import { readFileSync } from "fs";

interface RTLCheckResult {
  file: string;
  hasArabicTranslation: boolean;
  arabicKeysCount: number;
  hasDirectionSupport: boolean;
  issues: string[];
}

function checkArabicTranslations(filePath: string): RTLCheckResult {
  const content = readFileSync(filePath, "utf-8");

  const result: RTLCheckResult = {
    file: filePath,
    hasArabicTranslation: false,
    arabicKeysCount: 0,
    hasDirectionSupport: false,
    issues: [],
  };

  const arabicPattern = /[\u0600-\u06FF]/;
  const arabicMatches = content.match(arabicPattern);

  if (arabicMatches && arabicMatches.length > 0) {
    result.hasArabicTranslation = true;
    result.arabicKeysCount = arabicMatches.length;
  }

  const rtlPatterns = [
    /dir\s*=\s*["']rtl["']/,
    /direction\s*:\s*rtl/,
    /rtl\b/,
    /text-align\s*:\s*(right|start)/,
  ];

  for (const pattern of rtlPatterns) {
    if (pattern.test(content)) {
      result.hasDirectionSupport = true;
      break;
    }
  }

  if (!result.hasArabicTranslation && filePath.includes("ar")) {
    result.issues.push(
      "\u274C Arabic translation file contains no Arabic characters"
    );
  }

  return result;
}

async function main() {
  console.log("=".repeat(80));
  console.log("\uD83D\uDD24 RTL VALIDATION SCRIPT - @yyc3/i18n-core");
  console.log("=".repeat(80) + "\n");

  const arFilePath = "./src/locales/ar.ts";

  try {
    const arResult = checkArabicTranslations(arFilePath);

    console.log(`\uD83D\uDCC4 File: ${arResult.file}`);
    console.log(
      `   \u2022 Has Arabic text: ${arResult.hasArabicTranslation ? "\u2705 Yes" : "\u274C No"}`
    );
    console.log(
      `   \u2022 Arabic characters found: ${arResult.arabicKeysCount}`
    );
    console.log(
      `   \u2022 RTL direction support: ${arResult.hasDirectionSupport ? "\u2705 Detected" : "\u26A0\uFE0F Not detected"}`
    );

    if (arResult.issues.length > 0) {
      console.log("\n\u26A0\uFE0F Issues:");
      arResult.issues.forEach((issue) => console.log(`   ${issue}`));
    }

    console.log("\n\uD83D\uDCCB RTL Support Checklist:");

    const checklistItems = [
      ["HTML dir attribute", "document.documentElement.dir"],
      ["CSS logical properties", "margin-inline-start, padding-inline-end"],
      ["Flexbox direction", "flex-direction: row-reverse for RTL"],
      ["Text alignment", "text-align: start/end instead of left/right"],
      ["Arabic font stack", '"Segoe UI", Tahoma, Arial, sans-serif'],
    ];

    checklistItems.forEach(([item, detail]) => {
      console.log(`   \u2610 ${item} (${detail})`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("\uD83E\uDEA7 MANUAL BROWSER TESTING REQUIRED");
    console.log("=".repeat(80));
    console.log(`
1. Open browser DevTools Console
2. Run: document.documentElement.dir = 'rtl'
3. Switch language to Arabic (\u0627\u0644\u0639\u0631\u0628\u064A\u0629)
4. Verify:

   \u2705 Text flows right-to-left
   \u2705 Sidebar moves to the right
   \u2705 Navigation items align correctly
   \u2705 Form labels and inputs are properly aligned
   \u2705 Icons and buttons position correctly
   \u2705 No horizontal scrollbar appears
   \u2705 Tables and grids adapt to RTL

5. Test specific components:
   - [ ] Language selector shows Arabic label
   - [ ] Chat input area text direction
   - [ ] Code blocks remain LTR (important!)
   - [ ] Numbers and dates display correctly
   - [ ] Modal dialogs center properly

`);

    process.exit(0);
  } catch (error) {
    console.error(
      "\u274C Error checking Arabic translations:",
      error
    );
    process.exit(1);
  }
}

main().catch(console.error);
