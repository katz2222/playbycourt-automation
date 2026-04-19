# Requirements Document

## Introduction

The padel court availability checker currently has scan parameters (date range, hours, skip rules) hardcoded in `findAvailableSlots.service.ts`. This feature externalizes those parameters so they can be passed via GitHub Actions workflow inputs and environment variables, enabling parallel job execution with different scan configurations using matrix strategy.

## Glossary

- **Scan_Parameters**: The set of configuration values that control a court availability scan: start date offset, end date offset, start hour, end hour, skip weekend flag, and skip weekdays list.
- **Job**: A single GitHub Actions job that runs the court availability checker with a specific set of Scan_Parameters.
- **Workflow**: The GitHub Actions workflow definition in `.github/workflows/notify-court.yml` that orchestrates one or more Jobs.
- **Matrix_Strategy**: A GitHub Actions feature that generates multiple parallel Jobs from a set of parameter combinations.
- **Scanner**: The TypeScript code path from `findAvailableSlots.job.ts` through `findAvailableSlots.service.ts` that performs the court availability check.
- **Date_Offset**: An integer representing the number of days from today used to compute a scan date (e.g., `1` means tomorrow).

## Requirements

### Requirement 1: Accept Scan Parameters from Environment Variables

**User Story:** As a developer, I want the Scanner to read scan parameters from environment variables, so that I can configure scans without modifying source code.

#### Acceptance Criteria

1. WHEN the Scanner starts, THE Scanner SHALL read the following environment variables to construct Scan_Parameters: `SCAN_START_DATE_OFFSET`, `SCAN_END_DATE_OFFSET`, `SCAN_START_HOUR`, `SCAN_END_HOUR`, `SCAN_SKIP_WEEKEND`, `SCAN_SKIP_WEEKDAYS`.
2. WHEN an environment variable for a Scan_Parameter is not set, THE Scanner SHALL use a default value: `SCAN_START_DATE_OFFSET=1`, `SCAN_END_DATE_OFFSET=1`, `SCAN_START_HOUR=10`, `SCAN_END_HOUR=19`, `SCAN_SKIP_WEEKEND=false`, `SCAN_SKIP_WEEKDAYS=""`.
3. THE Scanner SHALL compute `startDate` as today plus `SCAN_START_DATE_OFFSET` days and `endDate` as today plus `SCAN_END_DATE_OFFSET` days.
4. WHEN `SCAN_SKIP_WEEKDAYS` is provided, THE Scanner SHALL parse it as a comma-separated list of day numbers (0=Sunday through 6=Saturday).

### Requirement 2: Validate Scan Parameters

**User Story:** As a developer, I want the Scanner to validate externalized parameters, so that misconfigured jobs fail fast with clear error messages.

#### Acceptance Criteria

1. WHEN `SCAN_START_HOUR` is not an integer between 0 and 23, THEN THE Scanner SHALL exit with an error message indicating the invalid value.
2. WHEN `SCAN_END_HOUR` is not an integer between 1 and 24, THEN THE Scanner SHALL exit with an error message indicating the invalid value.
3. WHEN `SCAN_START_HOUR` is greater than or equal to `SCAN_END_HOUR`, THEN THE Scanner SHALL exit with an error message indicating that start hour must be less than end hour.
4. WHEN `SCAN_START_DATE_OFFSET` or `SCAN_END_DATE_OFFSET` is not a non-negative integer, THEN THE Scanner SHALL exit with an error message indicating the invalid value.
5. WHEN `SCAN_START_DATE_OFFSET` is greater than `SCAN_END_DATE_OFFSET`, THEN THE Scanner SHALL exit with an error message indicating that start date offset must be less than or equal to end date offset.
6. WHEN `SCAN_SKIP_WEEKDAYS` contains a value outside the range 0-6, THEN THE Scanner SHALL exit with an error message indicating the invalid weekday number.

### Requirement 3: Define Workflow Inputs for Scan Parameters

**User Story:** As a developer, I want the GitHub Actions Workflow to accept scan parameters as `workflow_dispatch` inputs, so that I can trigger scans with custom parameters from the GitHub UI or API.

#### Acceptance Criteria

1. THE Workflow SHALL define `workflow_dispatch` inputs for: `start_date_offset`, `end_date_offset`, `start_hour`, `end_hour`, `skip_weekend`, and `skip_weekdays`.
2. THE Workflow SHALL pass each input value to the Job as the corresponding environment variable (`SCAN_START_DATE_OFFSET`, `SCAN_END_DATE_OFFSET`, `SCAN_START_HOUR`, `SCAN_END_HOUR`, `SCAN_SKIP_WEEKEND`, `SCAN_SKIP_WEEKDAYS`).
3. WHEN a `workflow_dispatch` input is not provided, THE Workflow SHALL omit the corresponding environment variable so the Scanner uses its default value.

### Requirement 4: Support Parallel Execution via Matrix Strategy

**User Story:** As a developer, I want to define multiple scan configurations in the Workflow, so that different date ranges and hour windows run as parallel Jobs.

#### Acceptance Criteria

1. THE Workflow SHALL support a `matrix` strategy that defines an array of scan configuration objects, each containing `start_date_offset`, `end_date_offset`, `start_hour`, `end_hour`, `skip_weekend`, and `skip_weekdays`.
2. THE Workflow SHALL run one Job per matrix entry, passing the matrix values as environment variables to the Scanner.
3. THE Workflow SHALL use a unique cache key per matrix entry so that each Job maintains its own `slot_history.xlsx` state.
4. THE Workflow SHALL use a unique artifact name per matrix entry so that each Job uploads its own `slot_history.xlsx` artifact.

### Requirement 5: Support Scheduled Cron Trigger with Matrix

**User Story:** As a developer, I want the Workflow to run on a cron schedule with the matrix configurations, so that parallel scans execute automatically without manual dispatch.

#### Acceptance Criteria

1. THE Workflow SHALL support a `schedule` trigger with a configurable cron expression.
2. WHEN triggered by `schedule`, THE Workflow SHALL execute all matrix configurations in parallel.
3. WHEN triggered by `workflow_dispatch` without inputs, THE Workflow SHALL execute all matrix configurations in parallel using default values.

### Requirement 6: Remove Hardcoded Scan Parameters from Service

**User Story:** As a developer, I want the `checkCourtAvailability` function to receive Scan_Parameters as an argument, so that the service layer has no hardcoded configuration.

#### Acceptance Criteria

1. THE Scanner SHALL accept Scan_Parameters as a function argument to `checkCourtAvailability` instead of defining them inline.
2. THE Scanner SHALL construct Scan_Parameters from environment variables in the job entry point (`findAvailableSlots.job.ts`) and pass them to `checkCourtAvailability`.
3. THE Scanner SHALL remove the `node-cron` scheduling from the job entry point and execute the scan once per invocation.
