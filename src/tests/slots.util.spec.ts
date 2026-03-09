import { test, expect } from '@playwright/test';
import { findConsecutiveSlots } from '../../src/utilities/slots.util';

function makeSlot(hh: number, mm: number) {
  return {
    facility_schedule_id: 0,
    schedule: `${hh}-${hh}:${mm}am`,
    shift: 'day',
    available: true,
    seconds_from_midnight: hh * 3600 + mm * 60,
    in_waitlist: false,
    group: 0,
  };
}

test('finds full runs and skips short gaps', () => {
  // free: 18:00-20:00 (4 slots: 18:00,18:30,19:00,19:30)
  // free: 20:30-21:00 (1 slot)
  // free: 21:30-23:00 (3 slots: 21:30,22:00,22:30)
  const slots = [
    makeSlot(18, 0),
    makeSlot(18, 30),
    makeSlot(19, 0),
    makeSlot(19, 30),
    makeSlot(20, 30),
    makeSlot(21, 30),
    makeSlot(22, 0),
    makeSlot(22, 30),
  ];

  const res = findConsecutiveSlots(slots, '2026-03-08');

  expect(res).toHaveLength(2);
  expect(res[0]).toEqual({ date: '2026-03-08', start: 18, end: 20 });
  expect(res[1]).toEqual({ date: '2026-03-08', start: 21.5, end: 23 });
});
