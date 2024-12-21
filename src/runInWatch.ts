import chalk from "chalk";

import { PruneGitHubNotificationsResult } from "./types.js";

export async function runInWatch(
	action: () => Promise<PruneGitHubNotificationsResult>,
	watch: number,
) {
	console.log(`Running prune-github-notifications with --watch ${watch}...`);

	while (true) {
		const { threads } = await action();
		const time = chalk.gray(`[${new Date().toISOString()}]`);

		console.log(
			time,
			threads.length
				? `Pruned ${threads.length.toString()} thread${threads.length === 1 ? "" : "s"}.`
				: chalk.gray(`No threads found.`),
		);

		await new Promise((resolve) => setTimeout(resolve, watch * 1000));
	}
}
