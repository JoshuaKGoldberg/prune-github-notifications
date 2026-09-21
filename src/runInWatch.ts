import { styleText } from "node:util";

import { formatFilters } from "./formatFilters.js";
import { FilterOptions, PruneGitHubNotificationsResult } from "./types.js";

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
				styleText(
					"red",
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
			console.log(formatTime(), styleText("gray", `No threads found.`));

			if (!loggedFilters) {
				console.log(styleText("gray", formatFilters(filters)));
				loggedFilters = true;
			}
		}

		await sleep(watch);
	}
}

function formatTime() {
	return styleText("gray", `[${new Date().toISOString()}]`);
}

async function sleep(seconds: number) {
	await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
