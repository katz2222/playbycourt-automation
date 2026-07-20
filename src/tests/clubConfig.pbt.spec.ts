import { test, expect } from "@playwright/test";
import fc from "fast-check";
import { parseClubConfigs } from "@utils/clubConfig.util";
import { ClubConfig } from "@utils/types.util";

// Feature: multi-club-scanning, Property 1: Club config parsing round-trip
/**
 * Property 1: Club config parsing round-trip
 *
 * For any valid JSON array of club config objects (each with correct provider-specific fields),
 * parsing with `parseClubConfigs` should return an array of `ClubConfig` objects where each
 * object's `name`, `provider`, and provider-specific fields match the input.
 *
 * **Validates: Requirements 1.1**
 */
test("Property 1: Club config parsing round-trip", () => {
  // Generator: non-empty alphanumeric strings for names and IDs
  const nonEmptyAlphanumeric = fc
    .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789"), {
      minLength: 1,
      maxLength: 20,
    })
    .map((chars) => chars.join(""));

  // Generator: valid PlayByPoint config
  const playByPointConfigArb = fc
    .record({
      name: nonEmptyAlphanumeric,
      facilityId: nonEmptyAlphanumeric,
    })
    .map(({ name, facilityId }) => ({
      name,
      provider: "playbypoint" as const,
      facilityId,
    }));

  // Generator: valid MatchPointer config
  const matchPointerConfigArb = fc
    .record({
      name: nonEmptyAlphanumeric,
      venueId: nonEmptyAlphanumeric,
    })
    .map(({ name, venueId }) => ({
      name,
      provider: "matchpointer" as const,
      venueId,
    }));

  // Generator: array of 1-5 valid club configs (either provider)
  const clubConfigsArb = fc.array(
    fc.oneof(playByPointConfigArb, matchPointerConfigArb),
    { minLength: 1, maxLength: 5 },
  );

  fc.assert(
    fc.property(clubConfigsArb, (configs) => {
      // Serialize to JSON and parse
      const json = JSON.stringify(configs);
      const result: ClubConfig[] = parseClubConfigs(json);

      // Result should have same length as input
      expect(result.length).toBe(configs.length);

      // Each parsed config should match the input
      for (let i = 0; i < configs.length; i++) {
        const input = configs[i];
        const output = result[i];

        expect(output.name).toBe(input.name);
        expect(output.provider).toBe(input.provider);

        if (input.provider === "playbypoint") {
          expect(output.provider).toBe("playbypoint");
          expect((output as { facilityId: string }).facilityId).toBe(
            input.facilityId,
          );
        } else {
          expect(output.provider).toBe("matchpointer");
          expect((output as { venueId: string }).venueId).toBe(input.venueId);
        }
      }
    }),
    { numRuns: 30 },
  );
});

// Feature: multi-club-scanning, Property 2: Invalid club configs are rejected
/**
 * Property 2: Invalid club configs are rejected
 *
 * For any club config object that is missing one or more required fields for its declared
 * provider type (e.g., a playbypoint config without facilityId, or a matchpointer config
 * without venueId), parseClubConfigs should exclude that config from its output.
 *
 * **Validates: Requirements 1.2, 1.3**
 */
test("Property 2: Invalid club configs are rejected", () => {
  const nonEmptyAlphanumeric = fc
    .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789"), {
      minLength: 1,
      maxLength: 20,
    })
    .map((chars) => chars.join(""));

  // Generator: invalid playbypoint config (missing facilityId)
  const pbpMissingFacilityId = nonEmptyAlphanumeric.map((name) => ({
    name,
    provider: "playbypoint",
  }));

  // Generator: invalid playbypoint config (missing name)
  const pbpMissingName = nonEmptyAlphanumeric.map((facilityId) => ({
    provider: "playbypoint",
    facilityId,
  }));

  // Generator: invalid playbypoint config (empty name)
  const pbpEmptyName = nonEmptyAlphanumeric.map((facilityId) => ({
    name: "",
    provider: "playbypoint",
    facilityId,
  }));

  // Generator: invalid matchpointer config (missing venueId)
  const mpMissingVenueId = nonEmptyAlphanumeric.map((name) => ({
    name,
    provider: "matchpointer",
  }));

  // Generator: invalid matchpointer config (missing name)
  const mpMissingName = nonEmptyAlphanumeric.map((venueId) => ({
    provider: "matchpointer",
    venueId,
  }));

  // Generator: invalid matchpointer config (empty name)
  const mpEmptyName = nonEmptyAlphanumeric.map((venueId) => ({
    name: "",
    provider: "matchpointer",
    venueId,
  }));

  // Generator: unknown provider
  const unknownProvider = fc
    .record({
      name: nonEmptyAlphanumeric,
      provider: fc.constantFrom("unknown", "other", "invalid", ""),
    })
    .map(({ name, provider }) => ({ name, provider }));

  // Generator: missing provider entirely
  const missingProvider = nonEmptyAlphanumeric.map((name) => ({ name }));

  const invalidConfigArb = fc.oneof(
    pbpMissingFacilityId,
    pbpMissingName,
    pbpEmptyName,
    mpMissingVenueId,
    mpMissingName,
    mpEmptyName,
    unknownProvider,
    missingProvider,
  );

  fc.assert(
    fc.property(invalidConfigArb, (invalidConfig) => {
      const json = JSON.stringify([invalidConfig]);
      const result = parseClubConfigs(json);

      // Invalid configs should be excluded from output
      expect(result.length).toBe(0);
    }),
    { numRuns: 20 },
  );
});

