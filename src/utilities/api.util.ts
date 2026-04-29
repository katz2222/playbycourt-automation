import { COOKIE } from "env-variables";

export async function fetchAvailableHours(timestamp: number): Promise<any> {
  const url = `https://app.playbypoint.com/api/facilities/652/available_hours?timestamp=${timestamp}&surface=padel&kind=reservation&courts_for_pros=false`;

  const res: Response = await fetch(url, {
    headers: {
      Cookie: COOKIE,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36"
    }
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}`);
  }

  return res.json();
}