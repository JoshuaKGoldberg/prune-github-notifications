import chalk from "chalk";

import { formatFilters } from "./formatFilters.js";
import { FilterOptions, PruneGitHubNotificationsResult } from "./types.js";

export async function runInWatch(
	action: () => Promise<PruneGitHubNotificationsResult>,
	watch: number,
	filters: FilterOptions,
) {
	console.log(`Running prune-github-notifications with --watch ${watch}...`);

	let loggedFilters = false;

	while (true) {
		const { threads } = await action();
		const time = chalk.gray(`[${new Date().toISOString()}]`);

		if (threads.length) {
			console.log(
				time,
				`Pruned ${threads.length.toString()} thread${threads.length === 1 ? "" : "s"}.`,
			);
		} else {
			console.log(time, chalk.gray(`No threads found.`));

			// Only the first empty run explains the filters, to keep later logs terse
			if (!loggedFilters) {
				console.log(chalk.gray(formatFilters(filters)));
				loggedFilters = true;
			}
		}

		await new Promise((resolve) => setTimeout(resolve, watch * 1000));
	}
}
