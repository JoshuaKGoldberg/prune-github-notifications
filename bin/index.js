#!/usr/bin/env node

import { pruneGitHubNotificationsCLI } from "../lib/cli.js";

try {
	await pruneGitHubNotificationsCLI(process.argv.slice(2));
} catch (error) {
	console.error("Failed to run prune-github-notifications:", error);
	process.exitCode = -1;
}
