import { dictionaries } from "../src/lib/i18n";
import { validateTranslations } from "../src/lib/i18n/validation";
import { writeFileSync, mkdirSync } from "node:fs";
import { requiredTranslationKeys } from "./translation-source";
const sourceKeys = requiredTranslationKeys();
const result = Object.fromEntries(
  Object.entries(dictionaries).map(([language, dictionary]) => [
    language,
    {
      keys: Object.keys(dictionary).length,
      ...validateTranslations(dictionaries["pt-BR"], dictionary),
      sourceMissing: sourceKeys.filter((key) => !Object.hasOwn(dictionary, key)),
    },
  ]),
);
mkdirSync("test-results", { recursive: true });
writeFileSync("test-results/i18n-coverage.json", JSON.stringify(result, null, 2) + "\n");
let failed = false;
for (const [language, report] of Object.entries(result)) {
  const errors =
    report.missing.length +
    report.extra.length +
    report.empty.length +
    report.interpolation.length +
    report.encoding.length +
    report.sourceMissing.length;
  console.log(
    `${language}: ${report.keys} keys; ${report.missing.length} missing; ${report.sourceMissing.length} source keys missing; ${errors} total errors`,
  );
  if (report.sourceMissing.length) console.error(report.sourceMissing);
  failed ||= errors > 0;
}
process.exitCode = failed ? 1 : 0;
