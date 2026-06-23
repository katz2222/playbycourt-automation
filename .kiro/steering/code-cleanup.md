---
inclusion: auto
---

# Code Cleanup

When a refactor makes existing code unreachable or redundant (dead guards, unused imports, orphaned helpers, etc.), clean it up in the same pass without waiting to be asked.

## Additional rules

- Consolidate duplicate logic. If the same computation or pattern appears in multiple places, extract it into a shared utility.
- Keep imports minimal — remove unused path aliases and unused named imports after every edit.
- Prefer early returns over deeply nested if/else blocks.
- When a function parameter becomes unused after a refactor, remove it and update all call sites.
- If a type in `types.util.ts` is no longer referenced anywhere, remove it.
- Avoid leftover `console.log` debugging statements; use the project's logger utility instead.
- When renaming or moving a function, verify no orphaned re-exports or barrel references remain.
- Keep utility files focused on a single concern — if a helper doesn't belong in the file it's in, move it to the appropriate one.
