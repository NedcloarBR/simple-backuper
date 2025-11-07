#!/usr/bin/env node
import { CLI } from "./cli";
import { logger } from "./utils/logger";

process.on("SIGINT", () => {
  console.clear();
  logger.info("\nGoodbye!");
  process.exit(0);
});

async function main(): Promise<void> {
  await CLI.start();
}

void main().catch((error) => {
  logger.error("An error occurred:", error);
  process.exit(1);
});

