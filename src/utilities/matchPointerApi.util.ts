import {
  MatchPointerVenue,
  MatchPointerCourt,
  MatchPointerReservationSlot,
} from "./types.util";
import { MATCHPOINTER_API_KEY } from "env-variables";

export async function fetchVenueDetails(
  venueId: string,
): Promise<MatchPointerVenue> {
  const url = `https://api.matchpointer.app/rest/v1/venues?select=*&is_active=eq.true&id=eq.${venueId}`;

  const res = await fetch(url, {
    headers: { apikey: MATCHPOINTER_API_KEY },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MatchPointer venue API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`MatchPointer venue not found: ${venueId}`);
  }

  return data[0];
}

export async function fetchActiveCourts(
  venueId: string,
): Promise<MatchPointerCourt[]> {
  const url = `https://api.matchpointer.app/rest/v1/courts?select=*&venue_id=eq.${venueId}&is_active=eq.true&order=name.asc`;

  const res = await fetch(url, {
    headers: { apikey: MATCHPOINTER_API_KEY },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MatchPointer courts API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function fetchReservations(
  courtIds: number[],
  startDate: string,
  endDate: string,
): Promise<MatchPointerReservationSlot[]> {
  const courtIdsList = courtIds.join(",");
  const url = `https://api.matchpointer.app/rest/v1/reservation_slots?select=*&court_id=in.(${courtIdsList})&date=gte.${startDate}&date=lte.${endDate}&status=neq.cancelled`;

  const res = await fetch(url, {
    headers: { apikey: MATCHPOINTER_API_KEY },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `MatchPointer reservations API error ${res.status}: ${body}`,
    );
  }

  return res.json();
}
