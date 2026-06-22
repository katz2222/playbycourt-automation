# Product

This is a court slot availability scanner for a padel facility. It polls the PlayByPoint API to find available court time slots within a configurable date/hour window, detects newly available or newly unavailable slots compared to a historical record, and sends Telegram notifications when new slots appear.

Key behaviors:

- Scans a date range (defined by day offsets from today) for available slots
- Filters slots by hour range and optionally skips weekends or specific weekdays
- Requires at least 3 consecutive 30-minute slots to form a bookable block
- Tracks slot history in an Excel file (`data/slot_history.xlsx`) to avoid duplicate notifications
- Sends formatted Telegram messages when new slots are found
