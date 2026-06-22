# Tech Stack

- Runtime: Node.js (CommonJS modules)
- Language: TypeScript (strict mode, ES2016 target)
- Test framework: Playwright Test (`@playwright/test`) — used for all tests including unit and PBT
- Property-based testing: `fast-check`
- Scheduling: `node-cron`
- Excel I/O: `xlsx`
- Environment config: `dotenv` + `env-var` (validated, typed env access via `env-variables.ts`)

## Path Aliases (tsconfig)

| Alias         | Resolves to       |
| ------------- | ----------------- |
| `@src/*`      | `src/*`           |
| `@utils/*`    | `src/utilities/*` |
| `@services/*` | `src/services/*`  |
| `@jobs/*`     | `src/jobs/*`      |
| `@tests/*`    | `src/tests/*`     |

## Common Commands

```bash
# Run all tests (single pass, no watch)
npx playwright test

# Run a specific test file
npx playwright test src/tests/scanParams.pbt.spec.ts

# View last HTML test report
npx playwright show-report
```

> Do not use `npm test` in watch mode. Always run tests with a single-execution command.

## Environment Variables

All env vars are declared and validated in `env-variables.ts`. Never access `process.env` directly — import from `env-variables.ts` instead.

Required vars: `EMAIL`, `URL`, `PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `COOKIE`, `SCAN_START_DATE_OFFSET`, `SCAN_END_DATE_OFFSET`, `SCAN_START_HOUR`, `SCAN_END_HOUR`

Optional vars: `SCAN_SKIP_WEEKEND` (default `false`), `SCAN_SKIP_WEEKDAYS` (default `""`)
