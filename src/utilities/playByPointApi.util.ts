import { COOKIE } from "env-variables";
import { ApiSlot } from "./types.util";

export async function fetchAvailableHours(
  facilityId: string,
  timestamp: number,
): Promise<ApiSlot[]> {
  const url = `https://app.playbypoint.com/api/facilities/${facilityId}/available_hours?timestamp=${timestamp}&surface=padel&kind=reservation&courts_for_pros=false`;

  const res: Response = await fetch(url, {
    headers: {
      Cookie: COOKIE,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  const json = await res.json();
  return json.available_hours;
}
