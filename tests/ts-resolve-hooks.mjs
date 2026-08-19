/**
 * Node로 `lib/**.ts`를 바로 불러 시험하기 위한 해석기입니다.
 *
 * 앱 코드는 번들러 규칙에 맞춰 확장자 없이 `./types`처럼 씁니다. Node의 ESM은
 * 확장자를 요구하므로, 시험을 돌릴 때만 `.ts`를 붙여 찾아 줍니다. 이렇게 하면
 * 시험을 위해 앱 코드의 import를 바꾸지 않아도 됩니다.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  const relative = specifier.startsWith("./") || specifier.startsWith("../");
  if (relative && !/\.[cm]?[jt]sx?$/.test(specifier) && context.parentURL) {
    for (const suffix of [".ts", "/index.ts"]) {
      const candidate = new URL(specifier + suffix, context.parentURL);
      if (existsSync(fileURLToPath(candidate))) {
        return nextResolve(specifier + suffix, context);
      }
    }
  }
  return nextResolve(specifier, context);
}
