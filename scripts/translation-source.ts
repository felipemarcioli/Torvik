import ts from "typescript";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

/** Audits actual source strings, so equal but incomplete catalogs cannot pass. */
export function requiredTranslationKeys(root = process.cwd()) {
  const keys = new Set<string>();
  const add = (text: string) => keys.add(text.replace(/\s+/g, " ").trim());
  const dynamicFiles =
    /^(src\/lib\/(exercises\/|auth\.ts|camera\.ts|mediapipe\.ts|preparation\.ts|pose\/)|src\/components\/torvik\/data\.ts)/;
  function walk(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!["locales", "i18n"].includes(entry.name)) walk(path);
        continue;
      }
      if (!/\.tsx?$/.test(path)) continue;
      const name = relative(root, path).replaceAll("\\", "/");
      const source = ts.createSourceFile(
        path,
        readFileSync(path, "utf8"),
        ts.ScriptTarget.Latest,
        true,
      );
      function visit(node: ts.Node) {
        if (ts.isCallExpression(node)) {
          const called = ts.isIdentifier(node.expression)
            ? node.expression.text
            : ts.isPropertyAccessExpression(node.expression)
              ? node.expression.name.text
              : "";
          const first = node.arguments[0];
          if (
            ["t", "translate", "translateVoice"].includes(called) &&
            first &&
            ts.isStringLiteralLike(first)
          )
            add(first.text);
        }
        // These domain files expose written feedback and errors; stable IDs have no spaces.
        if (
          dynamicFiles.test(name) &&
          ts.isStringLiteralLike(node) &&
          /\s/.test(node.text) &&
          !/https?:|\{|\}|<|>/.test(node.text)
        ) {
          // Worker protocol failure is mapped to a user-facing error by the adapter.
          if (!(name === "src/lib/pose/tasks-worker.ts" && node.text === "not ready"))
            add(node.text);
        }
        if (
          ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name) &&
          ["states", "stages", "statusText"].includes(node.name.text) &&
          node.initializer
        ) {
          const labels = (child: ts.Node) => {
            if (
              ts.isStringLiteralLike(child) &&
              !(ts.isPropertyAssignment(child.parent) && child.parent.name === child)
            )
              add(child.text);
            ts.forEachChild(child, labels);
          };
          labels(node.initializer);
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  walk(join(root, "src"));
  keys.delete("");
  return [...keys].sort();
}
