import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { compileFunction } from 'node:vm';
const ts = createRequire(import.meta.url)('typescript');

// Compile local modules in memory, with a fresh cache for each isolated test.
export function loadTypescript(filename, overrides = {}, environment = process.env, runtime = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const loadedModule = { exports: {} };
    cache.set(file, loadedModule);
    const nativeRequire = createRequire(file);
    const dependencies = (name) => {
      if (Object.hasOwn(overrides, name)) return overrides[name];
      if (name.startsWith('.')) {
        const target = resolve(dirname(file), name);
        const local = [target, `${target}.ts`, resolve(target, 'index.ts')].find(path => path.endsWith('.ts') && existsSync(path));
        if (local) return load(local);
      }
      return nativeRequire(name);
    };
    const compiled = ts.transpileModule(readFileSync(file, 'utf8'), {
      fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    });
    compileFunction(compiled.outputText, ['require', 'module', 'exports', 'process', 'fetch', 'console'], { filename: file })(
      dependencies, loadedModule, loadedModule.exports, { env: environment }, runtime.fetch ?? fetch, runtime.console ?? console,
    );
    return loadedModule.exports;
  }
  return load(resolve(filename));
}
