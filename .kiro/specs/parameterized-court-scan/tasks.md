# Implementation Plan: Parameterized Court Scan

## Overview

Externalize hardcoded scan parameters into environment variables, add validation via `parseScanParams()`, pass params through the call chain, remove `node-cron` from the job entry point, and update the GitHub Actions workflow with `workflow_dispatch` inputs, matrix strategy, and schedule trigger.

## Tasks

- [x] 1. Create `parseScanParams()` utility
  - [x] 1.1 Create `src/utilities/scanParams.util.ts` with `parseScanParams(env?)` function
    - Read `SCAN_START_DATE_OFFSET`, `SCAN_END_DATE_OFFSET`, `SCAN_START_HOUR`, `SCAN_END_HOUR`, `SCAN_SKIP_WEEKEND`, `SCAN_SKIP_WEEKDAYS` from the `env` parameter (default `process.env`)
    - Apply defaults: offsets=1, startHour=10, endHour=19, skipWeekend=false, skipWeekdays=[]
    - Parse `SCAN_SKIP_WEEKDAYS` as comma-separated integers
    - Compute `startDate` and `endDate` as today + offset days
    - Return a `ScanCourtSlotsOptions` object
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Add validation logic to `parseScanParams()`
    - Validate `SCAN_START_HOUR` is integer 0–23; throw descriptive error otherwise
    - Validate `SCAN_END_HOUR` is integer 1–24; throw descriptive error otherwise
    - Validate `SCAN_START_HOUR < SCAN_END_HOUR`; throw descriptive error otherwise
    - Validate offsets are non-negative integers; throw descriptive error otherwise
    - Validate `SCAN_START_DATE_OFFSET <= SCAN_END_DATE_OFFSET`; throw descriptive error otherwise
    - Validate each weekday in `SCAN_SKIP_WEEKDAYS` is 0–6; throw descriptive error otherwise
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 1.3 Write property tests for `parseScanParams()` validation
    - **Property 1: Default round-trip** — calling `parseScanParams({})` with no env vars returns valid `ScanCourtSlotsOptions` with default values (startHour=10, endHour=19, skipWeekend=false, skipWeekdays=[])
    - **Validates: Requirements 1.2**
    - **Property 2: Valid hour ranges always produce startHour < endHour** — for any `SCAN_START_HOUR` in [0,23] and `SCAN_END_HOUR` in [1,24] where start < end, `parseScanParams` returns an object with `startHour < endHour`
    - **Validates: Requirements 2.1, 2.2, 2.3**
    - **Property 3: Invalid inputs always throw** — for any `SCAN_START_HOUR >= SCAN_END_HOUR`, or negative offsets, or weekday outside 0–6, `parseScanParams` throws an error
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
    - **Property 4: Date offset consistency** — for any valid `SCAN_START_DATE_OFFSET <= SCAN_END_DATE_OFFSET`, the returned `startDate <= endDate`
    - **Validates: Requirements 1.3, 2.4, 2.5**

- [x] 2. Checkpoint - Verify parseScanParams
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Modify service and job entry point
  - [x] 3.1 Update `checkCourtAvailability` in `src/services/findAvailableSlots.service.ts` to accept `params: ScanCourtSlotsOptions` argument
    - Change function signature from `() => Promise<void>` to `(params: ScanCourtSlotsOptions) => Promise<void>`
    - Remove the inline `scanParameters` object construction
    - Use the `params` argument directly for `logScanParameters` and `scanCourtSlots` calls
    - _Requirements: 6.1_

  - [x] 3.2 Simplify `src/jobs/findAvailableSlots.job.ts` entry point
    - Remove `node-cron` import and `cron.schedule` call
    - Import `parseScanParams` from `scanParams.util`
    - Create `main()` that calls `parseScanParams()`, passes result to `checkCourtAvailability(params)`, and exits
    - Add `.catch()` handler that logs error and calls `process.exit(1)`
    - _Requirements: 6.2, 6.3_

- [x] 4. Update GitHub Actions workflow
  - [x] 4.1 Add `workflow_dispatch` inputs and `schedule` trigger to `.github/workflows/notify-court.yml`
    - Add `schedule` trigger with cron expression
    - Add `workflow_dispatch.inputs` for `start_date_offset`, `end_date_offset`, `start_hour`, `end_hour`, `skip_weekend`, `skip_weekdays` (all optional)
    - _Requirements: 3.1, 5.1_

  - [x] 4.2 Add matrix strategy with scan configurations
    - Define `strategy.matrix.config` array with `weekday-evening` and `weekend-daytime` entries
    - Map matrix values to `SCAN_*` environment variables in the run step
    - Use `${{ inputs.<name> || matrix.config.<name> }}` pattern so dispatch inputs override matrix defaults
    - _Requirements: 4.1, 4.2, 3.2, 3.3_

  - [x] 4.3 Update cache keys and artifact names for matrix support
    - Change cache key to `court-cache-${{ matrix.config.name }}-...` for per-config state
    - Change artifact name to `slot_history-${{ matrix.config.name }}` for per-config uploads
    - _Requirements: 4.3, 4.4_

- [x] 5. Final checkpoint - Ensure everything is wired together
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use Playwright Test (the project's existing test framework) with `fast-check` for property-based generation
- The `parseScanParams(env?)` design with injectable env makes all properties testable without touching real environment variables
