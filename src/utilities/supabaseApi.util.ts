import { SupabaseFacilityResponse } from "./types.util";

const SUPABASE_URL =
  "https://hhifcmpdogsyijohomxk.supabase.co/functions/v1/get-facility-court-availability";

export async function fetchSupabaseFacilityAvailability(
  facilityId: string,
  date: string,
): Promise<SupabaseFacilityResponse> {
  const res = await fetch(SUPABASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ facility_id: facilityId, date }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase API error ${res.status}: ${body}`);
  }

  const json = await res.json();

  if (!json || !Array.isArray(json.slots)) {
    throw new Error("Invalid Supabase response: missing slots array");
  }

  return json as SupabaseFacilityResponse;
}
