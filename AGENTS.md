# Project Agent Rules

## Package Publishing Rule

- Do not use `workspace:*` (or any `workspace:` specifier) in `dependencies`, `peerDependencies`, or `optionalDependencies` inside any `src/lib/*/package.json`.
- Every internal dependency in publishable `src/lib/*` packages must be pinned to an explicit published semver version (for example `0.2.2`).
- Before committing release-related changes, run:
  - `rg --line-number "workspace:" src/lib/**/package.json`
  - Expected result: no matches.

## Project Directory Architecture

- `src/`: application source code.
- `src/components/`: React UI layers (`EditorPanel`, `PreviewPanel`, `HeaderBar`, `ThemeModal`, and shared UI atoms).
- `src/lib/`: publishable npm packages used by the app and external consumers.
- `src/lib/json2pptx-schema/`: schema, migration, validation, and normalization pipeline.
- `src/lib/json2pptx/`: JSON-to-PPTX rendering and export logic.
- `src/lib/pptx2json/`: PPTX-to-JSON parser and normalization logic.
- `src/lib/pptx-previewer/`: browser preview renderer for presentation JSON.
- `src/lib/pptx-custom/`: custom content and theme transformation utilities.
- `src/types/`: project-level type and shim declarations.
- `template/`: built-in template JSON files loaded by the app.
- `test/`: root-level integration/regression tests.
- `docs/`: design and schema documentation.
- `scripts/`: release and automation scripts.
- `public/`: static assets served directly by Vite.

## Editing Boundaries

- In each `src/lib/*` package, treat source folders (such as `src/`, `runtime/`, `versions/`, `parser/`, `type/`) as source of truth.
- Do not hand-edit generated outputs under `dist/`.

## Testing Rules

- Root `./test` is reserved for integration tests that verify cross-package pipelines or broader app-level flows, typically involving two or three packages together.
- Single-package edge cases and regression tests belong in that package's own `test/` or `tests/` directory.
- Package-specific fixtures should live next to the owning package's tests, not under root `./test/assets`.

## Commenting guideline
Ensure generated comments explain the reasoning, intent, and design considerations behind the code, rather than merely restating its behavior.
