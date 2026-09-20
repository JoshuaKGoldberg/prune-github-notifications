import { parseArgs } from "node:util";
import * as z from "zod";

import { formatFilters } from "./formatFilters.js";
import { pruneGitHubNotifications } from "./pruneGitHubNotifications.js";
import { resolveFilters } from "./resolveFilters.js";
import { runInWatch } from "./runInWatch.js";

const schema = z.object({
	bandwidth: z.coerce.number().optional(),
	reason: z
		.array(z.string())
		.optional()
		.transform((value) => value && new Set(value)),
	title: z
		.array(z.string())
		.transform((values) => values.map((value) => new RegExp(value)))
		.optional(),
	watch: z.coerce.number().optional(),
});

export async function pruneGitHubNotificationsCLI(args: string[]) {
	const { values } = parseArgs({
		args,
		options: {
			auth: {
				default: process.env.GH_TOKEN,
				type: "string",
			},
			bandwidth: {
				type: "string",
			},
			reason: {
				multiple: true,
				type: "string",
			},
			title: {
				multiple: true,
				type: "string",
			},
			watch: {
				type: "string",
			},
		},
		tokens: true,
	});

	const { bandwidth, reason, title, watch } = schema.parse(values);
	const filters = resolveFilters({ reason, title });

	const action = async () =>
		await pruneGitHubNotifications({ bandwidth, filters });

	if (watch) {
		await runInWatch(action, watch, filters);
		return;
	}

	const { threads } = await action();

	if (!threads.length) {
		console.log(
			`No notifications matched the filters:\n${formatFilters(filters)}`,
		);
	}
}
