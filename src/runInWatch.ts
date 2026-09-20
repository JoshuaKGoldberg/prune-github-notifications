import chalk from "chalk";

import { formatFilters } from "./formatFilters.js";
import { FilterOptions, PruneGitHubNotificationsResult } from "./types.js";

// Transient failures (e.g. a locked keyring making `gh auth token` fail, or a
// network blip) shouldn't stop watch mode, but persistent ones should.
const maxConsecutiveFailures = 3;

export async function runInWatch(
	action: () => Promise<PruneGitHubNotificationsResult>,
	watch: number,
	filters: FilterOptions,
) {
	console.log(`Running prune-github-notifications with --watch ${watch}...`);

	let consecutiveFailures = 0;
	let loggedFilters = false;

	while (true) {
		let threads: number[];

		try {
			({ threads } = await action());
			consecutiveFailures = 0;
		} catch (error) {
			consecutiveFailures += 1;

			if (consecutiveFailures >= maxConsecutiveFailures) {
				throw error;
			}

			console.log(
				formatTime(),
				chalk.red(
					`Failed to prune notifications (attempt ${consecutiveFailures.toString()}/${maxConsecutiveFailures.toString()}):`,
				),
				error instanceof Error ? error.message : error,
			);

			await sleep(watch);
			continue;
		}

		if (threads.length) {
			console.log(
				formatTime(),
				`Pruned ${threads.length.toString()} thread${threads.length === 1 ? "" : "s"}.`,
			);
		} else {
			console.log(formatTime(), chalk.gray(`No threads found.`));

			if (!loggedFilters) {
				console.log(chalk.gray(formatFilters(filters)));
				loggedFilters = true;
			}
		}

		await sleep(watch);
	}
}

function formatTime() {
	return chalk.gray(`[${new Date().toISOString()}]`);
}

async function sleep(seconds: number) {
	await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