// Feature: multi-club-scanning, Property 3: Mixed valid/invalid configs produce only valid clubs
/**
 * Property 3: Mixed valid/invalid configs produce only valid clubs
 *
 * For any JSON array containing a mix of valid and invalid club configs,
 * parseClubConfigs should return exactly the valid configs (in order), and
 * the count of returned configs should equal the count of valid inputs.
 *
 * **Validates: Requirements 1.4**
 */
test("Property 3: Mixed valid/invalid configs produce only valid clubs", () => {
  const nonEmptyAlphanumeric = fc
    .array(fc.constantFrom(..."abcdefghijklmnopqrstuvwxyz0123456789"), {
      minLength: 1,
      maxLength: 20,
    })
    .map((chars) => chars.join(""));

  // Generator: valid PlayByPoint config (tagged)
  const validPbpArb = fc
    .record({
      name: nonEmptyAlphanumeric,
      facilityId: nonEmptyAlphanumeric,
    })
    .map(({ name, facilityId }) => ({
      config: { name, provider: "playbypoint" as const, facilityId },
      isValid: true as const,
    }));

  // Generator: valid MatchPointer config (tagged)
  const validMpArb = fc
    .record({
      name: nonEmptyAlphanumeric,
      venueId: nonEmptyAlphanumeric,
    })
    .map(({ name, venueId }) => ({
      config: { name, provider: "matchpointer" as const, venueId },
      isValid: true as const,
    }));

  // Generator: invalid config (tagged) — missing required fields or unknown provider
  const invalidArb = fc.oneof(
    // playbypoint missing facilityId
    nonEmptyAlphanumeric.map((name) => ({
      config: { name, provider: "playbypoint" as const },
      isValid: false as const,
    })),
    // matchpointer missing venueId
    nonEmptyAlphanumeric.map((name) => ({
      config: { name, provider: "matchpointer" as const },
      isValid: false as const,
    })),
    // unknown provider
    nonEmptyAlphanumeric.map((name) => ({
      config: { name, provider: "unknown" },
      isValid: false as const,
    })),
    // empty name with playbypoint
    nonEmptyAlphanumeric.map((facilityId) => ({
      config: { name: "", provider: "playbypoint" as const, facilityId },
      isValid: false as const,
    })),
  );

  // Generator: mixed array of valid and invalid configs (1-8 items, at least 1 of each)
  const mixedConfigsArb = fc
    .tuple(
      fc.array(fc.oneof(validPbpArb, validMpArb), {
        minLength: 1,
        maxLength: 4,
      }),
      fc.array(invalidArb, { minLength: 1, maxLength: 4 }),
    )
    .chain(([valids, invalids]) => {
      // Interleave valid and invalid configs randomly
      const all = [...valids, ...invalids];
      return fc.shuffledSubarray(all, {
        minLength: all.length,
        maxLength: all.length,
      });
    });

  fc.assert(
    fc.property(mixedConfigsArb, (taggedConfigs) => {
      const configs = taggedConfigs.map((t) => t.config);
      const expectedValidCount = taggedConfigs.filter((t) => t.isValid).length;

      const json = JSON.stringify(configs);
      const result = parseClubConfigs(json);

      // Count of returned configs should equal count of valid inputs
      expect(result.length).toBe(expectedValidCount);

      // Verify returned configs are in the same relative order as the valid inputs
      const expectedValids = taggedConfigs
        .filter((t) => t.isValid)
        .map((t) => t.config);

      for (let i = 0; i < result.length; i++) {
        const output = result[i];
        const expected = expectedValids[i];
        expect(output.name).toBe(expected.name);
        expect(output.provider).toBe(expected.provider);
      }
    }),
    { numRuns: 20 },
  );
});
