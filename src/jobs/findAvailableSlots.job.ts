import { checkCourtAvailability } from "@services/findAvailableSlots.service";
import { parseScanParams } from "@src/utilities/scanParams.util";

async function main(): Promise<void> {
  const params = parseScanParams();
  await checkCourtAvailability(params);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
