import "dotenv/config";
import envVar from "env-var";
const EMAIL = envVar.get("EMAIL").required().asString();
const URL = envVar.get("URL").required().asString();
const PASSWORD = envVar.get("PASSWORD").required().asString();
const PHONE_NUMBER = envVar.get("PHONE_NUMBER").required().asString();
const TWILIO_SANDBOX_NUMBER = envVar
  .get("TWILIO_SANDBOX_NUMBER")
  .required()
  .asString();
const TWILIO_ACCOUNT_SID = envVar
  .get("TWILIO_ACCOUNT_SID")
  .required()
  .asString();
const TWILIO_AUTH_TOKEN = envVar.get("TWILIO_AUTH_TOKEN").required().asString();
const COOKIE = envVar.get("COOKIE").required().asString();

// Scan parameters (required)
const SCAN_START_DATE_OFFSET = envVar
  .get("SCAN_START_DATE_OFFSET")
  .required()
  .asInt();
const SCAN_END_DATE_OFFSET = envVar
  .get("SCAN_END_DATE_OFFSET")
  .required()
  .asInt();
const SCAN_START_HOUR = envVar.get("SCAN_START_HOUR").required().asInt();
const SCAN_END_HOUR = envVar.get("SCAN_END_HOUR").required().asInt();
const SCAN_SKIP_WEEKEND = envVar.get("SCAN_SKIP_WEEKEND").required().asBool();
const SCAN_SKIP_WEEKDAYS = envVar
  .get("SCAN_SKIP_WEEKDAYS")
  .required()
  .asString();

export {
  EMAIL,
  URL,
  PASSWORD,
  PHONE_NUMBER,
  TWILIO_SANDBOX_NUMBER,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  COOKIE,
  SCAN_START_DATE_OFFSET,
  SCAN_END_DATE_OFFSET,
  SCAN_START_HOUR,
  SCAN_END_HOUR,
  SCAN_SKIP_WEEKEND,
  SCAN_SKIP_WEEKDAYS,
};
