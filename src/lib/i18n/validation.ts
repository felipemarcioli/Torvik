export type TranslationIssues = {
  missing: string[];
  extra: string[];
  empty: string[];
  interpolation: string[];
  encoding: string[];
};
export const variables = (value: string) =>
  [...value.matchAll(/{{\s*([^},\s]+)(?:,[^}]*)?\s*}}/g)].map((match) => match[1]!).sort();
export function validateTranslations(
  source: Record<string, string>,
  target: Record<string, string>,
): TranslationIssues {
  const keys = Object.keys(source);
  const issues: TranslationIssues = {
    missing: [],
    extra: [],
    empty: [],
    interpolation: [],
    encoding: [],
  };
  issues.missing = keys.filter((key) => !Object.hasOwn(target, key));
  issues.extra = Object.keys(target).filter((key) => !Object.hasOwn(source, key));
  for (const key of keys) {
    if (!Object.hasOwn(target, key)) continue;
    const value = target[key]!;
    if (typeof value !== "string" || !value.trim()) {
      issues.empty.push(key);
      continue;
    }
    if (JSON.stringify(variables(source[key]!)) !== JSON.stringify(variables(value)))
      issues.interpolation.push(key);
    // eslint-disable-next-line no-control-regex -- Detect invalid control characters in catalogs.
    if (/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\uD800-\uDFFF]/u.test(value))
      issues.encoding.push(key);
  }
  return issues;
}
