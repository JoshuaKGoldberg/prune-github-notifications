import { parseArgs } from "node:util";
import * as z from "zod";

import { pruneGitHubNotifications } from "./pruneGitHubNotifications.js";
import { runInWatch } from "./runInWatch.js";

const schema = z.object({
	auth: z.string({
		required_error:
			"--auth is required if a GH_TOKEN environment variable is not specified.",
	}),
	bandwidth: z.coerce.number().optional(),
	reason: z
		.array(z.string())
		.optional()
		.transform((value) => value && new Set(value)),
	title: z
		.string()
		.transform((value) => new RegExp(value))
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
				type: "string",
			},
			watch: {
				type: "string",
			},
		},
		tokens: true,
	});

	const { auth, bandwidth, reason, title, watch } = schema.parse(values);

	const action = async () =>
		await pruneGitHubNotifications({
			auth,
			bandwidth,
			filters: {
				reason,
				title,
			},
		});

	await (watch ? runInWatch(action, watch) : action());
}
