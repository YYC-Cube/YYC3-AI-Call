#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { readdirSync, statSync } from "fs";

const SOURCE_DIRS = ["./src", "./examples"];

const keyPattern = /\bt\(\s*["']([^"']+)["']/g;

function extractKeysFromFile(filePath: string): Set<string> {
  const keys = new Set<string>();

  try {
    const content = readFileSync(filePath, "utf-8");
    let match;

    while ((match = keyPattern.exec(content)) !== null) {
      keys.add(match[1]);
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
  }

  return keys;
}

function scanDirectory(dir: string): string[] {
  const results: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = `${dir}/${entry}`;
      const stat = statSync(fullPath);

      if (
        stat.isDirectory() &&
        !entry.startsWith(".") &&
        entry !== "node_modules"
      ) {
        results.push(...scanDirectory(fullPath));
      } else if (
        entry.endsWith(".ts") &&
        !entry.endsWith(".test.ts") &&
        !entry.includes(".d.")
      ) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors for non-existent directories
  }

  return results;
}

async function main() {
  console.log("=".repeat(80));
  console.log("\u{1F50D} I18N KEY EXTRACTOR - @yyc3/i18n-core");
  console.log("=".repeat(80) + "\n");

  const allKeys = new Set<string>();
  let totalFiles = 0;

  for (const dir of SOURCE_DIRS) {
    const files = scanDirectory(dir);
    totalFiles += files.length;

    for (const filePath of files) {
      const keys = extractKeysFromFile(filePath);
      keys.forEach((key) => allKeys.add(key));
    }
  }

  console.log(`\uD83D\uDCC9 Scanned ${totalFiles} files`);
  console.log(`\uD83D\uDD11 Found ${allKeys.size} unique i18n keys\n`);

  // Categorize keys by namespace
  const categories: Record<string, string[]> = {};

  allKeys.forEach((key) => {
    const namespace = key.split(".")[0];
    if (!categories[namespace]) {
      categories[namespace] = [];
    }
    categories[namespace].push(key);
  });

  console.log("\uD83D\uDCCB Keys by category:");
  console.log("-".repeat(80));

  Object.entries(categories)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([namespace, keys]) => {
      console.log(`\n\uD83D\uDCC4 ${namespace} (${keys.length} keys):`);
      keys.slice(0, 15).forEach((key) => {
        console.log(`   \u2022 ${key}`);
      });
      if (keys.length > 15) {
        console.log(`   ... and ${keys.length - 15} more`);
      }
    });

  console.log("\n" + "=".repeat(80));
  console.log(
    "\uD83DDCBE Saving extracted keys to: ./i18n-keys-extracted.txt"
  );
  console.log("=".repeat(80) + "\n");

  const outputContent = Array.from(allKeys).sort().join("\n");
  writeFileSync("./i18n-keys-extracted.txt", outputContent, "utf-8");

  process.exit(0);
}

main().catch(console.error);
