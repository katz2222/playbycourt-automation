import { ClubConfig, MatchPointerClubConfig } from "./types.util";

export function parseClubConfigs(clubsJson: string): ClubConfig[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(clubsJson);
  } catch (err) {
    throw new Error(
      `Failed to parse CLUBS JSON: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`CLUBS must be a JSON array, got: ${typeof parsed}`);
  }

  const validConfigs: ClubConfig[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const raw = parsed[i];
    const provider =
      raw && typeof raw === "object" && "provider" in raw
        ? (raw as Record<string, unknown>).provider
        : undefined;

    switch (provider) {
      case "playbypoint": {
        const config = validateFacilityIdConfig(raw, "playbypoint");
        if (config) {
          validConfigs.push(config);
        } else {
          console.error(
            `Club config at index ${i}: invalid playbypoint config (requires non-empty "name" and "facilityId")`,
          );
        }
        break;
      }
      case "matchpointer": {
        const config = validateMatchPointerConfig(raw);
        if (config) {
          validConfigs.push(config);
        } else {
          console.error(
            `Club config at index ${i}: invalid matchpointer config (requires non-empty "name" and "venueId")`,
          );
        }
        break;
      }
      case "supabase": {
        const config = validateFacilityIdConfig(raw, "supabase");
        if (config) {
          validConfigs.push(config);
        } else {
          console.error(
            `Club config at index ${i}: invalid supabase config (requires non-empty "name" and "facilityId")`,
          );
        }
        break;
      }
      default:
        console.error(
          `Club config at index ${i}: unknown or missing provider "${String(provider)}"`,
        );
        break;
    }
  }

  return validConfigs;
}

function validateFacilityIdConfig(
  raw: unknown,
  provider: "playbypoint" | "supabase",
): {
  name: string;
  facilityId: string;
  provider: "playbypoint" | "supabase";
} | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const name = obj.name;
  const facilityId = obj.facilityId;

  if (typeof name !== "string" || name.trim() === "") return null;
  if (typeof facilityId !== "string" || facilityId.trim() === "") return null;

  return { name, provider, facilityId };
}

function validateMatchPointerConfig(
  raw: unknown,
): MatchPointerClubConfig | null {
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  const name = obj.name;
  const venueId = obj.venueId;

  if (typeof name !== "string" || name.trim() === "") return null;
  if (typeof venueId !== "string" || venueId.trim() === "") return null;

  return {
    name,
    provider: "matchpointer",
    venueId,
  };
}
