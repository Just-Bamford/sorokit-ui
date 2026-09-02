#!/usr/bin/env node
// Fails only on "critical"-impact axe-core violations. Other impact levels
// (serious/moderate/minor — this is where WCAG 1.4.3 color-contrast lands)
// are printed for visibility but do not fail the build; see #183.
import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node check-axe-critical.mjs <axe-results.json>");
  process.exit(1);
}

const raw = JSON.parse(readFileSync(file, "utf-8"));
const results = Array.isArray(raw) ? raw : [raw];

let criticalCount = 0;
let totalCount = 0;

for (const result of results) {
  const violations = result.violations ?? [];
  for (const violation of violations) {
    totalCount++;
    const nodeCount = violation.nodes?.length ?? 0;
    console.log(
      `[${violation.impact}] ${violation.id}: ${violation.help} (${nodeCount} element${nodeCount === 1 ? "" : "s"})`,
    );
    if (violation.impact === "critical") criticalCount++;
  }
}

console.log(
  `\n${totalCount} violation(s) found, ${criticalCount} critical.`,
);

if (criticalCount > 0) {
  console.error("Failing build: critical accessibility violations found.");
  process.exit(1);
}
