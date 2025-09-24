import { initializeObservability } from "./lib/observability/init";

export async function register() {
  await initializeObservability();
}
