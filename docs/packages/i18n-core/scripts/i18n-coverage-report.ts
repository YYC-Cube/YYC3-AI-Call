#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { readdirSync, statSync } from "fs";

interface CoverageData {
  directory: string;
  totalFiles: number;
  filesWithI18n: number;
  totalStrings: number;
  translatedStrings: number;
  coverage: number;
}

function scanDirectory(dir: string): string[] {
  const results: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = `${dir}/${entry}`;
      const stat = statSync(fullPath);

      if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules") {
        results.push(...scanDirectory(fullPath));
      } else if (
        entry.endsWith(".ts") &&
        !entry.endsWith(".test.ts") &&
        !entry.includes(".d.")
      ) {
        results.push(fullPath);
      }
    }
  } catch {
    // Ignore
  }

  return results;
}

function analyzeFile(
  filePath: string
): { hasI18n: boolean; totalStrings: number; translatedStrings: number } {
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return { hasI18n: false, totalStrings: 0, translatedStrings: 0 };
  }

  const hasI18n = content.includes('t("') || content.includes("t('");

  const userStringPattern =
    /(?:return|html|label|title|placeholder|description|text|hint|help)\s*[=:]\s*["`]([A-Z][^"`]*?)["`]/g;
  const allMatches = content.match(userStringPattern) || [];

  const tCallPattern = /\bt\(\s*["']([^"']+)["']/g;
  const tCalls = content.match(tCallPattern) || [];

  return {
    hasI18n,
    totalStrings: allMatches.length,
    translatedStrings: tCalls.length,
  };
}

async function main() {
  console.log("=".repeat(80));
  console.log("\u{1F4CA} I18N COVERAGE REPORT - @yyc3/i18n-core");
  console.log("=".repeat(80) + "\n");

  const SOURCE_DIRS = [
    { path: "./src", name: "Source Code (\u6E90\u7801)" },
    { path: "./examples", name: "Examples (\u793A\u4F8B)" },
  ];

  const reportData: CoverageData[] = [];
  let grandTotalFiles = 0;
  let grandTotalWithI18n = 0;

  for (const dir of SOURCE_DIRS) {
    if (!dir.path.endsWith(".ts")) {
      const files = scanDirectory(dir.path);
      let totalStrings = 0;
      let translatedStrings = 0;
      let filesWithI18n = 0;

      for (const filePath of files) {
        const analysis = analyzeFile(filePath);
        if (analysis.hasI18n) filesWithI18n++;
        totalStrings += analysis.totalStrings;
        translatedStrings += analysis.translatedStrings;
      }

      const coverage =
        totalStrings > 0
          ? Math.round((translatedStrings / Math.max(totalStrings, 1)) * 100)
          : 0;

      reportData.push({
        directory: dir.name,
        totalFiles: files.length,
        filesWithI18n,
        totalStrings,
        translatedStrings,
        coverage,
      });

      grandTotalFiles += files.length;
      grandTotalWithI18n += filesWithI18n;
    }
  }

  console.log("\uD83D\uDCC1 Directory-wise Coverage:");
  console.log("-".repeat(80));
  console.log(
    `{"Directory":<30} {"Files":>6} {"i18n":>6} {"Strings":>10} {"Translated":>12} {"Coverage":>10}`
  );
  console.log("-".repeat(80));

  for (const data of reportData) {
    const safeCoverage = Math.max(0, Math.min(100, data.coverage));
    const bar =
      "\u2588".repeat(Math.floor(safeCoverage / 5)) +
      "\u2591".repeat(20 - Math.floor(safeCoverage / 5));
    console.log(
      `${data.directory.padEnd(30)} ${data.totalFiles.toString().padStart(6)} ${data.filesWithI18n.toString().padStart(6)} ${data.totalStrings.toString().padStart(10)} ${data.translatedStrings.toString().padStart(12)} ${safeCoverage.toString().padStart(9)}% ${bar}`
    );
  }

  console.log("-".repeat(80));

  const overallCoverage = Math.round(
    (grandTotalWithI18n / Math.max(grandTotalFiles, 1)) * 100
  );
  console.log(
    `\n\u{1F3AF} Overall i18n File Coverage: ${overallCoverage}% (${grandTotalWithI18n}/${grandTotalFiles} files)`
  );

  process.exit(0);
}

main().catch(console.error);
