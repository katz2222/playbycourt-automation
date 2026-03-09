import { checkCourtAvailability } from "@services/findAvailableSlots.service";
import { logWithTimestamp } from "@src/utilities/logger.utils";

async function runJob(): Promise<void> {
  try {
    logWithTimestamp("Running job...");
    await checkCourtAvailability();
    logWithTimestamp("successfully finished run");
  } catch (error) {
    console.error("Error running job:", error);
  } 
}

runJob();
