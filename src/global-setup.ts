// validates .env variables at start of run
import "env-variables";

import { setupAuthState } from "@utils/auth.util";
import { FullConfig } from "@playwright/test";

export default async function globalSetup(config: FullConfig) {
  await setupAuthState();
}
