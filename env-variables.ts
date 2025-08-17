import "dotenv/config";
import envVar from "env-var";
const TZ = envVar.get("TZ").required().asString();
const URL = envVar.get("URL").required().asString();
const AUTH_STATE_FILE_PATH = envVar
  .get("AUTH_STATE_FILE_PATH")
  .required()
  .asString();
const AUTH_STATE_DATE_FILE_NAME = envVar
  .get("AUTH_STATE_DATE_FILE_NAME")
  .required()
  .default("state.json")
  .asString();

export { TZ, URL, AUTH_STATE_FILE_PATH, AUTH_STATE_DATE_FILE_NAME };
