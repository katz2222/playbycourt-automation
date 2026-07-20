import { test, expect } from "@playwright/test";
import fc from "fast-check";
import { fetchAvailableHours } from "@utils/playByPointApi.util";

// Feature: multi-club-scanning, Property 11: PlayByPoint URL construction
/**
 * Property 11: PlayByPoint URL construction
 *
 * For any facility ID string, the constructed PlayByPoint API URL should contain
 * that exact facility ID in the path segment `/facilities/{facilityId}/available_hours`.
 *
 * **Validates: Requirements 2.1**
 */
test("Property 11: PlayByPoint URL construction", async () => {
  // Generator: alphanumeric facility IDs (simulating real facility identifiers)
  const facilityIdArb = fc
    .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789"), {
      minLength: 1,
      maxLength: 20,
    })
    .map((chars) => chars.join(""));

  const timestampArb = fc.integer({ min: 1000000000, max: 9999999999 });

  await fc.assert(
    fc.asyncProperty(
      facilityIdArb,
      timestampArb,
      async (facilityId, timestamp) => {
        let capturedUrl: string | undefined;

        // Mock global.fetch to capture the URL without making a real HTTP call
        const originalFetch = global.fetch;
        global.fetch = async (
          input: RequestInfo | URL,
          _init?: RequestInit,
        ) => {
          capturedUrl = input.toString();
          // Return a mock successful response with empty available_hours
          return new Response(JSON.stringify({ available_hours: [] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        };

        try {
          await fetchAvailableHours(facilityId, timestamp);

          // Verify the URL was constructed correctly
          expect(capturedUrl).toBeDefined();
          expect(capturedUrl).toContain(
            `/facilities/${facilityId}/available_hours`,
          );
          // Verify the full URL structure matches the expected pattern
          expect(capturedUrl).toBe(
            `https://app.playbypoint.com/api/facilities/${facilityId}/available_hours?timestamp=${timestamp}&surface=padel&kind=reservation&courts_for_pros=false`,
          );
        } finally {
          // Restore original fetch
          global.fetch = originalFetch;
        }
      },
    ),
    { numRuns: 20 },
  );
});
