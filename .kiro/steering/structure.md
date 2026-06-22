# Project Structure

```
src/
  jobs/         # Entry points — thin wrappers that parse params and call a service
  services/     # Orchestration logic — coordinates utilities, no business logic here
  utilities/    # All business logic, grouped by concern
  tests/        # All test files (unit + PBT)
data/
  slot_history.xlsx   # Persistent slot history (read/written at runtime)
env-variables.ts      # Single source of truth for all env vars
playwright.config.ts  # Test runner config
```

## Naming Conventions

- Utility files: `<name>.util.ts`
- Service files: `<name>.service.ts`
- Job files: `<name>.job.ts`
- Test files: `<name>.spec.ts` (unit), `<name>.pbt.spec.ts` (property-based)
- Type definitions live in `src/utilities/types.util.ts`

## Architecture Patterns

- Jobs → Services → Utilities (strict one-way dependency flow)
- Services must not contain business logic — delegate to utilities
- Utilities are pure/stateless where possible
- All types are defined in `types.util.ts` and imported from there
- Use path aliases (`@utils/*`, `@services/*`, etc.) for imports — never use deep relative paths like `../../`

## Testing Conventions

- All tests use Playwright Test (`test`, `expect`) even for pure unit logic
- Property-based tests use `fast-check` (`fc.assert`, `fc.property`) inside Playwright `test()` blocks
- PBT files are co-located in `src/tests/` with the `.pbt.spec.ts` suffix
- Test helpers (e.g. slot factories) are defined inline in the test file
