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


export {
  EMAIL,
  URL,
  PASSWORD,
  PHONE_NUMBER,
  TWILIO_SANDBOX_NUMBER,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  COOKIE
};
